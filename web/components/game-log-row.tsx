import type { LogEntry } from "@/lib/protocol";
import { LOG_KIND_STYLE } from "@/lib/log-style";
import { EXPLORER_TX_BASE } from "@/lib/env";

interface GameLogRowProps {
  entry: LogEntry;
}

export function GameLogRow({ entry }: GameLogRowProps) {
  const style = LOG_KIND_STYLE[entry.kind];
  const rowClass = `group flex items-start gap-2 rounded px-2 py-1.5 text-sm ${style.textClass}`;

  const content = (
    <>
      <span aria-hidden className="shrink-0">
        {style.icon}
      </span>
      <span className="flex-1 leading-snug">{entry.text}</span>
      {entry.txHash && (
        <span className="shrink-0 font-mono text-[10px] text-[#A99BFF]/60 group-hover:text-[#C9B8FF]">
          ↗ tx
        </span>
      )}
    </>
  );

  if (!entry.txHash) {
    return <div className={rowClass}>{content}</div>;
  }

  return (
    <a
      href={`${EXPLORER_TX_BASE}${entry.txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`${rowClass} transition-colors hover:bg-[#836EF9]/10`}
    >
      {content}
    </a>
  );
}
