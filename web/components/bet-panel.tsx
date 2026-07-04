"use client";

// Betting strip for the live arena: while a round is open you can connect an
// injected wallet and bet MON against the house on (a) who wins and (b) who
// dies first. Hides itself entirely when no round has ever been opened, so
// the theater still works standalone.
import { useCallback, useEffect, useState } from "react";
import { createWalletClient, custom, parseEther, formatEther, type Address } from "viem";
import { publicClient, arenaAbi, ARENA_ADDRESS, ARENA_AGENTS, ARENA_DEPLOY_BLOCK, monad } from "@/lib/arena";

interface RoundView {
  gameId: bigint;
  startsAt: number; // unix seconds; betting open until then
  open: boolean;
  settled: boolean;
}

interface SettledBet {
  gameId: bigint;
  amount: bigint;
  payout: bigint;
  won: boolean;
}

export function BetPanel() {
  const [round, setRound] = useState<RoundView | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [market, setMarket] = useState<0 | 1>(0);
  const [pick, setPick] = useState<number>(1); // default: impostor wins
  const [amount, setAmount] = useState<string>("0.05");
  const [status, setStatus] = useState<string>("");
  const [lastResults, setLastResults] = useState<SettledBet[]>([]);
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));

  // poll the current round every 5s; tick the countdown every second
  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const gameId = (await publicClient.readContract({
          address: ARENA_ADDRESS, abi: arenaAbi, functionName: "currentGame",
        })) as bigint;
        if (gameId === 0n) return;
        const r = (await publicClient.readContract({
          address: ARENA_ADDRESS, abi: arenaAbi, functionName: "rounds", args: [gameId],
        })) as readonly [bigint, boolean, boolean, number, number, boolean];
        if (!live) return;
        setRound({ gameId, startsAt: Number(r[0]), open: r[1], settled: r[2] });
      } catch {
        /* arena not reachable — stay hidden */
      }
    };
    load();
    const poll = setInterval(load, 5000);
    const tick = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => { live = false; clearInterval(poll); clearInterval(tick); };
  }, []);

  // pull my settled bets once connected
  useEffect(() => {
    if (!address) return;
    let live = true;
    const load = async () => {
      try {
        const logs = await publicClient.getContractEvents({
          address: ARENA_ADDRESS, abi: arenaAbi, eventName: "BetSettled",
          args: { user: address }, fromBlock: ARENA_DEPLOY_BLOCK,
        });
        if (!live) return;
        setLastResults(
          logs.slice(-3).map((l) => ({
            gameId: l.args.gameId as bigint,
            amount: l.args.amount as bigint,
            payout: l.args.payout as bigint,
            won: l.args.won as boolean,
          })),
        );
      } catch { /* best effort */ }
    };
    load();
    const t = setInterval(load, 15000);
    return () => { live = false; clearInterval(t); };
  }, [address, round?.settled]);

  const connect = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) { setStatus("No wallet found — install MetaMask/Rabby"); return; }
    try {
      const wallet = createWalletClient({ chain: monad, transport: custom(eth) });
      const [addr] = await wallet.requestAddresses();
      try {
        await wallet.switchChain({ id: monad.id });
      } catch {
        await wallet.addChain({ chain: monad }).catch(() => undefined);
        await wallet.switchChain({ id: monad.id }).catch(() => undefined);
      }
      setAddress(addr);
      setStatus("");
    } catch (err) {
      setStatus((err as Error).message.slice(0, 80));
    }
  }, []);

  const placeBet = useCallback(async () => {
    if (!address || !round) return;
    const eth = (window as any).ethereum;
    try {
      setStatus("confirm in wallet…");
      const wallet = createWalletClient({ chain: monad, transport: custom(eth) });
      const hash = await wallet.writeContract({
        address: ARENA_ADDRESS, abi: arenaAbi, functionName: "placeBet",
        args: [round.gameId, market, pick], value: parseEther(amount), account: address,
      });
      setStatus("bet placed ✓ — sealed on-chain");
      await publicClient.waitForTransactionReceipt({ hash }).catch(() => undefined);
    } catch (err) {
      setStatus(((err as Error).message ?? "failed").slice(0, 80));
    }
  }, [address, round, market, pick, amount]);

  const secsLeft = round ? round.startsAt - now : 0;
  const bettingOpen = !!round && round.open && secsLeft > 0;
  const mm = String(Math.max(0, Math.floor(secsLeft / 60))).padStart(2, "0");
  const ss = String(Math.max(0, secsLeft % 60)).padStart(2, "0");

  return (
    <div className="relative flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-[#836EF9]/30 bg-[#140A2E]/70 px-4 py-2 text-xs">
      <span className="font-mono font-bold uppercase tracking-widest text-[#C9B8FF]">
        🎲 Arena{round ? ` · game #${round.gameId.toString()}` : ""}
      </span>

      {!round ? (
        <span className="font-mono text-[#A99BFF]/70">
          next round opening soon — games run every ~10 min, bet MON on who wins &amp; who dies first
        </span>
      ) : bettingOpen ? (
        <span className="font-mono text-emerald-300">
          betting closes in <span className="font-bold">{mm}:{ss}</span> — game starts right after
        </span>
      ) : (
        <span className="font-mono text-[#A99BFF]/70">
          {round.settled ? "round settled — next opens soon" : `game #${round.gameId.toString()} in progress — bets locked`}
        </span>
      )}

      {bettingOpen && (
        <>
          <div className="flex overflow-hidden rounded border border-[#836EF9]/40 font-bold">
            <button type="button" onClick={() => { setMarket(0); setPick(1); }}
              className={`px-2 py-1 ${market === 0 ? "bg-[#836EF9] text-white" : "text-[#C9B8FF]"}`}>
              Who wins
            </button>
            <button type="button" onClick={() => { setMarket(1); setPick(0); }}
              className={`px-2 py-1 ${market === 1 ? "bg-[#836EF9] text-white" : "text-[#C9B8FF]"}`}>
              First victim ×4
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {market === 0 ? (
              <>
                <PickChip label="CREW" active={pick === 0} onClick={() => setPick(0)} color="#2ecc71" />
                <PickChip label="IMPOSTOR" active={pick === 1} onClick={() => setPick(1)} color="#e74c3c" />
              </>
            ) : (
              ARENA_AGENTS.map((a, i) => (
                <PickChip key={a.name} label={a.name} active={pick === i} onClick={() => setPick(i)} color={a.color} />
              ))
            )}
          </div>

          <div className="flex items-center gap-1 font-mono">
            {["0.01", "0.05", "0.1"].map((v) => (
              <button key={v} type="button" onClick={() => setAmount(v)}
                className={`rounded border px-1.5 py-0.5 ${amount === v ? "border-[#836EF9] bg-[#836EF9]/25 text-white" : "border-[#836EF9]/30 text-[#C9B8FF]"}`}>
                {v}
              </button>
            ))}
            <span className="text-[#A99BFF]/60">MON</span>
          </div>

          {address ? (
            <button type="button" onClick={placeBet}
              className="rounded bg-[#836EF9] px-3 py-1.5 font-bold uppercase tracking-wide text-white hover:bg-[#9887fa]">
              Place bet
            </button>
          ) : (
            <button type="button" onClick={connect}
              className="rounded border border-[#836EF9]/60 px-3 py-1.5 font-bold uppercase tracking-wide text-[#C9B8FF] hover:bg-[#836EF9]/20">
              Connect wallet
            </button>
          )}
        </>
      )}

      {address && (
        <span className="font-mono text-[#A99BFF]/60">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      )}
      {lastResults.length > 0 && (
        <span className="font-mono">
          {lastResults.map((r, i) => (
            <span key={i} className={r.won ? "text-emerald-300" : "text-red-400/80"}>
              {" "}#{r.gameId.toString()}: {r.won ? `won ${formatEther(r.payout)}` : "lost"}
            </span>
          ))}
        </span>
      )}
      {status && <span className="text-amber-300">{status}</span>}
      <span className="ml-auto flex items-center gap-3">
        {!address && !bettingOpen && (
          <button type="button" onClick={connect}
            className="rounded border border-[#836EF9]/60 px-3 py-1.5 font-bold uppercase tracking-wide text-[#C9B8FF] hover:bg-[#836EF9]/20">
            Connect wallet
          </button>
        )}
        <a href="/watch?replay=demo-game"
          className="rounded border border-[#836EF9]/40 px-3 py-1.5 font-bold uppercase tracking-wide text-[#C9B8FF] hover:bg-[#836EF9]/15">
          ▶ Watch last game
        </a>
        <span className="font-mono text-[10px] text-[#6b5fa8]">house-banked · broke house auto-refunds</span>
      </span>
    </div>
  );
}

function PickChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2 py-0.5 font-bold transition-colors ${active ? "text-white" : "text-[#C9B8FF]/80"}`}
      style={{ borderColor: color, backgroundColor: active ? color : "transparent" }}
    >
      {label}
    </button>
  );
}
