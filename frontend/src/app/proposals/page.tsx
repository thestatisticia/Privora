"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HubPage, HubPageTitle } from "@/components/hub/HubPage";
import VoteDonutChart from "@/components/charts/VoteDonutChart";
import { getAllProposals, Proposal } from "@/lib/stellar";
import {
  formatEnds,
  isProposalActive,
  timeRemaining,
  votePercents,
} from "@/lib/proposal-utils";

type Filter = "all" | "voting" | "ended";

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    getAllProposals().then((data) => {
      setProposals(data);
      setLoading(false);
    });
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
        <Link href="/create" className="btn btn-primary px-6 py-3 shrink-0">
          New Proposal
        </Link>
      </div>

      <div className="flex gap-2 mb-8 border-b border-stellar pb-4">
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
      </div>

      <div className="surface overflow-hidden">
        <div className="hidden lg:grid grid-cols-[64px_1fr_100px_88px_120px_130px] gap-4 px-6 py-4 border-b border-stellar text-[10px] font-bold uppercase tracking-[0.14em] text-stellar-muted">
          <span>ID</span>
          <span>Title</span>
          <span>Status</span>
          <span className="text-center">Votes</span>
          <span className="text-center">Distribution</span>
          <span className="text-right">Ends</span>
        </div>

        {loading ? (
          <div className="divide-y divide-stellar">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[4.5rem] animate-shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-stellar-muted text-sm">No proposals match this filter.</div>
        ) : (
          <div className="divide-y divide-stellar">
            {filtered.map((p) => (
              <ProposalRow key={p.id} proposal={p} />
            ))}
          </div>
        )}
      </div>
    </HubPage>
  );
}

function ProposalRow({ proposal }: { proposal: Proposal }) {
  const active = isProposalActive(proposal);
  const { total, yesPercent } = votePercents(proposal);

  return (
    <Link
      href={`/vote/${proposal.id}`}
      className="grid grid-cols-1 lg:grid-cols-[64px_1fr_100px_88px_120px_130px] gap-3 lg:gap-4 px-6 py-5 hover:bg-white/[0.02] transition-colors items-center group"
    >
      <span className="font-mono text-xs text-stellar-muted">
        #{proposal.id.toString().padStart(3, "0")}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-white truncate group-hover:text-stellar-cyan transition-colors">
          {proposal.title}
        </p>
        <p className="text-xs text-stellar-muted truncate mt-1 lg:hidden">
          {active ? timeRemaining(proposal.end_time) : "Ended"}
        </p>
      </div>
      <div>
        {active ? (
          <span className="badge badge-live">
            <span className="w-1.5 h-1.5 rounded-full bg-stellar-cyan animate-pulse" />
            Voting
          </span>
        ) : (
          <span className="badge badge-muted">Ended</span>
        )}
      </div>
      <span className="text-sm text-gray-300 tabular-nums text-center hidden lg:block">
        {total || "—"}
      </span>
      <div className="hidden lg:flex justify-center">
        <VoteDonutChart
          yesCount={proposal.yes_count}
          noCount={proposal.no_count}
          size={52}
          strokeWidth={7}
          showLegend={false}
        />
      </div>
      <span className="text-xs text-stellar-muted text-right hidden lg:block tabular-nums">
        {total > 0 && (
          <span className="text-stellar-cyan font-medium mr-2">{yesPercent}% yes</span>
        )}
        {active ? timeRemaining(proposal.end_time) : formatEnds(proposal.end_time).split(",")[0]}
      </span>
    </Link>
  );
}
