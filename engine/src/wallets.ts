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
  if (existsSync(FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(FILE, 'utf8')) as AgentWallet[];
      if (Array.isArray(parsed) && parsed.length === SOULS.length) return parsed;
      console.warn('[wallets] .agents.json is stale/mismatched — regenerating');
    } catch (err) {
      console.warn('[wallets] failed to parse .agents.json — regenerating:', err);
    }
  }

  const agents: AgentWallet[] = SOULS.map((s) => {
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
  console.log(`[wallets] generated ${agents.length} agent wallets -> ${FILE}`);
  return agents;
}
