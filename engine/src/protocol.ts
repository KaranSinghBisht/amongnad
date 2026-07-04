// Snapshot shapes emitted over WebSocket and recorded as replay frames.
// MUST match shared/PROTOCOL.md exactly — the web app renders from these.

export type Phase = 'lobby' | 'active' | 'meeting' | 'ended';

export type LogKind =
  | 'spawn' | 'move' | 'saw' | 'kill' | 'vent'
  | 'report' | 'meeting' | 'vote' | 'eject' | 'win'
  | 'sabotage' | 'fix';

export interface AgentView {
  id: string;
  name: string;
  color: string;
  soul: string;
  room: string;
  alive: boolean;
  role: null | 'crew' | 'impostor'; // null while secret; revealed at endGame
  wallet: string;
  thinking: string;
}

export interface Body {
  room: string;
  victim: string; // agent id
}

export interface LogEntry {
  id: number;
  kind: LogKind;
  text: string;
  txHash: string | null; // null until mined / if the write failed
  ts: number;
}

export interface ChatMsg {
  id: number;
  agentId: string;
  name: string;
  color: string;
  text: string;
  ts: number;
}

export interface MeetingView {
  active: boolean;
  round: number;
  reason: string;
  // agentId -> suspect agentId | "SKIP" | null (null == vote not yet revealed)
  votes: Record<string, string | null>;
}

export interface Clock {
  monadMs: number;
  ethEquivMs: number;
  txCount: number;
}

export interface Snapshot {
  type: 'snapshot';
  gameId: number;
  tick: number;
  phase: Phase;
  agents: AgentView[];
  bodies: Body[];
  lights: boolean; // false while the impostor's sabotage has the lights out
  log: LogEntry[];
  chat: ChatMsg[];
  meeting: MeetingView | null;
  clock: Clock;
}
