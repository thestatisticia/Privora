import { getCachedProposals } from "@/lib/server/proposals-cache";
import { enrichProposals } from "@/lib/server/enrich-proposals";
import ProposalsClient from "./ProposalsClient";

export default async function ProposalsPage() {
  const raw = await getCachedProposals();
  const proposals = await enrichProposals(raw).catch(() => raw);
  return <ProposalsClient initialProposals={proposals} />;
}
