import { getCachedProposals } from "@/lib/server/proposals-cache";
import { enrichProposals } from "@/lib/server/enrich-proposals";
import ProposalsClient from "./ProposalsClient";

export default async function ProposalsPage() {
  const proposals = await enrichProposals(await getCachedProposals());
  return <ProposalsClient initialProposals={proposals} />;
}
