"use client";

import { useWallet, truncateAddress } from "@/lib/wallet";
import ThemeToggle from "@/components/ThemeToggle";

export default function TopBar() {
  const { address, connected, connecting, connect, disconnect } = useWallet();

  return (
    <header className="hidden md:flex sticky top-0 z-30 h-14 items-center justify-end gap-2 px-6 border-b border-[var(--border)] bg-[var(--background)]">
      <ThemeToggle />
      {connected && address ? (
        <>
          <span className="text-sm font-mono text-[var(--muted)]">{truncateAddress(address)}</span>
          <button type="button" onClick={disconnect} className="btn btn-secondary text-sm py-2">
            Disconnect
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={connect}
          disabled={connecting}
          className="btn btn-primary text-sm py-2 disabled:opacity-50"
        >
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
      )}
    </header>
  );
}
