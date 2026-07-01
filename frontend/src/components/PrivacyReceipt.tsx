"use client";

import { useState } from "react";
import Link from "next/link";

export interface PrivacyReceiptData {
  proposalId: number;
  proposalTitle: string;
  voteLabel: "Yes" | "No";
  nullifier: string;
  txHash: string;
  votedAt: string;
}

const PUBLIC_ROWS = [
  "Yes / No tally updated",
  "Nullifier recorded on Soroban",
  "Groth16 proof verified on-chain",
  "Proof-of-Vote collectible minted",
];

const PRIVATE_ROWS = [
  "Your Stellar wallet (ballot tx)",
  "Secret identity & Merkle leaf",
  "Which snapshot voter you are",
];

export default function PrivacyReceipt({ data }: { data: PrivacyReceiptData }) {
  const [copied, setCopied] = useState<string | null>(null);
  const verifyHref = `/verify?nullifier=${encodeURIComponent(data.nullifier)}&proposalId=${data.proposalId}`;

  const receiptJson = JSON.stringify(
    {
      type: "privora-privacy-receipt",
      version: 1,
      ...data,
      verifyUrl: typeof window !== "undefined" ? `${window.location.origin}${verifyHref}` : verifyHref,
    },
    null,
    2
  );

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const download = () => {
    const blob = new Blob([receiptJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `privora-receipt-prv-${data.proposalId.toString().padStart(3, "0")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-stellar-cyan/25 bg-gradient-to-br from-stellar-cyan/5 to-transparent p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stellar-cyan mb-2">
          Privacy receipt
        </p>
        <p className="text-sm font-semibold mb-1">{data.proposalTitle}</p>
        <p className="text-xs text-[var(--muted)] mb-4">
          PRV #{data.proposalId.toString().padStart(3, "0")} · {data.votedAt}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-[var(--surface-2)] p-3">
            <p className="text-[10px] text-[var(--muted)] uppercase mb-1">Your vote</p>
            <p
              className={`font-bold ${data.voteLabel === "Yes" ? "text-stellar-yes" : "text-stellar-no"}`}
            >
              {data.voteLabel}
            </p>
          </div>
          <div className="rounded-lg bg-[var(--surface-2)] p-3">
            <p className="text-[10px] text-[var(--muted)] uppercase mb-1">On-chain</p>
            <p className="text-xs font-mono text-stellar-cyan truncate">{data.txHash.slice(0, 14)}…</p>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-[10px] text-[var(--muted)] uppercase mb-1">Nullifier</p>
          <p className="font-mono text-xs break-all text-[var(--text-secondary)]">{data.nullifier}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copy(data.nullifier, "nf")}
            className="btn btn-ghost text-xs py-2 px-3"
          >
            {copied === "nf" ? "Copied" : "Copy nullifier"}
          </button>
          <button
            type="button"
            onClick={() => copy(receiptJson, "json")}
            className="btn btn-ghost text-xs py-2 px-3"
          >
            {copied === "json" ? "Copied" : "Copy receipt JSON"}
          </button>
          <button type="button" onClick={download} className="btn btn-ghost text-xs py-2 px-3">
            Download receipt
          </button>
          <Link href={verifyHref} className="btn btn-primary text-xs py-2 px-3">
            Verify on-chain →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-[var(--border-subtle)] p-4">
          <p className="font-semibold text-stellar-yes mb-2 uppercase tracking-wider text-[10px]">
            Public on-chain
          </p>
          <ul className="space-y-1.5 text-[var(--text-secondary)]">
            {PUBLIC_ROWS.map((row) => (
              <li key={row} className="flex gap-2">
                <span className="text-stellar-yes">✓</span>
                {row}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] p-4">
          <p className="font-semibold text-[var(--muted)] mb-2 uppercase tracking-wider text-[10px]">
            Never revealed
          </p>
          <ul className="space-y-1.5 text-[var(--muted)]">
            {PRIVATE_ROWS.map((row) => (
              <li key={row} className="flex gap-2">
                <span>—</span>
                {row}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
