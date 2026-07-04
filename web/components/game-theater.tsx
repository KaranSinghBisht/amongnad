"use client";

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
    <div className="flex h-dvh flex-col gap-3 bg-[#0a0a0f] p-3 text-zinc-100">
      <ShadowClock clock={snapshot.clock} mode={mode} />

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
