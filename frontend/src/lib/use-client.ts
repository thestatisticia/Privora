import { useSyncExternalStore } from "react";

/** True after client hydration — avoids setState-in-effect for mount guards. */
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
