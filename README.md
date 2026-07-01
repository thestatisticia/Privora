# Privora

Wallet-unlinked governance voting on Stellar Soroban, powered by Groth16 zero-knowledge proofs.

Privora lets communities run votes where members prove Merkle eligibility without their Freighter wallet signing the ballot. Proofs are verified on-chain via Soroban BLS12-381 host functions; nullifiers prevent double-voting.

## What's in this repo

- **`frontend/`** — Next.js app (the thing you deploy)
- **`contracts/`** — Soroban smart contract (Rust)
- **`circuits/`** — Circom ZK circuit + build scripts

## Run locally

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How judges can test voting

Voters prove membership in a **Merkle snapshot** — not every wallet is eligible by default.

**Option A — Demo mode (fastest)**  
1. Open any live proposal with `?demo=1` (e.g. `/vote/4?demo=1`)  
2. Click **Demo voter #2** (or #3, #4)  
3. Choose Yes or No → generate proof → vote  

**Option B — Allowlist a judge wallet**  
Add the judge's Stellar address to `frontend/src/lib/allowlist.ts` in `ALLOWLIST`. They connect Freighter on a platform-snapshot proposal.

**Option C — Voter credentials**  
Import `voter-credentials.json` from a custom snapshot (production path). Wallet lists are never stored server-side.

## Deploy to Vercel

1. Import [github.com/thestatisticia/Privora](https://github.com/thestatisticia/Privora) in Vercel
2. Set **Root Directory** to `frontend`
3. Add these environment variables:

| Variable | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_CONTRACT_ID` | Soroban contract address | |
| `NEXT_PUBLIC_NETWORK` | `testnet` | |
| `NEXT_PUBLIC_RPC_URL` | `https://soroban-testnet.stellar.org` | |
| `NEXT_PUBLIC_MERKLE_ROOT` | Decimal Merkle root | |
| `RELAYER_SECRET` | Testnet relayer secret | **Server only** — not `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_RELAYER_PUBLIC` | Relayer public address | For RPC simulation |
| `NEXT_PUBLIC_ADMIN_WALLET` | Admin wallet | For `/review` |

4. Deploy — build command is `npm run build` (auto-detected)

## How voting works

1. Prove eligibility (credentials file or allowlisted wallet on platform snapshot)
2. Generate a Groth16 proof locally in the browser
3. POST proof to `/api/cast-vote` — server relayer signs `cast_vote` on Soroban

The voter wallet never signs the ballot transaction.

## Privacy model

| Public on Soroban | Private |
|---|---|
| Yes/No tally | Which Merkle leaf you are |
| Nullifier (one per voter per proposal) | Secret identity |
| Merkle root (eligible set) | Wallet → ballot link |

## Hackathon pitch (Stellar + privacy)

**One-liner:** First Groth16 wallet-unlinked governance on Soroban — eligibility in zero knowledge, ballots relayed without Freighter signing.

**Stellar-native:** BLS12-381 pairing verification in the contract, nullifiers in persistent storage, Freighter for governance ops only.

**Privacy layer:** Poseidon Merkle trees, client-side proving, server relayer, credential-based voter onboarding (no wallet lists on servers).

## License

MIT
