"use client";

import type { AgentState } from "@/lib/protocol";
import { useTypewriter } from "@/hooks/use-typewriter";
import { CrewmateIcon } from "./crewmate-icon";
import { CornerBrackets } from "./corner-brackets";

interface AgentPanelProps {
  agent: AgentState;
}

export function AgentPanel({ agent }: AgentPanelProps) {
  const isRevealedImpostor = agent.role === "impostor";
  const thinking = useTypewriter(agent.thinking);
  const typing = thinking.length < agent.thinking.length;

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-lg border bg-[#140A2E]/50 ${
        isRevealedImpostor ? "border-red-500/70" : "border-[#836EF9]/25"
      } ${agent.alive ? "" : "opacity-50"}`}
    >
      <CornerBrackets size={9} />
      <header
        className="flex shrink-0 items-center justify-between gap-2 border-b border-black/30 px-3 py-2"
        style={{ backgroundColor: `${agent.color}26` }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <svg viewBox="0 0 36 36" className="h-5 w-5 shrink-0" aria-hidden>
            <CrewmateIcon color={agent.color} />
          </svg>
          <span className="truncate text-sm font-bold text-[#F4F2FF]">{agent.name}</span>
          <span className="truncate text-xs text-[#A99BFF]/70">{agent.soul}</span>
        </div>
        <StatusBadge agent={agent} isRevealedImpostor={isRevealedImpostor} />
      </header>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-[#c9bfe8]/90">
          {thinking || "…"}
          {typing && <span className="animate-pulse text-[#836EF9]">▌</span>}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({
  agent,
  isRevealedImpostor,
}: {
  agent: AgentState;
  isRevealedImpostor: boolean;
}) {
  if (!agent.alive) {
    return (
      <span className="shrink-0 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#A99BFF]/70">
        Dead
      </span>
    );
  }
  if (isRevealedImpostor) {
    return (
      <span className="shrink-0 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-400">
        Impostor
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
      Alive
    </span>
  );
}
