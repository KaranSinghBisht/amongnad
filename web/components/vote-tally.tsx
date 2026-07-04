// "X has voted." strips in the Among Us style: white cards, green bold text
// once the sealed vote lands, revealing the target after on-chain reveal.
import type { AgentState, VoteMap } from "@/lib/protocol";

interface VoteTallyProps {
  agents: AgentState[];
  votes: VoteMap;
}

export function VoteTally({ agents, votes }: VoteTallyProps) {
  const agentById = Object.fromEntries(agents.map((a) => [a.id, a]));
  const voterIds = Object.keys(votes);

  if (voterIds.length === 0) return null;

  return (
    <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-[#836EF9]/20 px-3 py-2">
      {voterIds.map((voterId) => {
        const voter = agentById[voterId];
        const vote = votes[voterId];
        const revealed = vote !== null;
        return (
          <div
            key={voterId}
            className={`flex items-center gap-1.5 rounded-lg border-b-2 px-2.5 py-1 text-xs font-bold shadow-sm ${
              revealed ? "border-black/20 bg-white" : "border-black/10 bg-white/60"
            }`}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/30"
              style={{ backgroundColor: voter?.color }}
              aria-hidden
            />
            {revealed ? (
              vote === "SKIP" ? (
                <span className="text-emerald-600">{voter?.name} voted · SKIP</span>
              ) : (
                <span className="text-emerald-600">
                  {voter?.name} voted · eject{" "}
                  <span style={{ color: agentById[vote]?.color }}>{agentById[vote]?.name ?? vote}</span>
                </span>
              )
            ) : (
              <span className="italic text-zinc-500">{voter?.name} is deliberating…</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
