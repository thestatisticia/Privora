import type { Proposal } from "@/lib/types/proposal";

export function isProposalActive(proposal: Proposal): boolean {
  return proposal.is_active && Math.floor(Date.now() / 1000) < proposal.end_time;
}

/** Drop past-deadline proposals when newer active rounds exist. */
export function getDisplayProposals(proposals: Proposal[]): Proposal[] {
  const active = proposals.filter(isProposalActive);
  if (active.length > 0) {
    return [...active].sort((a, b) => b.id - a.id);
  }
  return [...proposals].sort((a, b) => b.id - a.id);
}

export function timeRemaining(endTime: number): string {
  const diff = endTime - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatEnds(endTime: number): string {
  return new Date(endTime * 1000).toLocaleString();
}

export function votePercents(proposal: Proposal) {
  const total = proposal.yes_count + proposal.no_count;
  const yesPercent = total > 0 ? Math.round((proposal.yes_count / total) * 100) : 0;
  const noPercent = total > 0 ? 100 - yesPercent : 0;
  return { total, yesPercent, noPercent };
}

export const DEFAULT_QUORUM_PERCENT = 25;

export function turnoutStats(proposal: Proposal, eligible: number | null | undefined) {
  const ballots = proposal.yes_count + proposal.no_count;
  if (!eligible || eligible <= 0) {
    return {
      ballots,
      eligible: null as number | null,
      turnoutPercent: null as number | null,
      quorumPercent: DEFAULT_QUORUM_PERCENT,
      quorumMet: false,
      quorumThreshold: null as number | null,
    };
  }
  const turnoutPercent = Math.round((ballots / eligible) * 1000) / 10;
  const quorumThreshold = Math.ceil(eligible * (DEFAULT_QUORUM_PERCENT / 100));
  const quorumMet = ballots >= quorumThreshold;
  return {
    ballots,
    eligible,
    turnoutPercent,
    quorumPercent: DEFAULT_QUORUM_PERCENT,
    quorumMet,
    quorumThreshold,
  };
}
