/**
 * stellar.ts
 * Soroban contract interaction layer.
 * Handles reading proposals and submitting votes via Freighter.
 */

import * as StellarSdk from "@stellar/stellar-sdk";
import type { Proposal } from "@/lib/types/proposal";

export type { Proposal } from "@/lib/types/proposal";

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || "";
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK === "mainnet"
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;
const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://soroban-testnet.stellar.org";
const RELAYER_SECRET = process.env.NEXT_PUBLIC_RELAYER_SECRET || "";
const DEFAULT_ROOT = process.env.NEXT_PUBLIC_MERKLE_ROOT || "";
const SIM_SOURCE =
  process.env.NEXT_PUBLIC_RELAYER_PUBLIC ||
  "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getRpc() {
  return new StellarSdk.rpc.Server(RPC_URL);
}

function getContract() {
  return new StellarSdk.Contract(CONTRACT_ID);
}

/** Decode a Soroban ScVal struct into a plain Proposal object */
function decodeProposal(scval: StellarSdk.xdr.ScVal): Proposal {
  const map = scval.map();
  if (!map) throw new Error("Expected map ScVal");

  const get = (key: string): StellarSdk.xdr.ScVal => {
    const entry = map.find(
      (e) => e.key().sym()?.toString() === key
    );
    if (!entry) throw new Error(`Missing key: ${key}`);
    return entry.val();
  };

  let merkleRoot: string | undefined;
  try {
    const rootEntry = map.find((e) => e.key().sym()?.toString() === "merkle_root");
    if (rootEntry) merkleRoot = Buffer.from(rootEntry.val().bytes()).toString("hex");
  } catch {
    /* older proposals without a root field */
  }

  return {
    id: Number(get("id").u32()),
    title: get("title").str()?.toString() || "",
    description: get("description").str()?.toString() || "",
    yes_count: Number(get("yes_count").u32()),
    no_count: Number(get("no_count").u32()),
    end_time: Number(get("end_time").u64()),
    is_active: get("is_active").b() || false,
    merkleRoot,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Read Functions
// ─────────────────────────────────────────────────────────────────────────────

export async function getProposalCount(): Promise<number> {
  if (!CONTRACT_ID) return MOCK_PROPOSALS.length;
  try {
    const rpc = getRpc();
    const contract = getContract();
    const result = await rpc.simulateTransaction(
      new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(SIM_SOURCE, "0"),
        { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
      )
        .addOperation(contract.call("get_proposal_count"))
        .setTimeout(30)
        .build()
    );
    if (StellarSdk.rpc.Api.isSimulationSuccess(result)) {
      return Number(StellarSdk.scValToNative(result.result!.retval));
    }
  } catch {
    /* fall through to mock */
  }
  return MOCK_PROPOSALS.length;
}

export async function getProposal(id: number): Promise<Proposal | null> {
  if (!CONTRACT_ID) return MOCK_PROPOSALS[id] || null;
  try {
    const rpc = getRpc();
    const contract = getContract();
    const result = await rpc.simulateTransaction(
      new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(SIM_SOURCE, "0"),
        { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
      )
        .addOperation(
          contract.call("get_proposal", StellarSdk.nativeToScVal(id, { type: "u32" }))
        )
        .setTimeout(30)
        .build()
    );
    if (StellarSdk.rpc.Api.isSimulationSuccess(result)) {
      const val = result.result!.retval;
      if (val.switch().name === "scvVoid") return null;
      return decodeProposal(val.vec()![0]);
    }
  } catch {
    /* fall through to mock */
  }
  return MOCK_PROPOSALS[id] || null;
}

export async function getAllProposals(): Promise<Proposal[]> {
  if (!CONTRACT_ID) return [...MOCK_PROPOSALS];
  try {
    const count = await getProposalCount();
    const proposals: Proposal[] = [];
    for (let i = 0; i < count; i++) {
      const p = await getProposal(i);
      if (p) proposals.push(p);
    }
    return proposals;
  } catch {
    return [...MOCK_PROPOSALS];
  }
}

/**
 * Normalize a nullifier supplied as either a decimal field element (as shown
 * on the success screen) or a hex string into a 32-byte big-endian buffer
 * matching the on-chain storage key.
 */
function normalizeNullifier(input: string): Buffer {
  const s = input.trim();
  let hex: string;
  if (/^0x/i.test(s) || /[a-f]/i.test(s)) {
    hex = s.replace(/^0x/i, "");
  } else {
    hex = BigInt(s).toString(16);
  }
  return Buffer.from(hex.padStart(64, "0"), "hex");
}

/** Convert a field element (decimal or hex) into a 32-byte big-endian buffer. */
function fieldToBytes32(input: string): Buffer {
  return normalizeNullifier(input);
}

export async function isNullifierUsed(
  nullifier: string,
  proposalId: number
): Promise<boolean> {
  if (!CONTRACT_ID) return false;
  try {
    const rpc = getRpc();
    const contract = getContract();
    const nullifierBytes = StellarSdk.nativeToScVal(
      normalizeNullifier(nullifier),
      { type: "bytes" }
    );
    const result = await rpc.simulateTransaction(
      new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(SIM_SOURCE, "0"),
        { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
      )
        .addOperation(
          contract.call(
            "is_nullifier_used",
            nullifierBytes,
            StellarSdk.nativeToScVal(proposalId, { type: "u32" })
          )
        )
        .setTimeout(30)
        .build()
    );
    if (StellarSdk.rpc.Api.isSimulationSuccess(result)) {
      return Boolean(StellarSdk.scValToNative(result.result!.retval));
    }
  } catch {
    /* ignore */
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Write Functions (require Freighter signing)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cast a FULLY ANONYMOUS vote. The transaction is signed and paid for by a
 * shared relayer account, so no voter wallet is ever recorded on-chain — the
 * vote is linked only to its anonymous nullifier. The choice itself stays
 * hidden inside the zero-knowledge proof.
 */
export async function castVote(params: {
  proofA: string;
  proofB: string;
  proofC: string;
  nullifierHex: string;
  vote: number;
  proposalId: number;
}): Promise<string> {
  if (!RELAYER_SECRET) {
    throw new Error("Relayer is not configured (NEXT_PUBLIC_RELAYER_SECRET).");
  }

  const rpc = getRpc();
  const contract = getContract();
  const relayer = StellarSdk.Keypair.fromSecret(RELAYER_SECRET);
  const account = await rpc.getAccount(relayer.publicKey());

  const nullifierBuf = Buffer.from(params.nullifierHex.padStart(64, "0"), "hex");
  const proofABuf = Buffer.from(params.proofA, "hex"); // G1, 96 bytes
  const proofBBuf = Buffer.from(params.proofB, "hex"); // G2, 192 bytes
  const proofCBuf = Buffer.from(params.proofC, "hex"); // G1, 96 bytes

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "10000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "cast_vote",
        StellarSdk.nativeToScVal(proofABuf, { type: "bytes" }),
        StellarSdk.nativeToScVal(proofBBuf, { type: "bytes" }),
        StellarSdk.nativeToScVal(proofCBuf, { type: "bytes" }),
        StellarSdk.nativeToScVal(nullifierBuf, { type: "bytes" }),
        StellarSdk.nativeToScVal(params.vote, { type: "u32" }),
        StellarSdk.nativeToScVal(params.proposalId, { type: "u32" })
      )
    )
    .setTimeout(30)
    .build();

  const simResult = await rpc.simulateTransaction(tx);
  if (!StellarSdk.rpc.Api.isSimulationSuccess(simResult)) {
    throw new Error(`Simulation failed: ${JSON.stringify(simResult)}`);
  }
  const preparedTx = StellarSdk.rpc.assembleTransaction(tx, simResult).build();

  // The relayer signs — not the voter. This is the heart of vote privacy.
  preparedTx.sign(relayer);

  const submitResult = await rpc.sendTransaction(preparedTx);
  if (submitResult.status === "ERROR") {
    throw new Error(`Transaction failed: ${JSON.stringify(submitResult.errorResult)}`);
  }

  let getResult = await rpc.getTransaction(submitResult.hash);
  let retries = 0;
  while (getResult.status === "NOT_FOUND" && retries < 20) {
    await new Promise((r) => setTimeout(r, 1000));
    getResult = await rpc.getTransaction(submitResult.hash);
    retries++;
  }

  if (getResult.status !== "SUCCESS") {
    throw new Error(`Transaction ${submitResult.hash} did not confirm`);
  }

  return submitResult.hash;
}

/**
 * Create a new proposal. Caller must be the admin or an authorized proposer
 * on-chain. Signed via Freighter by the connected wallet.
 */
export async function createProposal(params: {
  walletAddress: string;
  title: string;
  description: string;
  durationSeconds: number;
  merkleRoot?: string; // defaults to the platform snapshot root
}): Promise<number> {
  const contract = getContract();
  const root = fieldToBytes32(params.merkleRoot || DEFAULT_ROOT);
  const retval = await signAndSend(
    params.walletAddress,
    contract.call(
      "create_proposal",
      StellarSdk.nativeToScVal(params.walletAddress, { type: "address" }),
      StellarSdk.nativeToScVal(params.title, { type: "string" }),
      StellarSdk.nativeToScVal(params.description, { type: "string" }),
      StellarSdk.nativeToScVal(params.durationSeconds, { type: "u64" }),
      StellarSdk.nativeToScVal(root, { type: "bytes" })
    )
  );
  try {
    return retval ? Number(StellarSdk.scValToNative(retval)) : -1;
  } catch {
    return -1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Curated submissions
// ─────────────────────────────────────────────────────────────────────────────

export interface Submission {
  id: number;
  proposer: string;
  title: string;
  description: string;
  durationSeconds: number;
  merkleRoot?: string;
  status: "Pending" | "Approved" | "Rejected";
  proposalId: number;
}

/** Sign a single contract operation with Freighter and wait for confirmation. */
async function signAndSend(
  walletAddress: string,
  op: StellarSdk.xdr.Operation
): Promise<StellarSdk.xdr.ScVal | null> {
  const { signTransaction } = await import("@stellar/freighter-api");
  const rpc = getRpc();
  const account = await rpc.getAccount(walletAddress);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simResult = await rpc.simulateTransaction(tx);
  if (!StellarSdk.rpc.Api.isSimulationSuccess(simResult)) {
    throw new Error(`Simulation failed: ${JSON.stringify(simResult)}`);
  }
  const preparedTx = StellarSdk.rpc.assembleTransaction(tx, simResult).build();

  const { signedTxXdr } = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const submitResult = await rpc.sendTransaction(
    StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
  );
  if (submitResult.status === "ERROR") {
    throw new Error(`Transaction failed: ${submitResult.errorResult}`);
  }

  let getResult = await rpc.getTransaction(submitResult.hash);
  let retries = 0;
  while (getResult.status === "NOT_FOUND" && retries < 20) {
    await new Promise((r) => setTimeout(r, 1000));
    getResult = await rpc.getTransaction(submitResult.hash);
    retries++;
  }
  if (getResult.status !== "SUCCESS") {
    throw new Error(`Transaction ${submitResult.hash} did not confirm`);
  }
  return getResult.returnValue ?? null;
}

export async function submitProposal(params: {
  walletAddress: string;
  title: string;
  description: string;
  durationSeconds: number;
  merkleRoot?: string; // defaults to the platform snapshot root
}): Promise<number> {
  const contract = getContract();
  const root = fieldToBytes32(params.merkleRoot || DEFAULT_ROOT);
  const retval = await signAndSend(
    params.walletAddress,
    contract.call(
      "submit_proposal",
      StellarSdk.nativeToScVal(params.walletAddress, { type: "address" }),
      StellarSdk.nativeToScVal(params.title, { type: "string" }),
      StellarSdk.nativeToScVal(params.description, { type: "string" }),
      StellarSdk.nativeToScVal(params.durationSeconds, { type: "u64" }),
      StellarSdk.nativeToScVal(root, { type: "bytes" })
    )
  );
  try {
    return retval ? Number(StellarSdk.scValToNative(retval)) : -1;
  } catch {
    return -1;
  }
}

export async function approveSubmission(
  walletAddress: string,
  submissionId: number
): Promise<number> {
  const contract = getContract();
  const retval = await signAndSend(
    walletAddress,
    contract.call(
      "approve_submission",
      StellarSdk.nativeToScVal(walletAddress, { type: "address" }),
      StellarSdk.nativeToScVal(submissionId, { type: "u32" })
    )
  );
  try {
    return retval ? Number(StellarSdk.scValToNative(retval)) : -1;
  } catch {
    return -1;
  }
}

export async function rejectSubmission(
  walletAddress: string,
  submissionId: number
): Promise<void> {
  const contract = getContract();
  await signAndSend(
    walletAddress,
    contract.call(
      "reject_submission",
      StellarSdk.nativeToScVal(walletAddress, { type: "address" }),
      StellarSdk.nativeToScVal(submissionId, { type: "u32" })
    )
  );
}

function normalizeStatus(s: unknown): "Pending" | "Approved" | "Rejected" {
  let tag = "";
  if (typeof s === "string") tag = s;
  else if (Array.isArray(s)) tag = String(s[0]);
  else if (s && typeof s === "object" && "tag" in s)
    tag = String((s as { tag: unknown }).tag);
  if (tag === "Approved") return "Approved";
  if (tag === "Rejected") return "Rejected";
  return "Pending";
}

function bytesToHex(value: unknown): string | undefined {
  if (value instanceof Uint8Array) return Buffer.from(value).toString("hex");
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value))
    return (value as Buffer).toString("hex");
  return undefined;
}

async function simulateCall(
  fn: string,
  ...args: StellarSdk.xdr.ScVal[]
): Promise<StellarSdk.xdr.ScVal | null> {
  const rpc = getRpc();
  const contract = getContract();
  const result = await rpc.simulateTransaction(
    new StellarSdk.TransactionBuilder(new StellarSdk.Account(SIM_SOURCE, "0"), {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(fn, ...args))
      .setTimeout(30)
      .build()
  );
  if (StellarSdk.rpc.Api.isSimulationSuccess(result)) {
    return result.result!.retval;
  }
  return null;
}

function decodeSubmission(raw: Record<string, unknown>): Submission {
  return {
    id: Number(raw.id),
    proposer: String(raw.proposer),
    title: String(raw.title),
    description: String(raw.description),
    durationSeconds: Number(raw.duration_seconds),
    merkleRoot: bytesToHex(raw.merkle_root),
    status: normalizeStatus(raw.status),
    proposalId: Number(raw.proposal_id),
  };
}

export async function getAdmin(): Promise<string | null> {
  if (!CONTRACT_ID) return null;
  try {
    const retval = await simulateCall("get_admin");
    if (!retval || retval.switch().name === "scvVoid") return null;
    const native = StellarSdk.scValToNative(retval);
    if (native == null) return null;
    return String(native);
  } catch {
    return null;
  }
}

export async function getSubmissions(): Promise<Submission[]> {
  if (!CONTRACT_ID) {
    throw new Error(
      "Contract not configured. Set NEXT_PUBLIC_CONTRACT_ID in .env.local and restart the server."
    );
  }
  const retval = await simulateCall("get_submissions");
  if (!retval) {
    throw new Error("Could not read submissions from Soroban (simulation failed).");
  }
  const native = StellarSdk.scValToNative(retval);
  if (!Array.isArray(native)) return [];
  return native.map((s) => decodeSubmission(s as Record<string, unknown>));
}

// ─────────────────────────────────────────────────────────────────────────────
// Proof-of-Vote collectibles
// ─────────────────────────────────────────────────────────────────────────────

export interface Collectible {
  tokenId: number;
  proposalId: number;
  title: string;
  mintedAt: number;
  nullifierHex?: string; // which anonymous vote this badge corresponds to
}

/** Fetch the Proof-of-Vote collectible minted for a single nullifier, if any. */
export async function getCollectible(
  nullifierHex: string
): Promise<Collectible | null> {
  if (!CONTRACT_ID || !nullifierHex) return null;
  try {
    const buf = Buffer.from(nullifierHex.padStart(64, "0"), "hex");
    const retval = await simulateCall(
      "get_collectible",
      StellarSdk.nativeToScVal(buf, { type: "bytes" })
    );
    if (!retval || retval.switch().name === "scvVoid") return null;
    const c = StellarSdk.scValToNative(retval) as {
      token_id: number | bigint;
      proposal_id: number | bigint;
      title: string;
      minted_at: number | bigint;
    };
    return {
      tokenId: Number(c.token_id),
      proposalId: Number(c.proposal_id),
      title: c.title,
      mintedAt: Number(c.minted_at),
      nullifierHex,
    };
  } catch {
    return null;
  }
}

/**
 * Assemble the connected user's OWN collection. The client knows the user's
 * snapshot identity locally, so it can compute each nullifier and look up the
 * matching badge — all without ever revealing the wallet on-chain.
 */
export async function getMyCollectibles(
  nullifierHexes: string[]
): Promise<Collectible[]> {
  const results = await Promise.all(nullifierHexes.map((n) => getCollectible(n)));
  return results
    .filter((c): c is Collectible => c !== null)
    .sort((a, b) => b.tokenId - a.tokenId);
}

/** Total number of anonymous Proof-of-Vote collectibles minted platform-wide. */
export async function getTotalCollectibles(): Promise<number> {
  if (!CONTRACT_ID) return 0;
  try {
    const retval = await simulateCall("get_total_collectibles");
    return retval ? Number(StellarSdk.scValToNative(retval)) : 0;
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data (fallback when contract not deployed)
// ─────────────────────────────────────────────────────────────────────────────

const nowSec = () => Math.floor(Date.now() / 1000);

export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 0,
    title: "Allocate 50,000 XLM to Developer Grants",
    description:
      "Fund 10 early-stage projects building on Soroban with 5,000 XLM each. Selection by community vote. Focus areas: DeFi, privacy tools, and identity.",
    yes_count: 142,
    no_count: 31,
    end_time: nowSec() + 60 * 60 * 24 * 2, // 2 days from now
    is_active: true,
  },
  {
    id: 1,
    title: "Adopt ZK Proof Standard for DAO Membership",
    description:
      "Ratify the Poseidon-based Merkle tree commitment scheme as the official Privora eligibility standard. All future snapshots must use this format.",
    yes_count: 89,
    no_count: 12,
    end_time: nowSec() + 60 * 60 * 24 * 5, // 5 days from now
    is_active: true,
  },
  {
    id: 2,
    title: "Protocol Fee: 0.1% on Treasury Withdrawals",
    description:
      "Introduce a 0.1% protocol fee on all treasury disbursements above 1,000 XLM. Fees go into a community reserve multisig controlled by top 5 delegates.",
    yes_count: 55,
    no_count: 78,
    end_time: nowSec() + 60 * 60 * 24 * 1, // 1 day from now
    is_active: true,
  },
  {
    id: 3,
    title: "Expand Snapshot Eligibility to 50 XLM",
    description:
      "Lower the minimum holding requirement from 100 XLM to 50 XLM to increase voter participation. Retroactive to the next snapshot block.",
    yes_count: 201,
    no_count: 44,
    end_time: nowSec() - 60 * 60 * 2, // ended 2h ago
    is_active: false,
  },
];
