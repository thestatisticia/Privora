"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet";
import { submitProposal } from "@/lib/stellar";
import { HubBackLink, HubPage } from "@/components/hub/HubPage";

const DURATIONS = [
  { label: "1 day", seconds: 86400 },
  { label: "3 days", seconds: 259200 },
  { label: "5 days", seconds: 432000 },
  { label: "7 days", seconds: 604800 },
];

export default function SubmitProposalPage() {
  const { address, connected, connecting, connect } = useWallet();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(259200);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!address || !title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const id = await submitProposal({
        walletAddress: address,
        title: title.trim(),
        description: description.trim(),
        durationSeconds: duration,
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
        <p className="text-gray-400 mb-8">
          Submit a governance proposal for admin review. Approved submissions open
          for anonymous voting on the Proposals page.
        </p>

        {!connected ? (
          <div className="surface p-8 text-center">
            <p className="text-gray-400 mb-5">
              Connect your wallet to submit a proposal.
            </p>
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
            <p className="text-gray-400 text-sm mb-6">
              Your submission is in the review queue. Once approved, it will appear
              on Proposals and open for voting.
            </p>
            <button
              onClick={() => {
                setSubmittedId(null);
                setTitle("");
                setDescription("");
              }}
              className="btn btn-ghost px-6 py-2.5 text-sm"
            >
              Submit another
            </button>
          </div>
        ) : (
          <div className="surface p-6 space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-stellar-cyan/5 border border-stellar-cyan/15">
              <svg className="w-5 h-5 text-stellar-cyan shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-400">
                Submissions go to the review queue. An admin approves or rejects
                each one before it becomes a live proposal.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Increase liquidity rewards by 15%"
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
                Requested voting window
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.seconds}
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

            {error && <p className="text-rose-400 text-sm break-words">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !description.trim()}
              className="btn btn-primary w-full py-3.5 text-sm"
            >
              {submitting ? "Submitting…" : "Submit for Review"}
            </button>
          </div>
        )}
    </HubPage>
  );
}
