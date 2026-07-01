"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

/** Judge / tester UI — append ?demo=1 to any app URL. */
export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribe, getDemoMode, () => false);
}
