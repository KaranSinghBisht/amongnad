"use client";

import { useEffect, useRef } from "react";
import type { LogEntry } from "@/lib/protocol";
import { GameLogRow } from "./game-log-row";
import { CornerBrackets } from "./corner-brackets";

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
    <section className="relative flex h-full flex-col rounded-lg border border-[#836EF9]/25 bg-[#140A2E]/50">
      <CornerBrackets />
      <header className="shrink-0 border-b border-[#836EF9]/20 px-3 py-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#A99BFF]/80">
          On-chain Game Log
        </h2>
      </header>
      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {entries.length === 0 ? (
          <p className="px-2 py-4 text-sm text-[#6b5fa8]">Waiting for the first move…</p>
        ) : (
          entries.map((entry) => <GameLogRow key={entry.id} entry={entry} />)
        )}
      </div>
    </section>
  );
}
