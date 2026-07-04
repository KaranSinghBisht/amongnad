"use client";

// Emergency-meeting chat styled after the actual Among Us chat UI: white
// rounded speech cards with the agent's crewmate avatar, over the dark panel,
// with a decorative disabled input bar at the bottom.
import { useEffect, useRef } from "react";
import type { AgentState, ChatMessage, Meeting } from "@/lib/protocol";
import { useTypewriter } from "@/hooks/use-typewriter";
import { CrewmateIcon } from "./crewmate-icon";
import { VoteTally } from "./vote-tally";

interface MeetingChatProps {
  agents: AgentState[];
  chat: ChatMessage[];
  meeting: Meeting;
}

export function MeetingChat({ agents, chat, meeting }: MeetingChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat.length]);

  return (
    <div className="relative flex h-full flex-col">
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/3 select-none text-center text-2xl font-black uppercase tracking-widest text-white/5"
      >
        Who is the Impostor?
      </p>

      {meeting.reason && (
        <p className="shrink-0 border-b border-[#836EF9]/20 px-3 py-2 text-sm text-[#A99BFF]/80">
          <span className="font-semibold text-[#F4F2FF]">Called:</span> {meeting.reason}
        </p>
      )}

      <div ref={scrollRef} className="relative flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
        {chat.length === 0 ? (
          <p className="text-sm text-[#A99BFF]/50">Agents are gathering their thoughts…</p>
        ) : (
          chat.map((message, i) => (
            <ChatBubble key={message.id} message={message} isLatest={i === chat.length - 1} />
          ))
        )}
      </div>

      <VoteTally agents={agents} votes={meeting.votes} />

      {/* decorative Among-Us-style input bar — agents type, you watch */}
      <div className="flex shrink-0 items-center gap-2 border-t border-[#836EF9]/20 px-3 py-2">
        <div className="flex h-8 flex-1 items-center justify-end rounded-lg border-2 border-white/25 bg-white/10 px-2 font-mono text-[10px] text-white/40">
          0/100
        </div>
        <span className="text-lg text-[#836EF9]" aria-hidden>➤</span>
      </div>
    </div>
  );
}

function ChatBubble({ message, isLatest }: { message: ChatMessage; isLatest: boolean }) {
  const text = useTypewriter(message.text, { animateOnMount: isLatest });
  const typing = text.length < message.text.length;

  return (
    <div className="flex items-start gap-2">
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black/30"
        style={{ backgroundColor: `${message.color}33` }}
        aria-hidden
      >
        <svg viewBox="0 0 36 36" className="h-6 w-6">
          <CrewmateIcon color={message.color} />
        </svg>
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border-b-2 border-black/20 bg-white px-3 py-2 shadow-md">
        <p className="text-sm font-black leading-none" style={{ color: message.color }}>
          {message.name}
        </p>
        <p className="mt-1 text-sm font-medium leading-snug text-zinc-900">
          {text}
          {typing && <span className="animate-pulse text-[#836EF9]">▌</span>}
        </p>
      </div>
    </div>
  );
}
