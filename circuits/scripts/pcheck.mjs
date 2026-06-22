import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildPoseidonBls } from "./poseidon_bls.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ids = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "output", "mock_identities_bls.json"), "utf8")
);
const secret = ids[0].secretIdentity;

// emit input
fs.writeFileSync(
  path.join(__dirname, "..", "pcheck_input.json"),
  JSON.stringify({ a: secret, b: "0" })
);

const poseidon = await buildPoseidonBls();
const F = poseidon.F;
console.log("JS h1 (leaf)     :", F.toString(poseidon([BigInt(secret)])));
console.log("JS h2 (poseidon2):", F.toString(poseidon([BigInt(secret), 0n])));
console.log("stored leaf[0]   :", ids[0].leaf);
