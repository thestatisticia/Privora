import { unstable_cache } from "next/cache";
import { getAllProposals } from "@/lib/stellar";

/** Cached Soroban proposal list — avoids N+1 RPC on every navigation. */
export const getCachedProposals = unstable_cache(
  async () => getAllProposals(),
  ["privora-proposals"],
  { revalidate: 20, tags: ["proposals"] }
);
