import type { AgentState } from "@/lib/protocol";
import { AgentPanel } from "./agent-panel";

interface AgentPanelRowProps {
  agents: AgentState[];
}

// One strip, never wraps: 6 panels share the row on wide screens and scroll
// horizontally on smaller ones — wrapping used to blow past the viewport and
// push the replay controls off-screen.
export function AgentPanelRow({ agents }: AgentPanelRowProps) {
  return (
    <div className="flex h-full gap-3 overflow-x-auto pb-1">
      {agents.map((agent) => (
        <div key={agent.id} className="h-full w-[280px] shrink-0 xl:w-auto xl:min-w-[220px] xl:flex-1 xl:shrink">
          <AgentPanel agent={agent} />
        </div>
      ))}
    </div>
  );
}
