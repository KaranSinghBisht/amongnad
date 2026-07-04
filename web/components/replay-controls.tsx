import type { ReplayPlayerState } from "@/hooks/use-replay-player";

interface ReplayControlsProps {
  replay: ReplayPlayerState;
}

export function ReplayControls({ replay }: ReplayControlsProps) {
  const { playing, frameIndex, frameCount, play, pause, seek } = replay;

  return (
    <div className="flex shrink-0 items-center gap-3 rounded-lg border border-[#836EF9]/25 bg-[#140A2E]/60 px-4 py-2 text-xs text-[#A99BFF]/80">
      <button
        type="button"
        onClick={playing ? pause : play}
        className="rounded bg-[#836EF9]/20 px-3 py-1 font-bold text-[#F4F2FF] hover:bg-[#836EF9]/35"
      >
        {playing ? "Pause" : "Play"}
      </button>
      <input
        type="range"
        min={0}
        max={Math.max(frameCount - 1, 0)}
        value={frameIndex}
        onChange={(e) => seek(Number(e.target.value))}
        className="flex-1 accent-[#836EF9]"
      />
      <span className="w-16 shrink-0 text-right font-mono">
        {frameIndex + 1}/{frameCount || 1}
      </span>
      <span className="shrink-0 font-bold uppercase tracking-wide text-[#A99BFF]/60">Replay</span>
    </div>
  );
}
