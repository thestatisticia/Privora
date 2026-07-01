const REASONS = [
  {
    title: "Native ZK verification",
    desc: "Groth16 proofs are verified inside the Soroban contract using BLS12-381 pairing host functions — no external verifier contract on another chain.",
  },
  {
    title: "Low-cost, fast finality",
    desc: "Stellar's fee model and ledger speed make per-vote proof verification practical for real communities, not just lab demos.",
  },
  {
    title: "Freighter ecosystem",
    desc: "Wallets sign governance actions (submit, approve) while ballots go through a relayer — a clean split between identity ops and private voting.",
  },
  {
    title: "Persistent nullifier map",
    desc: "Soroban storage enforces one vote per anonymous identity per proposal, with auditable tallies anyone can inspect.",
  },
] as const;

export default function WhyStellar() {
  return (
    <section
      id="why-stellar"
      className="py-16 md:py-24 px-5 sm:px-8 lg:px-10 border-t border-[var(--border)] bg-[var(--surface)] scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-10 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-3">Why Stellar</p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
              Built for Soroban, not bolted on
            </h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed mb-6">
              Privora uses Stellar as the trust layer: cryptographic verification, nullifier
              enforcement, and governance state live on-chain. Privacy comes from zero-knowledge
              proofs and relayer architecture — Stellar provides the fast, cheap, verifiable rails.
            </p>
            <blockquote className="border-l-2 border-stellar-cyan/50 pl-4 text-sm text-[var(--text-secondary)] italic leading-relaxed">
              &ldquo;Prove participation without exposing voter wallets — verified where your
              community already lives.&rdquo;
            </blockquote>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REASONS.map((r) => (
              <article
                key={r.title}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] p-5"
              >
                <h3 className="text-sm font-semibold mb-2">{r.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{r.desc}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-[var(--border-subtle)] bg-[var(--background)] p-6 md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-4">
            Architecture on Stellar testnet
          </p>
          <div className="font-mono text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed space-y-1 overflow-x-auto">
            <p>
              <span className="text-stellar-cyan">Browser</span> → Groth16 proof (Circom + snarkjs)
            </p>
            <p>
              <span className="text-stellar-cyan">POST /api/cast-vote</span> → server relayer signs
            </p>
            <p>
              <span className="text-stellar-cyan">Soroban</span> → verify proof · record nullifier ·
              tally · mint collectible
            </p>
            <p className="text-[var(--muted)] pt-2">
              Voter Freighter address never appears in cast_vote
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
