const PILLARS = [
  {
    title: "Prove you belong",
    desc: "Merkle membership in zero knowledge",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    title: "Vote unlinked",
    desc: "Relayer submits — wallet never signs",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    title: "Verify everything",
    desc: "Groth16 + tallies on Soroban",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
] as const;

export default function HeroPillars() {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 max-w-xl mx-auto lg:mx-0">
      {PILLARS.map((p) => (
        <li
          key={p.title}
          className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/60 px-4 py-3 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stellar-cyan/10 text-stellar-cyan">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={p.icon} />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">{p.title}</p>
            <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">{p.desc}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
