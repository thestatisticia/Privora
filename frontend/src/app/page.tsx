import Link from "next/link";
import dynamic from "next/dynamic";
import LandingVoteCardSkeleton from "@/components/landing/LandingVoteCardSkeleton";

const LandingLiveVoteCard = dynamic(
  () => import("@/components/landing/LandingLiveVoteCard"),
  { loading: () => <LandingVoteCardSkeleton /> }
);

const BENEFITS = [
  {
    tag: "Privacy",
    title: "Anonymous eligibility",
    desc: "Prove you're in the voter snapshot with a Merkle proof. Your wallet never appears on the ballot.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    ),
  },
  {
    tag: "Integrity",
    title: "One vote enforced",
    desc: "Nullifiers on Soroban block double-voting. One identity, one ballot — enforced by math, not trust.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    ),
  },
  {
    tag: "Audit",
    title: "Fully verifiable",
    desc: "Groth16 proofs verified on-chain. Anyone can audit tallies and nullifiers without seeing who voted how.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    ),
  },
] as const;

const FLOW_STEPS = [
  {
    n: "01",
    title: "Connect wallet",
    desc: "Link Freighter to check your address against the voter snapshot. Eligibility only — no vote is cast yet.",
  },
  {
    n: "02",
    title: "Generate proof",
    desc: "Privora builds a Groth16 proof locally in your browser. Your secret identity never leaves the device.",
  },
  {
    n: "03",
    title: "Cast vote",
    desc: "The proof is relayed to Soroban anonymously. On-chain: a nullifier and tally update — not your wallet.",
  },
] as const;

const STATS = [
  { label: "Proof system", value: "Groth16" },
  { label: "Ballot privacy", value: "100%" },
  { label: "Network", value: "Soroban" },
] as const;

export default function Home() {
  return (
    <>
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 px-5 sm:px-8 lg:px-10 overflow-hidden">
        <div className="hero-orb pointer-events-none" aria-hidden />
        <div className="hero-grid-accent pointer-events-none" aria-hidden />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
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

              <div className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                <Link href="/proposals" prefetch className="btn btn-primary px-7 py-3 text-sm">
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

            <div className="animate-fade-in-up lg:pl-4 relative z-10" style={{ animationDelay: "0.08s" }}>
              <LandingLiveVoteCard />
            </div>
          </div>
        </div>
      </section>

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

      <section className="py-16 md:py-20 px-5 sm:px-8 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-3">Why Privora</p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Built for private governance
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {BENEFITS.map((b) => (
              <article key={b.title} className="feature-card group">
                <div className="feature-card-icon">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    {b.icon}
                  </svg>
                </div>
                <span className="feature-card-tag">{b.tag}</span>
                <h3 className="text-base font-semibold mb-2 mt-3">{b.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{b.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 md:py-24 px-5 sm:px-8 lg:px-10 border-t border-[var(--border)] scroll-mt-20 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-3">The flow</p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-[var(--text-secondary)] text-sm max-w-lg mx-auto">
              Three steps from wallet check to anonymous on-chain vote. Everything heavy
              happens locally — only the proof hits the chain.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {FLOW_STEPS.map((step, i) => (
              <article key={step.n} className="step-card">
                <div className="step-card-header">
                  <span className="step-card-num">{step.n}</span>
                  {i < FLOW_STEPS.length - 1 && (
                    <span className="step-card-connector hidden md:block" aria-hidden />
                  )}
                </div>
                <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-5 sm:px-8 lg:px-10 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">
              Why it matters
            </h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed mb-4">
              DAOs need voting that is both <strong className="text-[var(--foreground)] font-medium">verifiable</strong> and{" "}
              <strong className="text-[var(--foreground)] font-medium">private</strong>.
              Members prove eligibility without exposing wallets or choices.
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
            <div className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/proposals" prefetch className="btn btn-primary px-7 py-3 text-sm">
                Launch app
              </Link>
              <Link href="/verify" prefetch className="btn btn-secondary px-7 py-3 text-sm">
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
