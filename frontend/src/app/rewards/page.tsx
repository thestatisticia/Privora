"use client";

import { useEffect, useState } from "react";
import { useWallet, truncateAddress } from "@/lib/wallet";
import {
  getMyCollectibles,
  getTotalCollectibles,
  getProposalCount,
  Collectible,
} from "@/lib/stellar";
import { getIdentityForAddress, getNullifierFor } from "@/lib/merkle";
import { nullifierToBytes32 } from "@/lib/zkproof";
import { HubPage } from "@/components/hub/HubPage";

const GRADIENTS = [
  "from-stellar-purple to-stellar-cyan",
  "from-[#36d1dc] to-[#5b86e5]",
  "from-[#f7971e] to-[#ffd200]",
  "from-[#fc466b] to-[#3f5efb]",
  "from-[#11998e] to-[#38ef7d]",
  "from-[#c471f5] to-[#fa71cd]",
];

function CollectibleCard({ c }: { c: Collectible }) {
  const g = GRADIENTS[c.tokenId % GRADIENTS.length];
  const date = new Date(c.mintedAt * 1000).toLocaleDateString();
  return (
    <div className="surface overflow-hidden">
      <div
        className={`h-28 bg-gradient-to-br ${g} relative flex items-center justify-center`}
      >
        <svg className="w-10 h-10 text-black/70" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l2.4 6.9H22l-6 4.3 2.3 7-6.3-4.5L5.7 20l2.3-7-6-4.3h7.6z" />
        </svg>
        <span className="absolute top-2 right-3 text-xs font-mono text-black/70 font-bold">
          #{c.tokenId}
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs text-stellar-cyan uppercase tracking-widest mb-1">
          Proof of Vote
        </p>
        <p className="text-sm font-semibold text-white line-clamp-2 leading-snug">
          {c.title}
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Proposal #{c.proposalId} · {date}
        </p>
      </div>
    </div>
  );
}

export default function RewardsPage() {
  const { address, connected, connecting, connect } = useWallet();
  const [mine, setMine] = useState<Collectible[]>([]);
  const [total, setTotal] = useState(0);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [loadingMine, setLoadingMine] = useState(false);

  useEffect(() => {
    getTotalCollectibles().then(setTotal);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!connected || !address) {
      setMine([]);
      setEligible(null);
      return;
    }
    setLoadingMine(true);
    (async () => {
      const id = await getIdentityForAddress(address);
      if (!id) {
        if (!cancelled) {
          setEligible(false);
          setMine([]);
          setLoadingMine(false);
        }
        return;
      }
      if (!cancelled) setEligible(true);

      // Reconstruct your own collection locally: derive each proposal's
      // nullifier from your snapshot identity, then look up the matching badge.
      const count = await getProposalCount();
      const hexes: string[] = [];
      for (let pid = 0; pid < count; pid++) {
        const nf = await getNullifierFor(id.index, pid);
        if (nf) hexes.push(nullifierToBytes32(nf));
      }
      const cols = await getMyCollectibles(hexes);
      if (!cancelled) {
        setMine(cols);
        setLoadingMine(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connected, address]);

  return (
    <HubPage wide>
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Proof-of-vote <span className="text-stellar-cyan">collectibles</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Each anonymous vote mints a soulbound badge keyed to its nullifier —
            not to a wallet. Only you can reconstruct your collection, because
            only your browser holds your snapshot secret. The badge proves{" "}
            <span className="text-white font-medium">that</span> a vote happened,
            never <span className="text-white font-medium">who</span> cast it or{" "}
            <span className="text-white font-medium">how</span> they voted.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="surface p-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
              Your badges
            </p>
            <p className="text-3xl font-bold text-stellar-cyan">
              {connected && eligible ? mine.length : "—"}
            </p>
            {connected && address && (
              <p className="text-xs text-gray-600 mt-1 font-mono">
                {truncateAddress(address)}
              </p>
            )}
          </div>
          <div className="surface p-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
              Minted on Stellar
            </p>
            <p className="text-3xl font-bold">{total}</p>
          </div>
          <div className="surface p-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
              Public leaderboard
            </p>
            <p className="text-3xl font-bold text-gray-500">None</p>
            <p className="text-xs text-gray-600 mt-1">by design — votes stay anonymous</p>
          </div>
        </div>

        {/* Your collection */}
        <div className="mb-12">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-5">
            Your collection
          </h2>
          {!connected ? (
            <div className="surface p-10 text-center">
              <p className="text-gray-400 mb-5 text-sm">
                Connect your wallet to reconstruct your private collection.
              </p>
              <button
                onClick={connect}
                disabled={connecting}
                className="btn btn-primary px-6 py-3 text-sm"
              >
                {connecting ? "Connecting…" : "Connect Wallet"}
              </button>
            </div>
          ) : eligible === false ? (
            <div className="surface p-10 text-center text-gray-500 text-sm">
              This wallet isn&apos;t in the voter snapshot, so it has no
              collectibles.
            </div>
          ) : loadingMine ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 animate-shimmer rounded-2xl" />
              ))}
            </div>
          ) : mine.length === 0 ? (
            <div className="surface p-10 text-center text-gray-500 text-sm">
              No badges yet. Cast a vote to mint your first proof-of-vote collectible.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mine.map((c) => (
                <CollectibleCard key={c.tokenId} c={c} />
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="surface p-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            How collectibles stay private
          </h2>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex gap-3">
              <span className="text-stellar-cyan mt-0.5">1.</span>
              You prove eligibility with a zero-knowledge proof — the chain never
              learns which registered voter you are.
            </li>
            <li className="flex gap-3">
              <span className="text-stellar-cyan mt-0.5">2.</span>
              The vote is <span className="text-white">relayed</span> — no wallet
              signs it, so nothing on-chain links you to the vote or its choice.
            </li>
            <li className="flex gap-3">
              <span className="text-stellar-cyan mt-0.5">3.</span>
              A collectible is minted keyed to your anonymous{" "}
              <span className="text-white">nullifier</span>. Only your browser can
              recompute that nullifier from your secret, so only you can assemble
              your collection — and reward programs can check it without a public
              wallet leaderboard.
            </li>
          </ul>
        </div>
    </HubPage>
  );
}
