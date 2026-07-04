"use client";

import { useEffect, useState } from "react";
import type { ReplayFile, Snapshot } from "@/lib/protocol";

const FRAME_INTERVAL_MS = 1200;

export interface ReplayPlayerState {
  snapshot: Snapshot | null;
  frameIndex: number;
  frameCount: number;
  playing: boolean;
  loading: boolean;
  error: string | null;
  play: () => void;
  pause: () => void;
  seek: (index: number) => void;
}

/**
 * Fetches /replays/<name>.json and plays its frames on a fixed timer, with
 * play/pause/seek controls. Pass `null` to skip fetching (e.g. while a live
 * WebSocket connection is still being attempted).
 */
export function useReplayPlayer(name: string | null): ReplayPlayerState {
  const [frames, setFrames] = useState<Snapshot[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) {
      setFrames([]);
      setFrameIndex(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/replays/${name}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Replay "${name}" not found (${res.status})`);
        return res.json() as Promise<ReplayFile>;
      })
      .then((data) => {
        if (cancelled) return;
        setFrames(data.frames);
        setFrameIndex(0);
        setPlaying(true);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [name]);

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const timer = setInterval(() => {
      setFrameIndex((i) => (i + 1 < frames.length ? i + 1 : i));
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [playing, frames.length]);

  useEffect(() => {
    if (frames.length > 0 && frameIndex === frames.length - 1) {
      setPlaying(false);
    }
  }, [frameIndex, frames.length]);

  return {
    snapshot: frames[frameIndex] ?? null,
    frameIndex,
    frameCount: frames.length,
    playing,
    loading,
    error,
    play: () => {
      setFrameIndex((i) => (frames.length > 0 && i === frames.length - 1 ? 0 : i));
      setPlaying(true);
    },
    pause: () => setPlaying(false),
    seek: (index: number) =>
      setFrameIndex(Math.max(0, Math.min(index, frames.length - 1))),
  };
}
