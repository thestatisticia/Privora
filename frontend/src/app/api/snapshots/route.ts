import { NextResponse } from "next/server";
import { registerSnapshot, getSnapshotMeta } from "@/lib/server/snapshot-registry";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const root = searchParams.get("root");
  if (!root?.trim()) {
    return NextResponse.json({ error: "root required" }, { status: 400 });
  }
  const meta = await getSnapshotMeta(root.trim());
  if (!meta) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(meta);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const merkleRootDecimal = String(body.merkleRootDecimal ?? body.root ?? "");
    const merkleRootHex = String(body.merkleRootHex ?? body.rootHex ?? "");
    const voterCount = Number(body.voterCount);
    const label = body.label ? String(body.label) : undefined;
    const wallets = Array.isArray(body.wallets)
      ? body.wallets.map(String).filter((w: string) => w.startsWith("G"))
      : undefined;

    if (!merkleRootDecimal || !Number.isFinite(voterCount) || voterCount < 1) {
      return NextResponse.json({ error: "Invalid snapshot metadata" }, { status: 400 });
    }

    const meta = await registerSnapshot({
      merkleRootDecimal,
      merkleRootHex: merkleRootHex.replace(/^0x/i, ""),
      voterCount,
      label,
      wallets,
    });
    return NextResponse.json(meta);
  } catch {
    return NextResponse.json({ error: "Failed to register snapshot" }, { status: 500 });
  }
}
