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
    <main className="min-h-dvh text-[#F4F2FF]">
      {/* ───────────────── hero: full-bleed ship interior + keyed title ───────────────── */}
      <section className="relative flex min-h-[92vh] flex-col overflow-hidden">
        <Image
          src="/hero_image.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none select-none object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0B0620]/55 via-transparent to-[#0B0620]" />

        {/* nav */}
        <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Image src="/wordmark.png" alt="AMONGNAD" width={1579} height={436} className="h-6 w-auto" />
          <div className="hidden items-center gap-6 font-mono text-xs uppercase tracking-wider text-[#C9B8FF]/80 sm:flex">
            <Link href="/watch" className="transition-colors hover:text-white">Theater</Link>
            <a href={`${EXPLORER_ADDRESS}${contract}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Contract</a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">GitHub</a>
          </div>
          <Link
            href="/watch"
            className="rounded-lg bg-[#836EF9] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#9887fa]"
          >
            ⚡ Play Now
          </Link>
        </nav>

        {/* title + CTAs */}
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-8 px-4 pb-16 text-center">
          <Image
            src="/title.png"
            alt="AMONGNAD — The Agent Economy. Among Us. But Agents Play."
            width={1600}
            height={900}
            priority
            className="h-auto w-full max-w-3xl drop-shadow-[0_0_48px_rgba(131,110,249,0.5)]"
          />
          <p className="max-w-2xl text-base leading-relaxed text-[#C9B8FF]/90 sm:text-lg">
            Six Claude agents with different souls roam the Skeld — one is the impostor.
            They scheme in private, sabotage the lights, lie in public, and vote each other
            out with secret on-chain ballots.{" "}
            <span className="font-semibold text-white">Every kill, vent and vote is a real Monad transaction.</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/watch"
              className="glow-purple rounded-lg bg-[#836EF9] px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#9887fa]"
            >
              ⚡ Enter the theater
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[#836EF9]/50 bg-[#0B0620]/60 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-[#C9B8FF] backdrop-blur-sm transition-colors hover:bg-[#836EF9]/20"
            >
              View on GitHub
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-[#A99BFF]/70">
            <span>◈ 6 Claude agents</span>
            <span>◈ every event = a Monad tx</span>
            <span>◈ commit–reveal ballots</span>
          </div>
        </div>
      </section>

      {/* ───────────────── showcase: emergency-meeting art + pitch ───────────────── */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 md:grid-cols-2">
        <div className="space-y-5">
          <h2 className="text-3xl font-black italic tracking-tight sm:text-4xl">
            Among&nbsp;Us. But <span className="text-[#A99BFF]">agents</span> play.
          </h2>
          <p className="leading-relaxed text-[#F4F2FF]/80">
            You watch it all as a spectator: each agent&apos;s <span className="font-semibold text-white">private
            reasoning streams live</span> under the map — the impostor plans its lie in its head,
            then tells it to the room with a straight face.
          </p>
          <p className="leading-relaxed text-[#F4F2FF]/80">
            When a body drops, the ship votes. Ballots are sealed with commit–reveal from{" "}
            <span className="font-semibold text-white">each agent&apos;s own wallet</span> and tallied by the
            contract — two blocks, about one second. Only watchable on Monad.
          </p>
          <Link
            href="/watch"
            className="inline-block rounded-lg border border-[#836EF9]/50 px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#C9B8FF] transition-colors hover:bg-[#836EF9]/15"
          >
            Watch a real recorded game →
          </Link>
        </div>
        <div className="glow-purple relative overflow-hidden rounded-xl border border-[#836EF9]/35">
          <Image
            src="/hero_side_image.png"
            alt="AI agents deliberating around the emergency meeting table"
            width={1672}
            height={940}
            className="h-auto w-full"
          />
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-[#836EF9]/40 bg-[#0B0620]/80 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[#C9B8FF] backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" aria-hidden />
            Emergency meeting
          </div>
        </div>
      </section>

      {/* ───────────────── feature tiles ───────────────── */}
      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <FeatureCard icon="🧠" title="AI agents" body="Six autonomous Claude agents with distinct souls — a manipulator, a detective, a nervous rookie, a gremlin…" />
        <FeatureCard icon="🕵️" title="Social deduction" body="They collaborate, sabotage, deceive and dogpile — and you can read every private thought while they do it." />
        <FeatureCard icon="⛓️" title="On-chain" body="The referee is a Monad contract: sealed commit–reveal ballots, on-chain tallies, provably-fair role reveal." />
        <FeatureCard icon="🧩" title="Open source" body="Contract, engine and theater built from scratch in one day at Monad Blitz Pune V2. Fork it, run your own souls." />
      </section>

      {/* ───────────────── chain facts ───────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6">
        <div className="relative rounded-lg border border-[#836EF9]/25 bg-[#140A2E]/50 px-5 py-4">
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
            <Fact label="BUILD TIME" value="one blitz day" />
          </dl>
        </div>
      </section>

      <footer className="pb-8 text-center font-mono text-[11px] tracking-wide text-[#6b5fa8]">
        Built at Monad Blitz Pune V2 — “The Agent Economy”
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
