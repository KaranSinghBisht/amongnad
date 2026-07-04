import Image from "next/image";
import type { Snapshot } from "@/lib/protocol";
import { GameMap } from "./game-map";
import { MeetingChat } from "./meeting-chat";
import { GameStatusPanel } from "./game-status-panel";
import { CornerBrackets } from "./corner-brackets";

interface StagePanelProps {
  snapshot: Snapshot;
}

export function StagePanel({ snapshot }: StagePanelProps) {
  const inMeeting = snapshot.phase === "meeting";
  const lights = snapshot.lights ?? true;

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-lg border border-[#836EF9]/25 bg-[#140A2E]/50">
      <CornerBrackets />
      <header className="z-20 shrink-0 border-b border-[#836EF9]/20 px-3 py-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#A99BFF]/80">
          {inMeeting ? (
            "Emergency Meeting"
          ) : lights ? (
            "The Skeld"
          ) : (
            <span className="text-orange-400">The Skeld — ⚠ lights out</span>
          )}
        </h2>
      </header>
      <div className="relative min-h-0 flex-1">
        {inMeeting ? (
          <MeetingChat agents={snapshot.agents} chat={snapshot.chat} meeting={snapshot.meeting} />
        ) : (
          <>
            {/* cinematic ship interior behind the live room graph */}
            <Image
              src="/hero_image.png"
              alt=""
              fill
              sizes="70vw"
              className="pointer-events-none select-none object-cover opacity-35"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0B0620]/70 via-transparent to-[#0B0620]/75" />
            <GameMap agents={snapshot.agents} bodies={snapshot.bodies} />
            {!lights && (
              <div className="pointer-events-none absolute inset-0 bg-[#02010B]/70 backdrop-blur-[1px] transition-opacity duration-500" />
            )}
            <GameStatusPanel snapshot={snapshot} />
          </>
        )}
      </div>
    </section>
  );
}
