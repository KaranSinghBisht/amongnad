![amongnad — Among Us, but agents play. AI social deduction on Monad.](./assets/banner.png)

<div align="center">

# amongnad

### Among Us, but agents play. — AI social deduction on Monad.

[![Monad Testnet](https://img.shields.io/badge/Monad-Testnet%2010143-836EF9)](https://testnet.monadscan.com/address/0xa8e3463eF7934C7F8B18f77eBF1A6b49afA4932b)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Built at Monad Blitz Pune V2](https://img.shields.io/badge/Monad%20Blitz-Pune%20V2-purple.svg)](https://blitz.devnads.com)

</div>

---

## 🎯 What is this

**🔴 Live demo: [amongnad.vercel.app](https://amongnad.vercel.app)** — watch a real recorded game, then **bet MON on the next live round**.

**amongnad** is *Among Us* played by AI agents — and refereed on-chain. Six Claude agents, each with a different **"soul"** (personality + strategy prompt), roam a 2D Skeld-style map. One is secretly the **impostor**. They move, spot each other, kill, vent, **sabotage the lights** (dark kills have no witnesses — someone has to run to Electrical to fix them), report bodies, then argue and vote in emergency meetings.

You watch it all as a spectator: each agent's **private reasoning streams live** next to the map, so you see the impostor privately scheme — *"I'll blame Red"* — and then publicly lie in the chat.

The twist that makes it more than a toy: **every meaningful game event is a real Monad transaction**, and the secret ejection votes run trustlessly on-chain via commit–reveal. The game log on the left of the screen is human-readable *and* every line links to its actual transaction on the explorer.

## ⚡ Why Monad (and not Ethereum)

This isn't "a chain bolted onto a game." The core mechanic *needs* Monad's speed:

- **Secret ballots = commit–reveal = 2 sequential blocks per vote.** On Monad (400 ms blocks, ~single-slot finality) a full meeting resolves in ~1 second. On Ethereum (12 s blocks, ~13 min finality) one vote round is minutes — you cannot run several meetings in a 3-minute demo.
- **Each agent votes from its own wallet** — many wallets, many transactions, live. A private Alchemy RPC gives us the throughput headroom.
- **Every kill / vent / report / vote is logged on-chain** → the match is provably fair and fully replayable. Pennies on Monad; hundreds of dollars and many minutes on Ethereum.
- An in-app **shadow clock** makes it visceral: `MONAD ⚡ 95s · 48 txs` vs `ETHEREUM 🐢 still on vote round 1…`

## 🏗️ Architecture

```mermaid
flowchart LR
    subgraph ENGINE["engine · Node/TS"]
        LOOP["game loop<br/>rooms · ticks"]
        BRAIN["agent brains"]
        WSW["WebSocket +<br/>replay recorder"]
        LOOP --> BRAIN
        LOOP --> WSW
    end
    BRAIN -->|prompts| CLAUDE[["Anthropic Claude<br/>5 souls"]]
    LOOP -->|"txs (viem)"| SC["AmongNad.sol<br/>Monad Testnet"]
    WSW -->|snapshots| WEB["web · Next.js<br/>spectator theater"]
    SC -->|events| EXP[["MonadVision<br/>explorer"]]
    WEB -.->|click a log row| EXP
```

The **engine** runs the simulation and writes to chain; the **contract** is the trustless referee; the **web** app is the spectator theater (and reads live state over WebSocket, or plays a recorded replay for the hosted demo).

## 🔄 Game loop

```mermaid
stateDiagram-v2
    [*] --> Lobby
    Lobby --> Active: startGame() · roles committed
    Active --> Active: move · see · kill · vent<br/>(each = on-chain log tx)
    Active --> Meeting: body reported / meeting called
    Meeting --> Meeting: discuss (chat)
    Meeting --> Active: commit → reveal votes<br/>resolveMeeting() ejects
    Active --> Ended: win condition<br/>endGame() reveals roles
    Ended --> [*]
```

## 🗳️ Trustless voting (commit–reveal)

```mermaid
sequenceDiagram
    participant A as Agent wallets
    participant C as AmongNad contract
    participant M as Master (engine)
    M->>C: startMeeting()
    A->>C: commitVote( hash(suspect, salt) )
    Note over A,C: every vote is secret — nobody can copy
    A->>C: revealVote(suspect, salt)
    C->>C: tally on-chain
    M->>C: resolveMeeting() → eject top vote
    Note over C: 2 blocks ≈ 1s on Monad · minutes on Ethereum
```

## ⛓️ On-chain

| | |
|---|---|
| **Network** | Monad Testnet (chain id `10143`) |
| **Game contract** | [`0xa8e3463eF7934C7F8B18f77eBF1A6b49afA4932b`](https://testnet.monadscan.com/address/0xa8e3463eF7934C7F8B18f77eBF1A6b49afA4932b) |
| **Betting arena** | [`0x78Ba46dC4Ebdc8d178b1656bfE389e10EA305DD8`](https://testnet.monadscan.com/address/0x78Ba46dC4Ebdc8d178b1656bfE389e10EA305DD8) |
| **Deploy tx** | [`0x190bb0c5619ba3751405bfdf725f22143802de1eb2cd7dfa9cc01127bfef9b3d`](https://testnet.monadscan.com/tx/0x190bb0c5619ba3751405bfdf725f22143802de1eb2cd7dfa9cc01127bfef9b3d) |

`AmongNad.sol` is the referee: agent registration, role commitment + reveal, per-agent commit–reveal votes, **on-chain vote tally + ejection**, and a human-readable event log (`logEvent`) where every row emitted becomes one clickable transaction in the UI.

## 🎲 The betting arena (live tonight)

While one game plays, **betting for the next game is already open** — connect any injected wallet on the site and bet MON against the house:

| Market | Pick | Pays |
|---|---|---|
| **Who wins** | Crew / Impostor | **1.9×** |
| **First victim** | any of the 6 agents | **4.0×** |

`AmongNadArena.sol` is house-banked and settles **fully on-chain** the moment a game ends — and if the house ever can't cover a winning payout, **your stake is auto-refunded** (you can't lose to an insolvent bookmaker). Rounds run continuously: ~10 minutes of betting per game, countdown live on the site, results appear in the strip once settled.

## 🧠 The souls

One Claude model, **six prompts** — so the real contest is *which prompt plays social deduction best*. Each agent is a persistent persona (and accrues on-chain reputation across games).

| Agent | Soul | Personality |
|---|---|---|
| 🔴 Red | **Machiavelli** | ruthless manipulator — dominates the room, sows doubt, bends the truth |
| 🔵 Blue | **Cipher** | quiet observer — speaks rarely but precisely, tracks who was where & when |
| 🟢 Green | **Klaxon** | loud accuser — impulsive, points fingers on gut, unafraid to be wrong out loud |
| 🟣 Purple | **Sherlock** | logical detective — reasons from movement, timing & alibis; presses for contradictions |
| 🟡 Yellow | **Pip** | nervous rookie — second-guesses, flusters under pressure, blurts out what they're thinking |
| 🟠 Orange | **Gremlin** | chaotic wildcard — jokes at the worst moments, wild theories, accidentally right |

## 🖥️ The spectator view

Projector-ready:
- **On-chain Game Log (left)** — live feed; every line is a clickable Monad tx.
- **Stage (center)** — the map over the ship interior; goes **dark during sabotage**; becomes the Among Us-style **chat** during meetings.
- **Agent panels (bottom)** — each agent's live private reasoning, typed out as they think.
- **Shadow clock** — Monad vs "Ethereum would still be voting."
- **Arena strip** — countdown to the next game, wallet connect, bet placement, your results, past-game replays.

## 🛠️ Tech stack

Monad Testnet · Foundry (Solidity) · viem · Node/TypeScript engine · Anthropic Claude · Next.js + Tailwind + framer-motion · WebSocket · Vercel · scaffolded with [Monskills](https://skills.devnads.com).

## 🚀 Run it locally

```bash
# 1. contracts
cd contracts && forge build
# deploy is already live; to redeploy: forge create src/AmongNad.sol:AmongNad --rpc-url $MONAD_RPC_URL --private-key $PRIVATE_KEY --broadcast

# 2. engine (fund agent wallets, then run a game)
cd ../engine && npm install
npm run fund-agents
npm run run-game       # one full recorded game
npm run arena          # continuous mode: 10-min betting rounds + live games + on-chain settlement
                       # (ARENA_WINDOW_MS=60000 for quick 1-min test rounds)

# 3. web (spectator UI)
cd ../web && npm install && npm run dev   # http://localhost:3000
```

Secrets live in a gitignored `.env.local` (see `.env.example`). Never commit keys; use a fresh burner wallet.

## 🗺️ Roadmap

- **Bring your own agent** — an MCP server + open `joinGame` so *your* AI plays against ours (didn't fit in 6 hours; the betting arena did).
- **Borrow-NFT IOUs** — if the house is broke, mint a claim NFT instead of a refund.
- **ERC-8004 soul leaderboard** — persistent, portable reputation per strategy ("most cutthroat prompt").
- More sabotages (O2, reactor, doors) · more maps · on-chain movement anchoring.

## 📸 Screenshots

_(Demo screenshots + video added before the code freeze.)_

## 🙌 Built at Monad Blitz Pune V2 — *The Agent Economy*
