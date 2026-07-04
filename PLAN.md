# AmongNad — AI Among Us, refereed on Monad

**One-liner:** 5 AI agents (one Claude model, different "soul" prompts) play the Among Us social-deduction loop on a 2D map. Spectators watch each agent's *private reasoning* live while trust-critical steps (secret ejection votes, ejection/win resolution, provable-fair role reveal) settle on Monad via commit-reveal.

## Why Monad (the "only on Monad" beat — must be provable on stage)
- Secret ballots = **commit-reveal = 2 sequential blocks per round**. Monad 400ms → a full vote in ~1s. Ethereum 12s blocks + ~13min finality → unwatchable, and you can't run several meetings in a 3-min demo.
- Each agent votes from its **own wallet** → many wallets, many txs, live. Alchemy RPC = headroom.
- Whole match is logged on-chain → **provably-fair + replayable**. Only affordable at Monad gas.
- Economy layer: spectators bet MON on the impostor; ERC-8004 = persistent "soul" reputation leaderboard.
- **Shadow clock overlay**: `Monad: game over, 95s` vs `Ethereum: still on vote round 1…`

## Architecture (monorepo)
```
contracts/  Foundry — AmongNad.sol (game master lifecycle + per-agent commit-reveal votes)
engine/     Node/TS — game loop, room graph, agent brains (Claude), chain writes, WS server + replay recorder
web/        Next.js — spectator theater (map + per-agent thoughts + chat + shadow clock + bet panel)
```
**Data flow:** engine runs the sim → writes on-chain (votes from agent wallets, lifecycle/events from master key) → serves live state over WebSocket **and** records a replay JSON → web renders (live WS, or a static replay for the hosted Vercel demo).

## On-chain vs off-chain (keep the fun off-chain, the trust on-chain)
- **ON-CHAIN (contract):** agent registration, role commitment+reveal, meeting lifecycle, per-agent commit-reveal votes, ejection + win resolution, key-event log (kills/reports).
- **OFF-CHAIN (engine):** movement on the room graph, vision (same-room), memory, LLM deliberation/chat. (On-chain movement anchoring = stretch.)

## Room model
`engine/rooms.json` — 14 Skeld rooms as a graph: `edges` = hallways, `vents` = impostor-only teleports. Coords in 0..100 for SVG. Movement = pick an adjacent room (animated dot). NOT pixel pathfinding.

## UI layout (spectator theater — LOCKED from mockup)
- **Top-left — On-chain Game Log:** live human-readable feed ("Agent 3 killed Agent 4 in Electrical", "Agent 3 vented to MedBay", "Agent 5 reported a body"). **Every line is a real Monad tx — click a row to open that tx on the explorer.** This is the fun↔proof bridge (the narrative is literally on-chain) and the throughput flex (every kill/vent/report/vote is a paid tx: pennies on Monad, absurd on ETH).
- **Top-right — Stage:** the 2D room-graph map with agent dots moving between rooms; when a meeting starts, this area transforms into the **chat** (agents talking/accusing).
- **Bottom — agent panels (one per agent):** each streams that agent's live *private* reasoning ("thinking"). The gold: watch the impostor privately scheme, then publicly lie in chat.
- Explorer tx link base: `https://testnet.monadvision.com/tx/<hash>`. Engine captures each tx hash from the receipt and streams `{line, txHash, kind}` to the UI over WS.

## Game loop (turn-based ticks; a tick maps to a block cadence)
1. **ACTION** — each alive agent, one LLM call → `{thinking, action, target}`. Actions: `MOVE(room) | WAIT | KILL(agent) | VENT(room) | REPORT | CALL_MEETING`. KILL legal only if agent is impostor, co-located with target, few witnesses.
2. **Resolve** — apply moves; apply kill (drop body in room); update each agent's memory of who-it-saw-where.
3. If a body is reported or a meeting is called → **MEETING**:
   - **DISCUSS** — each alive agent → `{thinking, statement}` (1–2 rounds). This is the show.
   - **VOTE (on-chain)** — each agent wallet `commitVote(hash)` then `revealVote`. Contract tallies.
   - **resolveMeeting** — eject top (or SKIP), emit `wasImpostor`, check win.
4. **Win check** — impostors==0 → crew win; impostors ≥ crew → impostor win; else continue.

## Agent I/O (strict JSON out)
- ACTION: `{ "thinking": "...private...", "action": "MOVE|WAIT|KILL|VENT|REPORT|CALL_MEETING", "target": "<roomId|agentId|null>" }`
- DISCUSS: `{ "thinking": "...", "statement": "spoken aloud" }`
- VOTE: `{ "thinking": "...", "vote": "<agentId|SKIP>" }`
- Prompt = SOUL (personality+strategy) + ROLE (crewmate|impostor playbook) + STATE (room, who's here, memory, alive list, adjacency) + legal actions.

## Contract interface (AmongNad.sol)
`master` (deployer/engine key) drives lifecycle; **agents' own wallets cast votes**.
- `createGame() -> gameId`
- `addPlayer(gameId, addr, name, bytes32 soulId)` [master] — also expose open `joinGame(gameId, name, soulId)` for post-hackathon
- `startGame(gameId, bytes32 rolesCommit)` [master] — `rolesCommit = keccak(abi.encode(impostor, salt))`
- `reportKill(gameId, address victim)` [master] → `Killed`
- `startMeeting(gameId, uint8 reason)` [master] → opens commit window
- `commitVote(gameId, bytes32 voteHash)` [agent] — `voteHash = keccak(abi.encode(gameId, suspect, salt))`
- `revealVote(gameId, address suspect, bytes32 salt)` [agent]
- `resolveMeeting(gameId)` [master] → ejects top, emits `PlayerEjected(ejected, wasImpostor)`
- `endGame(gameId, address impostor, bytes32 salt, uint8 winner)` [master] → verifies `rolesCommit`, emits `GameEnded`
- Events: `GameCreated, PlayerAdded, GameStarted, Killed, MeetingStarted, VoteCommitted, VoteRevealed, PlayerEjected, MeetingResolved, GameEnded`

## Wallets
Funder `0xF1a8…F4B2` (40 MON / 60 USDC). Engine derives N agent wallets, funds each ~0.5 MON from funder, each agent signs its own commit/reveal. Lifecycle txs from funder (master) key.

## Build tiers (ship in this order)
- **T1 MUST-SHIP (~3:30):** rooms UI + 4–5 souls moving + impostor kill + report → meeting → chat → on-chain commit-reveal vote → eject → win + shadow clock. **This alone wins.**
- **T2 (if time):** MON betting market, ERC-8004 soul leaderboard, vent animation, art polish.
- **T3 stretch:** open external-agent registration (arena-style platform), multiple concurrent games, on-chain movement anchoring.
- **FLOOR (panic ~4:30):** pre-recorded replays played from static JSON on Vercel + backup video. Live-AI misbehavior can't sink us.

## Deployment
`web` → Vercel (required, deploy EARLY). Hosted version plays **replays** (static JSON) so it always works; live demo runs the engine locally (or via tunnel) with `web` pointed at its WS URL. Record backup video + screenshots by ~5:15, freeze 5:30, submit on blitz.devnads.com by 5:45.
