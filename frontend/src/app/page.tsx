"use client";

import Link from "next/link";
import LandingLiveVoteCard from "@/components/landing/LandingLiveVoteCard";

const BENEFITS = [
  {
    title: "Anonymous eligibility",
    desc: "Merkle proofs confirm you're in the snapshot — your wallet never hits the ballot.",
  },
  {
    title: "One vote enforced",
    desc: "Nullifiers on Soroban prevent double-voting. One identity, one ballot.",
  },
  {
    title: "Fully verifiable",
    desc: "Groth16 verified on-chain. Anyone can audit tallies and nullifiers.",
  },
] as const;

const FLOW_STEPS = [
  { n: "1", title: "Connect wallet", desc: "Check eligibility against the voter snapshot." },
  { n: "2", title: "Generate proof", desc: "Groth16 proof built locally in your browser." },
  { n: "3", title: "Cast vote", desc: "Relayed anonymously to Stellar. Choice stays private." },
] as const;

const STATS = [
  { label: "Proof system", value: "Groth16" },
  { label: "Ballot privacy", value: "100%" },
  { label: "Network", value: "Soroban" },
] as const;

export default function Home() {
  return (
    <>
      {/* Hero — split layout */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 px-5 sm:px-8 lg:px-10 overflow-hidden">
        <div className="hero-orb pointer-events-none" aria-hidden />
        <div className="hero-grid-accent pointer-events-none" aria-hidden />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Copy */}
            <div className="animate-fade-in-up text-center lg:text-left">
              <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)] mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-stellar-yes)]" />
                Live on Stellar Testnet
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem] font-semibold leading-[1.05] tracking-tight mb-5">
                Anonymous voting on Stellar, powered by ZK proofs
              </h1>

              <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed mb-4 max-w-xl mx-auto lg:mx-0">
                Vote with Merkle proofs and nullifiers on Soroban. Prove you&apos;re
                eligible without revealing who you are or how you voted.
              </p>

              <p className="text-sm text-[var(--muted)] mb-8 max-w-lg mx-auto lg:mx-0">
                Zero-knowledge ballots for DAOs and token-gated communities — verifiable,
                private, and live on testnet today.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                <Link href="/proposals" className="btn btn-primary px-7 py-3 text-sm">
                  Launch app
                </Link>
                <a href="#how-it-works" className="btn btn-secondary px-7 py-3 text-sm">
                  How it works
                </a>
              </div>

              <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p className="text-lg font-semibold tabular-nums">{s.value}</p>
                    <p className="text-[11px] text-[var(--muted)] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live vote card */}
            <div className="animate-fade-in-up lg:pl-4" style={{ animationDelay: "0.08s" }}>
              <LandingLiveVoteCard />
            </div>
          </div>
        </div>
      </section>

      {/* Marquee trust strip */}
      <section className="border-y border-[var(--border)] py-4 overflow-hidden bg-[var(--surface)]">
        <div className="flex gap-12 animate-marquee whitespace-nowrap text-xs text-[var(--muted)] uppercase tracking-[0.2em]">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="inline-flex gap-12 shrink-0">
              <span>✓ Groth16 on-chain</span>
              <span>✓ Nullifier receipts</span>
              <span>✓ Local proof generation</span>
              <span>✓ Relayer anonymity</span>
              <span>✓ Soroban verified</span>
            </span>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20 px-5 sm:px-8 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold text-center mb-10 tracking-tight">
            Built for private governance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="surface p-6 landing-benefit-card">
                <h3 className="text-base font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 md:py-24 px-5 sm:px-8 lg:px-10 border-t border-[var(--border)] scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
              Three steps from wallet to anonymous on-chain vote.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FLOW_STEPS.map((step) => (
              <div key={step.n} className="surface p-6 relative overflow-hidden group">
                <span className="text-5xl font-bold text-[var(--border)] absolute top-4 right-4 select-none group-hover:text-[var(--border-strong)] transition-colors">
                  {step.n}
                </span>
                <h3 className="text-base font-semibold mb-2 relative">{step.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed relative">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why + CTA */}
      <section className="py-16 md:py-20 px-5 sm:px-8 lg:px-10 bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              Why it matters
            </h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed mb-4">
              DAOs need voting that is both <strong className="text-[var(--foreground)] font-medium">verifiable</strong> and{" "}
              <strong className="text-[var(--foreground)] font-medium">private</strong>.
              Members prove eligibility without exposing wallets or choices — a path to
              compliance-friendly anonymous governance on Stellar.
            </p>
            <p className="text-sm text-[var(--muted)]">
              Token-gated communities, grant programs, and protocol upgrades can all run
              on the same nullifier-based ballot system.
            </p>
          </div>
          <div className="surface p-8 text-center lg:text-left">
            <h3 className="text-lg font-semibold mb-2">Ready to try it?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Vote on a live proposal, verify nullifiers, or submit your own for review.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/proposals" className="btn btn-primary px-7 py-3 text-sm">
                Launch app
              </Link>
              <Link href="/verify" className="btn btn-secondary px-7 py-3 text-sm">
                Verify a vote
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-8 px-5 sm:px-8 lg:px-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]">
          <span>Privora · Stellar Soroban · Groth16</span>
          <div className="flex gap-6">
            <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--foreground)]">
              Stellar.org
            </a>
            <a href="https://developers.stellar.org" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--foreground)]">
              Docs
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
