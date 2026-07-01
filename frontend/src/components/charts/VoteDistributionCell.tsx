"use client";

import VoteDonutChart from "@/components/charts/VoteDonutChart";

interface Props {
  yesCount: number;
  noCount: number;
  className?: string;
}

/** Table-cell vote split: mini donut + yes/no counts */
export default function VoteDistributionCell({ yesCount, noCount, className = "" }: Props) {
  const total = yesCount + noCount;
  const yesPct = total > 0 ? Math.round((yesCount / total) * 100) : 0;
  const noPct = total > 0 ? 100 - yesPct : 0;

  return (
    <div className={`flex items-center gap-3 min-w-[148px] ${className}`}>
      <VoteDonutChart
        yesCount={yesCount}
        noCount={noCount}
        size={48}
        strokeWidth={7}
        showLegend={false}
      />
      <div className="flex flex-col gap-1 text-[10px] leading-tight tabular-nums min-w-0">
        {total === 0 ? (
          <span className="text-[var(--muted)]">No votes</span>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: "var(--color-stellar-yes)" }}
              />
              <span className="text-[var(--color-stellar-yes)] font-semibold">{yesPct}%</span>
              <span className="text-[var(--muted)]">({yesCount})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: "var(--color-stellar-no)" }}
              />
              <span className="text-[var(--color-stellar-no)] font-semibold">{noPct}%</span>
              <span className="text-[var(--muted)]">({noCount})</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
