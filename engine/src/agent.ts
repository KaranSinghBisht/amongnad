// Agent brain: build a compact prompt from (soul, role, POV, phase), call
// Claude, and parse STRICT JSON. Three decision shapes: ACTION, DISCUSS, VOTE.
// Prompts are kept short for latency; every call has a safe fallback.
import Anthropic from '@anthropic-ai/sdk';
import { config } from './env';
import { CREW_PLAYBOOK, IMPOSTOR_PLAYBOOK } from './souls';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

// --- POV data (built by the engine; the brain turns it into a prompt) ---

export interface SelfView {
  name: string;
  soul: string;
  persona: string;
  role: 'crew' | 'impostor';
  systemPrompt: string;
}

export interface ActionPOV {
  self: SelfView;
  tick: number;
  room: { id: string; name: string };
  adjacent: { id: string; name: string }[];
  vents: { id: string; name: string }[] | null; // only for impostor
  here: string[];      // other alive agent names in the room
  alive: string[];     // all alive agent names
  dead: string[];      // dead / ejected names
  bodies: string[];    // victim names in this room
  memory: string[];    // recent private sightings
  killable: string[];  // names the impostor could kill right now
  canReport: boolean;
}

export interface DiscussPOV {
  self: SelfView;
  reason: string;
  round: number;
  alive: string[];
  dead: string[];
  memory: string[];
  chat: { name: string; text: string }[];
}

export interface VotePOV {
  self: SelfView;
  reason: string;
  candidates: string[]; // alive names excluding self
  dead: string[];
  memory: string[];
  chat: { name: string; text: string }[];
}

export interface ActionDecision {
  thinking: string;
  action: 'MOVE' | 'WAIT' | 'KILL' | 'VENT' | 'REPORT' | 'CALL_MEETING';
  target: string | null;
}
export interface DiscussDecision { thinking: string; statement: string; }
export interface VoteDecision { thinking: string; vote: string; }

// --- model call with one automatic fallback to a different model id ---

let workingModel = config.agentModel;

async function complete(system: string, user: string): Promise<string> {
  const run = async (model: string) => {
    const msg = await client.messages.create({
      model,
      max_tokens: 400,
      system,
      messages: [{ role: 'user', content: user }],
    });
    return msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
  };
  try {
    return await run(workingModel);
  } catch (err) {
    if (workingModel !== config.fallbackModel) {
      console.warn(`[agent] model ${workingModel} failed, falling back to ${config.fallbackModel}:`, (err as Error).message);
      workingModel = config.fallbackModel;
      return await run(workingModel);
    }
    throw err;
  }
}

function extractJson(text: string): any {
  let t = text.trim().replace(/```json/gi, '').replace(/```/g, '').trim();
  const s = t.indexOf('{');
  const e = t.lastIndexOf('}');
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

// Call the model, parse JSON, retry once on bad JSON, else return null.
async function askJson(system: string, user: string): Promise<any | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await complete(system, user);
      return extractJson(text);
    } catch (err) {
      if (attempt === 1) {
        console.warn('[agent] JSON parse/model failed after retry:', (err as Error).message);
        return null;
      }
    }
  }
  return null;
}

function systemFor(self: SelfView, outputRule: string): string {
  const playbook = self.role === 'impostor' ? IMPOSTOR_PLAYBOOK : CREW_PLAYBOOK;
  return `${self.systemPrompt}\n\n${playbook}\n\nYou are playing AmongNad, an Among Us style social-deduction game on The Skeld. ${outputRule}`;
}

// --- ACTION ---

export async function decideAction(pov: ActionPOV): Promise<ActionDecision> {
  const s = pov.self;
  const lines: string[] = [];
  lines.push(`PHASE: ACTION (tick ${pov.tick}).`);
  lines.push(`Location: ${pov.room.name}. Adjacent rooms: ${pov.adjacent.map((r) => r.name).join(', ') || 'none'}.`);
  if (pov.vents && pov.vents.length) lines.push(`Vents (impostor only) lead to: ${pov.vents.map((r) => r.name).join(', ')}.`);
  lines.push(`In your room now: ${pov.here.join(', ') || 'no one'}.`);
  lines.push(`Alive: ${pov.alive.join(', ')}. Dead/ejected: ${pov.dead.join(', ') || 'none'}.`);
  lines.push(pov.bodies.length ? `DEAD BODY in your room: ${pov.bodies.join(', ')}.` : 'No bodies in your room.');
  lines.push(`Recent memory:\n${pov.memory.length ? pov.memory.join('\n') : '(nothing notable yet)'}`);
  if (s.role === 'impostor') lines.push(`Killable right now: ${pov.killable.join(', ') || '(no one isolated with you)'}.`);
  const acts = ['MOVE <room>', 'WAIT'];
  if (pov.canReport) acts.push('REPORT');
  if (s.role === 'impostor') { acts.push('KILL <player>'); acts.push('VENT <vent room>'); }
  acts.push('CALL_MEETING');
  lines.push(`Legal actions: ${acts.join(', ')}.`);
  lines.push('Respond with ONLY this JSON: {"thinking":"private reasoning, 1-2 sentences","action":"MOVE|WAIT|KILL|VENT|REPORT|CALL_MEETING","target":"<room name, player name, or null>"}');

  const out = await askJson(systemFor(s, 'Output strict JSON only.'), lines.join('\n'));
  if (!out || typeof out.action !== 'string') return { thinking: '(no decision)', action: 'WAIT', target: null };
  return {
    thinking: String(out.thinking ?? ''),
    action: String(out.action).toUpperCase().trim() as ActionDecision['action'],
    target: out.target == null ? null : String(out.target),
  };
}

// --- DISCUSS ---

export async function discuss(pov: DiscussPOV): Promise<DiscussDecision> {
  const s = pov.self;
  const chat = pov.chat.length ? pov.chat.map((c) => `${c.name}: ${c.text}`).join('\n') : '(you speak first)';
  const user = [
    `PHASE: DISCUSSION (round ${pov.round}). Meeting reason: ${pov.reason}.`,
    `Alive: ${pov.alive.join(', ')}. Dead/ejected: ${pov.dead.join(', ') || 'none'}.`,
    `Your memory:\n${pov.memory.length ? pov.memory.join('\n') : '(nothing notable)'}`,
    `Conversation so far:\n${chat}`,
    'Say ONE short line aloud (accuse, defend, or share what you saw). If you are the impostor, lie convincingly.',
    'Respond with ONLY this JSON: {"thinking":"private reasoning","statement":"one sentence spoken aloud"}',
  ].join('\n');

  const out = await askJson(systemFor(s, 'Output strict JSON only.'), user);
  if (!out) return { thinking: '', statement: '...' };
  return { thinking: String(out.thinking ?? ''), statement: String(out.statement ?? '...') };
}

// --- VOTE ---

export async function vote(pov: VotePOV): Promise<VoteDecision> {
  const s = pov.self;
  const chat = pov.chat.length ? pov.chat.map((c) => `${c.name}: ${c.text}`).join('\n') : '(no discussion)';
  const user = [
    `PHASE: VOTE. Meeting reason: ${pov.reason}.`,
    `Discussion:\n${chat}`,
    `Your memory:\n${pov.memory.length ? pov.memory.join('\n') : '(nothing notable)'}`,
    `You may vote to eject one of: ${pov.candidates.join(', ')}. Or vote SKIP if genuinely unsure.`,
    'Respond with ONLY this JSON: {"thinking":"private reasoning","vote":"<player name or SKIP>"}',
  ].join('\n');

  const out = await askJson(systemFor(s, 'Output strict JSON only.'), user);
  if (!out || out.vote == null) return { thinking: '', vote: 'SKIP' };
  return { thinking: String(out.thinking ?? ''), vote: String(out.vote).trim() };
}
