import type { Proposal } from "@/lib/types/proposal";
import { getVoterCountForRoot, PLATFORM_SNAPSHOT } from "@/lib/server/snapshot-registry";
import { isPlatformRoot } from "@/lib/snapshot-builder";

export async function enrichProposal(proposal: Proposal): Promise<Proposal> {
  try {
    const snapshotVoterCount = await getVoterCountForRoot(proposal.merkleRoot);
    return { ...proposal, snapshotVoterCount };
  } catch {
    return {
      ...proposal,
      snapshotVoterCount: isPlatformRoot(proposal.merkleRoot)
        ? PLATFORM_SNAPSHOT.voterCount
        : null,
    };
  }
}

export async function enrichProposals(proposals: Proposal[]): Promise<Proposal[]> {
  return Promise.all(proposals.map(enrichProposal));
}
