# Privora

**Wallet-unlinked governance on Stellar Soroban** — Groth16 zero-knowledge proofs, relayer-based voting, Poseidon nullifiers.

> Prove you belong. Vote unlinked. Verify everything.

Privora lets communities run governance where members prove **Merkle eligibility** without their Freighter wallet signing the ballot. Proofs verify on-chain via Soroban **BLS12-381** host functions; nullifiers enforce one vote per identity per proposal.

**Live on Stellar testnet** · [Launch app](https://github.com/thestatisticia/Privora) (deploy via Vercel)

---

## The problem

Traditional on-chain voting:

```
Wallet → signs cast_vote → explorer links G… address to YES/NO forever
```

Privora:

```
Secret identity → Groth16 proof (browser) → relayer → Soroban
On-chain: nullifier + tally — not voter wallet
```

---

## What’s in this repo

| Path | Description |
|------|-------------|
| `frontend/` | Next.js 16 app — UI, browser proving, API relay |
| `contracts/voting_contract/` | Soroban contract — verify proofs, tally, nullifiers, collectibles |
| `circuits/` | Circom circuit, identity/nullifier generation scripts |

---

## Features

- **Proposals** — create, admin review, vote, tally, turnout
- **Custom snapshots** — paste wallets → Merkle tree → distribute `voter-credentials.json` privately (wallets never stored on server)
- **ZK voting** — Circom + snarkjs in browser; Groth16 verified on Soroban
- **Server relayer** — `/api/cast-vote` signs transactions; voter wallet never in `cast_vote`
- **Verify** — check anonymous vote receipts on-chain
- **Collectibles** — proof-of-vote badges keyed by nullifier (privacy-preserving participation reputation)

---

## Privacy model (honest)

| | Status |
|--|--------|
| Wallet hidden from ballot tx | ✅ |
| Eligibility proven in ZK | ✅ |
| Double voting prevented | ✅ |
| Vote choice hidden | ❌ (public circuit input — v2 secret ballot) |

**Public on Soroban:** yes/no tally, nullifier per vote, Merkle root (eligible set)  
**Private:** secret identity, which leaf you are, wallet → ballot link

---

## Quick start (local)

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required env vars (`.env.local`)

```env
NEXT_PUBLIC_CONTRACT_ID=          # Soroban contract
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_MERKLE_ROOT=          # Platform snapshot root (decimal)
RELAYER_SECRET=                   # Server-only — signs cast_vote
NEXT_PUBLIC_RELAYER_PUBLIC=       # Relayer public key (RPC sim)
NEXT_PUBLIC_ADMIN_WALLET=         # Review queue access
```

---

## Judge demo (2 minutes)

1. Open **`/vote/[id]?demo=1`** (use any live proposal ID)
2. Click **Demo voter #2**
3. Vote Yes or No → wait for proof → vote relays to Soroban
4. Show **privacy receipt** (anonymous vote receipt ID)
5. Open Stellar explorer — **relayer** signed, not voter wallet
6. Optional: `/verify` with receipt ID

**Allowlisted wallet path:** add judge address to `frontend/src/lib/allowlist.ts`, connect Freighter on platform-snapshot proposal.

---

## Deploy to Vercel

1. Import [github.com/thestatisticia/Privora](https://github.com/thestatisticia/Privora)
2. **Root directory:** `frontend`
3. Set environment variables (see table below)
4. **Redeploy** after changing env vars

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_CONTRACT_ID` | Yes | Soroban contract address |
| `NEXT_PUBLIC_NETWORK` | Yes | `testnet` |
| `NEXT_PUBLIC_RPC_URL` | Yes | Soroban RPC |
| `NEXT_PUBLIC_MERKLE_ROOT` | Yes | Platform demo root |
| `RELAYER_SECRET` | Yes | **Server only** — never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_RELAYER_PUBLIC` | Recommended | RPC simulation source |
| `NEXT_PUBLIC_ADMIN_WALLET` | Yes | `/review` admin |

Remove `NEXT_PUBLIC_RELAYER_SECRET` if present (deprecated).

---

## Architecture

```
Browser                    Next.js API              Soroban
───────                    ───────────              ───────
Merkle proof + Groth16  →  POST /api/cast-vote  →  cast_vote
(secret stays local)       RELAYER_SECRET signs     verify Groth16
                           (voter never signs)      record nullifier
                                                    tally yes/no
```

**Stack:** Circom · Groth16 · Poseidon · snarkjs · Freighter · Stellar SDK · Soroban BLS12-381 pairing verify

---

## App routes

| Route | Purpose |
|-------|---------|
| `/` | Landing — privacy comparison, Why Stellar |
| `/proposals` | Open proposals, activity feed |
| `/vote/[id]` | Vote flow (`?demo=1` for judge mode) |
| `/create` | Submit proposal + Merkle snapshot |
| `/review` | Admin approve/reject |
| `/verify` | Verify anonymous vote receipt |
| `/rewards` | Proof-of-vote collectibles |

---

## Hackathon pitch

**One-liner:**  
Privora brings wallet-unlinked governance to Stellar by combining browser Groth16 proofs, Soroban-native verification, and relayer-based voting so communities prove participation without exposing voter wallets.

**Why Stellar:** Native BLS12-381 verify in the contract, low fees, Freighter ecosystem, persistent nullifier storage — not a generic EVM ZK bolt-on.

---

## Roadmap

- [ ] Secret ballot circuit (private vote choice)
- [ ] Blind relay / minimal server logging
- [ ] Larger Merkle trees, mainnet audit
- [ ] `extend_proposal` on deployed contract (code in repo; redeploy WASM)

---

## License

MIT
