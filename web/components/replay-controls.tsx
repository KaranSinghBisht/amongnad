import type { ReplayPlayerState } from "@/hooks/use-replay-player";

interface ReplayControlsProps {
  replay: ReplayPlayerState;
}

export function ReplayControls({ replay }: ReplayControlsProps) {
  const { playing, frameIndex, frameCount, play, pause, seek } = replay;

  return (
    <div className="flex shrink-0 items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-xs text-zinc-400">
      <button
        type="button"
        onClick={playing ? pause : play}
        className="rounded bg-zinc-800 px-3 py-1 font-bold text-zinc-100 hover:bg-zinc-700"
      >
        {playing ? "Pause" : "Play"}
      </button>
      <input
        type="range"
        min={0}
        max={Math.max(frameCount - 1, 0)}
        value={frameIndex}
        onChange={(e) => seek(Number(e.target.value))}
        className="flex-1 accent-emerald-400"
      />
      <span className="w-16 shrink-0 text-right font-mono">
        {frameIndex + 1}/{frameCount || 1}
      </span>
      <span className="shrink-0 font-bold uppercase tracking-wide text-zinc-500">Replay</span>
    </div>
  );
}
