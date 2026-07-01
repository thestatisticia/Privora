"use client";

import type { Proposal } from "@/lib/types/proposal";
import { turnoutStats } from "@/lib/proposal-utils";

export default function TurnoutMeter({
  proposal,
  compact = false,
}: {
  proposal: Proposal;
  compact?: boolean;
}) {
  const stats = turnoutStats(proposal, proposal.snapshotVoterCount);

  if (stats.eligible === null) {
    return (
      <div className={compact ? "text-xs text-[var(--muted)]" : "surface p-4"}>
        <p className={compact ? "" : "text-sm text-[var(--text-secondary)]"}>
          <span className="font-semibold text-[var(--foreground)] tabular-nums">
            {stats.ballots}
          </span>{" "}
          ballot{stats.ballots !== 1 ? "s" : ""} cast
          <span className="text-[var(--muted)]"> · snapshot size unknown</span>
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? "" : "surface p-5"}>
      <div className={`flex flex-wrap items-end justify-between gap-3 ${compact ? "" : "mb-4"}`}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1">
            Turnout
          </p>
          <p className={`font-bold tabular-nums ${compact ? "text-lg" : "text-2xl"}`}>
            {stats.ballots}{" "}
            <span className={`text-[var(--muted)] font-medium ${compact ? "text-sm" : "text-base"}`}>
              / {stats.eligible} eligible
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className={`font-bold text-stellar-cyan tabular-nums ${compact ? "text-lg" : "text-2xl"}`}>
            {stats.turnoutPercent}%
          </p>
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest">
            participation
          </p>
        </div>
      </div>

      {!compact && (
        <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden mb-3">
          <div
            className="h-full bg-stellar-cyan/80 transition-all duration-500"
            style={{ width: `${Math.min(100, stats.turnoutPercent ?? 0)}%` }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`badge ${stats.quorumMet ? "badge-live" : "badge-muted"}`}
        >
          {stats.quorumMet ? "Quorum met" : `Quorum: ${stats.quorumPercent}%`}
        </span>
        {!stats.quorumMet && stats.quorumThreshold !== null && (
          <span className="text-[var(--muted)] tabular-nums">
            needs {stats.quorumThreshold} ballots ({stats.quorumThreshold - stats.ballots} more)
          </span>
        )}
        <span className="text-[var(--muted)] ml-auto">identities stay private</span>
      </div>
    </div>
  );
}
