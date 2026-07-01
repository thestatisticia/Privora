/**
 * merkle.ts
 * Client-side Merkle tree helpers for Privora.
 * Uses the same Poseidon-based depth-4 tree as the Circom circuit.
 */

export interface MockIdentity {
  index: number;
  secretIdentity: string;
  secretIdentityHex: string;
  leaf: string;
  label?: string;
  merkleProof: {
    pathElements: string[];
    pathIndices: number[];
    root: string;
  };
}

let _identities: MockIdentity[] | null = null;
let _merkleRoot: string | null = null;

export async function loadMockIdentities(): Promise<MockIdentity[]> {
  if (_identities) return _identities;
  const res = await fetch("/mock_identities.json");
  _identities = await res.json();
  return _identities!;
}

export async function getMerkleRoot(): Promise<string> {
  if (_merkleRoot) return _merkleRoot;
  const res = await fetch("/merkle_root.json");
  const data = await res.json();
  _merkleRoot = data.root;
  return _merkleRoot!;
}

/**
 * Check if a secretIdentity is in the mock snapshot.
 * Returns the identity (with Merkle proof) if found, null otherwise.
 */
export async function findIdentityBySecret(
  secretIdentity: string
): Promise<MockIdentity | null> {
  const identities = await loadMockIdentities();
  return identities.find((id) => id.secretIdentity === secretIdentity) || null;
}

/**
 * Get a random mock identity for demo/judge testing.
 */
export async function getRandomMockIdentity(): Promise<MockIdentity> {
  const identities = await loadMockIdentities();
  const idx = Math.floor(Math.random() * identities.length);
  return identities[idx];
}

/**
 * Look up the snapshot identity for a registered wallet on a specific proposal.
 * Custom snapshots: wallet list from registry + deterministic secrets.
 * Platform snapshot: allowlist + mock_identities.json.
 */
export async function getIdentityForAddress(
  address: string,
  merkleRoot?: string
): Promise<MockIdentity | null> {
  const { isPlatformRoot, resolveWalletInSnapshot } = await import("./snapshot-builder");

  if (merkleRoot && !isPlatformRoot(merkleRoot)) {
    try {
      const q = new URLSearchParams({ root: merkleRoot });
      const res = await fetch(`/api/snapshots?${q}`);
      if (res.ok) {
        const meta = (await res.json()) as { wallets?: string[] };
        if (meta.wallets?.includes(address)) {
          return resolveWalletInSnapshot(address, meta.wallets, merkleRoot);
        }
      }
    } catch {
      /* fall through */
    }
    return null;
  }

  const { findAllowlistEntry } = await import("./allowlist");
  const entry = findAllowlistEntry(address);
  if (!entry) return null;
  const identities = await loadMockIdentities();
  return identities[entry.identityIndex % identities.length];
}

/**
 * Get identity at a specific index (0-15).
 */
export async function getMockIdentityAt(index: number): Promise<MockIdentity> {
  const identities = await loadMockIdentities();
  return identities[index % identities.length];
}

let _nullifiers: string[][] | null = null;

/**
 * Look up the precomputed nullifier (decimal) for an identity + proposal.
 * Used to detect "already voted" without generating a full proof.
 */
export async function getNullifierFor(
  identityIndex: number,
  proposalId: number
): Promise<string | null> {
  if (!_nullifiers) {
    const res = await fetch("/nullifiers.json");
    _nullifiers = await res.json();
  }
  const row = _nullifiers![identityIndex];
  if (!row || proposalId >= row.length) return null;
  return row[proposalId];
}

/**
 * Every possible nullifier (decimal) for a given proposal, one per snapshot
 * identity. Used to build the anonymous "voters" list: checking which of these
 * are recorded on-chain reveals THAT votes happened — never who or how.
 */
export async function getNullifierColumn(proposalId: number): Promise<string[]> {
  if (!_nullifiers) {
    const res = await fetch("/nullifiers.json");
    _nullifiers = await res.json();
  }
  return _nullifiers!
    .map((row) => (proposalId < row.length ? row[proposalId] : null))
    .filter((v): v is string => !!v);
}
