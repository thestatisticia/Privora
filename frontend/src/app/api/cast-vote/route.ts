import { NextResponse } from "next/server";
import { relayVote } from "@/lib/server/relay-vote";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const proofA = String(body.proofA ?? "");
    const proofB = String(body.proofB ?? "");
    const proofC = String(body.proofC ?? "");
    const nullifierHex = String(body.nullifierHex ?? "");
    const vote = Number(body.vote);
    const proposalId = Number(body.proposalId);

    const txHash = await relayVote({
      proofA,
      proofB,
      proofC,
      nullifierHex,
      vote,
      proposalId,
    });

    return NextResponse.json({ txHash });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Relay failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
