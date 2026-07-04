// Color/icon legend for the on-chain game log — one lookup, shared by the
// log row renderer. Grouping follows PLAN.md: kill=red, vent/report=amber,
// meeting/vote=blue, eject=purple, win=green, move/saw/spawn=muted.

import type { LogKind } from "./protocol";

interface LogKindStyle {
  icon: string;
  textClass: string;
}

export const LOG_KIND_STYLE: Record<LogKind, LogKindStyle> = {
  spawn: { icon: "✨", textClass: "text-zinc-400" },
  move: { icon: "→", textClass: "text-zinc-400" },
  saw: { icon: "👁", textClass: "text-zinc-400" },
  kill: { icon: "🔪", textClass: "text-red-400" },
  vent: { icon: "🌀", textClass: "text-amber-400" },
  report: { icon: "🚨", textClass: "text-amber-400" },
  meeting: { icon: "📣", textClass: "text-blue-400" },
  vote: { icon: "🗳️", textClass: "text-blue-400" },
  eject: { icon: "⛔", textClass: "text-purple-400" },
  win: { icon: "🏆", textClass: "text-green-400" },
  sabotage: { icon: "🌑", textClass: "text-orange-400" },
  fix: { icon: "💡", textClass: "text-emerald-300" },
};
