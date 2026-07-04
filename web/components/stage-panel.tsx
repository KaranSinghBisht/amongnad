import type { Snapshot } from "@/lib/protocol";
import { GameMap } from "./game-map";
import { MeetingChat } from "./meeting-chat";
import { NodeGraphTexture } from "./node-graph-texture";
import { GameStatusPanel } from "./game-status-panel";
import { CornerBrackets } from "./corner-brackets";

interface StagePanelProps {
  snapshot: Snapshot;
}

export function StagePanel({ snapshot }: StagePanelProps) {
  const inMeeting = snapshot.phase === "meeting";

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-lg border border-[#836EF9]/25 bg-[#140A2E]/50">
      <CornerBrackets />
      <header className="shrink-0 border-b border-[#836EF9]/20 px-3 py-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#A99BFF]/80">
          {inMeeting ? "Emergency Meeting" : "The Skeld"}
        </h2>
      </header>
      <div className="relative min-h-0 flex-1">
        {!inMeeting && (
          <>
            <NodeGraphTexture />
            <GameStatusPanel snapshot={snapshot} />
          </>
        )}
        {inMeeting ? (
          <MeetingChat agents={snapshot.agents} chat={snapshot.chat} meeting={snapshot.meeting} />
        ) : (
          <GameMap agents={snapshot.agents} bodies={snapshot.bodies} />
        )}
      </div>
    </section>
  );
}
