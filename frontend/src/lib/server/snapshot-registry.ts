import { promises as fs } from "fs";
import path from "path";
import type { SnapshotMeta } from "@/lib/types/snapshot";
import { normalizeRootToDecimal } from "@/lib/snapshot-builder";

const DATA_DIR = path.join(process.cwd(), ".data");
const REGISTRY_FILE = path.join(DATA_DIR, "snapshots.json");

/** Platform demo snapshot — matches public/merkle_root.json */
export const PLATFORM_SNAPSHOT: SnapshotMeta = {
  merkleRootDecimal:
    process.env.NEXT_PUBLIC_MERKLE_ROOT ||
    "22889593495014049417157895632155058930916541121165646947370585817827020662216",
  merkleRootHex:
    "0x" +
    BigInt(
      process.env.NEXT_PUBLIC_MERKLE_ROOT ||
        "22889593495014049417157895632155058930916541121165646947370585817827020662216"
    )
      .toString(16)
      .padStart(64, "0"),
  voterCount: 16,
  label: "Privora platform demo",
  createdAt: "2025-01-01T00:00:00.000Z",
};

type Registry = Record<string, SnapshotMeta>;

function defaultRegistry(): Registry {
  return {
    [normalizeRootToDecimal(PLATFORM_SNAPSHOT.merkleRootDecimal)]: PLATFORM_SNAPSHOT,
  };
}

/** In-memory fallback when Vercel's filesystem is read-only or ephemeral. */
let memoryRegistry: Registry = defaultRegistry();

async function persistRegistry(registry: Registry): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2));
  } catch {
    /* Vercel/serverless — memory only */
  }
}

async function ensureRegistry(): Promise<Registry> {
  try {
    const raw = await fs.readFile(REGISTRY_FILE, "utf8");
    memoryRegistry = JSON.parse(raw) as Registry;
    return memoryRegistry;
  } catch {
    memoryRegistry = defaultRegistry();
    await persistRegistry(memoryRegistry);
    return memoryRegistry;
  }
}

async function saveRegistry(registry: Registry) {
  memoryRegistry = registry;
  await persistRegistry(registry);
}

export async function registerSnapshot(
  meta: Omit<SnapshotMeta, "createdAt"> & { wallets?: string[] }
): Promise<SnapshotMeta> {
  const registry = await ensureRegistry();
  const key = normalizeRootToDecimal(meta.merkleRootDecimal);
  const entry: SnapshotMeta = {
    ...meta,
    merkleRootDecimal: key,
    merkleRootHex: meta.merkleRootHex.replace(/^0x/i, "").padStart(64, "0"),
    wallets: meta.wallets,
    createdAt: new Date().toISOString(),
  };
  registry[key] = entry;
  await saveRegistry(registry);
  return entry;
}

export async function getSnapshotMeta(root: string): Promise<SnapshotMeta | null> {
  const key = normalizeRootToDecimal(root);
  const registry = await ensureRegistry();
  if (registry[key]) return registry[key];
  if (rootsEqual(key, PLATFORM_SNAPSHOT.merkleRootDecimal)) return PLATFORM_SNAPSHOT;
  return null;
}

function rootsEqual(a: string, b: string): boolean {
  try {
    return normalizeRootToDecimal(a) === normalizeRootToDecimal(b);
  } catch {
    return false;
  }
}

export async function getVoterCountForRoot(root: string | undefined): Promise<number | null> {
  if (!root) return PLATFORM_SNAPSHOT.voterCount;
  try {
    const meta = await getSnapshotMeta(root);
    return meta?.voterCount ?? null;
  } catch {
    return rootsEqual(root, PLATFORM_SNAPSHOT.merkleRootDecimal)
      ? PLATFORM_SNAPSHOT.voterCount
      : null;
  }
}
