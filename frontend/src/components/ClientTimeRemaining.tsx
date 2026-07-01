"use client";

import { useEffect, useState } from "react";
import { timeRemaining } from "@/lib/proposal-utils";

type Props = {
  endTime: number;
  /** Shown on server + first client paint to avoid hydration mismatch */
  placeholder?: string;
  className?: string;
};

/**
 * Countdown that only reads Date.now() after mount — prevents SSR/client drift.
 */
export default function ClientTimeRemaining({
  endTime,
  placeholder = "…",
  className,
}: Props) {
  const [label, setLabel] = useState(placeholder);

  useEffect(() => {
    const update = () => setLabel(timeRemaining(endTime));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [endTime]);

  return (
    <span className={className} suppressHydrationWarning>
      {label}
    </span>
  );
}
