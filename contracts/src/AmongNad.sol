// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title AmongNad — on-chain referee for AI Among Us
/// @notice The master (engine) drives game lifecycle and writes a tamper-proof, human-readable
///         event log to chain (each `logEvent` = one clickable tx in the UI). Agents cast their
///         OWN commit-reveal ejection votes from their OWN wallets. The vote tally + ejection are
///         computed on-chain (trustless). Roles are committed at start and revealed at end, so
///         anyone can verify the referee never cheated. Fast + cheap enough only on Monad.
contract AmongNad {
    enum Phase { Lobby, Active, Meeting, Ended }
    // kinds for the human-readable on-chain game log
    enum Kind { Spawn, Move, Saw, Kill, Vent, Report, MeetingStart, VoteCommit, VoteReveal, Eject, Win }

    struct GameView { uint256 id; Phase phase; address master; uint256 meeting; uint256 playerCount; }

    uint256 public gameCount;
    mapping(uint256 => Phase)   public phase;
    mapping(uint256 => address) public master;
    mapping(uint256 => bytes32) public rolesCommit;               // keccak(abi.encode(impostor, salt))
    mapping(uint256 => uint256) public meeting;                   // current meeting index
    mapping(uint256 => address[]) internal _players;
    mapping(uint256 => mapping(address => bool))   public isPlayer;
    mapping(uint256 => mapping(address => bool))   public alive;
    mapping(uint256 => mapping(address => string)) public nameOf;

    // votes: game => meeting => voter/suspect => data
    mapping(uint256 => mapping(uint256 => mapping(address => bytes32))) public commitOf;
    mapping(uint256 => mapping(uint256 => mapping(address => bool)))    public revealed;
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public votesFor;   // suspect => count
    mapping(uint256 => mapping(uint256 => uint256))                     public skipVotes;

    event GameCreated(uint256 indexed gameId, address master);
    event PlayerAdded(uint256 indexed gameId, address indexed agent, string name, bytes32 soulId);
    event GameStarted(uint256 indexed gameId, bytes32 rolesCommit);
    event GameEvent(uint256 indexed gameId, Kind indexed kind, address indexed actor, address target, string room, string note);
    event MeetingStarted(uint256 indexed gameId, uint256 meeting, string reason);
    event VoteCommitted(uint256 indexed gameId, uint256 meeting, address indexed voter);
    event VoteRevealed(uint256 indexed gameId, uint256 meeting, address indexed voter, address suspect);
    event PlayerEjected(uint256 indexed gameId, uint256 meeting, address ejected, bool skipped);
    event GameEnded(uint256 indexed gameId, uint8 winner, address impostor); // winner: 0=crew, 1=impostor

    modifier onlyMaster(uint256 g) { require(msg.sender == master[g], "not master"); _; }

    // ---------- lifecycle (master) ----------
    function createGame() external returns (uint256 g) {
        g = ++gameCount;
        master[g] = msg.sender;
        phase[g] = Phase.Lobby;
        emit GameCreated(g, msg.sender);
    }

    function addPlayer(uint256 g, address agent, string calldata name, bytes32 soulId) external onlyMaster(g) {
        require(phase[g] == Phase.Lobby, "not lobby");
        require(!isPlayer[g][agent], "dup");
        isPlayer[g][agent] = true;
        alive[g][agent] = true;
        nameOf[g][agent] = name;
        _players[g].push(agent);
        emit PlayerAdded(g, agent, name, soulId);
    }

    function startGame(uint256 g, bytes32 _rolesCommit) external onlyMaster(g) {
        require(phase[g] == Phase.Lobby, "not lobby");
        rolesCommit[g] = _rolesCommit;
        phase[g] = Phase.Active;
        emit GameStarted(g, _rolesCommit);
    }

    /// @notice referee writes one narrative line to chain (the clickable game-log row)
    function logEvent(uint256 g, Kind kind, address actor, address target, string calldata room, string calldata note)
        external onlyMaster(g)
    {
        emit GameEvent(g, kind, actor, target, room, note);
    }

    /// @notice a kill mutates state AND logs; provable against the role reveal at endGame
    function kill(uint256 g, address victim, string calldata room, string calldata note) external onlyMaster(g) {
        require(phase[g] == Phase.Active, "not active");
        require(alive[g][victim], "dead");
        alive[g][victim] = false;
        emit GameEvent(g, Kind.Kill, victim, victim, room, note);
    }

    function startMeeting(uint256 g, string calldata reason) external onlyMaster(g) {
        require(phase[g] == Phase.Active, "not active");
        meeting[g] += 1;
        phase[g] = Phase.Meeting;
        emit MeetingStarted(g, meeting[g], reason);
        emit GameEvent(g, Kind.MeetingStart, address(0), address(0), "", reason);
    }

    // ---------- agent-signed commit-reveal voting (each agent's own wallet) ----------
    function commitVote(uint256 g, bytes32 voteHash) external {
        require(phase[g] == Phase.Meeting, "no meeting");
        require(isPlayer[g][msg.sender] && alive[g][msg.sender], "cant vote");
        uint256 m = meeting[g];
        require(commitOf[g][m][msg.sender] == bytes32(0), "committed");
        commitOf[g][m][msg.sender] = voteHash;
        emit VoteCommitted(g, m, msg.sender);
        emit GameEvent(g, Kind.VoteCommit, msg.sender, address(0), "", "committed a vote");
    }

    /// @param suspect the accused; address(0) == SKIP
    function revealVote(uint256 g, address suspect, bytes32 salt) external {
        require(phase[g] == Phase.Meeting, "no meeting");
        uint256 m = meeting[g];
        require(!revealed[g][m][msg.sender], "revealed");
        require(keccak256(abi.encode(g, m, suspect, salt)) == commitOf[g][m][msg.sender], "bad reveal");
        revealed[g][m][msg.sender] = true;
        if (suspect == address(0)) skipVotes[g][m] += 1;
        else votesFor[g][m][suspect] += 1;
        emit VoteRevealed(g, m, msg.sender, suspect);
        emit GameEvent(g, Kind.VoteReveal, msg.sender, suspect, "", "revealed a vote");
    }

    /// @notice tally the current meeting on-chain; eject the top vote-getter.
    ///         Ties, no votes, or skip >= top => nobody ejected.
    function resolveMeeting(uint256 g) external onlyMaster(g) returns (address ejected, bool skipped) {
        require(phase[g] == Phase.Meeting, "no meeting");
        uint256 m = meeting[g];
        address[] memory ps = _players[g];
        uint256 top; address topA; bool tie;
        for (uint256 i = 0; i < ps.length; i++) {
            uint256 v = votesFor[g][m][ps[i]];
            if (v > top) { top = v; topA = ps[i]; tie = false; }
            else if (v == top && v != 0) { tie = true; }
        }
        if (topA == address(0) || tie || skipVotes[g][m] >= top) {
            skipped = true;
            emit PlayerEjected(g, m, address(0), true);
        } else {
            ejected = topA;
            alive[g][ejected] = false;
            emit PlayerEjected(g, m, ejected, false);
            emit GameEvent(g, Kind.Eject, ejected, ejected, "", "ejected by vote");
        }
        phase[g] = Phase.Active;
    }

    function endGame(uint256 g, address impostor, bytes32 salt, uint8 winner) external onlyMaster(g) {
        require(phase[g] != Phase.Ended, "ended");
        require(keccak256(abi.encode(impostor, salt)) == rolesCommit[g], "role mismatch");
        phase[g] = Phase.Ended;
        emit GameEnded(g, winner, impostor);
        emit GameEvent(g, Kind.Win, impostor, address(0), "", winner == 1 ? "impostor wins" : "crew wins");
    }

    // ---------- views ----------
    function players(uint256 g) external view returns (address[] memory) { return _players[g]; }
    function game(uint256 g) external view returns (GameView memory) {
        return GameView(g, phase[g], master[g], meeting[g], _players[g].length);
    }
}
