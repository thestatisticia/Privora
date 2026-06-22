// Precompute nullifiers = Poseidon(secretIdentity, proposalId) for every
// snapshot identity and proposal id 0..MAX, so the frontend can detect
// "already voted" without generating a full proof.
//
// Usage: node scripts/gen_nullifiers.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildPoseidonBls } from "./poseidon_bls.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const idsPath = path.join(__dirname, "..", "..", "frontend", "public", "mock_identities.json");
const outPath = path.join(__dirname, "..", "..", "frontend", "public", "nullifiers.json");

const MAX_PROPOSAL = 49;

const ids = JSON.parse(fs.readFileSync(idsPath, "utf8"));
const poseidon = await buildPoseidonBls();
const F = poseidon.F;

const table = ids.map((id) => {
  const row = [];
  for (let pid = 0; pid <= MAX_PROPOSAL; pid++) {
    const h = poseidon([id.secretIdentity, String(pid)]);
    row.push(F.toObject(h).toString());
  }
  return row;
});

fs.writeFileSync(outPath, JSON.stringify(table));
console.log(`Wrote ${outPath} (${table.length} identities x ${MAX_PROPOSAL + 1} proposals)`);
