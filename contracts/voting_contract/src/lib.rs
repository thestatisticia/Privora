#![no_std]

mod vk;

use soroban_sdk::{
    contract, contractimpl, contracttype,
    crypto::bls12_381::{Fr, G1Affine, G2Affine},
    Address, BytesN, Env, String, U256, Vec,
    contracterror, panic_with_error,
};

// ─────────────────────────────────────────────────────────────────────────────
// Data Types
// ─────────────────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct Proposal {
    pub id: u32,
    pub title: String,
    pub description: String,
    pub yes_count: u32,
    pub no_count: u32,
    pub end_time: u64,            // unix timestamp
    pub is_active: bool,
    pub merkle_root: BytesN<32>,  // eligible-voter snapshot for THIS proposal
}

/// A Proof-of-Vote collectible. It is keyed by the anonymous nullifier (not a
/// wallet), so it proves a vote happened without revealing who or how.
#[contracttype]
#[derive(Clone)]
pub struct Collectible {
    pub token_id: u32,
    pub proposal_id: u32,
    pub title: String,
    pub minted_at: u64,
}

/// Review status of a submitted proposal (curated flow).
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum SubmissionStatus {
    Pending,
    Approved,
    Rejected,
}

/// A proposal submitted by a project for admin review before it goes live.
#[contracttype]
#[derive(Clone)]
pub struct Submission {
    pub id: u32,
    pub proposer: Address,
    pub title: String,
    pub description: String,
    pub duration_seconds: u64,
    pub merkle_root: BytesN<32>, // the project's own eligible-voter snapshot
    pub status: SubmissionStatus,
    pub proposal_id: u32,        // the live proposal id once approved (else 0)
}

#[contracttype]
pub enum DataKey {
    Admin,
    MerkleRoot,                 // default snapshot root (fallback / convenience)
    ProposalCount,
    Proposal(u32),
    Nullifier(BytesN<32>, u32), // (nullifier_hash, proposal_id)
    Proposer(Address),          // is this address allowed to create proposals?
    ProposerList,               // Vec<Address> of authorized proposers (for display)
    Collectible(BytesN<32>),    // collectible keyed by nullifier (anonymous)
    TokenCounter,               // global incrementing collectible token id / total minted
    Submission(u32),            // a submitted proposal awaiting review
    SubmissionCount,            // number of submissions
}

// ─────────────────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────────────────

#[contracterror]
#[derive(Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum VotingError {
    AlreadyInitialized  = 1,
    Unauthorized        = 2,
    ProposalNotFound    = 3,
    VotingClosed        = 4,
    AlreadyVoted        = 5,
    InvalidVote         = 6,
    InvalidProof        = 7,
    InvalidMerkleRoot   = 8,
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract
// ─────────────────────────────────────────────────────────────────────────────

#[contract]
pub struct VotingContract;

#[contractimpl]
impl VotingContract {

    // ── Init ─────────────────────────────────────────────────────────────────

    /// One-time initialization. Sets the admin and a default Merkle root.
    /// Individual proposals carry their own snapshot root (see `merkle_root`).
    pub fn initialize(env: Env, admin: Address, merkle_root: BytesN<32>) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, VotingError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::MerkleRoot, &merkle_root);
        env.storage().instance().set(&DataKey::ProposalCount, &0u32);
    }

    // ── Proposer management ───────────────────────────────────────────────────

    pub fn add_proposer(env: Env, caller: Address, proposer: Address) {
        caller.require_auth();
        Self::require_admin(&env, &caller);

        if !env.storage().persistent().has(&DataKey::Proposer(proposer.clone())) {
            env.storage()
                .persistent()
                .set(&DataKey::Proposer(proposer.clone()), &true);
            let mut list: Vec<Address> = env
                .storage()
                .instance()
                .get(&DataKey::ProposerList)
                .unwrap_or_else(|| Vec::new(&env));
            list.push_back(proposer);
            env.storage().instance().set(&DataKey::ProposerList, &list);
        }
    }

    pub fn remove_proposer(env: Env, caller: Address, proposer: Address) {
        caller.require_auth();
        Self::require_admin(&env, &caller);
        env.storage()
            .persistent()
            .remove(&DataKey::Proposer(proposer.clone()));
        let list: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::ProposerList)
            .unwrap_or_else(|| Vec::new(&env));
        let mut next: Vec<Address> = Vec::new(&env);
        for a in list.iter() {
            if a != proposer {
                next.push_back(a);
            }
        }
        env.storage().instance().set(&DataKey::ProposerList, &next);
    }

    pub fn is_proposer(env: Env, addr: Address) -> bool {
        if let Some(admin) = env.storage().instance().get::<DataKey, Address>(&DataKey::Admin) {
            if admin == addr {
                return true;
            }
        }
        env.storage().persistent().has(&DataKey::Proposer(addr))
    }

    pub fn get_proposers(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::ProposerList)
            .unwrap_or_else(|| Vec::new(&env))
    }

    fn require_admin(env: &Env, caller: &Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(env, VotingError::Unauthorized));
        if *caller != admin {
            panic_with_error!(env, VotingError::Unauthorized);
        }
    }

    fn require_reviewer(env: &Env, caller: &Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(env, VotingError::Unauthorized));
        let ok = *caller == admin
            || env
                .storage()
                .persistent()
                .has(&DataKey::Proposer(caller.clone()));
        if !ok {
            panic_with_error!(env, VotingError::Unauthorized);
        }
    }

    // ── Proposal Creation ─────────────────────────────────────────────────────

    /// Create a live proposal directly (admin or authorized proposer). The
    /// `merkle_root` is this proposal's eligible-voter snapshot.
    pub fn create_proposal(
        env: Env,
        caller: Address,
        title: String,
        description: String,
        duration_seconds: u64,
        merkle_root: BytesN<32>,
    ) -> u32 {
        caller.require_auth();
        Self::require_reviewer(&env, &caller);
        Self::spawn_proposal(&env, title, description, duration_seconds, merkle_root)
    }

    /// Internal: materialize a live proposal. Returns the new proposal id.
    fn spawn_proposal(
        env: &Env,
        title: String,
        description: String,
        duration_seconds: u64,
        merkle_root: BytesN<32>,
    ) -> u32 {
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap_or(0);
        let proposal_id = count;
        let proposal = Proposal {
            id: proposal_id,
            title,
            description,
            yes_count: 0,
            no_count: 0,
            end_time: env.ledger().timestamp() + duration_seconds,
            is_active: true,
            merkle_root,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);
        env.storage()
            .instance()
            .set(&DataKey::ProposalCount, &(count + 1));
        proposal_id
    }

    // ── Curated submissions ───────────────────────────────────────────────────

    /// Open to any wallet: submit a proposal (with its own snapshot root) for
    /// admin review. It does NOT go live until a reviewer approves it.
    pub fn submit_proposal(
        env: Env,
        proposer: Address,
        title: String,
        description: String,
        duration_seconds: u64,
        merkle_root: BytesN<32>,
    ) -> u32 {
        proposer.require_auth();

        let id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::SubmissionCount)
            .unwrap_or(0);

        let submission = Submission {
            id,
            proposer,
            title,
            description,
            duration_seconds,
            merkle_root,
            status: SubmissionStatus::Pending,
            proposal_id: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Submission(id), &submission);
        env.storage()
            .instance()
            .set(&DataKey::SubmissionCount, &(id + 1));

        id
    }

    /// Reviewer-only: approve a pending submission, publishing it as a live
    /// proposal with the project's declared snapshot root.
    pub fn approve_submission(env: Env, caller: Address, submission_id: u32) -> u32 {
        caller.require_auth();
        Self::require_reviewer(&env, &caller);

        let mut submission: Submission = env
            .storage()
            .persistent()
            .get(&DataKey::Submission(submission_id))
            .unwrap_or_else(|| panic_with_error!(&env, VotingError::ProposalNotFound));

        if submission.status != SubmissionStatus::Pending {
            panic_with_error!(&env, VotingError::AlreadyVoted);
        }

        let proposal_id = Self::spawn_proposal(
            &env,
            submission.title.clone(),
            submission.description.clone(),
            submission.duration_seconds,
            submission.merkle_root.clone(),
        );

        submission.status = SubmissionStatus::Approved;
        submission.proposal_id = proposal_id;
        env.storage()
            .persistent()
            .set(&DataKey::Submission(submission_id), &submission);

        proposal_id
    }

    /// Reviewer-only: reject a pending submission.
    pub fn reject_submission(env: Env, caller: Address, submission_id: u32) {
        caller.require_auth();
        Self::require_reviewer(&env, &caller);

        let mut submission: Submission = env
            .storage()
            .persistent()
            .get(&DataKey::Submission(submission_id))
            .unwrap_or_else(|| panic_with_error!(&env, VotingError::ProposalNotFound));
        submission.status = SubmissionStatus::Rejected;
        env.storage()
            .persistent()
            .set(&DataKey::Submission(submission_id), &submission);
    }

    pub fn get_submissions(env: Env) -> Vec<Submission> {
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::SubmissionCount)
            .unwrap_or(0);
        let mut out: Vec<Submission> = Vec::new(&env);
        for i in 0..count {
            if let Some(s) = env
                .storage()
                .persistent()
                .get::<DataKey, Submission>(&DataKey::Submission(i))
            {
                out.push_back(s);
            }
        }
        out
    }

    // ── Voting (anonymous) ──────────────────────────────────────────────────────

    /// Cast a fully anonymous vote using a Groth16 ZK proof, verified on-chain
    /// via the BLS12-381 pairing host functions. No voter address is involved —
    /// the transaction is typically relayed, so no wallet is ever linked to a
    /// vote or its choice. A Proof-of-Vote collectible is minted, keyed by the
    /// anonymous nullifier.
    ///
    /// `proof_a/b/c` — Groth16 proof points (snarkjs, BLS12-381, uncompressed)
    /// `nullifier`   — Poseidon(secretIdentity, proposalId) — bound into the proof
    /// `vote`        — 0 = No, 1 = Yes
    /// `proposal_id` — Which proposal to vote on
    pub fn cast_vote(
        env: Env,
        proof_a: BytesN<96>,
        proof_b: BytesN<192>,
        proof_c: BytesN<96>,
        nullifier: BytesN<32>,
        vote: u32,
        proposal_id: u32,
    ) -> Result<(), VotingError> {

        // 1. Validate vote value
        if vote != 0 && vote != 1 {
            return Err(VotingError::InvalidVote);
        }

        // 2. Load proposal (carries its own eligible-voter snapshot root)
        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(VotingError::ProposalNotFound)?;

        // 3. Check proposal is still open
        if !proposal.is_active || env.ledger().timestamp() > proposal.end_time {
            return Err(VotingError::VotingClosed);
        }

        // 4. Check nullifier — prevents the same identity voting twice. Because
        //    each eligible identity has exactly one nullifier per proposal, this
        //    also guarantees one collectible per voter per proposal.
        let nullifier_key = DataKey::Nullifier(nullifier.clone(), proposal_id);
        if env.storage().persistent().has(&nullifier_key) {
            return Err(VotingError::AlreadyVoted);
        }

        // 5. Verify the Groth16 proof against THIS proposal's snapshot root.
        let root = proposal.merkle_root.clone();
        if !Self::verify_proof(
            &env, proof_a, proof_b, proof_c, &nullifier, vote, proposal_id, &root,
        ) {
            return Err(VotingError::InvalidProof);
        }

        // 6. Record nullifier
        env.storage().persistent().set(&nullifier_key, &true);

        // 7. Tally the vote
        if vote == 1 {
            proposal.yes_count += 1;
        } else {
            proposal.no_count += 1;
        }
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);

        // 8. Mint an anonymous Proof-of-Vote collectible, keyed by the nullifier.
        Self::mint_collectible(&env, &nullifier, proposal_id, proposal.title.clone());

        Ok(())
    }

    /// Mint one collectible keyed by the (anonymous) nullifier.
    fn mint_collectible(env: &Env, nullifier: &BytesN<32>, proposal_id: u32, title: String) {
        let token_id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TokenCounter)
            .unwrap_or(0);

        let collectible = Collectible {
            token_id,
            proposal_id,
            title,
            minted_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Collectible(nullifier.clone()), &collectible);
        env.storage()
            .instance()
            .set(&DataKey::TokenCounter, &(token_id + 1));
    }

    /// On-chain Groth16 verifier (BLS12-381).
    fn verify_proof(
        env: &Env,
        proof_a: BytesN<96>,
        proof_b: BytesN<192>,
        proof_c: BytesN<96>,
        nullifier: &BytesN<32>,
        vote: u32,
        proposal_id: u32,
        root: &BytesN<32>,
    ) -> bool {
        let bls = env.crypto().bls12_381();

        let alpha = G1Affine::from_bytes(BytesN::from_array(env, &vk::VK_ALPHA_G1));
        let beta = G2Affine::from_bytes(BytesN::from_array(env, &vk::VK_BETA_G2));
        let gamma = G2Affine::from_bytes(BytesN::from_array(env, &vk::VK_GAMMA_G2));
        let delta = G2Affine::from_bytes(BytesN::from_array(env, &vk::VK_DELTA_G2));

        let p_nullifier = Fr::from_bytes(nullifier.clone());
        let p_vote = Fr::from_u256(U256::from_u32(env, vote));
        let p_root = Fr::from_bytes(root.clone());
        let p_pid = Fr::from_u256(U256::from_u32(env, proposal_id));

        let mut points: Vec<G1Affine> = Vec::new(env);
        let mut scalars: Vec<Fr> = Vec::new(env);

        points.push_back(G1Affine::from_bytes(BytesN::from_array(env, &vk::VK_IC[1])));
        scalars.push_back(p_nullifier);
        points.push_back(G1Affine::from_bytes(BytesN::from_array(env, &vk::VK_IC[2])));
        scalars.push_back(p_vote.clone());
        points.push_back(G1Affine::from_bytes(BytesN::from_array(env, &vk::VK_IC[3])));
        scalars.push_back(p_root);
        points.push_back(G1Affine::from_bytes(BytesN::from_array(env, &vk::VK_IC[4])));
        scalars.push_back(p_pid);
        points.push_back(G1Affine::from_bytes(BytesN::from_array(env, &vk::VK_IC[5])));
        scalars.push_back(p_vote);

        let acc = bls.g1_msm(points, scalars);
        let ic0 = G1Affine::from_bytes(BytesN::from_array(env, &vk::VK_IC[0]));
        let vk_x = bls.g1_add(&ic0, &acc);

        let neg_a = -G1Affine::from_bytes(proof_a);
        let b = G2Affine::from_bytes(proof_b);
        let c = G1Affine::from_bytes(proof_c);

        let mut vp1: Vec<G1Affine> = Vec::new(env);
        vp1.push_back(neg_a);
        vp1.push_back(alpha);
        vp1.push_back(vk_x);
        vp1.push_back(c);

        let mut vp2: Vec<G2Affine> = Vec::new(env);
        vp2.push_back(b);
        vp2.push_back(beta);
        vp2.push_back(gamma);
        vp2.push_back(delta);

        bls.pairing_check(vp1, vp2)
    }

    // ── Read Functions ────────────────────────────────────────────────────────

    pub fn get_proposal(env: Env, proposal_id: u32) -> Option<Proposal> {
        env.storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
    }

    pub fn get_proposal_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap_or(0)
    }

    pub fn get_tally(env: Env, proposal_id: u32) -> (u32, u32) {
        let proposal: Option<Proposal> = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id));
        match proposal {
            Some(p) => (p.yes_count, p.no_count),
            None => (0, 0),
        }
    }

    pub fn get_merkle_root(env: Env) -> Option<BytesN<32>> {
        env.storage().instance().get(&DataKey::MerkleRoot)
    }

    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }

    pub fn is_nullifier_used(env: Env, nullifier: BytesN<32>, proposal_id: u32) -> bool {
        let key = DataKey::Nullifier(nullifier, proposal_id);
        env.storage().persistent().has(&key)
    }

    // ── Proof-of-Vote collectibles (anonymous, keyed by nullifier) ───────────────

    /// Fetch the collectible minted for a given nullifier, if any. A voter's
    /// own client can compute its nullifiers and assemble its collection
    /// without ever revealing the wallet on-chain.
    pub fn get_collectible(env: Env, nullifier: BytesN<32>) -> Option<Collectible> {
        env.storage()
            .persistent()
            .get(&DataKey::Collectible(nullifier))
    }

    /// Total number of collectibles minted across all proposals.
    pub fn get_total_collectibles(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::TokenCounter)
            .unwrap_or(0)
    }
}
