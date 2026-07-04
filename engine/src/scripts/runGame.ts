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

  // P5: also overwrite the hosted-demo replay the web app serves.
  let webFile = '';
  try {
    const webDir = fileURLToPath(new URL('../../../web/public/replays/', import.meta.url));
    mkdirSync(webDir, { recursive: true });
    webFile = `${webDir}demo-game.json`;
    writeFileSync(webFile, JSON.stringify({ meta, frames }, null, 2));
  } catch (err) {
    console.warn('[run-game] could not write web replay:', (err as Error).message);
  }

  // Verify the signature events are present in this recording.
  const lastLog = frames[frames.length - 1]?.log ?? [];
  const kinds = new Set(lastLog.map((l) => l.kind));
  const has = (k: string) => (kinds.has(k as never) ? 'yes' : 'NO');

  console.log('\n================ RUN COMPLETE ================');
  console.log(`replay: ${file}`);
  if (webFile) console.log(`web replay (hosted demo): ${webFile}`);
  console.log(`frames: ${frames.length}`);
  console.log(`winner: ${s.winner} | impostor: ${s.impostor} | on-chain txs: ${s.txCount} | tx failures: ${s.txFailures}`);
  console.log(`signature events -> kill: ${has('kill')} | report: ${has('report')} | vent: ${has('vent')} | meeting: ${has('meeting')} | eject: ${has('eject')}`);
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
