/**
 * generate_mock_identities.js
 * 
 * Generates 16 mock voter identities for the SecretBallot demo.
 * Each identity has a secretIdentity (random bigint) and a Merkle leaf
 * (Poseidon hash of the secretIdentity).
 * 
 * Run: node circuits/scripts/generate_mock_identities.js
 * Output: circuits/output/mock_identities.json, circuits/output/merkle_root.json
 */

const { buildPoseidon } = require("circomlibjs");
const { MerkleTree } = require("merkletreejs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEPTH = 4; // 16 leaves max (2^4)
const NUM_IDENTITIES = 16;

async function main() {
  console.log("🔧 Building Poseidon hash...");
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  console.log(`📝 Generating ${NUM_IDENTITIES} mock identities...`);
  const identities = [];

  for (let i = 0; i < NUM_IDENTITIES; i++) {
    // Random 31-byte secret (fits in field element)
    const secretBytes = crypto.randomBytes(31);
    const secretIdentity = BigInt("0x" + secretBytes.toString("hex"));

    // Leaf = Poseidon(secretIdentity)
    const leafRaw = poseidon([secretIdentity]);
    const leaf = F.toString(leafRaw);

    identities.push({
      index: i,
      secretIdentity: secretIdentity.toString(),
      secretIdentityHex: "0x" + secretIdentity.toString(16).padStart(62, "0"),
      leaf: leaf,
    });

    console.log(`  [${i}] secret: ${secretIdentity.toString().slice(0, 20)}... leaf: ${leaf.slice(0, 20)}...`);
  }

  // Build Merkle tree using keccak for compatibility
  // For ZK, the tree is rebuilt client-side using @zk-kit/incremental-merkle-tree
  const leaves = identities.map((id) => BigInt(id.leaf));

  // Simple depth-4 Merkle tree using Poseidon
  console.log("\n🌳 Building Merkle tree...");
  let currentLevel = [...leaves];

  // Pad to 16
  while (currentLevel.length < 2 ** DEPTH) {
    currentLevel.push(BigInt(0));
  }

  const levels = [currentLevel.map(String)];

  for (let level = 0; level < DEPTH; level++) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || BigInt(0);
      const hash = F.toString(poseidon([left, right]));
      nextLevel.push(BigInt(hash));
    }
    currentLevel = nextLevel;
    levels.push(nextLevel.map(String));
  }

  const merkleRoot = currentLevel[0].toString();
  console.log(`✅ Merkle Root: ${merkleRoot}`);

  // Generate Merkle proofs for each identity
  console.log("\n🔍 Generating Merkle proofs...");
  const identitiesWithProofs = identities.map((identity, leafIndex) => {
    const pathElements = [];
    const pathIndices = [];

    let currentIndex = leafIndex;
    let currentLevelData = levels[0].map(BigInt);

    for (let level = 0; level < DEPTH; level++) {
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;

      pathIndices.push(isRight ? 1 : 0);
      pathElements.push(
        (currentLevelData[siblingIndex] || BigInt(0)).toString()
      );

      currentIndex = Math.floor(currentIndex / 2);
      currentLevelData = levels[level + 1].map(BigInt);
    }

    return {
      ...identity,
      merkleProof: {
        pathElements,
        pathIndices,
        root: merkleRoot,
      },
    };
  });

  // Write outputs
  const outputDir = path.join(__dirname, "..", "output");
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "mock_identities.json"),
    JSON.stringify(identitiesWithProofs, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, "merkle_root.json"),
    JSON.stringify({ root: merkleRoot, depth: DEPTH, leaves: identities.map(id => id.leaf) }, null, 2)
  );

  // Also copy to frontend public dir
  const frontendPublicDir = path.join(__dirname, "..", "..", "frontend", "public");
  fs.mkdirSync(frontendPublicDir, { recursive: true });

  fs.writeFileSync(
    path.join(frontendPublicDir, "mock_identities.json"),
    JSON.stringify(identitiesWithProofs, null, 2)
  );
  fs.writeFileSync(
    path.join(frontendPublicDir, "merkle_root.json"),
    JSON.stringify({ root: merkleRoot, depth: DEPTH }, null, 2)
  );

  console.log("\n✅ Done!");
  console.log(`   → circuits/output/mock_identities.json`);
  console.log(`   → circuits/output/merkle_root.json`);
  console.log(`   → frontend/public/mock_identities.json`);
  console.log(`   → frontend/public/merkle_root.json`);
  console.log(`\n📋 Merkle Root to deploy: ${merkleRoot}`);
  console.log(
    `   Convert to hex for Soroban: 0x${BigInt(merkleRoot).toString(16).padStart(64, "0")}`
  );
}

main().catch(console.error);
