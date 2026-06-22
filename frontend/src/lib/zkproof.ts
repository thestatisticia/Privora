/**
 * zkproof.ts
 * Client-side ZK proof generation using snarkjs (Groth16).
 * Runs in the browser — no server required.
 */

export interface ProofInput {
  secretIdentity: string;
  pathElements: string[];
  pathIndices: number[];
  root: string;
  proposalId: number;
  vote: number; // 0 = No, 1 = Yes
}

export interface GeneratedProof {
  proof: object;
  publicSignals: string[];
  nullifier: string;
  // Soroban BLS12-381 uncompressed encodings (hex, no 0x prefix)
  proofA: string; // G1, 96 bytes
  proofB: string; // G2, 192 bytes
  proofC: string; // G1, 96 bytes
}

export type ProofStatus =
  | "idle"
  | "loading_wasm"
  | "generating"
  | "done"
  | "error";

/**
 * Generate a Groth16 ZK proof for the vote circuit.
 * Returns the proof and extracted nullifier.
 */
export async function generateVoteProof(
  input: ProofInput,
  onStatus?: (status: ProofStatus) => void
): Promise<GeneratedProof> {
  onStatus?.("loading_wasm");

  // @ts-ignore
  const snarkjs = await import("snarkjs");

  onStatus?.("generating");

  const circuitInput = {
    secretIdentity: input.secretIdentity,
    pathElements: input.pathElements,
    pathIndices: input.pathIndices.map(String),
    root: input.root,
    proposalId: String(input.proposalId),
    vote: String(input.vote),
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInput,
    "/circuit/circuit_js/circuit.wasm",
    "/circuit/circuit_final.zkey"
  );

  // Public signals order (from circuit): [nullifier, votePublic, root, proposalId, vote]
  // nullifier is output signal at index 0
  const nullifier = publicSignals[0];

  // Serialize proof points into Soroban's BLS12-381 uncompressed encoding.
  const proofA = g1ToHex(proof.pi_a);
  const proofB = g2ToHex(proof.pi_b);
  const proofC = g1ToHex(proof.pi_c);

  onStatus?.("done");

  return { proof, publicSignals, nullifier, proofA, proofB, proofC };
}

/** Big-endian 48-byte (Fp) hex for a BLS12-381 base-field element. */
function be48(dec: string): string {
  return BigInt(dec).toString(16).padStart(96, "0");
}

/** G1 point [x, y, 1] -> 96-byte hex: be(X) || be(Y). */
function g1ToHex(p: string[]): string {
  return be48(p[0]) + be48(p[1]);
}

/**
 * G2 point [[x_c0, x_c1], [y_c0, y_c1], ...] -> 192-byte hex.
 * Soroban expects: be(X_c1) || be(X_c0) || be(Y_c1) || be(Y_c0).
 */
function g2ToHex(p: string[][]): string {
  return be48(p[0][1]) + be48(p[0][0]) + be48(p[1][1]) + be48(p[1][0]);
}

/**
 * Convert a nullifier (decimal string from snarkjs) to a 32-byte hex BytesN<32>
 * compatible with the Soroban contract.
 */
export function nullifierToBytes32(nullifier: string): string {
  return BigInt(nullifier).toString(16).padStart(64, "0");
}
