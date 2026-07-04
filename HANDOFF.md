# HANDOFF — amongnad (Monad Blitz Pune V2)

Snapshot ~2:45 PM IST (freeze 5:30, submit 5:45). Opus session handing the remainder to the Fable session.

## ✅ DONE & LIVE
- **Contract** `AmongNad` deployed + **verified** on Monad testnet `10143`: [`0xa8e3463eF7934C7F8B18f77eBF1A6b49afA4932b`](https://testnet.monadscan.com/address/0xa8e3463eF7934C7F8B18f77eBF1A6b49afA4932b) (monadscan + monadvision, perfect match).
- **Engine**: full game loop, 5 Claude "souls", commit-reveal votes from per-agent wallets, on-chain event log, WS server + replay recorder. Validated with real on-chain games. Gameplay tuned (real kills, meeting caps, tight gas, loud failures). Committed.
- **Frontend**: spectator theater matching the banner identity (banner header, corner brackets, crewmate icons, EKG "AGENT STATUS" shadow-clock, TASKS-style HUD). Build passes, browser-verified. Committed + pushed (this commit).
- **Hosted PUBLIC demo LIVE → https://amongnad.vercel.app** — git-linked auto-deploy from `main` (root dir `web`, env incl. `NEXT_PUBLIC_EXPLORER_TX=…monadscan…`, deployment protection OFF → public 200). Plays a bundled replay, no backend needed. **Every push to `main` auto-deploys in ~1 min.**
- Wallets funded (~1.48 MON each); funder ~31 MON. GitHub fork pushed + backed up.

## 🔧 IN PROGRESS — engine subagent (let it finish; don't double-edit engine/)
Fixing the **on-chain identity leak**: the kill note currently reads `"Purple killed Red in Reactor"` — that names the impostor on-chain *before* the reveal. Target: neutral on-chain notes — kill → `"{victim} was eliminated in {room}"` (no killer); vent → neutral/no name; saw-near-vent → neutral. Keep spicy text in the UI only. Then it re-records a clean game to `engine/replays/`.
⚠️ **Don't edit `engine/` until that subagent reports done** (conflict risk). It will drop a clean replay + report the filename.

## ⏭️ REMAINING (Fable)
1. **Confirm the leak fix** landed: in the new replay, no `kill`/`vent`/`saw` log text names the impostor before the `win` line.
2. **Wire the clean game into the hosted demo** (this is the main visible upgrade — current live default is the weaker `demo-sample`):
   - `cp engine/replays/<clean>.json web/public/replays/demo-game.json`
   - set `DEFAULT_REPLAY_NAME = "demo-game"` in `web/hooks/use-game-state.ts`
   - `git add -A && git commit && git push` → Vercel auto-deploys.
3. **(Optional) Live end-to-end**: `cd engine && npm start` (WS :8787 + live game), then `cd web && npm run dev` → confirm the theater renders a LIVE game over WS.
4. **Backup video + screenshots** of a good game by ~5:15 (live AI can misbehave on stage; the recorded replay at amongnad.vercel.app is the safe demo path).
5. **Submit** on https://blitz.devnads.com by 5:45 — GitHub `https://github.com/KaranSinghBisht/amongnad`, Demo `https://amongnad.vercel.app`.

## KEY FACTS
- Explorer: `https://testnet.monadscan.com/tx/<hash>` (monadvision 403s to non-browsers). Web reads it from `NEXT_PUBLIC_EXPLORER_TX` (set locally + on Vercel).
- Contract ABI: `engine/src/abi/AmongNad.json` & `web/lib/AmongNad.abi.json`. Funder `0xF1a8…F4B2`; 5 agent wallets in `engine/.agents.json` (gitignored, funded).
- Secrets in `.env.local` (gitignored). **Rotate the Anthropic key after the event** — it was pasted in chat.
- Spec: `PLAN.md` (architecture/game loop/contract), `shared/PROTOCOL.md` (snapshot schema), `README.md` (branded, mermaid diagrams).
- Untracked `web/public/replays/demo-game.json` is the OLD leaky game — overwrite it with the clean one (step 2), don't ship it as-is.
