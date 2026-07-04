# AmongNad — engine ⇄ web protocol

Engine serves a WebSocket (default `ws://localhost:8787`, env `NEXT_PUBLIC_WS_URL`). On every state change it broadcasts a full **Snapshot** (frontend re-renders; animate diffs with framer-motion). Every game is also recorded to `engine/replays/<id>.json` as `{ meta, frames: Snapshot[] }` for the hosted Vercel demo + fallback (frontend plays frames on a timer instead of WS).

## Snapshot (JSON, one full object per update)
```jsonc
{
  "type": "snapshot",
  "gameId": 1,
  "tick": 7,
  "phase": "active",              // lobby | active | meeting | ended
  "agents": [
    {
      "id": "agent1", "name": "Red", "color": "#e74c3c",
      "soul": "Machiavelli",       // personality label (shown on the agent panel)
      "room": "electrical",         // room id from engine/rooms.json
      "alive": true,
      "role": null,                 // null while secret; "crew" | "impostor" after endGame reveal
      "wallet": "0x…",
      "thinking": "…private reasoning, streamed into this agent's bottom panel…"
    }
  ],
  "bodies": [ { "room": "electrical", "victim": "agent4" } ],
  "log": [
    { "id": 12, "kind": "kill", "text": "Red killed Cyan in Electrical",
      "txHash": "0x…", "ts": 1720080000000 }   // txHash null until mined
  ],
  "chat": [ { "id": 3, "agentId": "agent1", "name": "Red", "color": "#e74c3c", "text": "I saw Blue vent!", "ts": 0 } ],
  "meeting": { "active": true, "round": 1, "reason": "Green reported a body",
               "votes": { "agent1": "agent3", "agent2": "SKIP", "agent3": null } },
  "clock": { "monadMs": 95000, "ethEquivMs": 620000, "txCount": 48 }
}
```

### Rendering rules
- `log[].kind` ∈ `spawn|move|saw|kill|vent|report|meeting|vote|eject|win`. Each row links to `${NEXT_PUBLIC_EXPLORER_TX}${txHash}` (only when `txHash` present).
- `phase === "meeting"` → center Stage renders `chat` + live `meeting.votes`. Otherwise Stage renders the **map** (coords from `engine/rooms.json`) with agent dots + body markers.
- Shadow clock: `clock.ethEquivMs = txCount * 12000` (illustrative "Ethereum would still be at…").
- Bottom panels: one per agent, showing `name`, `soul`, alive/dead, and streaming `thinking`.

## Chain
- Contract `0xa8e3463eF7934C7F8B18f77eBF1A6b49afA4932b` (Monad testnet 10143). ABI: `engine/src/abi/AmongNad.json` & `web/lib/AmongNad.abi.json`.
- Tx link base `https://testnet.monadvision.com/tx/` — **VERIFY this domain renders our tx**; swap via `NEXT_PUBLIC_EXPLORER_TX` if not.
