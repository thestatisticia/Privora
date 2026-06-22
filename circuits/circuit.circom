pragma circom 2.0.0;
include "node_modules/circomlib/circuits/poseidon.circom";

template MerkleTreeInclusion(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output root;

    component hashers[levels];
    signal hashes[levels + 1];
    hashes[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        hashers[i] = Poseidon(2);
        
        // if pathIndices[i] == 0, left child is hashes[i]
        // if pathIndices[i] == 1, right child is hashes[i]
        hashers[i].inputs[0] <== hashes[i] - pathIndices[i] * (hashes[i] - pathElements[i]);
        hashers[i].inputs[1] <== pathElements[i] - pathIndices[i] * (pathElements[i] - hashes[i]);
        
        hashes[i + 1] <== hashers[i].out;
    }
    
    root <== hashes[levels];
}

template SecretBallot() {
    // Private inputs
    signal input secretIdentity; // Random 32-byte secret, NOT the Stellar private key
    signal input pathElements[4];
    signal input pathIndices[4];
    
    // Public inputs
    signal input root;
    signal input proposalId;
    signal input vote; // 0 = No, 1 = Yes
    
    // Outputs
    signal output nullifier;
    signal output votePublic;

    // 1. Verify identity (leaf is hash of secretIdentity)
    component leafHasher = Poseidon(1);
    leafHasher.inputs[0] <== secretIdentity;
    
    component tree = MerkleTreeInclusion(4);
    tree.leaf <== leafHasher.out;
    for (var i=0; i<4; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
    tree.root === root; // enforce root match
    
    // 2. Generate nullifier to prevent double voting per proposal
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== secretIdentity;
    nullifierHasher.inputs[1] <== proposalId;
    nullifier <== nullifierHasher.out;

    // 3. Enforce vote is 0 or 1
    vote * (vote - 1) === 0;

    // 4. Output public vote
    votePublic <== vote;
}

component main {public [root, proposalId, vote]} = SecretBallot();
