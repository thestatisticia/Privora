/**
 * Server-only vote relay — relayer secret never ships to the browser.
 */

import * as StellarSdk from "@stellar/stellar-sdk";

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || "";
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK === "mainnet"
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;
const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";
const RELAYER_SECRET =
  process.env.RELAYER_SECRET || process.env.NEXT_PUBLIC_RELAYER_SECRET || "";

export type RelayVoteParams = {
  proofA: string;
  proofB: string;
  proofC: string;
  nullifierHex: string;
  vote: number;
  proposalId: number;
};

function assertHex(label: string, value: string, bytes: number) {
  const hex = value.replace(/^0x/i, "");
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length !== bytes * 2) {
    throw new Error(`Invalid ${label}`);
  }
  return hex;
}

export async function relayVote(params: RelayVoteParams): Promise<string> {
  if (!CONTRACT_ID) {
    throw new Error("Contract not configured");
  }
  if (!RELAYER_SECRET) {
    throw new Error("RELAYER_SECRET is not configured on the server");
  }
  if (params.vote !== 0 && params.vote !== 1) {
    throw new Error("Invalid vote");
  }
  if (!Number.isInteger(params.proposalId) || params.proposalId < 0) {
    throw new Error("Invalid proposal id");
  }

  const proofA = assertHex("proofA", params.proofA, 96);
  const proofB = assertHex("proofB", params.proofB, 192);
  const proofC = assertHex("proofC", params.proofC, 96);
  const nullifierHex = assertHex("nullifier", params.nullifierHex, 32);

  const rpc = new StellarSdk.rpc.Server(RPC_URL);
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  const relayer = StellarSdk.Keypair.fromSecret(RELAYER_SECRET);
  const account = await rpc.getAccount(relayer.publicKey());

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "10000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "cast_vote",
        StellarSdk.nativeToScVal(Buffer.from(proofA, "hex"), { type: "bytes" }),
        StellarSdk.nativeToScVal(Buffer.from(proofB, "hex"), { type: "bytes" }),
        StellarSdk.nativeToScVal(Buffer.from(proofC, "hex"), { type: "bytes" }),
        StellarSdk.nativeToScVal(Buffer.from(nullifierHex, "hex"), { type: "bytes" }),
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
