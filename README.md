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

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add the environment variables from `frontend/.env.example`
5. Deploy

The build uses `npm run build` (webpack mode — required for snarkjs).

## How voting works

1. Connect your wallet to check eligibility against a voter snapshot
2. Generate a Groth16 proof in your browser
3. Cast your vote anonymously via a relayer — your wallet never signs the ballot

## Testnet demo

This demo runs on Stellar testnet. The relayer key is exposed client-side for convenience — fine for demos, not for production. Move the relayer to a backend before mainnet.

## License

MIT
