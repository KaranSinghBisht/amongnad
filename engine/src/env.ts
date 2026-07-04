// Loads secrets from the repo-root .env.local (relative to this file, so it
// works regardless of cwd) and exposes a validated, typed config object.
import { config as loadDotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
// src/env.ts -> ../../ == repo root
const envPath = path.resolve(here, '../../.env.local');
loadDotenv({ path: envPath });

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name} (looked in ${envPath})`);
  return v;
}

export const config = {
  anthropicApiKey: req('ANTHROPIC_API_KEY'),
  agentModel: process.env.AGENT_MODEL || 'claude-sonnet-4-5',
  fallbackModel: 'claude-3-5-sonnet-latest',
  privateKey: req('PRIVATE_KEY') as `0x${string}`,
  rpcUrl: req('MONAD_RPC_URL'),
  rpcPublic: process.env.MONAD_RPC_PUBLIC || '',
  rpcFallback: process.env.MONAD_RPC_FALLBACK || '',
  chainId: Number(process.env.CHAIN_ID || '10143'),
  contract: req('GAME_CONTRACT_ADDRESS') as `0x${string}`,
  wsPort: Number(process.env.WS_PORT || '8787'),
  explorerTx: 'https://testnet.monadvision.com/tx/',
} as const;
