// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title AmongNadArena — house-banked spectator betting on AmongNad games
/// @notice Before each game the master opens a betting round for the upcoming
///         gameId. Spectators bet MON against the house on two markets:
///           WinnerSide (0): pick 0 = crew, 1 = impostor  — pays 1.9x
///           FirstVictim (1): pick = agent index 0..5     — pays 4.0x
///         Settlement is fully on-chain. If the house can't cover a winning
///         payout, the bettor's stake is refunded instead — you can never
///         lose to an insolvent house.
contract AmongNadArena {
    enum Market { WinnerSide, FirstVictim }

    struct Round {
        uint64 startsAt;   // betting closes at this timestamp; game starts after
        bool open;
        bool settled;
        uint8 winnerSide;  // 0 crew, 1 impostor
        uint8 firstVictim; // agent index; only meaningful if hadVictim
        bool hadVictim;
    }

    struct Bet {
        address user;
        uint8 market;
        uint8 pick;
        uint128 amount;
    }

    address public immutable master;
    uint256 public currentGame; // gameId of the round currently open for betting

    uint256 public constant MAX_BET = 0.2 ether;
    uint256 public constant MIN_BET = 0.001 ether;
    uint256 public constant WINNER_PAYOUT_X10 = 19; // 1.9x
    uint256 public constant VICTIM_PAYOUT_X10 = 40; // 4.0x
    uint8 public constant AGENTS = 6;

    mapping(uint256 => Round) public rounds;
    mapping(uint256 => Bet[]) internal _bets;

    event RoundOpened(uint256 indexed gameId, uint64 startsAt);
    event BetPlaced(uint256 indexed gameId, address indexed user, uint8 market, uint8 pick, uint256 amount);
    event BettingClosed(uint256 indexed gameId);
    event RoundSettled(uint256 indexed gameId, uint8 winnerSide, uint8 firstVictim, bool hadVictim);
    event BetSettled(uint256 indexed gameId, address indexed user, uint8 market, uint8 pick, uint256 amount, uint256 payout, bool won);
    event HouseFunded(address indexed from, uint256 amount);

    modifier onlyMaster() { require(msg.sender == master, "not master"); _; }

    constructor() { master = msg.sender; }

    receive() external payable { emit HouseFunded(msg.sender, msg.value); }

    // ---------- round lifecycle (master) ----------

    function openRound(uint256 gameId, uint64 startsAt) external onlyMaster {
        require(!rounds[gameId].open && !rounds[gameId].settled, "exists");
        rounds[gameId] = Round(startsAt, true, false, 0, 0, false);
        currentGame = gameId;
        emit RoundOpened(gameId, startsAt);
    }

    function closeBetting(uint256 gameId) external onlyMaster {
        rounds[gameId].open = false;
        emit BettingClosed(gameId);
    }

    /// @notice settle every bet of the round in one pass. Winners are paid from
    ///         the house balance; if the house can't cover a payout the stake
    ///         is refunded. Transfers that fail are skipped, never reverted, so
    ///         settlement always completes.
    function settle(uint256 gameId, uint8 winnerSide, uint8 firstVictim, bool hadVictim) external onlyMaster {
        Round storage r = rounds[gameId];
        require(!r.settled, "settled");
        r.open = false;
        r.settled = true;
        r.winnerSide = winnerSide;
        r.firstVictim = firstVictim;
        r.hadVictim = hadVictim;

        Bet[] storage bets = _bets[gameId];
        for (uint256 i = 0; i < bets.length; i++) {
            Bet storage b = bets[i];
            bool won;
            uint256 payout;
            if (b.market == uint8(Market.WinnerSide)) {
                won = b.pick == winnerSide;
                if (won) payout = (uint256(b.amount) * WINNER_PAYOUT_X10) / 10;
            } else {
                won = hadVictim && b.pick == firstVictim;
                if (won) payout = (uint256(b.amount) * VICTIM_PAYOUT_X10) / 10;
            }
            if (won && address(this).balance < payout) payout = b.amount; // broke house = refund
            if (!won) payout = 0;
            if (payout > 0) {
                (bool ok, ) = b.user.call{ value: payout, gas: 30_000 }("");
                if (!ok) payout = 0; // never let one bad receiver block the round
            }
            emit BetSettled(gameId, b.user, b.market, b.pick, b.amount, payout, won);
        }
        emit RoundSettled(gameId, winnerSide, firstVictim, hadVictim);
    }

    /// @notice reclaim house funds after the event
    function sweep(uint256 amount) external onlyMaster {
        (bool ok, ) = master.call{ value: amount }("");
        require(ok, "sweep failed");
    }

    // ---------- betting (anyone) ----------

    function placeBet(uint256 gameId, uint8 market, uint8 pick) external payable {
        Round storage r = rounds[gameId];
        require(r.open && block.timestamp < r.startsAt, "betting closed");
        require(msg.value >= MIN_BET && msg.value <= MAX_BET, "bad amount");
        require(market <= uint8(Market.FirstVictim), "bad market");
        if (market == uint8(Market.WinnerSide)) require(pick <= 1, "bad pick");
        else require(pick < AGENTS, "bad pick");
        _bets[gameId].push(Bet(msg.sender, market, pick, uint128(msg.value)));
        emit BetPlaced(gameId, msg.sender, market, pick, msg.value);
    }

    // ---------- views ----------

    function betCount(uint256 gameId) external view returns (uint256) {
        return _bets[gameId].length;
    }

    function betAt(uint256 gameId, uint256 i) external view returns (Bet memory) {
        return _bets[gameId][i];
    }

    function houseBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
