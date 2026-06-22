import { NextResponse } from "next/server";
import { getAllProposals } from "@/lib/stellar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const proposals = await getAllProposals();
    return NextResponse.json(proposals, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
