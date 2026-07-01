"use client";

import { useEffect, useState } from "react";
import { HubPage } from "@/components/hub/HubPage";

export default function VerifyPage() {
  const [nullifierInput, setNullifierInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("nullifier") ?? "";
  });
  const [proposalInput, setProposalInput] = useState(() => {
    if (typeof window === "undefined") return "0";
    return new URLSearchParams(window.location.search).get("proposalId") ?? "0";
  });
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<"found" | "not_found" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nf = params.get("nullifier");
    const pid = params.get("proposalId");
    if (!nf || !pid) return;
    const q = new URLSearchParams({ nullifier: nf, proposalId: pid });
    fetch(`/api/nullifier?${q}`)
      .then((r) => r.json())
      .then((data) => setResult(data.used ? "found" : "not_found"))
      .catch(() => setResult("not_found"));
  }, []);

  const handleCheck = async () => {
    if (!nullifierInput.trim()) return;
    setChecking(true);
    setResult(null);
    try {
      const q = new URLSearchParams({
        nullifier: nullifierInput.trim(),
        proposalId: proposalInput,
      });
      const r = await fetch(`/api/nullifier?${q}`);
      const data = await r.json();
      setResult(data.used ? "found" : "not_found");
    } catch {
      setResult("not_found");
    } finally {
      setChecking(false);
    }
  };

  return (
    <HubPage>
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-3">
            Verify a <span className="text-stellar-cyan">vote</span>
          </h1>
          <p className="text-gray-400 leading-relaxed max-w-lg">
            Confirm a vote was recorded on Soroban using your anonymous vote receipt —
            without revealing who cast it.
          </p>
        </div>

        {/* Explainer */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { d: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z", title: "Vote receipt", desc: "A unique nullifier ID from your secret identity and the proposal." },
            { d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", title: "Anonymous", desc: "Proves a vote exists without linking it to any wallet." },
            { d: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1", title: "On-chain", desc: "Stored in the Soroban contract — verifiable by anyone." },
          ].map((item) => (
            <div key={item.title} className="surface p-4 text-center">
              <svg className="w-5 h-5 text-stellar-cyan mx-auto mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.d} />
              </svg>
              <p className="text-white text-xs font-semibold mb-1">{item.title}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Input Form */}
        <div className="surface p-8">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 font-medium mb-2">
                Anonymous vote receipt ID
              </label>
              <input
                type="text"
                value={nullifierInput}
                onChange={(e) => { setNullifierInput(e.target.value); setResult(null); }}
                placeholder="Paste receipt ID from your privacy receipt (decimal or hex)"
                className="w-full bg-black border border-[#222] rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 focus:outline-none focus:border-stellar-cyan/50 transition-colors"
              />
              <p className="text-xs text-gray-600 mt-1.5">
                Shown after you vote, on your privacy receipt. Technically this is a Poseidon
                nullifier — it proves participation without your wallet.
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 font-medium mb-2">
                Proposal ID
              </label>
              <input
                type="number"
                value={proposalInput}
                onChange={(e) => { setProposalInput(e.target.value); setResult(null); }}
                min="0"
                className="w-full bg-black border border-[#222] rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 focus:outline-none focus:border-stellar-cyan/50 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleCheck}
            disabled={checking || !nullifierInput.trim()}
            className="btn btn-primary w-full py-4 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {checking ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Checking on-chain…
              </span>
            ) : (
              "Verify receipt →"
            )}
          </button>

          {/* Result */}
          {result && (
            <div className={`mt-6 rounded-xl p-5 border flex items-start gap-4 transition-all ${
              result === "found"
                ? "bg-stellar-cyan/5 border-stellar-cyan/25 text-stellar-cyan"
                : "bg-[#111] border-[#222] text-gray-400"
            }`}>
              <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-lg shrink-0 ${
                result === "found" ? "border-stellar-cyan/40 bg-stellar-cyan/10" : "border-[#333]"
              }`}>
                {result === "found" ? "✓" : "—"}
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">
                  {result === "found" ? "Vote recorded" : "Not found"}
                </p>
                <p className="text-xs opacity-70 leading-relaxed">
                  {result === "found"
                    ? "This receipt ID is registered in the Soroban contract. A valid Groth16 proof was submitted for this proposal."
                    : "No vote with this receipt ID was found for this proposal. Check the proposal ID or paste the ID from your privacy receipt."}
                </p>
                {result === "found" && (
                  <p className="text-xs opacity-50 mt-2 font-mono break-all">{nullifierInput}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* How it works footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-xs">
            Powered by Groth16 zero-knowledge proofs on{" "}
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stellar-cyan hover:underline"
            >
              Stellar Soroban
            </a>
          </p>
        </div>
    </HubPage>
  );
}
