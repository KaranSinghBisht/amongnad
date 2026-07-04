import Image from "next/image";
import Link from "next/link";
import { CornerBrackets } from "@/components/corner-brackets";
import { GAME_CONTRACT } from "@/lib/env";

const EXPLORER_ADDRESS = "https://testnet.monadscan.com/address/";
const GITHUB_URL = "https://github.com/KaranSinghBisht/amongnad";

export default function LandingPage() {
  const contract = GAME_CONTRACT || "0xa8e3463eF7934C7F8B18f77eBF1A6b49afA4932b";
  const shortContract = `${contract.slice(0, 6)}…${contract.slice(-4)}`;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-10 px-4 py-8 text-[#F4F2FF] sm:px-6 sm:py-12">
      {/* Hero */}
      <section className="flex flex-col items-center gap-7 text-center">
        <div className="glow-purple relative aspect-[3/1] w-full overflow-hidden rounded-xl border border-[#836EF9]/35">
          <Image
            src="/banner.png"
            alt="amongnad — Among Us, but agents play. AI social deduction on Monad."
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover object-center"
          />
        </div>

        <div className="max-w-2xl space-y-4">
          <h1 className="text-3xl font-black italic tracking-tight sm:text-4xl">
            Among&nbsp;Us, but <span className="text-[#A99BFF]">agents</span> play.
          </h1>
          <p className="text-base leading-relaxed text-[#C9B8FF]/85 sm:text-lg">
            Five Claude agents with different souls roam the Skeld — one is the impostor.
            They scheme in private, lie in public, and vote each other out with secret
            on-chain ballots. <span className="font-semibold text-[#F4F2FF]">Every kill,
            vent, report and vote is a real Monad transaction.</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/watch"
            className="glow-purple rounded-lg bg-[#836EF9] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#9887fa]"
          >
            ▶ Enter the theater
          </Link>
          <a
            href={`${EXPLORER_ADDRESS}${contract}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[#836EF9]/40 px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#C9B8FF] transition-colors hover:bg-[#836EF9]/15"
          >
            Contract ↗
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[#836EF9]/40 px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#C9B8FF] transition-colors hover:bg-[#836EF9]/15"
          >
            GitHub ↗
          </a>
        </div>
      </section>

      {/* Why it's interesting */}
      <section className="grid gap-4 sm:grid-cols-3">
        <FeatureCard
          icon="🧠"
          title="Minds on display"
          body="Each agent's private reasoning streams live under the map. Watch the impostor plan a lie in its head — then tell it out loud in the meeting."
        />
        <FeatureCard
          icon="⛓️"
          title="The story is on-chain"
          body="The game log is written to Monad as it happens. Click any row and read the actual transaction — the narrative is the receipt."
        />
        <FeatureCard
          icon="🗳️"
          title="Ballots that can't cheat"
          body="Ejection votes run commit-reveal from each agent's own wallet and are tallied by the contract. Two blocks ≈ one second — only watchable on Monad."
        />
      </section>

      {/* Chain facts */}
      <section className="relative rounded-lg border border-[#836EF9]/25 bg-[#140A2E]/50 px-5 py-4">
        <CornerBrackets />
        <dl className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 font-mono text-xs text-[#A99BFF]/85">
          <Fact label="CHAIN" value="Monad Testnet · 10143" />
          <Fact
            label="CONTRACT"
            value={
              <a
                href={`${EXPLORER_ADDRESS}${contract}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[#836EF9]/60 underline-offset-2 hover:text-[#F4F2FF]"
              >
                {shortContract} ↗
              </a>
            }
          />
          <Fact label="BLOCK TIME" value="400 ms" />
          <Fact label="VOTES" value="commit–reveal" />
          <Fact label="AGENTS" value="Claude × 5 souls" />
        </dl>
      </section>

      <footer className="mt-auto pb-2 text-center font-mono text-[11px] tracking-wide text-[#6b5fa8]">
        Built in one day at Monad Blitz Pune V2 — “The Agent Economy”
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="relative rounded-lg border border-[#836EF9]/25 bg-[#140A2E]/50 p-5">
      <CornerBrackets size={10} />
      <div className="mb-2 text-2xl" aria-hidden>
        {icon}
      </div>
      <h2 className="mb-1.5 text-sm font-bold uppercase tracking-widest text-[#C9B8FF]">{title}</h2>
      <p className="text-sm leading-relaxed text-[#F4F2FF]/75">{body}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="text-[#6b5fa8]">{label}</dt>
      <dd className="font-bold text-[#C9B8FF]">{value}</dd>
    </div>
  );
}
