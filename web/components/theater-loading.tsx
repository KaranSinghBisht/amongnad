import type { ConnectionMode } from "@/hooks/use-game-state";

interface TheaterLoadingProps {
  mode?: ConnectionMode;
}

export function TheaterLoading({ mode }: TheaterLoadingProps) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-[#0a0a0f] text-zinc-500">
      <div className="text-2xl font-black tracking-tight text-zinc-300">
        AMONG<span className="text-fuchsia-400">NAD</span>
      </div>
      <p className="text-sm">
        {mode === "connecting" ? "Connecting to the engine…" : "Loading the theater…"}
      </p>
    </div>
  );
}
