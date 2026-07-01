import { NextResponse } from "next/server";
import { getCachedProposals } from "@/lib/server/proposals-cache";
import { enrichProposals } from "@/lib/server/enrich-proposals";
import { getDisplayProposals } from "@/lib/proposal-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await getCachedProposals();
    const enriched = await enrichProposals(raw).catch(() => raw);
    const proposals = getDisplayProposals(enriched);
    return NextResponse.json(proposals, {
      headers: {
        "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
