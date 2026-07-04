"use client";

import { useEffect, useState } from "react";
import type { Snapshot } from "@/lib/protocol";

export type SocketStatus = "connecting" | "open" | "closed";

export interface WebSocketSnapshotState {
  snapshot: Snapshot | null;
  status: SocketStatus;
}

/**
 * Connects to the engine's WS endpoint and tracks the latest full Snapshot.
 * Pass `undefined` to skip connecting entirely (e.g. no URL configured, or
 * the caller has already decided to use a replay instead).
 */
export function useWebSocketSnapshot(url: string | undefined): WebSocketSnapshotState {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<SocketStatus>("connecting");

  useEffect(() => {
    if (!url) {
      setStatus("closed");
      return;
    }

    setSnapshot(null);
    setStatus("connecting");

    let cancelled = false;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      if (!cancelled) setStatus("open");
    };

    ws.onmessage = (event) => {
      if (cancelled) return;
      try {
        const data = JSON.parse(event.data) as Snapshot;
        if (data?.type === "snapshot") setSnapshot(data);
      } catch (err) {
        console.error("useWebSocketSnapshot: failed to parse message", err);
      }
    };

    ws.onerror = () => {
      if (!cancelled) setStatus("closed");
    };

    ws.onclose = () => {
      if (!cancelled) setStatus("closed");
    };

    return () => {
      cancelled = true;
      ws.close();
    };
  }, [url]);

  return { snapshot, status };
}
