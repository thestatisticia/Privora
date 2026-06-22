import { Proposal } from "@/lib/stellar";

export function isProposalActive(proposal: Proposal): boolean {
  return proposal.is_active && Math.floor(Date.now() / 1000) < proposal.end_time;
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
