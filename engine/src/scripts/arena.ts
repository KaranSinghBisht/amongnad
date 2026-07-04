// Continuous betting arena: open a 10-minute betting round on-chain, run a
// live game, settle every bet from the real outcome, publish the replay (git
// push -> Vercel redeploy), repeat until stopped. Run with: npm run arena
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from '../env';
import { chain } from '../chain';
import { arena } from '../arena-chain';
import { Game } from '../game';
import { GameServer } from '../server';
import type { Snapshot } from '../protocol';

// betting window between games — override for testing: ARENA_WINDOW_MS=60000
const WINDOW_MS = Number(process.env.ARENA_WINDOW_MS || 10 * 60 * 1000);
const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const REPLAYS_DIR = `${REPO_ROOT}web/public/replays/`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface HistoryEntry {
  gameId: number;
  winner: string;
  impostor: string;
  txCount: number;
  file: string;
  endedAt: number;
}

// Open a round if it doesn't exist yet; tolerate "already exists" so restarts
// and the always-open-next-round flow never crash the loop.
async function ensureRound(id: bigint, startsAt: bigint): Promise<void> {
  try {
    await arena.openRound(id, startsAt);
    console.log(`[arena] round #${id} open — betting closes ${new Date(Number(startsAt) * 1000).toLocaleTimeString()}`);
  } catch (err) {
    console.warn(`[arena] openRound #${id} skipped (probably already open):`, (err as Error).message.slice(0, 90));
  }
}

async function runRound(server: GameServer): Promise<void> {
  // our master is the only creator, so the next gameId is gameCount + 1
  const nextId = (await chain.gameCount()) + 1n;
  await ensureRound(nextId, BigInt(Math.floor((Date.now() + WINDOW_MS) / 1000)));

  // wait out this round's ON-CHAIN close time (correct even after a restart)
  const r = await arena.round(nextId);
  const waitMs = Number(r.startsAt) * 1000 - Date.now();
  if (waitMs > 0) {
    console.log(`[arena] betting on #${nextId} open for ${(waitMs / 1000).toFixed(0)}s…`);
    await sleep(waitMs);
  }

  try {
    await arena.closeBetting(nextId);
  } catch (err) {
    console.error('[arena] closeBetting failed (continuing):', (err as Error).message);
  }
  const bets = await arena.betCount(nextId).catch(() => 0n);
  console.log(`[arena] betting closed for #${nextId} — ${bets} bet(s). Starting game…`);

  // betting never stops: open the NEXT game's round immediately, so the crowd
  // bets on game #N+1 while #N is playing out on screen.
  await ensureRound(nextId + 1n, BigInt(Math.floor((Date.now() + WINDOW_MS) / 1000)));

  const frames: Snapshot[] = [];
  const game = new Game((snap) => {
    frames.push(structuredClone(snap));
    server.broadcast(snap);
  });
  await game.setup();
  if (game.gameId !== nextId) {
    console.warn(`[arena] gameId drift: bets on #${nextId}, game is #${game.gameId} — settling #${nextId} from this outcome anyway`);
  }
  await game.run();
  const s = game.summary();

  try {
    await arena.settle(nextId, s.winnerSide, s.firstVictimIndex ?? 0, s.firstVictimIndex !== null);
    console.log(`[arena] settled #${nextId}: winnerSide=${s.winnerSide} firstVictim=${s.firstVictimIndex ?? 'none'}`);
  } catch (err) {
    console.error('[arena] settle FAILED (bets stay unsettled):', (err as Error).message);
  }

  publishReplay(s, frames);
}

// Write the replay + history index into web/public and push, so the hosted
// Vercel site picks up every finished game ~a minute after it ends.
function publishReplay(s: ReturnType<Game['summary']>, frames: Snapshot[]): void {
  try {
    mkdirSync(REPLAYS_DIR, { recursive: true });
    const file = `game-${s.gameId}.json`;
    const meta = { ...s, contract: config.contract, explorerTx: config.explorerTx, createdAt: Date.now() };
    writeFileSync(`${REPLAYS_DIR}${file}`, JSON.stringify({ meta, frames }));

    const indexPath = `${REPLAYS_DIR}index.json`;
    let history: HistoryEntry[] = [];
    if (existsSync(indexPath)) {
      try { history = JSON.parse(readFileSync(indexPath, 'utf8')); } catch { history = []; }
    }
    history.unshift({
      gameId: s.gameId, winner: s.winner, impostor: s.impostor,
      txCount: s.txCount, file, endedAt: Date.now(),
    });
    writeFileSync(indexPath, JSON.stringify(history.slice(0, 50), null, 2));

    execSync('git add web/public/replays', { cwd: REPO_ROOT, stdio: 'pipe' });
    execSync(`git commit -m "arena: game ${s.gameId} replay (${s.winner} won)" --no-verify`, { cwd: REPO_ROOT, stdio: 'pipe' });
    execSync('git pull --rebase --autostash origin main', { cwd: REPO_ROOT, stdio: 'pipe' });
    execSync('git push origin main', { cwd: REPO_ROOT, stdio: 'pipe' });
    console.log(`[arena] published ${file} — Vercel will redeploy with it`);
  } catch (err) {
    console.error('[arena] publish failed (game + settlement are still fine):', (err as Error).message);
  }
}

async function main(): Promise<void> {
  const server = new GameServer(config.wsPort);
  const house = await arena.houseBalance().catch(() => 0n);
  console.log(`[arena] house balance: ${Number(house) / 1e18} MON — rounds start now. Ctrl+C to stop.`);
  for (;;) {
    try {
      await runRound(server);
    } catch (err) {
      console.error('[arena] round crashed — cooling down 20s:', err);
      await sleep(20_000);
    }
  }
}

main();
