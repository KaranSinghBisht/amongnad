import type { Snapshot } from "@/lib/protocol";
import { GameMap } from "./game-map";
import { MeetingChat } from "./meeting-chat";

interface StagePanelProps {
  snapshot: Snapshot;
}

export function StagePanel({ snapshot }: StagePanelProps) {
  const inMeeting = snapshot.phase === "meeting";

  return (
    <section className="flex h-full flex-col rounded-lg border border-zinc-800 bg-zinc-950/60">
      <header className="shrink-0 border-b border-zinc-800 px-3 py-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          {inMeeting ? "Emergency Meeting" : "The Skeld"}
        </h2>
      </header>
      <div className="relative min-h-0 flex-1">
        {inMeeting ? (
          <MeetingChat agents={snapshot.agents} chat={snapshot.chat} meeting={snapshot.meeting} />
        ) : (
          <GameMap agents={snapshot.agents} bodies={snapshot.bodies} />
        )}
      </div>
    </section>
  );
}
