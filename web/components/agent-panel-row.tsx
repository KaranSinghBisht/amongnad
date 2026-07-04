import type { AgentState } from "@/lib/protocol";
import { AgentPanel } from "./agent-panel";

interface AgentPanelRowProps {
  agents: AgentState[];
}

export function AgentPanelRow({ agents }: AgentPanelRowProps) {
  return (
    <div className="flex h-full flex-wrap gap-3">
      {agents.map((agent) => (
        <div key={agent.id} className="min-w-[220px] flex-1 basis-[220px]">
          <AgentPanel agent={agent} />
        </div>
      ))}
    </div>
  );
}
