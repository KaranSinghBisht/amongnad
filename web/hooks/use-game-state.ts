"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Snapshot } from "@/lib/protocol";
import { WS_URL } from "@/lib/env";
import { useWebSocketSnapshot } from "./use-websocket-snapshot";
import { useReplayPlayer, type ReplayPlayerState } from "./use-replay-player";

const WS_CONNECT_TIMEOUT_MS = 2500;
const DEFAULT_REPLAY_NAME = "demo-game";

export type ConnectionMode = "connecting" | "live" | "replay";

export interface GameState {
  mode: ConnectionMode;
  snapshot: Snapshot | null;
  /** Present only in replay mode — play/pause/scrub controls for the UI. */
  replay: ReplayPlayerState | null;
}

/**
 * Single source of truth for "what does the theater show right now":
 * - `?replay=<name>` in the URL always wins (explicit override, no WS attempt).
 * - Otherwise try the engine's WS; if it doesn't deliver a snapshot within
 *   WS_CONNECT_TIMEOUT_MS (or errors/closes first), fall back to the bundled
 *   demo replay so the page always works with no engine running.
 */
export function useGameState(): GameState {
  const searchParams = useSearchParams();
  const forcedReplayName = searchParams.get("replay");
  const attemptLive = !forcedReplayName && !!WS_URL;

  const [mode, setMode] = useState<ConnectionMode>(attemptLive ? "connecting" : "replay");

  const live = useWebSocketSnapshot(attemptLive ? WS_URL : undefined);
  const replay = useReplayPlayer(
    mode === "replay" ? forcedReplayName ?? DEFAULT_REPLAY_NAME : null
  );

  useEffect(() => {
    if (!attemptLive) return;

    if (live.snapshot) {
      setMode("live");
      return;
    }

    if (live.status === "closed") {
      setMode((current) => (current === "live" ? current : "replay"));
      return;
    }

    const timer = setTimeout(() => {
      setMode((current) => (current === "live" ? current : "replay"));
    }, WS_CONNECT_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [attemptLive, live.status, live.snapshot]);

  return {
    mode,
    snapshot: mode === "live" ? live.snapshot : replay.snapshot,
    replay: mode === "replay" ? replay : null,
  };
}
