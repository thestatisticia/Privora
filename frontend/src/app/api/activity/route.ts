import { NextResponse } from "next/server";
import { getCachedProposals } from "@/lib/server/proposals-cache";
import { refreshActivity } from "@/lib/server/activity-tracker";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const proposals = await getCachedProposals();
    const events = await refreshActivity(proposals);
    return NextResponse.json(
      { events },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
