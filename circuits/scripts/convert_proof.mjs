// Converts a snarkjs proof.json + public.json into the Soroban byte encoding
// and prints the values needed to invoke cast_vote.
// Usage: node scripts/convert_proof.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { g1ToHex, g2ToHex } from "./bls_utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blsDir = path.join(__dirname, "..", "bls");

const proof = JSON.parse(fs.readFileSync(path.join(blsDir, "proof.json"), "utf8"));
const pub = JSON.parse(fs.readFileSync(path.join(blsDir, "public.json"), "utf8"));

const aHex = g1ToHex(proof.pi_a);
const bHex = g2ToHex(proof.pi_b);
const cHex = g1ToHex(proof.pi_c);

// publicSignals order: [nullifier, votePublic, root, proposalId, vote]
const nullifierDec = pub[0];
const nullifierHex = BigInt(nullifierDec).toString(16).padStart(64, "0");

const out = {
  proof_a: aHex,
  proof_b: bHex,
  proof_c: cHex,
  nullifier: nullifierHex,
  publicSignals: pub,
};
fs.writeFileSync(path.join(blsDir, "soroban_proof.json"), JSON.stringify(out, null, 2));

console.log("proof_a   (96b):", aHex);
console.log("proof_b  (192b):", bHex);
console.log("proof_c   (96b):", cHex);
console.log("nullifier (32b):", nullifierHex);
console.log("publicSignals  :", JSON.stringify(pub));
