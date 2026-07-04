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
    <div className="flex shrink-0 flex-wrap gap-2 border-t border-zinc-800 px-3 py-2">
      {voterIds.map((voterId) => {
        const voter = agentById[voterId];
        const vote = votes[voterId];
        return (
          <div
            key={voterId}
            className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs"
          >
            <VoterDot color={voter?.color} />
            <span className="text-zinc-500">→</span>
            {vote === null ? (
              <span className="italic text-zinc-600">deliberating…</span>
            ) : vote === "SKIP" ? (
              <span className="font-semibold text-zinc-400">SKIP</span>
            ) : (
              <>
                <VoterDot color={agentById[vote]?.color} />
                <span className="font-semibold text-zinc-200">
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
      style={{ backgroundColor: color ?? "#52525b" }}
      aria-hidden
    />
  );
}
