import type { Clock } from "@/lib/protocol";
import type { ConnectionMode } from "@/hooks/use-game-state";

interface ShadowClockProps {
  clock: Clock;
  mode: ConnectionMode;
}

function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

export function ShadowClock({ clock, mode }: ShadowClockProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-2">
      <div className="text-lg font-black tracking-tight">
        <span className="text-emerald-400">AMONG</span>
        <span className="text-fuchsia-400">NAD</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 font-mono text-sm sm:text-base">
        <span className="font-bold text-violet-300">
          MONAD ⚡ {formatSeconds(clock.monadMs)}s · {clock.txCount} txs
        </span>
        <span className="text-zinc-600">vs</span>
        <span className="text-zinc-500 line-through decoration-red-500/60">
          ETHEREUM 🐢 {formatSeconds(clock.ethEquivMs)}s
        </span>
      </div>

      <ModeBadge mode={mode} />
    </header>
  );
}

function ModeBadge({ mode }: { mode: ConnectionMode }) {
  if (mode === "live") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden />
        Live
      </span>
    );
  }
  if (mode === "replay") {
    return (
      <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-zinc-500">
        Replay
      </span>
    );
  }
  return (
    <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-zinc-600">
      Connecting…
    </span>
  );
}
