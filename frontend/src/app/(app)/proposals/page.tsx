import { getCachedProposals } from "@/lib/server/proposals-cache";
import { enrichProposals } from "@/lib/server/enrich-proposals";
import { getDisplayProposals } from "@/lib/proposal-utils";
import ProposalsClient from "./ProposalsClient";

export default async function ProposalsPage() {
  const raw = await getCachedProposals();
  const enriched = await enrichProposals(raw).catch(() => raw);
  const proposals = getDisplayProposals(enriched);
  return <ProposalsClient initialProposals={proposals} />;
}
