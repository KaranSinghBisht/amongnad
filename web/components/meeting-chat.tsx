"use client";

import { useEffect, useRef } from "react";
import type { AgentState, ChatMessage, Meeting } from "@/lib/protocol";
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
      {meeting.reason && (
        <p className="shrink-0 border-b border-[#836EF9]/20 px-3 py-2 text-sm text-[#A99BFF]/80">
          <span className="font-semibold text-[#F4F2FF]">Called:</span> {meeting.reason}
        </p>
      )}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {chat.length === 0 ? (
          <p className="text-sm text-[#A99BFF]/50">Agents are gathering their thoughts…</p>
        ) : (
          chat.map((message) => <ChatBubble key={message.id} message={message} />)
        )}
      </div>
      <VoteTally agents={agents} votes={meeting.votes} />
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: message.color }}
        aria-hidden
      />
      <p className="text-sm leading-snug text-[#F4F2FF]">
        <span className="font-bold" style={{ color: message.color }}>
          {message.name}:
        </span>{" "}
        {message.text}
      </p>
    </div>
  );
}
