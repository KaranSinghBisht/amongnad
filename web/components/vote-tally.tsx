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
    <div className="flex shrink-0 flex-wrap gap-2 border-t border-[#836EF9]/20 px-3 py-2">
      {voterIds.map((voterId) => {
        const voter = agentById[voterId];
        const vote = votes[voterId];
        return (
          <div
            key={voterId}
            className="flex items-center gap-1.5 rounded-full border border-[#836EF9]/25 bg-[#1a1030]/70 px-2.5 py-1 text-xs"
          >
            <VoterDot color={voter?.color} />
            <span className="text-[#A99BFF]/60">→</span>
            {vote === null ? (
              <span className="italic text-[#A99BFF]/50">deliberating…</span>
            ) : vote === "SKIP" ? (
              <span className="font-semibold text-[#A99BFF]/80">SKIP</span>
            ) : (
              <>
                <VoterDot color={agentById[vote]?.color} />
                <span className="font-semibold text-[#F4F2FF]">
                  {agentById[vote]?.name ?? vote}
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VoterDot({ color }: { color?: string }) {
  return (
    <span
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: color ?? "#836EF9" }}
      aria-hidden
    />
  );
}
