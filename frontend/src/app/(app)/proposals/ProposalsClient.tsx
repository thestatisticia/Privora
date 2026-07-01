"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { HubPage, HubPageTitle } from "@/components/hub/HubPage";
import VoteDistributionCell from "@/components/charts/VoteDistributionCell";
import ClientTimeRemaining from "@/components/ClientTimeRemaining";
import type { Proposal } from "@/lib/types/proposal";
import { useWallet } from "@/lib/wallet";
import { isReviewer } from "@/lib/allowlist";
import {
  formatEnds,
  turnoutStats,
  isProposalActive,
  votePercents,
} from "@/lib/proposal-utils";
import LiveActivityFeed from "@/components/LiveActivityFeed";

type Filter = "all" | "voting" | "ended";

async function fetchProposals(): Promise<Proposal[]> {
  const r = await fetch("/api/proposals");
  if (!r.ok) return [];
  return r.json();
}

export default function ProposalsClient({
  initialProposals,
}: {
  initialProposals: Proposal[];
}) {
  const { address } = useWallet();
  const admin = isReviewer(address);
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchProposals();
      setProposals(data);
    } catch {
      /* keep stale list */
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filtered = proposals.filter((p) => {
    const active = isProposalActive(p);
    if (filter === "voting") return active;
    if (filter === "ended") return !active;
    return true;
  });

  const votingCount = proposals.filter(isProposalActive).length;
  const totalVotes = proposals.reduce((a, p) => a + p.yes_count + p.no_count, 0);

  return (
    <HubPage wide>
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <HubPageTitle subtitle={`${votingCount} open · ${proposals.length} total · ${totalVotes} votes cast`}>
          Proposals
        </HubPageTitle>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            className="btn btn-secondary px-5 py-3 text-sm"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          {admin && (
            <Link href="/review" className="btn btn-secondary px-5 py-3 text-sm">
              Review queue
            </Link>
          )}
          <Link href="/create" className="btn btn-primary px-6 py-3 text-sm" prefetch>
            New Proposal
          </Link>
          <p className="w-full lg:w-auto text-[10px] text-[var(--muted)] lg:max-w-[140px] leading-snug lg:text-right">
            Submit at /create — paste eligible Stellar wallets to build the voter Merkle tree
          </p>
        </div>
      </div>

      {admin && (
        <div className="surface px-4 py-3 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-[var(--accent)]/25">
          <p className="text-sm text-[var(--text-secondary)]">
            Admin mode — approve pending submissions in the review queue before they go live.
          </p>
          <Link href="/review" className="text-sm font-medium text-[var(--accent)] hover:underline shrink-0">
            Open review →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 mb-8">
        <div className="min-w-0">
      <div className="flex gap-2 mb-8 border-b border-[var(--border-subtle)] pb-4">
        {(
          [
            ["all", "All"],
            ["voting", "Voting"],
            ["ended", "Ended"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === key
                ? "bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border-strong)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent"
            }`}
          >
            {label}
          </button>
        ))}
        {refreshing && (
          <span className="ml-auto text-xs text-[var(--muted)] self-center tabular-nums">
            Syncing…
          </span>
        )}
      </div>

      <div className="surface overflow-hidden">
        <div className="hidden lg:grid grid-cols-[52px_minmax(0,1fr)_88px_52px_minmax(168px,1fr)_minmax(100px,0.8fr)] gap-3 px-5 py-3 border-b border-[var(--border-subtle)] text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          <span>ID</span>
          <span>Title</span>
          <span>Status</span>
          <span className="text-center">Votes</span>
          <span>Yes / No split</span>
          <span className="text-right">Turnout · Ends</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted)] text-sm">
            No proposals match this filter.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filtered.map((p) => (
              <ProposalRow key={p.id} proposal={p} />
            ))}
          </div>
        )}
      </div>
        </div>
        <LiveActivityFeed className="xl:sticky xl:top-6 h-fit" />
      </div>
    </HubPage>
  );
}

function ProposalRow({ proposal }: { proposal: Proposal }) {
  const active = isProposalActive(proposal);
  const { total, yesPercent } = votePercents(proposal);
  const turnout = turnoutStats(proposal, proposal.snapshotVoterCount);

  return (
    <Link
      href={`/vote/${proposal.id}`}
      prefetch
      className="grid grid-cols-1 lg:grid-cols-[52px_minmax(0,1fr)_88px_52px_minmax(168px,1fr)_minmax(100px,0.8fr)] gap-3 px-5 py-4 hover:bg-[var(--surface-2)]/50 transition-colors items-center group"
    >
      <span className="font-mono text-[11px] text-[var(--muted)] tabular-nums">
        #{proposal.id.toString().padStart(3, "0")}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate group-hover:text-[var(--accent)] transition-colors">
          {proposal.title}
        </p>
        <p className="text-xs text-[var(--muted)] truncate mt-0.5 lg:hidden">
          {active ? (
            <ClientTimeRemaining endTime={proposal.end_time} />
          ) : (
            "Ended"
          )}
          {turnout.eligible != null && turnout.turnoutPercent != null
            ? ` · ${turnout.turnoutPercent}% turnout`
            : total > 0
              ? ` · ${yesPercent}% yes`
              : ""}
        </p>
      </div>
      <div>
        {active ? (
          <span className="badge badge-live">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-stellar-yes)]" />
            Voting
          </span>
        ) : (
          <span className="badge badge-muted">Ended</span>
        )}
      </div>
      <span className="text-sm tabular-nums text-center hidden lg:block text-[var(--text-secondary)]">
        {total || "—"}
      </span>
      <div className="hidden lg:flex items-center">
        <VoteDistributionCell yesCount={proposal.yes_count} noCount={proposal.no_count} />
      </div>
      {/* Mobile: show distribution inline */}
      <div className="lg:hidden col-span-full -mt-1 mb-1">
        <VoteDistributionCell yesCount={proposal.yes_count} noCount={proposal.no_count} />
      </div>
      <span className="text-xs text-[var(--muted)] text-right hidden lg:block tabular-nums">
        {turnout.eligible != null && turnout.turnoutPercent != null ? (
          <span className="text-[var(--foreground)] font-medium mr-2">
            {turnout.ballots}/{turnout.eligible} · {turnout.turnoutPercent}%
          </span>
        ) : total > 0 ? (
          <span className="text-[var(--foreground)] font-medium mr-2">{yesPercent}% yes</span>
        ) : null}
        {active ? (
          <ClientTimeRemaining endTime={proposal.end_time} />
        ) : (
          formatEnds(proposal.end_time).split(",")[0]
        )}
      </span>
    </Link>
  );
}
