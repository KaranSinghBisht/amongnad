import type { ConnectionMode } from "@/hooks/use-game-state";
import { SiteBanner } from "./site-banner";

interface TheaterLoadingProps {
  mode?: ConnectionMode;
}

export function TheaterLoading({ mode }: TheaterLoadingProps) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 p-3 text-[#A99BFF]">
      <div className="w-full max-w-3xl">
        <SiteBanner />
      </div>
      <p className="text-sm tracking-wide">
        {mode === "connecting" ? "Connecting to the engine…" : "Loading the theater…"}
      </p>
    </div>
  );
}
