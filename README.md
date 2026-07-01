# Privora

Anonymous voting on Stellar, powered by zero-knowledge proofs.

Privora lets communities run governance votes where members prove they're eligible without revealing their wallet or their choice. Votes are verified on-chain via Groth16 proofs on Soroban.

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

**Option A — Demo voter (fastest, no wallet setup)**  
1. Open any live proposal  
2. Under **For judges & testers**, click **Demo voter #2** (or #3, #4)  
3. Choose Yes or No → generate proof → vote  

Each demo slot is a pre-registered snapshot identity. The vote is fully anonymous on-chain.

**Option B — Allowlist a judge wallet**  
Add the judge's Stellar address to `frontend/src/lib/allowlist.ts` in `ALLOWLIST`, mapped to a free snapshot index (1–15). They connect Freighter and vote normally.

**Option C — Manual secret**  
Expand **Advanced: use a specific secret identity** and paste a `secretIdentity` from `mock_identities.json`.

## Deploy to Vercel

1. Import [github.com/thestatisticia/Privora](https://github.com/thestatisticia/Privora) in Vercel
2. Set **Root Directory** to `frontend`
3. Add these environment variables (copy values from your local `.env.local`):

| Variable | Example |
|---|---|
| `NEXT_PUBLIC_CONTRACT_ID` | Soroban contract address |
| `NEXT_PUBLIC_NETWORK` | `testnet` |
| `NEXT_PUBLIC_RPC_URL` | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_MERKLE_ROOT` | Decimal Merkle root from snapshot |
| `NEXT_PUBLIC_RELAYER_SECRET` | Testnet relayer secret key |
| `NEXT_PUBLIC_RELAYER_PUBLIC` | Relayer public address |
| `NEXT_PUBLIC_ADMIN_WALLET` | Admin wallet for `/review` |

4. Deploy — build command is `npm run build` (auto-detected)

**Note:** The relayer secret is client-side for this demo. Move it to a server API route before mainnet.

## How voting works

1. Connect your wallet to check eligibility against a voter snapshot
2. Generate a Groth16 proof in your browser
3. Cast your vote anonymously via a relayer — your wallet never signs the ballot

## Testnet demo

This demo runs on Stellar testnet. The relayer key is exposed client-side for convenience — fine for demos, not for production. Move the relayer to a backend before mainnet.

## License

MIT
