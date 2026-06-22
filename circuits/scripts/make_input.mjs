// Emits a circuit input file for a given identity index / proposal / vote.
// Usage: node scripts/make_input.mjs <identityIndex> <proposalId> <vote>
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [, , idxArg = "0", pidArg = "0", voteArg = "1"] = process.argv;

const ids = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "output", "mock_identities_bls.json"), "utf8")
);
const id = ids[Number(idxArg)];

const input = {
  secretIdentity: id.secretIdentity,
  pathElements: id.merkleProof.pathElements,
  pathIndices: id.merkleProof.pathIndices.map(String),
  root: id.merkleProof.root,
  proposalId: String(pidArg),
  vote: String(voteArg),
};

const dest = path.join(__dirname, "..", "bls", "input.json");
fs.writeFileSync(dest, JSON.stringify(input, null, 2));
console.log("Wrote", dest, "for identity", idxArg);
