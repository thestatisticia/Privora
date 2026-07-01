export type ProofStatus =
  | "idle"
  | "loading_wasm"
  | "generating"
  | "done"
  | "error";

export interface ProofInput {
  secretIdentity: string;
  pathElements: string[];
  pathIndices: number[];
  root: string;
  proposalId: number;
  vote: number;
}

export interface GeneratedProof {
  proof: object;
  publicSignals: string[];
  nullifier: string;
  proofA: string;
  proofB: string;
  proofC: string;
}
