"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ActivityEvent {
  id: string;
  type: "ballot" | "quorum" | "milestone";
  proposalId: number;
  title: string;
  message: string;
  at: number;
}

const ICONS: Record<ActivityEvent["type"], string> = {
  ballot: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  quorum: "M13 10V3L4 14h7v7l9-11h-7z",
  milestone: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function LiveActivityFeed({ className = "" }: { className?: string }) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      fetch("/api/activity", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { events: [] }))
        .then((d) => {
          if (!cancelled) {
            setEvents(d.events ?? []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className={`surface p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stellar-cyan opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-stellar-cyan" />
          </span>
          <h2 className="text-sm font-semibold">Live activity</h2>
        </div>
        <span className="text-[10px] text-[var(--muted)] uppercase tracking-widest">
          Anonymous
        </span>
      </div>
      <p className="text-xs text-[var(--muted)] mb-4 leading-relaxed">
        Ballots and milestones — never wallets or vote choices.
      </p>

      {loading && events.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-shimmer rounded-lg" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-[var(--muted)] py-6 text-center">
          No ballots yet. Cast a vote to see activity here.
        </p>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {events.slice(0, 12).map((ev) => (
            <li key={ev.id}>
              <Link
                href={`/vote/${ev.proposalId}`}
                className="flex gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-stellar-cyan/30 transition-colors"
              >
                <svg
                  className="w-4 h-4 text-stellar-cyan shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d={ICONS[ev.type]}
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--foreground)] leading-snug">{ev.message}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-1 truncate">{ev.title}</p>
                </div>
                <span className="text-[10px] text-[var(--muted)] shrink-0 tabular-nums">
                  {timeAgo(ev.at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
