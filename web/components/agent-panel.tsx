import type { AgentState } from "@/lib/protocol";

interface AgentPanelProps {
  agent: AgentState;
}

export function AgentPanel({ agent }: AgentPanelProps) {
  const isRevealedImpostor = agent.role === "impostor";

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-lg border bg-zinc-950/60 ${
        isRevealedImpostor ? "border-red-500/70" : "border-zinc-800"
      } ${agent.alive ? "" : "opacity-50"}`}
    >
      <header
        className="flex shrink-0 items-center justify-between gap-2 border-b border-black/30 px-3 py-2"
        style={{ backgroundColor: `${agent.color}26` }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: agent.color }}
            aria-hidden
          />
          <span className="truncate text-sm font-bold text-zinc-100">{agent.name}</span>
          <span className="truncate text-xs text-zinc-500">{agent.soul}</span>
        </div>
        <StatusBadge agent={agent} isRevealedImpostor={isRevealedImpostor} />
      </header>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-zinc-400">
          {agent.thinking || "…"}
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
      <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
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
