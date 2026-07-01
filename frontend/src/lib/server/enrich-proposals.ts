import type { Proposal } from "@/lib/types/proposal";
import { getVoterCountForRoot } from "@/lib/server/snapshot-registry";

export async function enrichProposal(proposal: Proposal): Promise<Proposal> {
  const root = proposal.merkleRoot;
  const snapshotVoterCount = await getVoterCountForRoot(root);
  return { ...proposal, snapshotVoterCount };
}

export async function enrichProposals(proposals: Proposal[]): Promise<Proposal[]> {
  return Promise.all(proposals.map(enrichProposal));
}
