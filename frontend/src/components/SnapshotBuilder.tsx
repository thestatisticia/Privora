"use client";

import { useMemo, useState } from "react";
import {
  buildSnapshotFromWallets,
  downloadSnapshotBundle,
  SNAPSHOT_MAX_VOTERS,
} from "@/lib/snapshot-builder";
import type { BuiltSnapshot } from "@/lib/types/snapshot";

type SnapshotMode = "platform" | "custom";

/** Matches public/merkle_root.json — platform demo snapshot. */
export const PLATFORM_ROOT =
  "22889593495014049417157895632155058930916541121165646947370585817827020662216";
export const PLATFORM_VOTER_COUNT = 16;

const STELLAR_ADDRESS = /^G[A-Z2-7]{55}$/;

function parseWalletLines(text: string): { valid: string[]; invalid: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const line of lines) {
    const wallet = line.split(/[,\s#]/)[0]?.trim() ?? "";
    if (STELLAR_ADDRESS.test(wallet)) {
      if (!valid.includes(wallet)) valid.push(wallet);
    } else {
      invalid.push(line);
    }
  }
  return { valid: valid.slice(0, SNAPSHOT_MAX_VOTERS), invalid };
}

async function registerSnapshot(
  snapshot: BuiltSnapshot,
  wallets: string[],
  label?: string
): Promise<void> {
  await fetch("/api/snapshots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merkleRootDecimal: snapshot.root,
      merkleRootHex: snapshot.rootHex,
      voterCount: snapshot.voterCount,
      wallets,
      label,
    }),
  });
}

export function useSnapshotSelection() {
  const [mode, setMode] = useState<SnapshotMode>("custom");
  const [voterText, setVoterText] = useState("");
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [customSnapshot, setCustomSnapshot] = useState<BuiltSnapshot | null>(null);

  const parsed = useMemo(() => parseWalletLines(voterText), [voterText]);

  const activeRoot =
    mode === "custom" && customSnapshot ? customSnapshot.root : PLATFORM_ROOT;

  const activeVoterCount =
    mode === "custom" && customSnapshot
      ? customSnapshot.voterCount
      : PLATFORM_VOTER_COUNT;

  const buildCustom = async () => {
    if (parsed.valid.length === 0) {
      setBuildError("Add at least one valid Stellar address (starts with G, 56 characters).");
      return;
    }
    setBuilding(true);
    setBuildError(null);
    try {
      const snapshot = await buildSnapshotFromWallets(parsed.valid);
      await registerSnapshot(snapshot, parsed.valid, "Custom proposal snapshot");
      setCustomSnapshot(snapshot);
    } catch (err) {
      setBuildError(err instanceof Error ? err.message : "Failed to build snapshot");
      setCustomSnapshot(null);
    } finally {
      setBuilding(false);
    }
  };

  const resetCustom = () => {
    setCustomSnapshot(null);
    setBuildError(null);
  };

  return {
    mode,
    setMode: (m: SnapshotMode) => {
      setMode(m);
      resetCustom();
    },
    voterText,
    setVoterText: (t: string) => {
      setVoterText(t);
      resetCustom();
    },
    parsed,
    building,
    buildError,
    customSnapshot,
    buildCustom,
    activeRoot,
    activeVoterCount,
    canSubmit: mode === "platform" || customSnapshot !== null,
    needsSnapshotBuild: mode === "custom" && !customSnapshot,
  };
}

export function SnapshotBuilderPanel(props: ReturnType<typeof useSnapshotSelection>) {
  const {
    mode,
    setMode,
    voterText,
    setVoterText,
    parsed,
    building,
    buildError,
    customSnapshot,
    buildCustom,
    activeRoot,
    activeVoterCount,
    needsSnapshotBuild,
  } = props;

  return (
    <section className="rounded-2xl border-2 border-stellar-cyan/20 bg-stellar-cyan/[0.03] p-5 md:p-6 space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-stellar-cyan mb-1">
          Step 2 · Who can vote?
        </p>
        <h2 className="text-lg font-semibold mb-2">Eligible voter snapshot</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Paste the <strong className="text-gray-300">Stellar wallet addresses</strong> allowed
          to vote. Privora builds a Merkle tree and stores the root on-chain. Listed wallets
          can connect Freighter on the vote page and are recognized automatically — no copy/paste
          required.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`py-3 px-4 rounded-xl border text-left text-sm transition-all ${
            mode === "custom"
              ? "bg-stellar-cyan/10 border-stellar-cyan text-stellar-cyan"
              : "bg-[#060708] border-[#1c1f24] text-gray-400 hover:border-stellar-cyan/30"
          }`}
        >
          <span className="font-semibold block">My voter list</span>
          <span className="text-xs opacity-80 mt-0.5">Paste eligible wallet addresses</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("platform")}
          className={`py-3 px-4 rounded-xl border text-left text-sm transition-all ${
            mode === "platform"
              ? "bg-stellar-cyan/10 border-stellar-cyan text-stellar-cyan"
              : "bg-[#060708] border-[#1c1f24] text-gray-400 hover:border-stellar-cyan/30"
          }`}
        >
          <span className="font-semibold block">Platform demo</span>
          <span className="text-xs opacity-80 mt-0.5">16 pre-registered test voters</span>
        </button>
      </div>

      {mode === "custom" ? (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="voter-wallets"
              className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2"
            >
              Eligible Stellar wallets
            </label>
            <textarea
              id="voter-wallets"
              value={voterText}
              onChange={(e) => setVoterText(e.target.value)}
              placeholder={`GDCYHMPLBJCLSVKJWVYYSWDUDHUCAUV7Y2CWFE67XTCW35EG47QM276X\nGBX6VOHHHKE4LMEIECXSJMSZGPY3YZE4XKEELNOIJRRH2BVAGJ2RP3W2\nGDQ2TQ5Z2DLKWI4RLSNAWXF4UCQUIODB5A6NU2HL2UEOXZ3OT7PFQXXT`}
              rows={8}
              className="input-field w-full resize-y font-mono text-xs leading-relaxed"
            />
            <p className="text-xs text-gray-500 mt-2">
              One address per line · max {SNAPSHOT_MAX_VOTERS} wallets · commas and comments after{" "}
              <span className="font-mono text-gray-400">#</span> are ignored
            </p>
          </div>

          {(parsed.valid.length > 0 || parsed.invalid.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {parsed.valid.length > 0 && (
                <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                  <p className="text-stellar-cyan font-semibold mb-2">
                    {parsed.valid.length} valid wallet{parsed.valid.length !== 1 ? "s" : ""}
                  </p>
                  <ul className="space-y-1 font-mono text-gray-400 max-h-24 overflow-y-auto">
                    {parsed.valid.map((w) => (
                      <li key={w} className="truncate">
                        {w.slice(0, 8)}…{w.slice(-6)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {parsed.invalid.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                  <p className="text-rose-400 font-semibold mb-2">
                    {parsed.invalid.length} invalid line{parsed.invalid.length !== 1 ? "s" : ""}
                  </p>
                  <ul className="space-y-1 text-gray-500 max-h-24 overflow-y-auto">
                    {parsed.invalid.map((l) => (
                      <li key={l} className="truncate font-mono">
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={buildCustom}
            disabled={building || parsed.valid.length === 0}
            className="btn btn-primary w-full py-3 text-sm"
          >
            {building
              ? "Building Merkle tree…"
              : `Build Merkle snapshot (${parsed.valid.length || 0} voters)`}
          </button>

          {buildError && <p className="text-rose-400 text-sm">{buildError}</p>}

          {needsSnapshotBuild && parsed.valid.length > 0 && !building && (
            <p className="text-amber-400/90 text-xs">
              Build the snapshot before submitting — this locks the eligible voter set on-chain.
            </p>
          )}

          {customSnapshot && (
            <div className="p-4 rounded-xl bg-stellar-cyan/5 border border-stellar-cyan/25 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-stellar-cyan text-lg">✓</span>
                <div>
                  <p className="text-sm font-semibold text-stellar-cyan">
                    Merkle snapshot ready
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {customSnapshot.voterCount} eligible voters · root committed at submit
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-mono break-all bg-black/20 rounded-lg p-2">
                0x{customSnapshot.rootHex}
              </p>
              <div className="text-xs text-gray-400 space-y-1.5 border-t border-stellar-cyan/10 pt-3">
                <p className="font-medium text-gray-300">After approval:</p>
                <p className="text-gray-500">
                  Wallets on this list connect Freighter on the vote page — eligibility is
                  automatic. The credentials file is optional backup for auditors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadSnapshotBundle(customSnapshot)}
                className="btn btn-secondary w-full py-2.5 text-sm"
              >
                Download voter credentials (.json) — optional
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-gray-400">
          Uses the shared Privora demo tree ({PLATFORM_VOTER_COUNT} voters). Judges can use{" "}
          <span className="text-gray-300">Demo voter #1–4</span> on the vote page — no wallet
          list needed.
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2 border-t border-[var(--border-subtle)]">
        <span>
          Eligible voters:{" "}
          <strong className="text-gray-300 tabular-nums">{activeVoterCount}</strong>
        </span>
        <span className="font-mono truncate max-w-[min(100%,280px)]">
          Merkle root: {activeRoot.slice(0, 14)}…
        </span>
      </div>
    </section>
  );
}
