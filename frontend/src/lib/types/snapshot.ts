import type { MockIdentity } from "@/lib/merkle";

export interface SnapshotMeta {
  merkleRootDecimal: string;
  merkleRootHex: string;
  voterCount: number;
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
