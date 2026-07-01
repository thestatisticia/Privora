import { NextResponse } from "next/server";
import { getCachedProposals } from "@/lib/server/proposals-cache";
import { enrichProposals } from "@/lib/server/enrich-proposals";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const proposals = await enrichProposals(await getCachedProposals());
    return NextResponse.json(proposals, {
      headers: {
        "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
