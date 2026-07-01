import { NextResponse } from "next/server";
import { isNullifierUsed } from "@/lib/stellar";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const nullifier = searchParams.get("nullifier");
  const proposalId = Number(searchParams.get("proposalId") ?? "0");
  if (!nullifier?.trim()) {
    return NextResponse.json({ error: "nullifier required" }, { status: 400 });
  }
  try {
    const used = await isNullifierUsed(nullifier.trim(), proposalId);
    return NextResponse.json({ used });
  } catch {
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
