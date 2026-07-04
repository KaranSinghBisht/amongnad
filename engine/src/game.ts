// Engine core: holds game state, drives the turn-based loop, mirrors trust-
// critical steps on-chain, and emits a full Snapshot after every change.
import { stringToHex, type Address, type Hex } from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { chain, Kind, Winner, ZERO_ADDRESS, rolesCommit, voteHash, randomSalt } from './chain';
import { loadOrCreateAgents } from './wallets';
import { SOULS } from './souls';
import {
  START_ROOM, roomName, adjacentRooms, ventRooms, isAdjacent, isVentAdjacent, resolveRoom,
} from './map';
import {
  decideAction, discuss, vote,
  type SelfView, type ActionPOV, type DiscussPOV, type VotePOV,
} from './agent';
import type { Snapshot, LogEntry, ChatMsg, Body, MeetingView, LogKind, Phase } from './protocol';

const MAX_TICKS = 22;
const DISCUSS_ROUNDS = 2;       // two rounds so accusations get rebutted before the vote
const PACE_MS = 300;
const WALL_CLOCK_MS = 240_000;   // hard cap so a game always fits a ~4-min arena slot
const MAX_EMERGENCY = 2;         // emergency (no-body) meetings allowed per game
const EMERGENCY_COOLDOWN = 3;    // ticks between emergency meetings
const EMERGENCY_MIN_TICK = 4;    // no emergency meetings before this — let kills happen first
const KILL_COOLDOWN = 2;         // ticks between kills — spaces kills so bodies get found & reported
const LIGHTS_AUTO_RESTORE = 3;   // ticks of darkness before emergency power kicks in
const MAX_SABOTAGE = 2;          // blackouts per game — sabotage is strong
const SABOTAGE_COOLDOWN = 3;     // ticks after a restore before the next blackout
const TOP_UP_THRESHOLD = 150_000_000_000_000_000n; // 0.15 MON
const TOP_UP_AMOUNT = '0.5';     // MON to send a low agent wallet at setup

interface AgentState {
  id: string;
  name: string;
  color: string;
  soul: string;
  persona: string;
  systemPrompt: string;
  address: Address;
  account: PrivateKeyAccount;
  role: 'crew' | 'impostor';
  alive: boolean;
  room: string;
  thinking: string;
  memory: string[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Game {
  private onSnapshot: (s: Snapshot) => void;
  gameId = 0n;
  private tick = 0;
  private phase: Phase = 'lobby';
  private agents: AgentState[] = [];
  private impostor!: AgentState;
  private salt: Hex = '0x';
  private bodies: Body[] = [];
  log: LogEntry[] = [];
  private chat: ChatMsg[] = [];
  private meeting: MeetingView | null = null;
  txCount = 0;
  txFailures = 0;
  private startTime = Date.now();
  private logSeq = 1;
  private chatSeq = 1;
  private winner: number | null = null;
  private lastMeetingTick = -99;
  private lastKillTick = -99;
  private emergencyCount = 0;
  private lightsOut = false;
  private lightsOutTick = -99;
  private lightsRestoredTick = -99;
  private sabotagesUsed = 0;
  private firstVictimId: string | null = null;

  constructor(onSnapshot: (s: Snapshot) => void) {
    this.onSnapshot = onSnapshot;
  }

  // ---- helpers ----

  private alive(): AgentState[] {
    return this.agents.filter((a) => a.alive);
  }

  private remember(a: AgentState, note: string): void {
    a.memory.push(note);
    if (a.memory.length > 12) a.memory = a.memory.slice(-12);
  }

  private resolveAgent(text: string | null): AgentState | null {
    if (!text) return null;
    const t = text.trim().toLowerCase();
    const exact = this.agents.find(
      (a) => a.name.toLowerCase() === t || a.soul.toLowerCase() === t || a.id.toLowerCase() === t,
    );
    if (exact) return exact;
    return this.agents.find(
      (a) => t.includes(a.name.toLowerCase()) || t.includes(a.soul.toLowerCase()),
    ) ?? null;
  }

  private selfView(a: AgentState): SelfView {
    return { name: a.name, soul: a.soul, persona: a.persona, role: a.role, systemPrompt: a.systemPrompt };
  }

  private addLog(kind: LogKind, text: string, txHash: Hex | null): void {
    this.log.push({ id: this.logSeq++, kind, text, txHash: txHash ?? null, ts: Date.now() });
  }

  private addChat(a: AgentState, text: string): void {
    this.chat.push({ id: this.chatSeq++, agentId: a.id, name: a.name, color: a.color, text, ts: Date.now() });
  }

  // Run an on-chain write; count it on success, never let a failure crash the
  // game. A failure is logged LOUDLY and counted — a swallowed vote tx means a
  // log row with no explorer link, which we must notice, not hide.
  private async tryChain(fn: () => Promise<Hex>, label = 'write'): Promise<Hex | null> {
    try {
      const h = await fn();
      this.txCount++;
      return h;
    } catch (err) {
      this.txFailures++;
      console.error(`[chain] ❌ ${label} FAILED (this log row will have NO tx link): ${(err as Error).message}`);
      return null;
    }
  }

  // Top up any agent wallet that's too low to pay for its votes, so a live demo
  // never dies on a broke signer mid-game. (Monad charges the full gas limit.)
  private async ensureFunded(): Promise<void> {
    for (const a of this.agents) {
      try {
        const bal = await chain.balance(a.address);
        if (bal < TOP_UP_THRESHOLD) {
          const h = await chain.fund(a.address, TOP_UP_AMOUNT);
          console.log(`[game] topped up ${a.name} (${a.address}) with ${TOP_UP_AMOUNT} MON — tx ${h}`);
        }
      } catch (err) {
        console.error(`[game] top-up check failed for ${a.name}:`, (err as Error).message);
      }
    }
  }

  private buildSnapshot(): Snapshot {
    const revealed = this.phase === 'ended';
    return {
      type: 'snapshot',
      gameId: Number(this.gameId),
      tick: this.tick,
      phase: this.phase,
      agents: this.agents.map((a) => ({
        id: a.id, name: a.name, color: a.color, soul: a.soul,
        room: a.room, alive: a.alive,
        role: revealed ? a.role : null,
        wallet: a.address, thinking: a.thinking,
      })),
      bodies: this.bodies.map((b) => ({ room: b.room, victim: b.victim })),
      lights: !this.lightsOut,
      log: this.log,
      chat: this.chat,
      meeting: this.meeting,
      clock: { monadMs: Date.now() - this.startTime, ethEquivMs: this.txCount * 12000, txCount: this.txCount },
    };
  }

  private emit(): void {
    this.onSnapshot(this.buildSnapshot());
  }

  // ---- POV builders ----

  private buildActionPOV(a: AgentState): ActionPOV {
    const here = this.alive().filter((o) => o.id !== a.id && o.room === a.room);
    const cooldown = a.role === 'impostor' ? Math.max(0, KILL_COOLDOWN - (this.tick - this.lastKillTick)) : 0;
    // in the dark, crew can't see who shares their room; the impostor still can
    const blind = this.lightsOut && a.role === 'crew';
    return {
      self: this.selfView(a),
      tick: this.tick,
      room: { id: a.room, name: roomName(a.room) },
      adjacent: adjacentRooms(a.room),
      vents: a.role === 'impostor' ? ventRooms(a.room) : null,
      lightsOut: this.lightsOut,
      ticksLeft: MAX_TICKS - this.tick,
      here: blind ? [] : here.map((o) => o.name),
      alive: this.alive().map((o) => o.name),
      dead: this.agents.filter((o) => !o.alive).map((o) => o.name),
      bodies: this.bodies.filter((b) => b.room === a.room).map((b) => this.nameOf(b.victim)),
      memory: a.memory.slice(-8),
      killable: (a.role === 'impostor' && cooldown === 0) ? here.map((o) => o.name) : [],
      killCooldown: cooldown,
      canReport: this.bodies.some((b) => b.room === a.room),
    };
  }

  private buildDiscussPOV(a: AgentState, reason: string, round: number): DiscussPOV {
    return {
      self: this.selfView(a),
      reason,
      round,
      alive: this.alive().map((o) => o.name),
      dead: this.agents.filter((o) => !o.alive).map((o) => o.name),
      memory: a.memory.slice(-10),
      chat: this.chat.map((c) => ({ name: c.name, text: c.text })),
    };
  }

  private buildVotePOV(a: AgentState, reason: string): VotePOV {
    return {
      self: this.selfView(a),
      reason,
      candidates: this.alive().filter((o) => o.id !== a.id).map((o) => o.name),
      dead: this.agents.filter((o) => !o.alive).map((o) => o.name),
      memory: a.memory.slice(-10),
      chat: this.chat.map((c) => ({ name: c.name, text: c.text })),
    };
  }

  private nameOf(id: string): string {
    return this.agents.find((a) => a.id === id)?.name ?? id;
  }

  // ---- setup: register + start the game on-chain ----

  async setup(): Promise<void> {
    const wallets = loadOrCreateAgents();
    this.agents = wallets.map((w) => {
      const soulDef = SOULS.find((s) => s.id === w.id)!;
      return {
        id: w.id, name: w.name, color: w.color, soul: w.soul, persona: w.persona,
        systemPrompt: soulDef.systemPrompt,
        address: w.address, account: privateKeyToAccount(w.privateKey),
        role: 'crew' as const, alive: true, room: START_ROOM, thinking: '', memory: [] as string[],
      };
    });
    // Everyone starts around the Cafeteria table (authentic Among Us opening);
    // they disperse on their own — and the impostor can sabotage the lights.

    // Pick exactly one impostor, secretly.
    const idx = Math.floor(Math.random() * this.agents.length);
    this.agents[idx].role = 'impostor';
    this.impostor = this.agents[idx];
    console.log(`[game] impostor is ${this.impostor.name} (${this.impostor.soul})`);

    this.startTime = Date.now();
    this.phase = 'lobby';
    this.emit();

    // make sure every agent can afford its votes before we start
    await this.ensureFunded();

    // createGame -> gameId + tx hash. Retry a few times so an RPC blip at game
    // start doesn't crash the whole process.
    let created: { gameId: bigint; hash: Hex } | null = null;
    for (let attempt = 1; attempt <= 3 && !created; attempt++) {
      try {
        created = await chain.createGame();
      } catch (err) {
        console.error(`[game] createGame attempt ${attempt}/3 failed:`, (err as Error).message);
        if (attempt === 3) throw new Error('createGame failed after 3 attempts — aborting setup');
        await sleep(1500);
      }
    }
    this.gameId = created!.gameId;
    this.txCount++;
    this.addLog('spawn', `Game #${this.gameId} created on Monad`, created!.hash);
    this.emit();

    // addPlayer for each agent
    for (const a of this.agents) {
      const soulId = stringToHex(a.id, { size: 32 });
      const h = await this.tryChain(() => chain.addPlayer(this.gameId, a.address, a.name, soulId), 'addPlayer');
      this.addLog('spawn', `${a.name} (${a.soul}) joined the crew`, h);
      this.emit();
    }

    // startGame with the roles commitment
    this.salt = randomSalt();
    const commit = rolesCommit(this.impostor.address, this.salt);
    const h = await this.tryChain(() => chain.startGame(this.gameId, commit), 'startGame');
    this.addLog('spawn', 'Game started — roles committed on-chain (commit/reveal)', h);
    this.phase = 'active';
    this.emit();
  }

  // ---- main loop ----

  async run(): Promise<void> {
    try {
      while (this.phase !== 'ended' && this.tick < MAX_TICKS) {
        if (Date.now() - this.startTime > WALL_CLOCK_MS) {
          console.log('[game] wall-clock cap reached — ending game');
          break;
        }
        this.tick++;
        await this.actionPhase();
        const w = this.checkWin();
        if (w !== null) {
          await this.endGame(w);
          break;
        }
        await sleep(PACE_MS);
      }
      if (this.phase !== 'ended') {
        await this.endGame(this.currentWinner());
      }
    } catch (err) {
      console.error('[game] fatal error in run loop:', err);
      if (this.phase !== 'ended') {
        try { await this.endGame(this.currentWinner()); } catch (e) { console.error('[game] endGame failed:', e); }
      }
    }
  }

  private checkWin(): number | null {
    const imp = this.agents.filter((a) => a.role === 'impostor' && a.alive).length;
    const crew = this.agents.filter((a) => a.role === 'crew' && a.alive).length;
    if (imp === 0) return Winner.Crew;
    if (imp >= crew) return Winner.Impostor;
    return null;
  }

  private currentWinner(): number {
    const w = this.checkWin();
    if (w !== null) return w;
    // Real Among Us: the impostor only wins at parity (checkWin). If the shift
    // ends before parity, the crew survived — crew wins the tiebreak.
    return Winner.Crew;
  }

  // ---- ACTION phase ----

  private async actionPhase(): Promise<void> {
    // emergency power: darkness never lasts more than a few ticks
    if (this.lightsOut && this.tick - this.lightsOutTick >= LIGHTS_AUTO_RESTORE) {
      await this.restoreLights(null);
    }

    const actors = this.alive();
    const decisions = await Promise.all(
      actors.map(async (a) => ({ a, d: await decideAction(this.buildActionPOV(a)) })),
    );
    for (const { a, d } of decisions) a.thinking = d.thinking;
    this.emit();

    // 1. resolve kills using pre-move positions (respecting the kill cooldown)
    for (const { a, d } of decisions) {
      if (d.action !== 'KILL' || a.role !== 'impostor' || !a.alive) continue;
      if (this.tick - this.lastKillTick < KILL_COOLDOWN) continue; // kill on cooldown
      const target = this.resolveAgent(d.target);
      if (target && target.alive && target.id !== a.id && target.room === a.room) {
        await this.doKill(a, target);
      }
    }

    // 1b. sabotage + fixes (after kills so a dark kill this tick reads in order)
    for (const { a, d } of decisions) {
      if (!a.alive) continue;
      if (
        d.action === 'SABOTAGE' && a.role === 'impostor' && !this.lightsOut &&
        this.sabotagesUsed < MAX_SABOTAGE && this.tick - this.lightsRestoredTick >= SABOTAGE_COOLDOWN
      ) {
        this.sabotagesUsed++;
        this.lightsOut = true;
        this.lightsOutTick = this.tick;
        this.remember(a, `t${this.tick}: you sabotaged the lights`);
        for (const c of this.alive()) {
          if (c.id !== a.id) this.remember(c, `t${this.tick}: the lights went OUT`);
        }
        // actor stays ZERO on-chain — naming the saboteur would out the impostor
        const h = await this.tryChain(() =>
          chain.logEvent(this.gameId, Kind.Move, ZERO_ADDRESS, ZERO_ADDRESS, '', 'the lights went dark'),
        'logEvent(Sabotage)');
        this.addLog('sabotage', 'The lights went dark across the Skeld', h);
        this.emit();
      } else if (d.action === 'FIX' && this.lightsOut && a.room === 'electrical') {
        await this.restoreLights(a);
      }
    }

    // 2. detect a meeting trigger — body reports are always allowed; emergency
    //    (no-body) meetings are rate-limited and blocked early so the game can't
    //    stall on meetings before any kills happen.
    let pending: string | null = null;
    let bodyReporter: AgentState | null = null;
    for (const { a, d } of decisions) {
      if (!a.alive) continue;
      if (d.action === 'REPORT' && this.bodies.some((b) => b.room === a.room)) {
        pending = `${a.name} reported a body`;
        bodyReporter = a;
        break;
      }
    }
    if (!pending && this.tick >= EMERGENCY_MIN_TICK && this.emergencyCount < MAX_EMERGENCY && this.tick - this.lastMeetingTick >= EMERGENCY_COOLDOWN) {
      for (const { a, d } of decisions) {
        if (a.alive && d.action === 'CALL_MEETING') {
          pending = `${a.name} called an emergency meeting`;
          this.emergencyCount++;
          break;
        }
      }
    }
    if (pending) {
      // A body report is its own on-chain event (reporter identity isn't the
      // secret — anyone can report), then the meeting opens.
      if (bodyReporter) {
        const room = bodyReporter.room;
        const rHash = await this.tryChain(() =>
          chain.logEvent(this.gameId, Kind.Report, bodyReporter!.address, ZERO_ADDRESS, roomName(room), `reported a body in ${roomName(room)}`),
        'logEvent(Report)');
        this.addLog('report', `${bodyReporter.name} reported a body in ${roomName(room)}`, rHash);
      }
      this.emit();
      await this.meetingPhase(pending);
      return;
    }

    // 3. apply movement for still-living agents
    for (const { a, d } of decisions) {
      if (!a.alive) continue;
      if (d.action === 'MOVE') {
        const r = resolveRoom(d.target ?? '');
        if (r && isAdjacent(a.room, r)) a.room = r;
      } else if (d.action === 'VENT' && a.role === 'impostor') {
        const r = resolveRoom(d.target ?? '');
        if (r && isVentAdjacent(a.room, r)) await this.doVent(a, r);
      }
    }

    // 4. update co-presence sightings
    this.updateSightings();
    this.emit();
  }

  private async restoreLights(fixer: AgentState | null): Promise<void> {
    this.lightsOut = false;
    this.lightsRestoredTick = this.tick;
    const text = fixer
      ? `${fixer.name} fixed the lights in Electrical`
      : 'Emergency power restored the lights';
    if (fixer) this.remember(fixer, `t${this.tick}: you fixed the lights`);
    const h = await this.tryChain(() =>
      chain.logEvent(this.gameId, Kind.Move, fixer?.address ?? ZERO_ADDRESS, ZERO_ADDRESS, 'Electrical', 'the lights came back on'),
    'logEvent(Fix)');
    this.addLog('fix', text, h);
    this.emit();
  }

  private async doKill(killer: AgentState, victim: AgentState): Promise<void> {
    const room = victim.room;
    this.lastKillTick = this.tick;
    // kills in the dark have no witnesses — that's the point of the sabotage
    const witnesses = this.lightsOut
      ? []
      : this.alive().filter((o) => o.id !== killer.id && o.id !== victim.id && o.room === room);
    victim.alive = false;
    if (this.firstVictimId === null) this.firstVictimId = victim.id;
    this.bodies.push({ room, victim: victim.id });
    this.remember(killer, `t${this.tick}: you killed ${victim.name} in ${roomName(room)}`);
    for (const w of witnesses) {
      this.remember(w, `t${this.tick}: you SAW ${killer.name} kill ${victim.name} in ${roomName(room)}`);
    }

    // The on-chain note names only the VICTIM + room (both public once a body is
    // found) — never the killer, which would leak the impostor before the
    // endGame reveal. The spicy, killer-identifying text is off-chain only (UI log).
    const kHash = await this.tryChain(() =>
      chain.kill(this.gameId, victim.address, roomName(room), `${victim.name} was eliminated in ${roomName(room)}`),
    'kill');
    this.addLog('kill', `${killer.name} killed ${victim.name} in ${roomName(room)}`, kHash);

    if (witnesses.length > 0) {
      const w = witnesses[0];
      // target = ZERO so the on-chain event doesn't encode who was seen.
      const sHash = await this.tryChain(() =>
        chain.logEvent(this.gameId, Kind.Saw, w.address, ZERO_ADDRESS, roomName(room), `a suspicious event in ${roomName(room)}`),
      'logEvent(Saw)');
      this.addLog('saw', `${w.name} witnessed ${killer.name} near the body in ${roomName(room)}`, sHash);
    }
  }

  private async doVent(a: AgentState, toRoom: string): Promise<void> {
    const from = a.room;
    a.room = toRoom;
    this.remember(a, `t${this.tick}: vented ${roomName(from)} -> ${roomName(toRoom)}`);
    // Venting is impostor-only, so BOTH the on-chain actor AND the note stay
    // neutral — recording the real address (or the word "vent") would out the
    // impostor before the reveal. The UI log keeps the real "X vented" text.
    const h = await this.tryChain(() =>
      chain.logEvent(this.gameId, Kind.Vent, ZERO_ADDRESS, ZERO_ADDRESS, roomName(toRoom), `suspicious activity near ${roomName(toRoom)}`),
    'logEvent(Vent)');
    this.addLog('vent', `${a.name} vented to ${roomName(toRoom)}`, h);
  }

  private updateSightings(): void {
    for (const a of this.alive()) {
      const others = this.alive().filter((o) => o.id !== a.id && o.room === a.room);
      if (others.length > 0) {
        this.remember(a, `t${this.tick}: with ${others.map((o) => o.name).join(', ')} in ${roomName(a.room)}`);
      }
    }
  }

  // ---- MEETING phase ----

  private async meetingPhase(reason: string): Promise<void> {
    this.phase = 'meeting';
    this.lastMeetingTick = this.tick;
    this.lightsOut = false; // systems reset when everyone gathers
    this.chat = []; // fresh chat for this meeting
    const initialVotes: Record<string, string | null> = {};
    for (const a of this.alive()) initialVotes[a.id] = null;
    this.meeting = { active: true, round: 1, reason, votes: initialVotes };

    const smHash = await this.tryChain(() => chain.startMeeting(this.gameId, reason), 'startMeeting');
    this.addLog('meeting', reason, smHash);
    let meetingIndex = 0n;
    try { meetingIndex = await chain.getMeeting(this.gameId); } catch (err) {
      console.warn('[meeting] getMeeting failed, defaulting index to 0:', (err as Error).message);
    }
    this.emit();

    // discussion (sequential so agents react to each other)
    for (let round = 1; round <= DISCUSS_ROUNDS; round++) {
      this.meeting.round = round;
      for (const a of this.alive()) {
        const d = await discuss(this.buildDiscussPOV(a, reason, round));
        a.thinking = d.thinking;
        this.addChat(a, d.statement);
        this.emit();
      }
    }

    // vote decisions (parallel), then commit + reveal on each agent's own wallet
    const voters = this.alive();
    const decided = await Promise.all(
      voters.map(async (a) => ({ a, v: await vote(this.buildVotePOV(a, reason)) })),
    );

    const plan = decided.map(({ a, v }) => {
      const target = this.resolveAgent(v.vote);
      const isSkip = !target || /skip/i.test(v.vote) || target.id === a.id || !target.alive;
      const suspect = isSkip ? ZERO_ADDRESS : target!.address;
      const salt = randomSalt();
      a.thinking = v.thinking;
      return {
        a,
        choiceLabel: (isSkip ? 'SKIP' : target!.id) as string,
        targetName: isSkip ? null : target!.name,
        suspect,
        salt,
        hash: voteHash(this.gameId, meetingIndex, suspect, salt),
      };
    });
    this.emit();

    // commit (parallel, streamed live as each lands)
    await Promise.allSettled(plan.map(async (p) => {
      const h = await this.tryChain(() => chain.commitVote(p.a.account, this.gameId, p.hash), `commitVote(${p.a.name})`);
      this.addLog('vote', `${p.a.name} cast a sealed vote`, h);
      this.emit();
    }));

    // reveal (parallel, streamed live)
    await Promise.allSettled(plan.map(async (p) => {
      const h = await this.tryChain(() => chain.revealVote(p.a.account, this.gameId, p.suspect, p.salt), `revealVote(${p.a.name})`);
      this.meeting!.votes[p.a.id] = p.choiceLabel;
      this.addLog('vote', p.targetName ? `${p.a.name} revealed: eject ${p.targetName}` : `${p.a.name} revealed: skip`, h);
      this.emit();
    }));

    // resolve on-chain (authoritative); fall back to local tally if it reverts
    let ejected: AgentState | null = null;
    let rHash: Hex | null = null;
    try {
      const r = await chain.resolveMeeting(this.gameId);
      rHash = r.hash;
      this.txCount++;
      if (!r.skipped) {
        ejected = this.agents.find((a) => a.address.toLowerCase() === r.ejected.toLowerCase()) ?? null;
      }
    } catch (err) {
      console.warn('[meeting] resolveMeeting failed, using local tally:', (err as Error).message);
      const tally = this.localTally(plan);
      if (!tally.skip) ejected = this.agents.find((a) => a.id === tally.ejectedId) ?? null;
    }

    if (ejected) {
      ejected.alive = false;
      this.addLog('eject', `${ejected.name} was ejected`, rHash);
    } else {
      this.addLog('eject', 'No one was ejected (skipped)', rHash);
    }

    // cleanup: bodies cleared, survivors regroup at the Cafeteria table (real
    // Among Us behaviour) and disperse again on their own next tick.
    this.bodies = [];
    this.meeting.active = false;
    this.meeting = null;
    this.phase = 'active';
    for (const a of this.alive()) a.room = START_ROOM;
    this.emit();
  }

  private localTally(plan: { choiceLabel: string }[]): { ejectedId: string | null; skip: boolean } {
    const counts = new Map<string, number>();
    let skip = 0;
    for (const p of plan) {
      if (p.choiceLabel === 'SKIP') skip++;
      else counts.set(p.choiceLabel, (counts.get(p.choiceLabel) ?? 0) + 1);
    }
    let topId: string | null = null;
    let top = 0;
    let tie = false;
    for (const [id, c] of counts) {
      if (c > top) { top = c; topId = id; tie = false; }
      else if (c === top) tie = true;
    }
    if (topId === null || skip >= top || tie) return { ejectedId: null, skip: true };
    return { ejectedId: topId, skip: false };
  }

  // ---- END ----

  private async endGame(winner: number): Promise<void> {
    this.phase = 'ended';
    this.winner = winner;
    const h = await this.tryChain(() => chain.endGame(this.gameId, this.impostor.address, this.salt, winner), 'endGame');
    const label = winner === Winner.Impostor ? 'Impostor' : 'Crew';
    this.addLog('win', `${label} wins! The impostor was ${this.impostor.name} (${this.impostor.soul}).`, h);
    this.emit();
    console.log(`[game] ${label} wins. txCount=${this.txCount}`);
  }

  // ---- summary for replay meta / reporting ----

  summary() {
    const victimIndex = this.firstVictimId
      ? this.agents.findIndex((a) => a.id === this.firstVictimId)
      : null;
    return {
      gameId: Number(this.gameId),
      winner: this.winner === Winner.Impostor ? 'impostor' : 'crew',
      winnerSide: this.winner === Winner.Impostor ? 1 : 0,
      firstVictimIndex: victimIndex,
      impostor: this.impostor?.name,
      txCount: this.txCount,
      txFailures: this.txFailures,
      agents: this.agents.map((a) => ({ id: a.id, name: a.name, color: a.color, soul: a.soul, address: a.address })),
      txHashes: this.log.filter((l) => l.txHash).map((l) => ({ kind: l.kind, text: l.text, txHash: l.txHash })),
    };
  }
}
