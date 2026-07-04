"use client";

import { useEffect, useRef, useState } from "react";

const STEP_MS = 24;
const MAX_STEPS = 70; // long texts type faster so nothing takes > ~1.7s

/**
 * Streams `text` in character by character whenever it changes, so agent
 * speech/thinking reads like it's being typed live instead of popping in.
 *
 * - `animateOnMount: true` also types the very first value (for chat bubbles,
 *   which mount once per message); default only animates on later changes
 *   (for thinking panels, which keep one instance per agent).
 * - Never animates when text is unchanged (e.g. after a replay seek).
 */
export function useTypewriter(text: string, opts?: { animateOnMount?: boolean }): string {
  const animateOnMount = opts?.animateOnMount ?? false;
  const [shown, setShown] = useState(animateOnMount ? "" : text);
  const prevRef = useRef<string | null>(animateOnMount ? null : text);

  useEffect(() => {
    if (text === prevRef.current) return;
    prevRef.current = text;

    if (!text) {
      setShown("");
      return;
    }

    setShown("");
    const step = Math.max(1, Math.ceil(text.length / MAX_STEPS));
    let i = 0;
    const timer = setInterval(() => {
      i = Math.min(text.length, i + step);
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, STEP_MS);

    return () => clearInterval(timer);
  }, [text]);

  return shown;
}
