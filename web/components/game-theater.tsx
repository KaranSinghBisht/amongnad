"use client";

import Link from "next/link";
import Image from "next/image";
import { useGameState } from "@/hooks/use-game-state";
import { ShadowClock } from "./shadow-clock";
import { GameLog } from "./game-log";
import { StagePanel } from "./stage-panel";
import { AgentPanelRow } from "./agent-panel-row";
import { ReplayControls } from "./replay-controls";
import { TheaterLoading } from "./theater-loading";
import { BetPanel } from "./bet-panel";
import { GameHistory } from "./game-history";

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
          className="glow-purple flex items-center rounded-lg border border-[#836EF9]/30 bg-[#140A2E]/60 px-4"
        >
          <Image src="/wordmark.png" alt="AMONGNAD" width={1579} height={436} priority className="h-7 w-auto" />
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

      <BetPanel />
      {replay && <ReplayControls replay={replay} />}
      <GameHistory />
    </div>
  );
}
