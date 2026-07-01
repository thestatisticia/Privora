"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/lib/wallet";
import { HubBackLink, HubPage } from "@/components/hub/HubPage";
import {
  SnapshotBuilderPanel,
  useSnapshotSelection,
} from "@/components/SnapshotBuilder";

const DURATIONS = [
  { label: "1 day", seconds: 86400 },
  { label: "3 days", seconds: 259200 },
  { label: "5 days", seconds: 432000 },
  { label: "7 days", seconds: 604800 },
];

export default function SubmitProposalPage() {
  const { address, connected, connecting, connect } = useWallet();
  const snapshot = useSnapshotSelection();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(259200);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!address || !title.trim() || !description.trim() || !snapshot.canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { submitProposal } = await import("@/lib/stellar");
      const id = await submitProposal({
        walletAddress: address,
        title: title.trim(),
        description: description.trim(),
        durationSeconds: duration,
        merkleRoot: snapshot.activeRoot,
      });
      setSubmittedId(id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HubPage>
      <HubBackLink href="/proposals" label="Proposals" />

      <h1 className="text-3xl font-bold mb-2">Submit a proposal</h1>
      <p className="text-gray-400 mb-8 max-w-2xl">
        Three steps: describe your proposal, define who can vote (Merkle snapshot), then
        submit for admin review.
      </p>

      {!connected ? (
        <div className="surface p-8 text-center">
          <p className="text-gray-400 mb-5">Connect your wallet to submit a proposal.</p>
          <button
            onClick={connect}
            disabled={connecting}
            className="btn btn-primary px-6 py-3 text-sm"
          >
            {connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        </div>
      ) : submittedId !== null ? (
        <div className="surface p-8 text-center border-stellar-cyan/30">
          <div className="w-12 h-12 rounded-full bg-stellar-cyan/10 border border-stellar-cyan/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-stellar-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-stellar-cyan font-bold text-lg mb-2">
            Submission #{submittedId} received
          </p>
          <p className="text-gray-400 text-sm mb-2">
            Snapshot locked:{" "}
            <strong className="text-gray-300">{snapshot.activeVoterCount}</strong> eligible
            wallets
          </p>
          {snapshot.mode === "custom" && (
            <p className="text-gray-500 text-xs mb-6 max-w-md mx-auto">
              Distribute the voter credentials JSON to each wallet holder before voting opens.
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <Link href="/review" className="btn btn-ghost px-6 py-2.5 text-sm">
              Review queue
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmittedId(null);
                setTitle("");
                setDescription("");
              }}
              className="btn btn-primary px-6 py-2.5 text-sm"
            >
              Submit another
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 max-w-3xl">
          {/* Step 1 */}
          <section className="surface p-6 space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1">
                Step 1 · Proposal
              </p>
              <h2 className="text-lg font-semibold">What are voters deciding?</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Allocate 50,000 XLM to developer grants"
                maxLength={120}
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what voters are deciding on…"
                rows={5}
                maxLength={600}
                className="input-field w-full resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Voting window
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.seconds}
                    type="button"
                    onClick={() => setDuration(d.seconds)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      duration === d.seconds
                        ? "bg-stellar-cyan/10 border-stellar-cyan text-stellar-cyan"
                        : "bg-[#060708] border-[#1c1f24] text-gray-400 hover:border-stellar-cyan/30"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Step 2 — voter snapshot (prominent) */}
          <SnapshotBuilderPanel {...snapshot} />

          {/* Step 3 */}
          <section className="surface p-6 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1">
                Step 3 · Submit
              </p>
              <h2 className="text-lg font-semibold">Send to review queue</h2>
              <p className="text-sm text-gray-500 mt-1">
                An admin approves before your proposal and Merkle root go live on Proposals.
              </p>
            </div>

            {snapshot.needsSnapshotBuild && (
              <p className="text-amber-400 text-sm">
                Complete Step 2 — build your Merkle snapshot before submitting.
              </p>
            )}

            {error && <p className="text-rose-400 text-sm break-words">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                submitting ||
                !title.trim() ||
                !description.trim() ||
                !snapshot.canSubmit
              }
              className="btn btn-primary w-full py-3.5 text-sm"
            >
              {submitting ? "Submitting…" : "Submit for Review"}
            </button>
          </section>
        </div>
      )}
    </HubPage>
  );
}
