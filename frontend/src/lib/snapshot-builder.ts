/**
 * Client-side Poseidon Merkle snapshot builder (depth 4, max 16 voters).
 * Matches circuits/circuit.circom and generate_mock_identities.js.
 */

import type { MockIdentity } from "@/lib/merkle";
import type { BuiltSnapshot } from "@/lib/types/snapshot";

export const SNAPSHOT_DEPTH = 4;
export const SNAPSHOT_MAX_VOTERS = 16;

function randomFieldElement(): bigint {
  const bytes = new Uint8Array(31);
  crypto.getRandomValues(bytes);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return BigInt(`0x${hex}`);
}

function rootToHex(rootDecimal: string): string {
  return BigInt(rootDecimal).toString(16).padStart(64, "0");
}

/** Normalize hex or decimal Merkle roots for comparison. */
export function normalizeRootToDecimal(root: string): string {
  const s = root.trim();
  if (/^\d+$/.test(s)) return s;
  const hex = s.replace(/^0x/i, "");
  if (/^[0-9a-f]+$/i.test(hex)) return BigInt(`0x${hex}`).toString();
  return s;
}

export function rootsMatch(a: string, b: string): boolean {
  try {
    return normalizeRootToDecimal(a) === normalizeRootToDecimal(b);
  } catch {
    return false;
  }
}

function parseVoterLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, SNAPSHOT_MAX_VOTERS);
}

/**
 * Build a voter snapshot from one label per line (wallet, email, or name).
 * Secrets are generated locally — distribute the exported JSON to voters.
 */
export async function buildSnapshotFromLabels(labelsText: string): Promise<BuiltSnapshot> {
  const labels = parseVoterLines(labelsText);
  if (labels.length === 0) {
    throw new Error("Add at least one voter (one per line).");
  }
  if (labels.length > SNAPSHOT_MAX_VOTERS) {
    throw new Error(`Maximum ${SNAPSHOT_MAX_VOTERS} voters per snapshot.`);
  }

  const { buildPoseidon } = await import("circomlibjs");
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  const identities: Omit<MockIdentity, "merkleProof">[] = labels.map((label, index) => {
    const secretIdentity = randomFieldElement();
    const leafRaw = poseidon([secretIdentity]);
    const leaf = F.toString(leafRaw);
    return {
      index,
      label,
      secretIdentity: secretIdentity.toString(),
      secretIdentityHex: `0x${secretIdentity.toString(16).padStart(62, "0")}`,
      leaf,
    };
  });

  const leaves = identities.map((id) => BigInt(id.leaf));
  let currentLevel = [...leaves];
  while (currentLevel.length < 2 ** SNAPSHOT_DEPTH) {
    currentLevel.push(BigInt(0));
  }

  const levels: bigint[][] = [currentLevel];
  for (let level = 0; level < SNAPSHOT_DEPTH; level++) {
    const nextLevel: bigint[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] ?? BigInt(0);
      const hash = F.toString(poseidon([left, right]));
      nextLevel.push(BigInt(hash));
    }
    currentLevel = nextLevel;
    levels.push(currentLevel);
  }

  const merkleRoot = currentLevel[0].toString();

  const identitiesWithProofs: MockIdentity[] = identities.map((identity, leafIndex) => {
    const pathElements: string[] = [];
    const pathIndices: number[] = [];
    let currentIndex = leafIndex;
    let currentLevelData = levels[0];

    for (let level = 0; level < SNAPSHOT_DEPTH; level++) {
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;
      pathIndices.push(isRight ? 1 : 0);
      pathElements.push((currentLevelData[siblingIndex] ?? BigInt(0)).toString());
      currentIndex = Math.floor(currentIndex / 2);
      currentLevelData = levels[level + 1];
    }

    return {
      ...identity,
      merkleProof: { pathElements, pathIndices, root: merkleRoot },
    };
  });

  return {
    root: merkleRoot,
    rootHex: rootToHex(merkleRoot),
    depth: SNAPSHOT_DEPTH,
    voterCount: labels.length,
    identities: identitiesWithProofs,
  };
}

/** Parse a downloaded voter-credentials bundle into MockIdentity entries. */
export function parseVoterCredentialsJson(raw: unknown): MockIdentity[] {
  if (!raw || typeof raw !== "object") return [];
  const data = raw as {
    voters?: Array<{
      index: number;
      secretIdentity: string;
      merkleProof: MockIdentity["merkleProof"];
    }>;
  };
  if (!Array.isArray(data.voters)) return [];
  return data.voters.map((v) => ({
    index: v.index,
    secretIdentity: v.secretIdentity,
    secretIdentityHex: `0x${BigInt(v.secretIdentity).toString(16).padStart(62, "0")}`,
    leaf: "",
    merkleProof: v.merkleProof,
  }));
}

export function downloadSnapshotBundle(snapshot: BuiltSnapshot, proposalTitle?: string) {
  const slug = (proposalTitle || "privora-snapshot")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  const blob = new Blob(
    [
      JSON.stringify(
        {
          merkleRoot: snapshot.root,
          merkleRootHex: snapshot.rootHex,
          voterCount: snapshot.voterCount,
          voters: snapshot.identities.map((v) => ({
            wallet: v.label ?? null,
            index: v.index,
            secretIdentity: v.secretIdentity,
            merkleProof: v.merkleProof,
          })),
        },
        null,
        2
      ),
    ],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}-voter-credentials.json`;
  a.click();
  URL.revokeObjectURL(url);
}
