/** Static shell — paints instantly, no JS required */
export default function LandingVoteCardSkeleton() {
  return (
    <div className="landing-vote-card scroll-mt-24">
      <div className="landing-vote-card-glow" aria-hidden />
      <div className="relative rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-stellar-yes)]" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider">Live proposal</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--muted)]">PRV #001</span>
        </div>
        <div className="p-5 md:p-6 space-y-4">
          <div className="h-6 w-4/5 rounded bg-[var(--surface-2)]" />
          <div className="h-10 w-full rounded bg-[var(--surface-2)]" />
          <div className="h-2 w-full rounded-full bg-[var(--surface-2)]" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-16 rounded-lg bg-[var(--surface-2)]" />
            <div className="h-16 rounded-lg bg-[var(--surface-2)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
