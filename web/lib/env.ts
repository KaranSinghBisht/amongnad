// Single source of truth for the NEXT_PUBLIC_* vars in web/.env.local.
// These are client-exposed by design (not secrets) — centralizing the reads
// just keeps the fallback values and access pattern consistent.

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "";
// Fallback baked in so a missing Vercel env var can never produce dead links.
export const EXPLORER_TX_BASE =
  process.env.NEXT_PUBLIC_EXPLORER_TX ?? "https://testnet.monadscan.com/tx/";
export const GAME_CONTRACT =
  process.env.NEXT_PUBLIC_GAME_CONTRACT ?? "0xa8e3463eF7934C7F8B18f77eBF1A6b49afA4932b";
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "10143");
