"use client";

// Past arena games, from /replays/index.json (written by the arena loop).
// Hidden when the index doesn't exist — e.g. before the first arena round.
import { useEffect, useState } from "react";
import Link from "next/link";

interface HistoryEntry {
  gameId: number;
  winner: string;
  impostor: string;
  txCount: number;
  file: string;
}

export function GameHistory() {
  const [games, setGames] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    let live = true;
    fetch("/replays/index.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (live && Array.isArray(data)) setGames(data); })
      .catch(() => undefined);
    return () => { live = false; };
  }, []);

  if (games.length === 0) return null;

  return (
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto rounded-lg border border-[#836EF9]/20 bg-[#140A2E]/50 px-3 py-1.5 font-mono text-[11px] text-[#A99BFF]/80">
      <span className="shrink-0 font-bold uppercase tracking-widest text-[#6b5fa8]">Past games</span>
      {games.slice(0, 12).map((g) => (
        <Link
          key={g.gameId}
          href={`/watch?replay=game-${g.gameId}`}
          className="shrink-0 rounded-full border border-[#836EF9]/30 px-2.5 py-0.5 transition-colors hover:bg-[#836EF9]/15"
        >
          #{g.gameId} · {g.winner === "impostor" ? "🔪 impostor" : "🏆 crew"} · {g.txCount} tx
        </Link>
      ))}
    </div>
  );
}
