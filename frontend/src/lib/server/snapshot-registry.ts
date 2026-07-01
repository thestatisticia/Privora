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

async function ensureRegistry(): Promise<Registry> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(REGISTRY_FILE, "utf8");
    return JSON.parse(raw) as Registry;
  } catch {
    const initial: Registry = {
      [normalizeRootToDecimal(PLATFORM_SNAPSHOT.merkleRootDecimal)]: PLATFORM_SNAPSHOT,
    };
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(REGISTRY_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

async function saveRegistry(registry: Registry) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2));
}

export async function registerSnapshot(meta: Omit<SnapshotMeta, "createdAt">): Promise<SnapshotMeta> {
  const registry = await ensureRegistry();
  const key = normalizeRootToDecimal(meta.merkleRootDecimal);
  const entry: SnapshotMeta = {
    ...meta,
    merkleRootDecimal: key,
    merkleRootHex: meta.merkleRootHex.replace(/^0x/i, "").padStart(64, "0"),
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
  const meta = await getSnapshotMeta(root);
  return meta?.voterCount ?? null;
}
