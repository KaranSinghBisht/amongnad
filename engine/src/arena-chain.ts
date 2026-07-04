// Typed wrappers for the AmongNadArena betting contract (house-banked bets).
// Reuses the master signer + clients from chain.ts.
import { readFileSync } from 'node:fs';
import type { Abi, Hex } from 'viem';
import { publicClient, walletClient, master } from './chain';
import { config } from './env';

const abi = JSON.parse(
  readFileSync(new URL('./abi/AmongNadArena.json', import.meta.url), 'utf8'),
) as Abi;

const ARENA = { address: config.arenaContract, abi } as const;

async function send(functionName: string, args: readonly unknown[], gas: bigint): Promise<Hex> {
  const hash = await walletClient.writeContract({ ...ARENA, functionName, args, account: master, gas } as any);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === 'reverted') throw new Error(`${functionName} reverted on-chain (tx ${hash})`);
  return hash;
}

export const arena = {
  openRound: (g: bigint, startsAt: bigint) => send('openRound', [g, startsAt], 300_000n),

  closeBetting: (g: bigint) => send('closeBetting', [g], 150_000n),

  // settlement loops over every bet and pays winners — generous limit
  settle: (g: bigint, winnerSide: number, firstVictim: number, hadVictim: boolean) =>
    send('settle', [g, winnerSide, firstVictim, hadVictim], 3_000_000n),

  betCount: (g: bigint) =>
    publicClient.readContract({ ...ARENA, functionName: 'betCount', args: [g] } as any) as Promise<bigint>,

  async round(g: bigint): Promise<{ startsAt: bigint; open: boolean; settled: boolean }> {
    const r = (await publicClient.readContract({ ...ARENA, functionName: 'rounds', args: [g] } as any)) as any[];
    return { startsAt: r[0] as bigint, open: r[1] as boolean, settled: r[2] as boolean };
  },

  houseBalance: () =>
    publicClient.readContract({ ...ARENA, functionName: 'houseBalance', args: [] } as any) as Promise<bigint>,
};
