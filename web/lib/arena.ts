// Client-side access to the AmongNadArena betting contract.
import { createPublicClient, http, defineChain, parseAbi } from "viem";

export const monad = defineChain({
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "10143"),
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
});

export const ARENA_ADDRESS = (process.env.NEXT_PUBLIC_ARENA_CONTRACT ??
  "0x78Ba46dC4Ebdc8d178b1656bfE389e10EA305DD8") as `0x${string}`;

// block just before the arena deploy — keeps event scans cheap
export const ARENA_DEPLOY_BLOCK = 42_330_000n;

export const publicClient = createPublicClient({ chain: monad, transport: http() });

export const arenaAbi = parseAbi([
  "function currentGame() view returns (uint256)",
  "function rounds(uint256) view returns (uint64 startsAt, bool open, bool settled, uint8 winnerSide, uint8 firstVictim, bool hadVictim)",
  "function placeBet(uint256 gameId, uint8 market, uint8 pick) payable",
  "function houseBalance() view returns (uint256)",
  "event BetPlaced(uint256 indexed gameId, address indexed user, uint8 market, uint8 pick, uint256 amount)",
  "event BetSettled(uint256 indexed gameId, address indexed user, uint8 market, uint8 pick, uint256 amount, uint256 payout, bool won)",
]);

/** souls in contract index order (0..5) — must match engine/src/souls.ts */
export const ARENA_AGENTS = [
  { name: "Red", color: "#e74c3c" },
  { name: "Blue", color: "#3498db" },
  { name: "Green", color: "#2ecc71" },
  { name: "Purple", color: "#9b59b6" },
  { name: "Yellow", color: "#f1c40f" },
  { name: "Orange", color: "#e67e22" },
] as const;
