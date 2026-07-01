"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWallet, truncateAddress } from "@/lib/wallet";
import ThemeToggle from "@/components/ThemeToggle";
import PrivoraLogo from "@/components/PrivoraLogo";

type NavItem = { href: string; label: string; icon: React.ReactNode };
type NavGroup = { heading: string; items: NavItem[] };

function Icon({ d }: { d: string }) {
  return (
    <svg className="w-[17px] h-[17px] shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
    </svg>
  );
}

const ICONS = {
  governance: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  submit: "M12 4v16m8-8H4",
  rewards: "M12 2l2.4 6.9H22l-6 4.3 2.3 7-6.3-4.5L5.7 20l2.3-7-6-4.3h7.6z",
  verify: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  review: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
};

function useNavGroups(): NavGroup[] {
  return [
    {
      heading: "Governance",
      items: [
        { href: "/proposals", label: "Proposals", icon: <Icon d={ICONS.governance} /> },
        { href: "/create", label: "Submit + voter list", icon: <Icon d={ICONS.submit} /> },
      ],
    },
    {
      heading: "Rewards & verify",
      items: [
        { href: "/rewards", label: "Rewards hub", icon: <Icon d={ICONS.rewards} /> },
        { href: "/verify", label: "Verify vote", icon: <Icon d={ICONS.verify} /> },
      ],
    },
    {
      heading: "Administration",
      items: [{ href: "/review", label: "Review queue", icon: <Icon d={ICONS.review} /> }],
    },
  ];
}

function Logo() {
  return <PrivoraLogo size="sm" />;
}

function WalletBlock() {
  const { address, connected, connecting, connect, disconnect } = useWallet();
  if (connected && address) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-mono text-[var(--muted)] truncate px-1">{truncateAddress(address)}</p>
        <button type="button" onClick={disconnect} className="btn btn-secondary w-full text-xs py-2">
          Disconnect
        </button>
      </div>
    );
  }
  return (
    <button type="button" onClick={connect} disabled={connecting} className="btn btn-primary w-full text-sm py-2">
      {connecting ? "Connecting…" : "Connect wallet"}
    </button>
  );
}

function NavList({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {groups.map((group) => (
        <div key={group.heading}>
          <p className="px-2.5 mb-1.5 text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">
            {group.heading}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const cls = `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
                active
                  ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
              }`;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={onNavigate}
                  className={cls}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  const groups = useNavGroups();
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-[15.5rem] flex-col shell-border-r bg-[var(--background)] z-40">
        <div className="px-4 h-14 flex items-center shell-border-b">
          <Logo />
        </div>
        <NavList groups={groups} />
        <div className="p-3 shell-border-t space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Theme</span>
            <ThemeToggle />
          </div>
          <WalletBlock />
        </div>
      </aside>

      <div className="md:hidden fixed top-0 inset-x-0 h-14 flex items-center justify-between px-4 shell-border-b bg-[var(--background)] z-50">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 flex flex-col bg-[var(--background)] shell-border-r">
            <div className="px-4 h-14 flex items-center justify-between shell-border-b">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <NavList groups={groups} onNavigate={() => setOpen(false)} />
            <div className="p-3 shell-border-t">
              <WalletBlock />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
