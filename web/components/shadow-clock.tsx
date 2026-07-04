import type { Clock } from "@/lib/protocol";
import type { ConnectionMode } from "@/hooks/use-game-state";
import { CornerBrackets } from "./corner-brackets";
import { EkgWaveform } from "./ekg-waveform";

interface ShadowClockProps {
  clock: Clock;
  mode: ConnectionMode;
}

function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

export function ShadowClock({ clock, mode }: ShadowClockProps) {
  return (
    <header className="glow-purple relative flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-lg border border-[#836EF9]/30 bg-[#140A2E]/60 px-5 py-3">
      <CornerBrackets />

      <StatusWidget mode={mode} />

      <div className="flex flex-wrap items-center gap-3 font-mono text-base font-extrabold sm:text-lg">
        <span className="text-[#A99BFF]">
          MONAD ⚡ {formatSeconds(clock.monadMs)}s · {clock.txCount} txs
        </span>
        <span className="text-sm font-normal text-[#6b5fa8]">vs</span>
        <span className="text-[#6b5fa8] line-through decoration-red-500/60">
          ETHEREUM 🐢 {formatSeconds(clock.ethEquivMs)}s
        </span>
      </div>
    </header>
  );
}

function StatusWidget({ mode }: { mode: ConnectionMode }) {
  const label = mode === "live" ? "ONLINE" : mode === "replay" ? "REPLAY" : "CONNECTING";
  const dotColor = mode === "live" ? "#4ade80" : mode === "replay" ? "#A99BFF" : "#6b5fa8";

  return (
    <div className="flex shrink-0 items-center gap-3">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
        aria-hidden
      />
      <div className="font-mono leading-tight">
        <div className="text-[10px] tracking-wider text-[#A99BFF]/70">AGENT STATUS</div>
        <div className="text-xs font-bold tracking-widest text-[#C9B8FF]">{label}</div>
      </div>
      <EkgWaveform active={mode === "live"} className="h-6 w-20" />
    </div>
  );
}
