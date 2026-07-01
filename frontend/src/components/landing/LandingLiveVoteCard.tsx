"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Proposal } from "@/lib/types/proposal";
import { votePercents } from "@/lib/proposal-utils";
import { useIsClient } from "@/lib/use-client";

const FALLBACK: Proposal = {
  id: 0,
  title: "Allocate 50,000 XLM to Developer Grants",
  description:
    "Fund early-stage Soroban projects with community-selected grants. Focus: DeFi, privacy, and identity.",
  yes_count: 142,
  no_count: 31,
  end_time: 4102444800,
  is_active: true,
};

export default function LandingLiveVoteCard() {
  const [proposal, setProposal] = useState<Proposal>(FALLBACK);
  const [hover, setHover] = useState<"yes" | "no" | null>(null);
  const mounted = useIsClient();

  useEffect(() => {
    if (!mounted) return;
    fetch("/api/proposals")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Proposal[]) => {
        const active = list.filter((p) => p.is_active && Date.now() / 1000 < p.end_time);
        const picked = active[0] ?? list[0];
        if (picked) setProposal(picked);
      })
      .catch(() => {});
  }, [mounted]);

  const { total, yesPercent, noPercent } = votePercents(proposal);
  const voteHref = `/vote/${proposal.id}`;

  return (
    <div id="live-vote" className="landing-vote-card scroll-mt-24">
      <div className="landing-vote-card-glow pointer-events-none" aria-hidden />

      <div className="relative rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-stellar-yes)] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-stellar-yes)]" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider">Live proposal</span>
          </div>
          <span className="text-[10px] font-mono text-[var(--muted)]">
            PRV #{proposal.id.toString().padStart(3, "0")}
          </span>
        </div>

        <div className="p-5 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold leading-snug mb-2 pr-2">
            {proposal.title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-5">
            {proposal.description}
          </p>

          <div className="mb-6">
            <div className="flex justify-between text-xs text-[var(--muted)] mb-2">
              <span>{proposal.yes_count} yes</span>
              <span>{total} votes</span>
              <span>{proposal.no_count} no</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden flex">
              <div
                className="h-full bg-[var(--color-stellar-yes)] transition-all duration-700"
                style={{ width: `${yesPercent}%` }}
              />
              <div
                className="h-full bg-[var(--color-stellar-no)] transition-all duration-700"
                style={{ width: `${noPercent}%` }}
              />
            </div>
            <p className="text-center text-xs text-[var(--muted)] mt-2 tabular-nums">
              {yesPercent}% approve · {noPercent}% reject
            </p>
          </div>

          <p className="text-[11px] uppercase tracking-widest text-[var(--muted)] mb-3 text-center">
            Cast your anonymous vote
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={voteHref}
              onMouseEnter={() => setHover("yes")}
              onMouseLeave={() => setHover(null)}
              className={`landing-vote-btn landing-vote-btn--yes ${
                hover === "yes" ? "landing-vote-btn--active-yes" : ""
              }`}
            >
              <span className="text-lg font-semibold">Yes</span>
              <span className="text-[11px] opacity-80">Support</span>
            </Link>
            <Link
              href={voteHref}
              onMouseEnter={() => setHover("no")}
              onMouseLeave={() => setHover(null)}
              className={`landing-vote-btn landing-vote-btn--no ${
                hover === "no" ? "landing-vote-btn--active-no" : ""
              }`}
            >
              <span className="text-lg font-semibold">No</span>
              <span className="text-[11px] opacity-80">Reject</span>
            </Link>
          </div>

          <p className="text-[11px] text-center text-[var(--muted)] mt-4 leading-relaxed">
            Opens the full ZK voting flow — connect wallet, generate proof, vote privately
          </p>
        </div>

        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--background)] flex items-center justify-between text-[10px] text-[var(--muted)]">
          <span>Groth16 · Soroban testnet</span>
          <Link href={voteHref} className="text-[var(--foreground)] hover:underline font-medium">
            Full details →
          </Link>
        </div>
      </div>
    </div>
  );
}
