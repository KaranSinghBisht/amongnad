// Single source of truth for the NEXT_PUBLIC_* vars in web/.env.local.
// These are client-exposed by design (not secrets) — centralizing the reads
// just keeps the fallback values and access pattern consistent.

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "";
export const EXPLORER_TX_BASE = process.env.NEXT_PUBLIC_EXPLORER_TX ?? "";
export const GAME_CONTRACT = process.env.NEXT_PUBLIC_GAME_CONTRACT ?? "";
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "10143");
