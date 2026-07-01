import { NextResponse } from "next/server";
import { getProposal } from "@/lib/stellar";
import { getCachedProposals } from "@/lib/server/proposals-cache";
import { enrichProposal } from "@/lib/server/enrich-proposals";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const proposalId = Number(id);
  if (!Number.isFinite(proposalId) || proposalId < 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const cached = await getCachedProposals();
    const hit = cached.find((p) => p.id === proposalId);
    const proposal = hit ?? (await getProposal(proposalId));
    if (!proposal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = await enrichProposal(proposal).catch(() => proposal);
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load proposal" }, { status: 500 });
  }
}
