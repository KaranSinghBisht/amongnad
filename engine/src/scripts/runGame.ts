// Run one game headless and save the replay to engine/replays/demo-<ts>.json
// as { meta, frames: Snapshot[] }. Run with: npm run run-game
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from '../env';
import { Game } from '../game';
import type { Snapshot } from '../protocol';

async function main() {
  const frames: Snapshot[] = [];
  const game = new Game((snap) => frames.push(structuredClone(snap)));

  await game.setup();
  await game.run();

  const s = game.summary();
  const ts = Date.now();
  const dir = fileURLToPath(new URL('../../replays/', import.meta.url));
  mkdirSync(dir, { recursive: true });
  const file = `${dir}demo-${ts}.json`;

  const meta = {
    gameId: s.gameId,
    winner: s.winner,
    impostor: s.impostor,
    txCount: s.txCount,
    createdAt: ts,
    agents: s.agents,
    contract: config.contract,
    explorerTx: config.explorerTx,
  };
  writeFileSync(file, JSON.stringify({ meta, frames }, null, 2));

  console.log('\n================ RUN COMPLETE ================');
  console.log(`replay: ${file}`);
  console.log(`frames: ${frames.length}`);
  console.log(`winner: ${s.winner} | impostor: ${s.impostor} | on-chain txs: ${s.txCount}`);
  console.log('\nfunded agent addresses:');
  for (const a of s.agents) console.log(`  ${a.name} (${a.soul}): ${a.address}`);

  const withTx = s.txHashes.filter((t) => t.txHash);
  console.log('\nsample on-chain txs (open on the explorer):');
  for (const t of withTx.slice(0, 5)) {
    console.log(`  [${t.kind}] ${t.text}`);
    console.log(`    ${config.explorerTx}${t.txHash}`);
  }
  console.log('=============================================\n');
}

main().catch((err) => {
  console.error('[run-game] fatal:', err);
  process.exit(1);
});
