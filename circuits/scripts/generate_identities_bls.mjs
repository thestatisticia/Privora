// Generates 16 voter identities and a depth-4 Merkle tree over the BLS12-381
// field (matching the circuit compiled with `-p bls12381`).
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildPoseidonBls } from "./poseidon_bls.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEPTH = 4;
const NUM = 16;

function toHex32(decStr) {
  return BigInt(decStr).toString(16).padStart(64, "0");
}

async function main() {
  const poseidon = await buildPoseidonBls();
  const F = poseidon.F;

  const identities = [];
  for (let i = 0; i < NUM; i++) {
    const secret = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
    const leaf = F.toString(poseidon([secret]));
    identities.push({
      index: i,
      secretIdentity: secret.toString(),
      secretIdentityHex: "0x" + secret.toString(16).padStart(62, "0"),
      leaf,
    });
  }

  // Build the tree (pad to 2^DEPTH leaves with zeros).
  let level = identities.map((id) => BigInt(id.leaf));
  while (level.length < 2 ** DEPTH) level.push(0n);
  const levels = [level.map(String)];
  for (let d = 0; d < DEPTH; d++) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(BigInt(F.toString(poseidon([level[i], level[i + 1] ?? 0n]))));
    }
    level = next;
    levels.push(next.map(String));
  }
  const root = level[0].toString();

  const withProofs = identities.map((id, leafIndex) => {
    const pathElements = [];
    const pathIndices = [];
    let idx = leafIndex;
    for (let d = 0; d < DEPTH; d++) {
      const isRight = idx % 2 === 1;
      const sibling = isRight ? idx - 1 : idx + 1;
      pathIndices.push(isRight ? 1 : 0);
      pathElements.push((BigInt(levels[d][sibling] ?? "0")).toString());
      idx = Math.floor(idx / 2);
    }
    return { ...id, merkleProof: { pathElements, pathIndices, root } };
  });

  const outDir = path.join(__dirname, "..", "output");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "mock_identities_bls.json"),
    JSON.stringify(withProofs, null, 2)
  );
  fs.writeFileSync(
    path.join(outDir, "merkle_root_bls.json"),
    JSON.stringify({ root, rootHex: toHex32(root), depth: DEPTH }, null, 2)
  );

  const fePub = path.join(__dirname, "..", "..", "frontend", "public");
  fs.mkdirSync(fePub, { recursive: true });
  fs.writeFileSync(
    path.join(fePub, "mock_identities.json"),
    JSON.stringify(withProofs, null, 2)
  );
  fs.writeFileSync(
    path.join(fePub, "merkle_root.json"),
    JSON.stringify({ root, depth: DEPTH }, null, 2)
  );

  console.log("Merkle root (dec):", root);
  console.log("Merkle root (hex):", toHex32(root));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
