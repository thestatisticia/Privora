import { NextRequest, NextResponse } from "next/server";
import { getMyCollectibles, getTotalCollectibles, getProposalCount } from "@/lib/stellar";
import { getIdentityForAddress, getNullifierFor } from "@/lib/merkle";
import { nullifierToBytes32 } from "@/lib/nullifier";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim();

  try {
    const total = await getTotalCollectibles();

    if (!address) {
      return NextResponse.json(
        { total, collectibles: [], eligible: null },
        { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" } }
      );
    }

    const id = await getIdentityForAddress(address);
    if (!id) {
      return NextResponse.json({ total, collectibles: [], eligible: false });
    }

    const count = await getProposalCount();
    const hexes: string[] = [];
    for (let pid = 0; pid < count; pid++) {
      const nf = await getNullifierFor(id.index, pid);
      if (nf) hexes.push(nullifierToBytes32(nf));
    }
    const collectibles = await getMyCollectibles(hexes);

    return NextResponse.json(
      { total, collectibles, eligible: true },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=20" } }
    );
  } catch {
    return NextResponse.json({ total: 0, collectibles: [], eligible: null }, { status: 500 });
  }
}
