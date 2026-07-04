// The banner's "TASKS" checklist widget, repurposed as a live game-status
// HUD overlaid on a corner of the Stage. Impostor count stays a mystery
// ("?") until roles are actually revealed at endGame — this widget must
// not spoil the deduction game it's reporting on.

import type { Snapshot } from "@/lib/protocol";

interface GameStatusPanelProps {
  snapshot: Snapshot;
}

export function GameStatusPanel({ snapshot }: GameStatusPanelProps) {
  const { agents, tick } = snapshot;
  const aliveCount = agents.filter((a) => a.alive).length;
  const rolesRevealed = agents.some((a) => a.role !== null);
  const impostorsLeft = rolesRevealed
    ? agents.filter((a) => a.role === "impostor" && a.alive).length
    : null;

  return (
    <div className="absolute left-2 top-2 z-10 rounded border border-[#836EF9]/35 bg-[#0B0620]/80 px-3 py-2 font-mono text-[10px] leading-relaxed text-[#C9B8FF] backdrop-blur-sm">
      <div className="mb-1 border-b border-[#836EF9]/25 pb-1 tracking-widest text-[#A99BFF]/70">
        GAME STATUS
      </div>
      <StatusRow label="ALIVE" value={`${aliveCount}/${agents.length}`} />
      <StatusRow label="IMPOSTORS" value={impostorsLeft === null ? "?" : String(impostorsLeft)} />
      <StatusRow label="TICK" value={`#${tick}`} />
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 shrink-0 border border-[#836EF9]/60" aria-hidden />
      <span className="text-[#A99BFF]/70">{label}</span>
      <span className="ml-auto pl-3 font-bold text-[#F4F2FF]">{value}</span>
    </div>
  );
}
