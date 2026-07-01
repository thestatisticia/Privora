"use client";

import { useEffect, useState } from "react";
import { useWallet, truncateAddress } from "@/lib/wallet";
import { HubPage } from "@/components/hub/HubPage";

interface Collectible {
  tokenId: number;
  proposalId: number;
  title: string;
  mintedAt: number;
}

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
        <p className="text-sm font-semibold text-[var(--foreground)] line-clamp-2 leading-snug">
          {c.title}
        </p>
        <p className="text-xs text-[var(--muted)] mt-2">
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
  const [fetchKey, setFetchKey] = useState<{ address: string; done: boolean } | null>(null);
  const loadingMine =
    connected && address
      ? !(fetchKey?.address === address && fetchKey.done)
      : false;

  useEffect(() => {
    fetch("/api/rewards")
      .then((r) => r.json())
      .then((d) => setTotal(d.total ?? 0))
      .catch(() => setTotal(0));
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!connected || !address) return;
    const addr = address;
    fetch(`/api/rewards?address=${encodeURIComponent(addr)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setEligible(d.eligible ?? null);
        setMine(d.collectibles ?? []);
        if (typeof d.total === "number") setTotal(d.total);
      })
      .catch(() => {
        if (!cancelled) {
          setEligible(null);
          setMine([]);
        }
      })
      .finally(() => {
        if (!cancelled) setFetchKey({ address: addr, done: true });
      });
    return () => {
      cancelled = true;
    };
  }, [connected, address]);

  const displayMine = connected && address ? mine : [];
  const displayEligible = connected && address ? eligible : null;

  return (
    <HubPage wide>
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Rewards <span className="text-stellar-cyan">hub</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl">
            Each anonymous vote mints a soulbound badge keyed to its nullifier —
            not to a wallet. Only you can reconstruct your collection, because
            only your browser holds your snapshot secret.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="surface p-6">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2">
              Your badges
            </p>
            <p className="text-3xl font-bold text-stellar-cyan">
              {connected && displayEligible ? displayMine.length : "—"}
            </p>
            {connected && address && (
              <p className="text-xs text-[var(--muted)] mt-1 font-mono">
                {truncateAddress(address)}
              </p>
            )}
          </div>
          <div className="surface p-6">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2">
              Minted on Stellar
            </p>
            <p className="text-3xl font-bold">{total}</p>
          </div>
          <div className="surface p-6">
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2">
              Public leaderboard
            </p>
            <p className="text-3xl font-bold text-[var(--muted)]">None</p>
            <p className="text-xs text-[var(--muted)] mt-1">by design — votes stay anonymous</p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-5">
            Your collection
          </h2>
          {!connected ? (
            <div className="surface p-10 text-center">
              <p className="text-[var(--text-secondary)] mb-5 text-sm">
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
          ) : displayEligible === false ? (
            <div className="surface p-10 text-center text-[var(--muted)] text-sm">
              This wallet isn&apos;t in the platform snapshot. Import voter credentials
              from your organizer, or use{" "}
              <span className="font-mono text-[var(--foreground)]">?demo=1</span> on a
              proposal to test.
            </div>
          ) : loadingMine ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 animate-shimmer rounded-2xl" />
              ))}
            </div>
          ) : displayMine.length === 0 ? (
            <div className="surface p-10 text-center text-[var(--muted)] text-sm">
              No badges yet. Cast a vote to mint your first proof-of-vote collectible.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayMine.map((c) => (
                <CollectibleCard key={c.tokenId} c={c} />
              ))}
            </div>
          )}
        </div>

        <div className="surface p-6">
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-4">
            How collectibles stay private
          </h2>
          <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
            <li className="flex gap-3">
              <span className="text-stellar-cyan mt-0.5">1.</span>
              You prove eligibility with a zero-knowledge proof — the chain never
              learns which registered voter you are.
            </li>
            <li className="flex gap-3">
              <span className="text-stellar-cyan mt-0.5">2.</span>
              The vote is relayed — no wallet signs it, so nothing on-chain links you to the vote.
            </li>
            <li className="flex gap-3">
              <span className="text-stellar-cyan mt-0.5">3.</span>
              A collectible is minted keyed to your anonymous nullifier. Only your browser can
              recompute it from your secret.
            </li>
          </ul>
        </div>
    </HubPage>
  );
}
