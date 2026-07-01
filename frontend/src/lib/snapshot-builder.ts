/**
 * Client-side Poseidon Merkle snapshot builder (depth 4, max 16 voters).
 * Matches circuits/circuit.circom and generate_mock_identities.js.
 */

import type { MockIdentity } from "@/lib/merkle";
import type { BuiltSnapshot } from "@/lib/types/snapshot";

export const SNAPSHOT_DEPTH = 4;
export const SNAPSHOT_MAX_VOTERS = 16;

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

export const PLATFORM_ROOT_DECIMAL =
  "22889593495014049417157895632155058930916541121165646947370585817827020662216";

export function isPlatformRoot(root: string | undefined): boolean {
  if (!root) return true;
  return rootsMatch(root, PLATFORM_ROOT_DECIMAL);
}

const BN128_FIELD = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

/** Deterministic secret per wallet — same address always yields the same leaf. */
function walletToField(wallet: string): bigint {
  let v = BigInt(0);
  for (let i = 0; i < wallet.length; i++) {
    v = (v * BigInt(131) + BigInt(wallet.charCodeAt(i))) % BN128_FIELD;
  }
  return v;
}

async function deriveSecretForWallet(wallet: string): Promise<bigint> {
  const { buildPoseidon } = await import("circomlibjs");
  const poseidon = await buildPoseidon();
  const F = poseidon.F;
  const w = walletToField(wallet);
  return BigInt(F.toString(poseidon([w])));
}

/**
 * Build a Merkle snapshot from Stellar wallet addresses.
 * Secrets are derived from each wallet so voters only need to connect Freighter.
 */
export async function buildSnapshotFromWallets(wallets: string[]): Promise<BuiltSnapshot> {
  if (wallets.length === 0) {
    throw new Error("Add at least one wallet address.");
  }
  if (wallets.length > SNAPSHOT_MAX_VOTERS) {
    throw new Error(`Maximum ${SNAPSHOT_MAX_VOTERS} voters per snapshot.`);
  }

  const { buildPoseidon } = await import("circomlibjs");
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  const identities: Omit<MockIdentity, "merkleProof">[] = await Promise.all(
    wallets.map(async (wallet, index) => {
      const secretIdentity = await deriveSecretForWallet(wallet);
      const leafRaw = poseidon([secretIdentity]);
      const leaf = F.toString(leafRaw);
      return {
        index,
        label: wallet,
        secretIdentity: secretIdentity.toString(),
        secretIdentityHex: `0x${secretIdentity.toString(16).padStart(62, "0")}`,
        leaf,
      };
    })
  );

  return finishSnapshot(identities, poseidon, F);
}

/** @deprecated Use buildSnapshotFromWallets — kept for one-per-line text input */
export async function buildSnapshotFromLabels(labelsText: string): Promise<BuiltSnapshot> {
  const labels = parseVoterLines(labelsText);
  return buildSnapshotFromWallets(labels);
}

async function finishSnapshot(
  identities: Omit<MockIdentity, "merkleProof">[],
  poseidon: Awaited<ReturnType<typeof import("circomlibjs")["buildPoseidon"]>>,
  F: { toString: (n: unknown) => string }
): Promise<BuiltSnapshot> {
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
    voterCount: identities.length,
    identities: identitiesWithProofs,
  };
}

/** Resolve a connected wallet to its snapshot identity (rebuilds tree client-side). */
export async function resolveWalletInSnapshot(
  wallet: string,
  wallets: string[],
  expectedRoot?: string
): Promise<MockIdentity | null> {
  if (!wallets.includes(wallet)) return null;
  const snapshot = await buildSnapshotFromWallets(wallets);
  const identity = snapshot.identities.find((i) => i.label === wallet) ?? null;
  if (!identity) return null;
  if (expectedRoot && !rootsMatch(identity.merkleProof.root, expectedRoot)) return null;
  return identity;
}

/** Poseidon(secretIdentity, proposalId) — for custom-snapshot vote checks. */
export async function computeNullifier(
  secretIdentity: string,
  proposalId: number
): Promise<string> {
  const { buildPoseidon } = await import("circomlibjs");
  const poseidon = await buildPoseidon();
  const F = poseidon.F;
  const nf = poseidon([BigInt(secretIdentity), BigInt(proposalId)]);
  return F.toString(nf);
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
