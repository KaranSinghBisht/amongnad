// Start the WebSocket server and run one live game, broadcasting every
// snapshot to connected spectators. The server keeps serving the final
// snapshot after the game ends so late viewers still see the result.
import { config } from './env';
import { GameServer } from './server';
import { Game } from './game';

async function main() {
  const server = new GameServer(config.wsPort);
  const game = new Game((snap) => server.broadcast(snap));

  await game.setup();
  await game.run();

  const s = game.summary();
  console.log(`[index] game over — ${s.winner} won in ${s.txCount} on-chain txs.`);
  console.log(`[index] WS server still serving the final snapshot on port ${config.wsPort}. Ctrl+C to stop.`);
}

main().catch((err) => {
  console.error('[index] fatal:', err);
  process.exit(1);
});
