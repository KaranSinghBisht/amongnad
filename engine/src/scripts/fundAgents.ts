// Generate (or load) the agent wallets and fund each ~0.3 MON from the funder.
// Run with: npm run fund-agents
import { formatEther } from 'viem';
import { chain, master } from '../chain';
import { loadOrCreateAgents } from '../wallets';

const FUND_AMOUNT = '0.5'; // MON to send when a wallet is below the threshold
const THRESHOLD = 400_000_000_000_000_000n; // 0.4 MON — top up below this

async function main() {
  const agents = loadOrCreateAgents();
  const funderBalance = await chain.balance(master.address);
  console.log(`[fund] funder ${master.address} balance: ${formatEther(funderBalance)} MON`);

  for (const a of agents) {
    const bal = await chain.balance(a.address);
    if (bal >= THRESHOLD) {
      console.log(`[fund] ${a.name} ${a.address} already funded (${formatEther(bal)} MON) — skipping`);
      continue;
    }
    try {
      const hash = await chain.fund(a.address, FUND_AMOUNT);
      const newBal = await chain.balance(a.address);
      console.log(`[fund] ${a.name} ${a.address} -> ${formatEther(newBal)} MON  (tx ${hash})`);
    } catch (err) {
      console.error(`[fund] FAILED to fund ${a.name} ${a.address}:`, (err as Error).message);
    }
  }

  console.log('[fund] done.');
  console.log('[fund] agent addresses:');
  for (const a of agents) console.log(`  ${a.name} (${a.soul}): ${a.address}`);
}

main().catch((err) => {
  console.error('[fund] fatal:', err);
  process.exit(1);
});
