"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useWallet, truncateAddress } from "@/lib/wallet";
import type { Proposal } from "@/lib/types/proposal";
import {
  findIdentityBySecret,
  getIdentityForAddress,
  getMockIdentityAt,
  getNullifierFor,
  getNullifierColumn,
  MockIdentity,
} from "@/lib/merkle";
import { nullifierToBytes32 } from "@/lib/nullifier";
import type { ProofStatus } from "@/lib/types/zkproof";
import ClientTimeRemaining from "@/components/ClientTimeRemaining";
import VoteProgressBar from "@/components/charts/VoteProgressBar";
import TurnoutMeter from "@/components/TurnoutMeter";
import PrivacyReceipt from "@/components/PrivacyReceipt";
import { rootsMatch, parseVoterCredentialsJson, computeNullifier } from "@/lib/snapshot-builder";
import {
  HubBackLink,
  HubPage,
  HubSectionTitle,
  DetailTable,
  DetailRow,
  MetricCard,
} from "@/components/hub/HubPage";
import {
  isProposalActive,
  votePercents,
} from "@/lib/proposal-utils";
import { useDemoMode } from "@/lib/use-demo-mode";

const DEMO_VOTER_SLOTS = [1, 2, 3, 4] as const;

type VoteChoice = 0 | 1 | null;
type FlowStep = "eligibility" | "proof" | "casting" | "success" | "error";

export default function VotePage() {
  const params = useParams();
  const proposalId = Number(params.id);
  const { address, connected, connecting, connect } = useWallet();
  const demoMode = useDemoMode();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingProposal, setLoadingProposal] = useState(true);

  // Identity / eligibility
  const [overrideIdentity, setOverrideIdentity] = useState<MockIdentity | null>(null);
  const [walletIdentity, setWalletIdentity] = useState<MockIdentity | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [manualChecked, setManualChecked] = useState(false);
  const [manualEligible, setManualEligible] = useState(false);
  const [manualSnapshotMismatch, setManualSnapshotMismatch] = useState(false);
  const [importedIdentities, setImportedIdentities] = useState<MockIdentity[]>([]);

  // Vote flow
  const [voteChoice, setVoteChoice] = useState<VoteChoice>(null);
  const [step, setStep] = useState<FlowStep>("eligibility");
  const [proofStatus, setProofStatus] = useState<ProofStatus>("idle");
  const [nullifier, setNullifier] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-vote "already voted" detection (no proof needed).
  const [voteCheck, setVoteCheck] = useState<{
    identityIndex: number;
    nullifier: string | null;
  } | null>(null);

  // Anonymous voters list (nullifiers recorded on-chain for this proposal).
  const [voters, setVoters] = useState<string[]>([]);

  const identity =
    overrideIdentity ??
    (connected && address && !advancedOpen ? walletIdentity : null);
  const isEligible = !!identity;
  const hasVotedNullifier =
    identity && voteCheck?.identityIndex === identity.index
      ? voteCheck.nullifier
      : null;
  const isCheckingVoted =
    !!identity && voteCheck?.identityIndex !== identity.index;

  const identityMatchesSnapshot =
    !identity ||
    !proposal?.merkleRoot ||
    rootsMatch(identity.merkleProof.root, proposal.merkleRoot);

  useEffect(() => {
    fetch(`/api/proposals/${proposalId}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || `HTTP ${r.status}`);
        }
        return r.json() as Promise<Proposal>;
      })
      .then((p) => {
        setProposal(p);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        setProposal(null);
        setLoadError(err instanceof Error ? err.message : "Failed to load proposal");
      })
      .finally(() => setLoadingProposal(false));
  }, [proposalId]);

  // Build the anonymous voters list: which snapshot nullifiers are recorded
  // on-chain for this proposal. We learn THAT a vote happened, never the choice.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { isNullifierUsed } = await import("@/lib/stellar");
      const decs = await getNullifierColumn(proposalId);
      const checks = await Promise.all(
        decs.map(async (d) => ((await isNullifierUsed(d, proposalId)) ? d : null))
      );
      if (!cancelled) {
        setVoters(
          checks.filter((d): d is string => !!d).map((d) => nullifierToBytes32(d))
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [proposalId, txHash]);

  // Resolve wallet against this proposal's voter snapshot.
  useEffect(() => {
    if (!connected || !address || advancedOpen) return;
    let cancelled = false;
    getIdentityForAddress(address, proposal?.merkleRoot).then((id) => {
      if (!cancelled) setWalletIdentity(id);
    });
    return () => {
      cancelled = true;
    };
  }, [connected, address, advancedOpen, proposal?.merkleRoot]);

  // Detect whether this identity has already voted on this proposal, before
  // asking the user to generate a (slow) proof.
  useEffect(() => {
    if (!identity) return;
    const idx = identity.index;
    let cancelled = false;
    (async () => {
      const { isNullifierUsed } = await import("@/lib/stellar");
      const nf =
        (await getNullifierFor(identity.index, proposalId)) ??
        (await computeNullifier(identity.secretIdentity, proposalId));
      const used = await isNullifierUsed(nf, proposalId);
      if (!cancelled) {
        setVoteCheck({ identityIndex: idx, nullifier: used ? nf : null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [identity, proposalId]);

  const checkManualSecret = useCallback(async () => {
    if (!secretInput.trim()) return;
    const fromMock = await findIdentityBySecret(secretInput.trim());
    const found =
      fromMock ??
      importedIdentities.find((i) => i.secretIdentity === secretInput.trim()) ??
      null;
    setManualChecked(true);
    setManualSnapshotMismatch(false);
    if (found && proposal?.merkleRoot && !rootsMatch(found.merkleProof.root, proposal.merkleRoot)) {
      setOverrideIdentity(null);
      setManualEligible(false);
      setManualSnapshotMismatch(true);
      return;
    }
    if (found) {
      setOverrideIdentity(found);
      setManualEligible(true);
    } else {
      setOverrideIdentity(null);
      setManualEligible(false);
    }
  }, [secretInput, proposal, importedIdentities]);

  const handleCredentialFile = useCallback(async (file: File | null) => {
    if (!file) return;
    try {
      const parsed = parseVoterCredentialsJson(JSON.parse(await file.text()));
      setImportedIdentities(parsed);
    } catch {
      setImportedIdentities([]);
    }
  }, []);

  const loadDemoVoter = useCallback(async (index: number) => {
    const id = await getMockIdentityAt(index);
    setOverrideIdentity(id);
    setAdvancedOpen(false);
    setManualChecked(false);
  }, []);

  const handleVote = useCallback(async () => {
    if (!identity || voteChoice === null || !identityMatchesSnapshot) return;

    setStep("proof");
    setProofStatus("loading_wasm");
    setErrorMsg(null);

    try {
      const { generateVoteProof } = await import("@/lib/zkproof");
      const { castVote, isNullifierUsed } = await import("@/lib/stellar");

      const { nullifier: nullifierStr, proofA, proofB, proofC } =
        await generateVoteProof(
          {
            secretIdentity: identity.secretIdentity,
            pathElements: identity.merkleProof.pathElements,
            pathIndices: identity.merkleProof.pathIndices,
            root: identity.merkleProof.root,
            proposalId,
            vote: voteChoice,
          },
          setProofStatus
        );

      setNullifier(nullifierStr);
      const nullHex = nullifierToBytes32(nullifierStr);

      const used = await isNullifierUsed(nullHex, proposalId);
      if (used) {
        setAlreadyVoted(true);
        setStep("error");
        setErrorMsg("This identity has already voted on this proposal.");
        return;
      }

      setStep("casting");

      // No wallet signs — the vote is relayed, so nothing on-chain links you
      // to this vote or its choice.
      const hash = await castVote({
        proofA,
        proofB,
        proofC,
        nullifierHex: nullHex,
        vote: voteChoice,
        proposalId,
      });

      setTxHash(hash);
      setStep("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrorMsg(msg);
      setStep("error");
    }
  }, [identity, voteChoice, proposalId, identityMatchesSnapshot]);

  const isVotingOpen = proposal ? isProposalActive(proposal) : false;
  const { total, yesPercent, noPercent } = proposal
    ? votePercents(proposal)
    : { total: 0, yesPercent: 0, noPercent: 0 };

  if (loadingProposal) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-2 border-stellar-cyan/30 border-t-stellar-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-6 text-center">
        <p className="text-gray-400 text-xl">
          {loadError ? "Could not load proposal" : "Proposal not found"}
        </p>
        {loadError && (
          <p className="text-sm text-rose-400/90 max-w-md break-words">{loadError}</p>
        )}
        <Link href="/proposals" className="text-stellar-cyan hover:underline">
          ← Back to proposals
        </Link>
      </div>
    );
  }

  const endsAt = new Date(proposal.end_time * 1000).toLocaleString();

  return (
    <HubPage>
      <HubBackLink href="/proposals" label="Proposals" />

        {/* Header */}
        <div className="mb-7">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {isVotingOpen ? (
              <span className="badge badge-live">
                <span className="w-1.5 h-1.5 rounded-full bg-stellar-cyan animate-pulse" />
                Voting
              </span>
            ) : (
              <span className="badge badge-muted">Ended</span>
            )}
            <span className="badge badge-muted">Proposal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
            PRV #{proposalId.toString().padStart(3, "0")}: {proposal.title}
          </h1>
          <p className="text-gray-400 leading-relaxed text-sm md:text-base">
            {proposal.description}
          </p>
        </div>

        {/* Actions */}
        <div className="surface p-6 mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            Actions
          </h2>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li className="flex gap-3">
              <span className="text-stellar-yes font-semibold shrink-0">Yes</span>
              you support this proposal.
            </li>
            <li className="flex gap-3">
              <span className="text-stellar-no font-semibold shrink-0">No</span>
              you oppose this proposal.
            </li>
            <li className="flex gap-3 text-gray-500">
              <span className="text-gray-400 font-semibold shrink-0">Unlinked</span>
              your Stellar wallet never signs the ballot — a Soroban relayer submits the proof.
            </li>
          </ul>
        </div>

        {/* Details table */}
        <DetailTable>
          <DetailRow label="ID" value={`PRV #${proposalId.toString().padStart(3, "0")}`} />
          <DetailRow label="Type" value="Anonymous ballot · Soroban" />
          <DetailRow
            label="Eligibility snapshot"
            value={
              proposal.merkleRoot
                ? `0x${proposal.merkleRoot.slice(0, 10)}…${proposal.merkleRoot.slice(-8)}`
                : "Platform snapshot"
            }
            mono
          />
          <DetailRow
            label="Voting ends"
            value={
              isVotingOpen ? (
                <>
                  {endsAt} (
                  <ClientTimeRemaining endTime={proposal.end_time} />)
                </>
              ) : (
                `${endsAt} (ended)`
              )
            }
          />
          <DetailRow label="Status" value={isVotingOpen ? "Voting" : "Closed"} last />
        </DetailTable>

        {/* Turnout */}
        <div className="mb-8">
          <TurnoutMeter proposal={proposal} />
        </div>

        {/* Results */}
        <HubSectionTitle>Results</HubSectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <MetricCard label="Participation">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-gray-600 mt-1">votes recorded</p>
          </MetricCard>
          <MetricCard label="Approval threshold">
            <p className="text-2xl font-bold text-stellar-cyan">50%</p>
            <p className="text-xs text-gray-600 mt-1">majority of votes cast</p>
          </MetricCard>
          <MetricCard label="Voting period">
            <p className="text-lg font-bold leading-tight">
              {isVotingOpen ? (
                <ClientTimeRemaining endTime={proposal.end_time} />
              ) : (
                "Ended"
              )}
            </p>
            <p className="text-xs text-gray-600 mt-1">Closes {endsAt}</p>
          </MetricCard>
        </div>

        {/* Vote breakdown — Injective-style */}
        <HubSectionTitle>Vote</HubSectionTitle>
        <div className="surface p-6 md:p-8 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-stellar">
            <div>
              <p className="text-xs text-stellar-muted mb-1 uppercase tracking-widest">Total</p>
              <p className="text-xl font-bold tabular-nums">{total} vote{total !== 1 ? "s" : ""}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stellar-muted mb-1 uppercase tracking-widest">Voting ends</p>
              <p className="text-sm text-gray-200">{endsAt}</p>
              {isVotingOpen && (
                <p className="text-xs text-[var(--muted)] mt-1">
                  <ClientTimeRemaining endTime={proposal.end_time} />
                </p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <VoteProgressBar
              yesCount={proposal.yes_count}
              noCount={proposal.no_count}
              className="max-w-full"
            />
            <div className="grid grid-cols-2 gap-4 mt-6">
              <VoteBreakdownCard label="Yes" percent={yesPercent} count={proposal.yes_count} color="yes" />
              <VoteBreakdownCard label="No" percent={noPercent} count={proposal.no_count} color="no" />
            </div>
          </div>

        {/* Cast vote + voters */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
        {/* ── VOTING FLOW ── */}
        {!isVotingOpen ? (
          <div className="surface p-10 text-center">
            <LockIcon className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Voting has closed for this proposal.</p>
          </div>
        ) : step === "success" ? (
          <SuccessCard
            proposalId={proposalId}
            proposalTitle={proposal.title}
            voteChoice={voteChoice}
            nullifier={nullifier}
            txHash={txHash}
          />
        ) : step === "error" ? (
          <div className="surface p-8 text-center border-rose-500/25">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
              {alreadyVoted ? (
                <LockIcon className="w-5 h-5 text-rose-400" />
              ) : (
                <span className="text-rose-400 text-xl">!</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-rose-400 mb-2">
              {alreadyVoted ? "Already Voted" : "Something went wrong"}
            </h2>
            <p className="text-gray-400 text-sm mb-6 break-words max-w-md mx-auto">
              {errorMsg}
            </p>
            <button
              onClick={() => {
                setStep("eligibility");
                setErrorMsg(null);
                setAlreadyVoted(false);
              }}
              className="btn btn-ghost px-6 py-2.5 text-sm"
            >
              Try again
            </button>
          </div>
        ) : step === "proof" || step === "casting" ? (
          <ProofProgress step={step} proofStatus={proofStatus} />
        ) : (
          /* ── ELIGIBILITY + VOTE SELECTION ── */
          <div className="space-y-5">
            {/* Step 1: Eligibility */}
            <div className="surface p-6">
              <StepHeader n={1} title="Prove eligibility" />

              {!connected ? (
                <>
                  <p className="text-gray-400 text-sm mb-5">
                    Connect Freighter — if your wallet was on the proposal&apos;s voter
                    list, you&apos;ll be marked eligible automatically. Your wallet is
                    never linked to your vote on-chain.
                  </p>
                  <button
                    onClick={connect}
                    disabled={connecting}
                    className="btn btn-primary w-full py-3.5 text-sm"
                  >
                    {connecting ? "Connecting…" : "Connect Wallet to Check Eligibility"}
                  </button>
                </>
              ) : isEligible && identity && !identityMatchesSnapshot ? (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                  <span className="text-rose-400">✗</span>
                  <p className="text-sm text-gray-300">
                    This identity belongs to a different voter snapshot than this proposal.
                    Use credentials from the proposal&apos;s snapshot file.
                  </p>
                </div>
              ) : isEligible && identity ? (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-stellar-cyan/[0.06] border border-stellar-cyan/20">
                  <div className="w-9 h-9 rounded-full bg-stellar-cyan/15 border border-stellar-cyan/30 flex items-center justify-center shrink-0">
                    <CheckIcon className="w-4 h-4 text-stellar-cyan" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stellar-cyan">
                      Eligible to vote
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Wallet{" "}
                      <span className="font-mono text-gray-300">
                        {truncateAddress(address!)}
                      </span>{" "}
                      → snapshot voter #{identity.index}. Merkle proof ready.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                  <span className="text-rose-400">✗</span>
                  <p className="text-sm text-gray-300">
                    {proposal?.merkleRoot
                      ? "Import voter-credentials.json from your organizer (Advanced below)."
                      : "Connect an allowlisted wallet or import voter credentials."}
                  </p>
                </div>
              )}

              {/* Judge / tester demo — hidden unless ?demo=1 */}
              {demoMode && (
              <div className="mt-5 p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5">
                  Demo mode
                </p>
                <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">
                  Load a pre-registered snapshot identity to test the full Groth16 → Soroban flow.
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEMO_VOTER_SLOTS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => loadDemoVoter(i)}
                      className="btn btn-secondary text-xs py-2 px-3"
                    >
                      Demo voter #{i}
                    </button>
                  ))}
                </div>
              </div>
              )}

              {/* Credential-based identity (production path for custom snapshots) */}
              <button
                onClick={() => setAdvancedOpen((v) => !v)}
                className="mt-4 text-xs text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center gap-1.5"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${advancedOpen ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Advanced: voter credentials
              </button>

              {advancedOpen && (
                <div className="mt-4 pt-4 border-t border-[#1c1f24] space-y-4">
                  <div>
                    <p className="text-gray-500 text-xs mb-2">
                      Import{" "}
                      <span className="font-mono text-gray-400">voter-credentials.json</span>{" "}
                      from your proposal submitter (custom snapshots).
                    </p>
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={(e) => handleCredentialFile(e.target.files?.[0] ?? null)}
                      className="text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[var(--surface-2)] file:text-gray-300"
                    />
                    {importedIdentities.length > 0 && (
                      <p className="text-xs text-stellar-cyan mt-2">
                        Loaded {importedIdentities.length} voter credential
                        {importedIdentities.length !== 1 ? "s" : ""}.
                      </p>
                    )}
                  </div>
                  <div>
                  <p className="text-gray-500 text-xs mb-3">
                    Paste a <span className="font-mono text-gray-400">secretIdentity</span>{" "}
                    from the snapshot. This is the production-style flow where the
                    secret is decoupled from your wallet.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={secretInput}
                      onChange={(e) => {
                        setSecretInput(e.target.value);
                        setManualChecked(false);
                      }}
                      placeholder="Enter secret identity…"
                      className="input-field font-mono flex-1"
                    />
                    <button
                      onClick={checkManualSecret}
                      disabled={!secretInput.trim()}
                      className="btn btn-ghost px-5 text-sm"
                    >
                      Check
                    </button>
                  </div>
                  {manualChecked && (
                    <p
                      className={`text-xs mt-2.5 ${manualEligible ? "text-stellar-cyan" : "text-rose-400"}`}
                    >
                      {manualEligible
                        ? `✓ Eligible — snapshot voter #${identity?.index}`
                        : manualSnapshotMismatch
                          ? "✗ Secret is valid but for a different proposal snapshot."
                          : "✗ This secret is not in the snapshot."}
                    </p>
                  )}
                  </div>
                </div>
              )}
            </div>

            {/* Already voted (detected before proving) */}
            {hasVotedNullifier ? (
              <div className="surface p-6 border-stellar-cyan/25">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-stellar-cyan/15 border border-stellar-cyan/30 flex items-center justify-center shrink-0">
                    <CheckIcon className="w-4 h-4 text-stellar-cyan" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stellar-cyan">
                      You&apos;ve already voted on this proposal
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Each registered voter can vote once per proposal. Your
                      Proof-of-Vote collectible has been minted.
                    </p>
                    <p className="text-gray-500 text-xs mt-3 mb-1">
                      Anonymous vote receipt
                    </p>
                    <p className="font-mono text-xs text-gray-300 break-all">
                      {hasVotedNullifier}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      Nullifier ID — not linked to your wallet on-chain
                    </p>
                    <div className="flex gap-3 mt-4">
                      <Link href="/verify" className="btn btn-ghost px-4 py-2 text-sm">
                        Verify on-chain
                      </Link>
                      <Link href="/rewards" className="btn btn-primary px-4 py-2 text-sm">
                        View collectibles
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            /* Step 2: Cast vote */
            <div
              className={`surface p-6 transition-all ${
                isEligible && !isCheckingVoted && identityMatchesSnapshot
                  ? ""
                  : "opacity-50 pointer-events-none"
              }`}
            >
              <StepHeader n={2} title="Cast your vote" />

              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  onClick={() => setVoteChoice(1)}
                  className={`py-5 rounded-xl border text-base font-bold transition-all ${
                    voteChoice === 1
                      ? "bg-stellar-cyan/10 border-stellar-cyan text-stellar-cyan neon-glow"
                      : "bg-[#060708] border-[#1c1f24] text-gray-400 hover:border-stellar-cyan/30 hover:text-white"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setVoteChoice(0)}
                  className={`py-5 rounded-xl border text-base font-bold transition-all ${
                    voteChoice === 0
                      ? "bg-rose-500/10 border-rose-500 text-rose-400"
                      : "bg-[#060708] border-[#1c1f24] text-gray-400 hover:border-rose-500/30 hover:text-white"
                  }`}
                >
                  No
                </button>
              </div>

              <button
                onClick={handleVote}
                disabled={voteChoice === null || !isEligible}
                className="btn btn-primary w-full py-4 text-sm"
              >
                Generate ZK Proof &amp; Submit Vote
              </button>

              <p className="text-xs text-gray-600 text-center mt-3">
                Proof is computed locally in your browser. Generation takes a few
                seconds — this is the zero-knowledge math, not a network delay.
              </p>
            </div>
            )}
          </div>
        )}
          </div>

          <aside className="lg:col-span-2">
            <VotersList voters={voters} total={total} />
          </aside>
        </div>
        </div>
    </HubPage>
  );
}

/* ── Small presentational helpers ─────────────────────────────────────────── */

function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="w-6 h-6 rounded-full bg-stellar-cyan/15 text-stellar-cyan text-xs flex items-center justify-center font-bold border border-stellar-cyan/25">
        {n}
      </span>
      <h2 className="font-semibold">{title}</h2>
    </div>
  );
}

function ProofProgress({
  step,
  proofStatus,
}: {
  step: FlowStep;
  proofStatus: ProofStatus;
}) {
  const steps = [
    {
      label: "Load circuit (WASM + proving key)",
      done: proofStatus !== "idle" && proofStatus !== "loading_wasm",
      active: proofStatus === "loading_wasm",
    },
    {
      label: "Compute Groth16 proof locally",
      done: proofStatus === "done" || step === "casting",
      active: proofStatus === "generating",
    },
    {
      label: "Relay vote anonymously to Stellar",
      done: false,
      active: step === "casting",
    },
  ];

  return (
    <div className="surface p-8">
      <div className="flex flex-col items-center text-center mb-7">
        <div className="w-16 h-16 rounded-full border border-stellar-cyan/40 flex items-center justify-center mb-5 relative">
          <div className="w-16 h-16 rounded-full border-2 border-stellar-cyan/20 border-t-stellar-cyan animate-spin absolute" />
          <span className="text-stellar-cyan text-lg font-bold z-10">ZK</span>
        </div>
        <h2 className="text-lg font-bold mb-1.5">
          {step === "casting" ? "Submitting to Stellar…" : "Generating ZK proof…"}
        </h2>
        <p className="text-gray-500 text-sm max-w-xs">
          {proofStatus === "loading_wasm" && "Loading the circuit into your browser…"}
          {proofStatus === "generating" && "Crunching the Groth16 proof — this is local, no server involved."}
          {proofStatus === "done" && step === "casting" && "Proof ready. Relaying your anonymous vote — no wallet signature needed."}
        </p>
      </div>

      <div className="w-full max-w-sm mx-auto space-y-2.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                s.done
                  ? "bg-stellar-cyan border-stellar-cyan text-black"
                  : s.active
                    ? "border-stellar-cyan text-stellar-cyan"
                    : "border-[#2a2e35] text-gray-600"
              }`}
            >
              {s.done ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm ${
                s.active ? "text-white" : s.done ? "text-stellar-cyan" : "text-gray-600"
              }`}
            >
              {s.label}
            </span>
            {s.active && (
              <div className="w-3 h-3 border border-stellar-cyan/30 border-t-stellar-cyan rounded-full animate-spin ml-auto" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessCard({
  proposalId,
  proposalTitle,
  voteChoice,
  nullifier,
  txHash,
}: {
  proposalId: number;
  proposalTitle: string;
  voteChoice: VoteChoice;
  nullifier: string | null;
  txHash: string | null;
}) {
  if (!nullifier || !txHash || voteChoice === null) {
    return null;
  }

  return (
    <div className="surface p-8 border-stellar-cyan/30">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-stellar-cyan/10 border border-stellar-cyan/30 flex items-center justify-center mb-4 neon-glow">
          <CheckIcon className="w-8 h-8 text-stellar-cyan" />
        </div>
        <h2 className="text-xl font-bold text-stellar-cyan mb-2">Vote recorded</h2>
        <p className="text-gray-400 text-sm">
          Your anonymous vote is on Stellar testnet.
        </p>
      </div>

      <PrivacyReceipt
        data={{
          proposalId,
          proposalTitle,
          voteLabel: voteChoice === 1 ? "Yes" : "No",
          nullifier,
          txHash,
          votedAt: new Date().toLocaleString(),
        }}
      />

      <div className="flex gap-3 mt-6">
        <Link href="/proposals" className="btn btn-primary flex-1 py-2.5 text-sm">
          All Proposals
        </Link>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function VoteBreakdownCard({
  label,
  percent,
  count,
  color,
}: {
  label: string;
  percent: number;
  count: number;
  color: "yes" | "no";
}) {
  const cls = color === "yes" ? "text-stellar-yes" : "text-stellar-no";
  const border = color === "yes" ? "border-stellar-yes/20" : "border-stellar-no/20";
  return (
    <div className={`rounded-xl bg-stellar-surface-2 border ${border} p-5`}>
      <p className="text-[11px] text-stellar-muted uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${cls}`}>{percent} %</p>
      <p className="text-xs text-stellar-muted mt-2 tabular-nums">{count} votes</p>
    </div>
  );
}

function VotersList({ voters, total }: { voters: string[]; total: number }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? voters : voters.slice(0, 8);
  return (
    <div className="surface p-5 lg:sticky lg:top-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-200">Voters</h2>
        <span className="text-xs text-gray-600">{total} total</span>
      </div>
      <p className="text-xs text-gray-600 mb-4 leading-relaxed">
        Anonymous nullifiers on-chain. You can see <span className="text-gray-400">that</span> a
        vote was cast, not <span className="text-gray-400">who</span> voted or{" "}
        <span className="text-gray-400">how</span>.
      </p>

      {voters.length === 0 ? (
        <p className="text-gray-600 text-sm py-6 text-center">No votes yet.</p>
      ) : (
        <div className="space-y-1.5">
          {shown.map((n) => (
            <div
              key={n}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[#060708] border border-[#16181c]"
            >
              <span className="font-mono text-xs text-gray-400 truncate">
                anon · {n.slice(0, 6)}…{n.slice(-4)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-600 shrink-0">
                <LockIcon className="w-3.5 h-3.5" />
                Private
              </span>
            </div>
          ))}
          {voters.length > 8 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full text-center text-xs text-stellar-cyan hover:underline pt-2"
            >
              {showAll ? "Show less" : `Show all ${voters.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
