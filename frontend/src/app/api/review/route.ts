import { NextResponse } from "next/server";
import { getAdmin, getSubmissions } from "@/lib/stellar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [submissions, chainAdmin] = await Promise.all([getSubmissions(), getAdmin()]);
    return NextResponse.json(
      { submissions, chainAdmin },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load review queue";
    return NextResponse.json({ submissions: [], chainAdmin: null, error: message }, { status: 500 });
  }
}
