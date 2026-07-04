// viem clients on a custom Monad chain + typed wrappers for every contract fn.
// Lifecycle txs are signed by the master (funder) key; votes are signed by
// each agent's own wallet. Every write returns its tx hash.
import {
  createPublicClient,
  createWalletClient,
  http,
  fallback,
  defineChain,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  parseEther,
  type Abi,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { config } from './env';

// ABI is loaded at runtime, so viem's static generics can't infer call shapes
// from it; the `as any` casts below are the standard escape hatch for a
// dynamically-loaded ABI and do not affect runtime behaviour.
const abi = JSON.parse(
  readFileSync(new URL('./abi/AmongNad.json', import.meta.url), 'utf8'),
) as Abi;

export const monad = defineChain({
  id: config.chainId,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [config.rpcUrl] } },
});

const urls = [config.rpcUrl, config.rpcPublic, config.rpcFallback].filter(Boolean);
const transport = fallback(urls.map((u) => http(u)));

export const publicClient = createPublicClient({
  chain: monad,
  transport,
  pollingInterval: 300, // 400ms blocks — poll aggressively for snappy waits
});
export const walletClient = createWalletClient({ chain: monad, transport });
export const master: PrivateKeyAccount = privateKeyToAccount(config.privateKey);

const CONTRACT = { address: config.contract, abi } as const;

// Kind enum order (matches the Solidity enum):
// Spawn0 Move1 Saw2 Kill3 Vent4 Report5 MeetingStart6 VoteCommit7 VoteReveal8 Eject9 Win10
export const Kind = {
  Spawn: 0, Move: 1, Saw: 2, Kill: 3, Vent: 4, Report: 5,
  MeetingStart: 6, VoteCommit: 7, VoteReveal: 8, Eject: 9, Win: 10,
} as const;

export const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

// Winner enum: crew(0), impostor(1)
export const Winner = { Crew: 0, Impostor: 1 } as const;

export function randomSalt(): Hex {
  return ('0x' + randomBytes(32).toString('hex')) as Hex;
}

export function rolesCommit(impostor: Address, salt: Hex): Hex {
  return keccak256(
    encodeAbiParameters(parseAbiParameters('address, bytes32'), [impostor, salt]),
  );
}

export function voteHash(gameId: bigint, meeting: bigint, suspect: Address, salt: Hex): Hex {
  return keccak256(
    encodeAbiParameters(parseAbiParameters('uint256, uint256, address, bytes32'), [
      gameId, meeting, suspect, salt,
    ]),
  );
}

// --- low-level send helpers (writeContract + waitForTransactionReceipt) ---

async function send(
  functionName: string,
  args: readonly unknown[],
  account: PrivateKeyAccount,
  gas: bigint,
): Promise<Hex> {
  const hash = await walletClient.writeContract({ ...CONTRACT, functionName, args, account, gas } as any);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === 'reverted') throw new Error(`${functionName} reverted on-chain (tx ${hash})`);
  return hash;
}

async function simSend(
  functionName: string,
  args: readonly unknown[],
  account: PrivateKeyAccount,
  gas: bigint,
): Promise<{ hash: Hex; result: unknown }> {
  const { request, result } = await publicClient.simulateContract({
    ...CONTRACT, functionName, args, account, gas,
  } as any);
  const hash = await walletClient.writeContract(request as any);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === 'reverted') throw new Error(`${functionName} reverted on-chain (tx ${hash})`);
  return { hash, result };
}

// --- typed contract wrappers (each returns its tx hash) ---

export const chain = {
  async createGame(): Promise<{ gameId: bigint; hash: Hex }> {
    const { hash, result } = await simSend('createGame', [], master, 600_000n);
    return { gameId: result as bigint, hash };
  },

  addPlayer(g: bigint, agent: Address, name: string, soulId: Hex): Promise<Hex> {
    return send('addPlayer', [g, agent, name, soulId], master, 500_000n);
  },

  startGame(g: bigint, commit: Hex): Promise<Hex> {
    return send('startGame', [g, commit], master, 500_000n);
  },

  logEvent(g: bigint, kind: number, actor: Address, target: Address, room: string, note: string): Promise<Hex> {
    return send('logEvent', [g, kind, actor, target, room, note], master, 500_000n);
  },

  kill(g: bigint, victim: Address, room: string, note: string): Promise<Hex> {
    return send('kill', [g, victim, room, note], master, 500_000n);
  },

  startMeeting(g: bigint, reason: string): Promise<Hex> {
    return send('startMeeting', [g, reason], master, 500_000n);
  },

  async resolveMeeting(g: bigint): Promise<{ hash: Hex; ejected: Address; skipped: boolean }> {
    const { hash, result } = await simSend('resolveMeeting', [g], master, 700_000n);
    const r = result as any;
    const ejected = (Array.isArray(r) ? r[0] : r.ejected) as Address;
    const skipped = (Array.isArray(r) ? r[1] : r.skipped) as boolean;
    return { hash, ejected, skipped };
  },

  endGame(g: bigint, impostor: Address, salt: Hex, winner: number): Promise<Hex> {
    return send('endGame', [g, impostor, salt, winner], master, 500_000n);
  },

  // Monad charges on the gas LIMIT, not gas used — agent wallets are low-balance,
  // so these limits are kept tight (just above real usage) to conserve MON.
  commitVote(account: PrivateKeyAccount, g: bigint, hash: Hex): Promise<Hex> {
    return send('commitVote', [g, hash], account, 120_000n);
  },

  revealVote(account: PrivateKeyAccount, g: bigint, suspect: Address, salt: Hex): Promise<Hex> {
    return send('revealVote', [g, suspect, salt], account, 150_000n);
  },

  getMeeting(g: bigint): Promise<bigint> {
    return publicClient.readContract({ ...CONTRACT, functionName: 'meeting', args: [g] } as any) as Promise<bigint>;
  },

  isAlive(g: bigint, addr: Address): Promise<boolean> {
    return publicClient.readContract({ ...CONTRACT, functionName: 'alive', args: [g, addr] } as any) as Promise<boolean>;
  },

  gameCount(): Promise<bigint> {
    return publicClient.readContract({ ...CONTRACT, functionName: 'gameCount', args: [] } as any) as Promise<bigint>;
  },

  balance(addr: Address): Promise<bigint> {
    return publicClient.getBalance({ address: addr });
  },

  async fund(to: Address, mon: string): Promise<Hex> {
    const hash = await walletClient.sendTransaction({
      account: master,
      to,
      value: parseEther(mon),
      chain: monad,
    } as any);
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
  },
};
