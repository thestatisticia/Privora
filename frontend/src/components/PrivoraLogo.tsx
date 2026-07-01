"use client";

import Link from "next/link";
import { useIsClient } from "@/lib/use-client";

type Size = "sm" | "md" | "lg";

const ICON: Record<Size, string> = {
  sm: "w-6 h-6",
  md: "w-7 h-7",
  lg: "w-9 h-9",
};

const TEXT: Record<Size, string> = {
  sm: "text-sm",
  md: "text-[15px]",
  lg: "text-lg",
};

export function PrivoraMark({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="9"
        stroke="currentColor"
        strokeWidth="1.25"
        className="text-[var(--accent)]"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path
        d="M10.5 23.5V8.5h6.4c3.6 0 6.1 2.3 6.1 5.7 0 2.6-1.4 4.4-3.5 5.1l3.2 4.2h-3.5l-2.8-6.4h-3.7v6.4h-3.2zm3.2-9.2h2.9c1.7 0 2.8-1 2.8-2.4s-1.1-2.4-2.8-2.4h-2.9v4.8z"
        fill="currentColor"
        className="text-[var(--foreground)]"
      />
      <circle cx="23" cy="10.5" r="2" fill="currentColor" className="text-[var(--accent)]" />
    </svg>
  );
}

type Props = {
  size?: Size;
  showText?: boolean;
  className?: string;
  href?: string | null;
};

export default function PrivoraLogo({
  size = "md",
  showText = true,
  className = "",
  href = "/",
}: Props) {
  const mounted = useIsClient();

  const inner = (
    <>
      <PrivoraMark className={`${ICON[size]} shrink-0 logo-mark`} />
      {showText && (
        <span className={`${TEXT[size]} font-semibold tracking-[-0.02em]`} suppressHydrationWarning>
          Priv<span className="text-[var(--accent)]">ora</span>
        </span>
      )}
    </>
  );

  const base = `flex items-center gap-2.5 shrink-0 ${className}`;

  if (href) {
    return (
      <Link href={href} className={base} suppressHydrationWarning>
        {mounted ? inner : (
          <>
            <PrivoraMark className={`${ICON[size]} shrink-0 logo-mark`} />
            {showText && <span className={`${TEXT[size]} font-semibold tracking-[-0.02em]`}>Privora</span>}
          </>
        )}
      </Link>
    );
  }

  return <div className={base}>{inner}</div>;
}
