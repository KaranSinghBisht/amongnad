"use client";

import Link from "next/link";
import { useGameState } from "@/hooks/use-game-state";
import { ShadowClock } from "./shadow-clock";
import { GameLog } from "./game-log";
import { StagePanel } from "./stage-panel";
import { AgentPanelRow } from "./agent-panel-row";
import { ReplayControls } from "./replay-controls";
import { TheaterLoading } from "./theater-loading";

export function GameTheater() {
  const { mode, snapshot, replay } = useGameState();

  if (!snapshot) {
    return <TheaterLoading mode={mode} />;
  }

  return (
    <div className="flex h-dvh flex-col gap-3 overflow-hidden p-3 text-[#F4F2FF]">
      <div className="flex shrink-0 items-stretch gap-3">
        <Link
          href="/"
          className="glow-purple flex items-center rounded-lg border border-[#836EF9]/30 bg-[#140A2E]/60 px-4 font-black italic tracking-tight"
        >
          <span className="bg-gradient-to-r from-white via-[#E4B9F0] to-[#836EF9] bg-clip-text text-xl text-transparent">
            AMONG⚡NAD
          </span>
        </Link>
        <div className="min-w-0 flex-1">
          <ShadowClock clock={snapshot.clock} mode={mode} />
        </div>
      </div>

      <div className="grid min-h-0 flex-[3] grid-cols-10 gap-3">
        <div className="col-span-10 min-h-0 md:col-span-3">
          <GameLog entries={snapshot.log} />
        </div>
        <div className="col-span-10 min-h-0 md:col-span-7">
          <StagePanel snapshot={snapshot} />
        </div>
      </div>

      <div className="min-h-0 flex-[2]">
        <AgentPanelRow agents={snapshot.agents} />
      </div>

      {replay && <ReplayControls replay={replay} />}
    </div>
  );
}
