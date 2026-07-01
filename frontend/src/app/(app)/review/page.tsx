"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useWallet, truncateAddress } from "@/lib/wallet";
import { ADMIN_WALLET, isReviewer } from "@/lib/allowlist";
import { HubBackLink, HubPage, HubPageTitle } from "@/components/hub/HubPage";
import type { Submission } from "@/lib/stellar";

function days(seconds: number): string {
  const d = Math.round(seconds / 86400);
  return `${d} day${d === 1 ? "" : "s"}`;
}

export default function ReviewPage() {
  const { address, connected, connecting, connect } = useWallet();
  const allowed = isReviewer(address);

  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [chainAdmin, setChainAdmin] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const r = await fetch("/api/review");
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to load review queue");
      setSubs(data.submissions ?? []);
      setChainAdmin(data.chainAdmin ?? null);
    } catch (err: unknown) {
      setSubs([]);
      setFetchError(
        err instanceof Error ? err.message : "Failed to load submissions from Soroban"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/review")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load review queue");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setSubs(data.submissions ?? []);
        setChainAdmin(data.chainAdmin ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSubs([]);
        setFetchError(
          err instanceof Error ? err.message : "Failed to load submissions from Soroban"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleApprove = async (id: number) => {
    if (!address || !allowed) return;
    setBusyId(id);
    setError(null);
    try {
      const { approveSubmission } = await import("@/lib/stellar");
      await approveSubmission(address, id);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!address || !allowed) return;
    setBusyId(id);
    setError(null);
    try {
      const { rejectSubmission } = await import("@/lib/stellar");
      await rejectSubmission(address, id);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setBusyId(null);
    }
  };

  const pending = subs.filter((s) => s.status === "Pending");
  const decided = subs.filter((s) => s.status !== "Pending");

  return (
    <HubPage>
      <HubBackLink href="/proposals" label="Proposals" />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <HubPageTitle subtitle="Submissions stay here until approved — they do not appear on Proposals until you publish them.">
          Review <span className="text-gradient-stellar">queue</span>
        </HubPageTitle>
        <button
          onClick={load}
          disabled={loading}
          className="btn btn-ghost px-4 py-2.5 text-sm shrink-0 self-start sm:self-auto"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {fetchError && (
        <div className="surface p-4 mb-5 border-rose-500/25">
          <p className="text-rose-400 text-sm break-words">{fetchError}</p>
          <p className="text-stellar-muted text-xs mt-2">
            If you use <span className="font-mono">npm start</span>, rebuild after changing{" "}
            <span className="font-mono">.env.local</span> so the contract ID is included.
          </p>
        </div>
      )}

      {!connected ? (
        <div className="surface p-5 mb-6 border-[var(--border-strong)]">
          <p className="text-[var(--text-secondary)] text-sm mb-4">
            The queue below is live from Soroban — anyone can view it. Connect the admin
            wallet to approve or reject submissions.
          </p>
          <button onClick={connect} disabled={connecting} className="btn btn-primary px-6 py-3 text-sm">
            {connecting ? "Connecting…" : "Connect admin wallet"}
          </button>
          <p className="text-xs text-stellar-muted mt-3 font-mono">
            Admin: {truncateAddress(ADMIN_WALLET)}
            {chainAdmin && chainAdmin !== ADMIN_WALLET && (
              <span className="text-rose-400 block mt-1">
                On-chain admin differs: {truncateAddress(chainAdmin)}
              </span>
            )}
          </p>
        </div>
      ) : !allowed ? (
        <div className="surface p-5 mb-6 border-rose-500/25">
          <p className="text-stellar-rose font-semibold mb-2">Not authorized to approve</p>
          <p className="text-stellar-muted text-sm">
            Connected{" "}
            <span className="font-mono text-gray-300">{truncateAddress(address!)}</span> cannot
            approve on-chain. Connect{" "}
            <span className="font-mono text-gray-300">{truncateAddress(ADMIN_WALLET)}</span>
            {chainAdmin && chainAdmin !== ADMIN_WALLET && (
              <> (deploy admin: {truncateAddress(chainAdmin)})</>
            )}
            .
          </p>
        </div>
      ) : (
        error && (
          <div className="surface p-4 mb-5 border-rose-500/25">
            <p className="text-rose-400 text-sm break-words">{error}</p>
          </div>
        )
      )}

      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
        Pending ({pending.length})
      </h2>
      {loading ? (
        <div className="space-y-3 mb-10">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 animate-shimmer rounded-2xl" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="surface p-10 text-center text-gray-500 text-sm mb-10">
          <p>No pending submissions on-chain.</p>
          <p className="text-xs text-stellar-muted mt-2 max-w-md mx-auto">
            New proposals appear here after someone uses <strong className="text-[var(--foreground)]">New proposal</strong>. They will not show on
            Proposals until you approve them.
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-10">
          {pending.map((s) => (
            <div key={s.id} className="surface p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-muted">Submission #{s.id}</span>
                <span className="text-xs text-gray-600">{days(s.durationSeconds)} window</span>
              </div>
              <h3 className="font-bold text-lg mb-1">{s.title}</h3>
              <p className="text-gray-400 text-sm mb-3 leading-relaxed">{s.description}</p>
              <p className="text-xs text-gray-600 font-mono mb-4">
                by {truncateAddress(s.proposer)}
              </p>
              {allowed ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(s.id)}
                    disabled={busyId !== null}
                    className="btn btn-primary px-5 py-2.5 text-sm"
                  >
                    {busyId === s.id ? "Working…" : "Approve & publish"}
                  </button>
                  <button
                    onClick={() => handleReject(s.id)}
                    disabled={busyId !== null}
                    className="btn btn-ghost px-5 py-2.5 text-sm"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <p className="text-xs text-stellar-muted">
                  Connect the admin wallet to approve or reject this submission.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            Decided
          </h2>
          <div className="space-y-2">
            {decided.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-[#060708] border border-[#1c1f24]"
              >
                <span
                  className={`badge ${s.status === "Approved" ? "badge-live" : "badge-muted"}`}
                >
                  {s.status}
                </span>
                <span className="text-sm text-gray-300 truncate flex-1">{s.title}</span>
                {s.status === "Approved" && (
                  <Link
                    href={`/vote/${s.proposalId}`}
                    className="text-stellar-yes text-xs hover:underline shrink-0"
                  >
                    Proposal #{s.proposalId} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </HubPage>
  );
}
