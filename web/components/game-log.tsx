"use client";

import { useEffect, useRef } from "react";
import type { LogEntry } from "@/lib/protocol";
import { GameLogRow } from "./game-log-row";

interface GameLogProps {
  entries: LogEntry[];
}

export function GameLog({ entries }: GameLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <section className="flex h-full flex-col rounded-lg border border-zinc-800 bg-zinc-950/60">
      <header className="shrink-0 border-b border-zinc-800 px-3 py-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          On-chain Game Log
        </h2>
      </header>
      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {entries.length === 0 ? (
          <p className="px-2 py-4 text-sm text-zinc-600">Waiting for the first move…</p>
        ) : (
          entries.map((entry) => <GameLogRow key={entry.id} entry={entry} />)
        )}
      </div>
    </section>
  );
}
