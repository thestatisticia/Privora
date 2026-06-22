"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import PrivoraLogo from "@/components/PrivoraLogo";

const NAV_LINKS = [
  { href: "/proposals", label: "Governance" },
  { href: "#how-it-works", label: "How it works" },
  { href: "/verify", label: "Verify" },
  { href: "#live-vote", label: "Live vote" },
] as const;

export default function LandingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="nav-bar fixed top-0 inset-x-0 z-50 h-16">
      <div className="h-full w-full px-5 sm:px-8 lg:px-10 flex items-center">
        <div className="flex-shrink-0 min-w-[140px]">
          <PrivoraLogo />
        </div>

        <nav className="hidden lg:flex flex-1 items-center justify-center gap-10 xl:gap-14">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                link.href.startsWith("/") && pathname.startsWith(link.href)
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex-shrink-0 min-w-[140px] flex items-center justify-end gap-2 ml-auto lg:ml-0">
          <ThemeToggle />
          <Link href="/proposals" prefetch className="btn btn-primary text-sm py-2.5 hidden sm:inline-flex">
            Launch app
          </Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            className="lg:hidden p-2 text-[var(--foreground)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[var(--border)] bg-[var(--background)] px-5 py-4 flex flex-col">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-3 text-sm text-[var(--muted)] hover:text-[var(--foreground)] border-b border-[var(--border)] last:border-0"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/proposals"
            onClick={() => setOpen(false)}
            className="btn btn-primary w-full mt-4 text-sm"
          >
            Launch app
          </Link>
        </div>
      )}
    </header>
  );
}
