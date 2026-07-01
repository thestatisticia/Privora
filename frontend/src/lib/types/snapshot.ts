import type { MockIdentity } from "@/lib/merkle";

export interface SnapshotMeta {
  merkleRootDecimal: string;
  merkleRootHex: string;
  voterCount: number;
  /** Public Stellar addresses in this snapshot — used for connect-wallet eligibility. */
  wallets?: string[];
  label?: string;
  createdAt: string;
}

export interface BuiltSnapshot {
  root: string;
  rootHex: string;
  depth: number;
  voterCount: number;
  identities: MockIdentity[];
}
