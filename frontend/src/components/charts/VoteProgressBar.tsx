interface Props {
  yesCount: number;
  noCount: number;
  className?: string;
}

/** Compact yes/no bar for table rows — no SVG arcs, instant paint */
export default function VoteProgressBar({ yesCount, noCount, className = "" }: Props) {
  const total = yesCount + noCount;
  const yesPct = total > 0 ? Math.round((yesCount / total) * 100) : 0;
  const noPct = total > 0 ? 100 - yesPct : 0;

  if (total === 0) {
    return (
      <div className={`w-full max-w-[120px] ${className}`}>
        <div className="h-1.5 rounded-full bg-[var(--surface-2)]" />
        <p className="text-[10px] text-[var(--muted)] mt-1.5 tabular-nums">No votes yet</p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-[120px] ${className}`}>
      <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden flex">
        <div
          className="h-full bg-[var(--color-stellar-yes)] transition-[width] duration-500"
          style={{ width: `${yesPct}%` }}
        />
        <div
          className="h-full bg-[var(--color-stellar-no)] transition-[width] duration-500"
          style={{ width: `${noPct}%` }}
        />
      </div>
      <p className="text-[10px] text-[var(--muted)] mt-1.5 tabular-nums">
        <span className="text-[var(--color-stellar-yes)]">{yesPct}%</span>
        {" · "}
        <span className="text-[var(--color-stellar-no)]">{noPct}%</span>
      </p>
    </div>
  );
}
