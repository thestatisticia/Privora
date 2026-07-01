function FlowColumn({
  title,
  variant,
  steps,
  footer,
}: {
  title: string;
  variant: "traditional" | "privora";
  steps: { label: string; detail: string; highlight?: boolean }[];
  footer: string;
}) {
  const accent =
    variant === "privora"
      ? "border-stellar-cyan/30 bg-stellar-cyan/[0.04]"
      : "border-[var(--border-subtle)] bg-[var(--surface)]";

  return (
    <article className={`rounded-2xl border p-6 md:p-8 h-full ${accent}`}>
      <p
        className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
          variant === "privora" ? "text-stellar-cyan" : "text-[var(--muted)]"
        }`}
      >
        {title}
      </p>
      <ol className="space-y-0">
        {steps.map((step, i) => (
          <li key={step.label} className="relative">
            <div
              className={`rounded-lg px-4 py-3 border ${
                step.highlight
                  ? "border-stellar-cyan/40 bg-stellar-cyan/10"
                  : "border-[var(--border-subtle)] bg-[var(--surface-2)]"
              }`}
            >
              <p className="text-sm font-semibold">{step.label}</p>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">{step.detail}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-center py-2" aria-hidden>
                <svg className="w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
          </li>
        ))}
      </ol>
      <p className="text-xs text-[var(--text-secondary)] mt-5 pt-4 border-t border-[var(--border-subtle)] leading-relaxed">
        {footer}
      </p>
    </article>
  );
}

export default function PrivacyComparison() {
  return (
    <section
      id="privacy-comparison"
      className="py-16 md:py-24 px-5 sm:px-8 lg:px-10 border-t border-[var(--border)] scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-3">The difference</p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            Wallet-linked vs wallet-unlinked
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Traditional on-chain voting ties your Stellar address to your ballot forever.
            Privora separates eligibility from casting — the chain verifies your proof, not your wallet.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <FlowColumn
            title="Traditional governance"
            variant="traditional"
            steps={[
              {
                label: "Connect wallet",
                detail: "Freighter signs the vote transaction",
              },
              {
                label: "Vote YES / NO",
                detail: "Choice and address recorded together",
              },
              {
                label: "Public forever",
                detail: "Explorers link G… address → ballot",
                highlight: false,
              },
            ]}
            footer="Anyone can see which wallet voted and how — fine for transparency, risky for coercion and whale targeting."
          />
          <FlowColumn
            title="Privora on Soroban"
            variant="privora"
            steps={[
              {
                label: "Secret identity + ZK proof",
                detail: "Groth16 proves Merkle membership locally",
                highlight: true,
              },
              {
                label: "Relayer submits",
                detail: "cast_vote signed by relayer — not your wallet",
                highlight: true,
              },
              {
                label: "Anonymous receipt",
                detail: "Nullifier + tally on-chain — no voter address",
                highlight: true,
              },
            ]}
            footer="Communities verify participation and results without exposing which Freighter account cast each ballot."
          />
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[
            { label: "Wallet hidden", ok: true },
            { label: "Eligibility proven", ok: true },
            { label: "Double-vote blocked", ok: true },
            { label: "Secret ballot (v2)", ok: false },
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-3"
            >
              <p className="text-lg mb-1" aria-hidden>
                {row.ok ? "✓" : "○"}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">{row.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
