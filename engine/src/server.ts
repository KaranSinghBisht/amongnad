// Minimal WebSocket server: sends the latest snapshot on connect and
// broadcasts every new snapshot to all connected spectators.
import { WebSocketServer, WebSocket } from 'ws';
import type { Snapshot } from './protocol';

export class GameServer {
  private wss: WebSocketServer;
  private latest: Snapshot | null = null;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.wss.on('connection', (ws) => {
      if (this.latest) {
        try {
          ws.send(JSON.stringify(this.latest));
        } catch (err) {
          console.error('[ws] failed to send latest snapshot:', err);
        }
      }
    });
    this.wss.on('error', (err) => console.error('[ws] server error:', err));
    console.log(`[ws] listening on ws://localhost:${port}`);
  }

  broadcast(snap: Snapshot): void {
    this.latest = snap;
    const data = JSON.stringify(snap);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
        } catch (err) {
          console.error('[ws] failed to broadcast:', err);
        }
      }
    }
  }
}
