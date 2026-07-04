// Mirrors shared/PROTOCOL.md exactly — this is the wire format the engine
// broadcasts over WebSocket (and records into replay files). Keep field
// names in lockstep with that doc; it is the source of truth, not this file.

export type Phase = "lobby" | "active" | "meeting" | "ended";

export type Role = "crew" | "impostor" | null;

export type LogKind =
  | "spawn"
  | "move"
  | "saw"
  | "kill"
  | "vent"
  | "report"
  | "meeting"
  | "vote"
  | "eject"
  | "win";

export interface AgentState {
  id: string;
  name: string;
  color: string;
  soul: string;
  room: string;
  alive: boolean;
  role: Role;
  wallet: string;
  thinking: string;
}

export interface Body {
  room: string;
  victim: string;
}

export interface LogEntry {
  id: number;
  kind: LogKind;
  text: string;
  txHash: string | null;
  ts: number;
}

export interface ChatMessage {
  id: number;
  agentId: string;
  name: string;
  color: string;
  text: string;
  ts: number;
}

/** agentId -> suspect agentId | "SKIP" | null (not yet revealed). */
export type VoteMap = Record<string, string | null>;

export interface Meeting {
  active: boolean;
  round: number;
  reason: string;
  votes: VoteMap;
}

export interface Clock {
  monadMs: number;
  ethEquivMs: number;
  txCount: number;
}

export interface Snapshot {
  type: "snapshot";
  gameId: number;
  tick: number;
  phase: Phase;
  agents: AgentState[];
  bodies: Body[];
  log: LogEntry[];
  chat: ChatMessage[];
  meeting: Meeting;
  clock: Clock;
}

/** engine/replays/<id>.json shape — also what we bundle under public/replays. */
export interface ReplayFile {
  meta: Record<string, unknown>;
  frames: Snapshot[];
}
