// Generates N agent private keys (one per soul), persists them to
// engine/.agents.json (gitignored), and reloads them on subsequent runs so the
// same wallets are reused across fund-agents and run-game.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import type { Address, Hex } from 'viem';
import { SOULS } from './souls';

export interface AgentWallet {
  id: string;
  name: string;
  color: string;
  soul: string;
  persona: string;
  privateKey: Hex;
  address: Address;
}

const FILE = fileURLToPath(new URL('../.agents.json', import.meta.url));

export function loadOrCreateAgents(): AgentWallet[] {
  // Keep any existing (already-funded) wallets keyed by soul id and only
  // generate keys for souls that don't have one yet — adding a 6th soul must
  // not orphan five funded wallets.
  let existing = new Map<string, AgentWallet>();
  if (existsSync(FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(FILE, 'utf8')) as AgentWallet[];
      if (Array.isArray(parsed)) existing = new Map(parsed.map((w) => [w.id, w]));
    } catch (err) {
      console.warn('[wallets] failed to parse .agents.json — regenerating all:', err);
    }
  }

  let generated = 0;
  const agents: AgentWallet[] = SOULS.map((s) => {
    const prior = existing.get(s.id);
    if (prior?.privateKey && prior?.address) {
      // refresh display fields from the soul definition, keep the keypair
      return { ...prior, name: s.name, color: s.color, soul: s.soul, persona: s.persona };
    }
    generated++;
    const pk = generatePrivateKey();
    return {
      id: s.id,
      name: s.name,
      color: s.color,
      soul: s.soul,
      persona: s.persona,
      privateKey: pk,
      address: privateKeyToAccount(pk).address,
    };
  });

  writeFileSync(FILE, JSON.stringify(agents, null, 2));
  if (generated > 0) console.log(`[wallets] generated ${generated} new agent wallet(s) -> ${FILE}`);
  return agents;
}
