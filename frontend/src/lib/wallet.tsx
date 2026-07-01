"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";

interface WalletContextType {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  connected: false,
  connecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
});

const walletListeners = new Set<() => void>();

function subscribeWallet(onStoreChange: () => void) {
  walletListeners.add(onStoreChange);
  return () => walletListeners.delete(onStoreChange);
}

function notifyWalletListeners() {
  walletListeners.forEach((cb) => cb());
}

function readStoredAddress(): string | null {
  return sessionStorage.getItem("sb_wallet_address");
}

let freighterApi: typeof import("@stellar/freighter-api") | null = null;
if (typeof window !== "undefined") {
  import("@stellar/freighter-api").then((mod) => {
    freighterApi = mod;
    // Initialize the Freighter messaging bridge immediately
    mod.isConnected().then(res => console.log("Freighter init:", res)).catch(console.error);
  }).catch(console.error);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const restoredAddress = useSyncExternalStore(
    subscribeWallet,
    readStoredAddress,
    () => null
  );
  const [liveAddress, setLiveAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const address = liveAddress ?? restoredAddress;

  const connect = useCallback(async () => {
    if (!freighterApi) {
      setError("Freighter wallet not loaded. Please ensure the extension is installed.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      console.log("Requesting access from Freighter...");
      const accessResponse = await freighterApi.requestAccess();
      console.log("Access response:", accessResponse);
      
      if (accessResponse.error) {
        throw new Error(accessResponse.error);
      }

      let addr = accessResponse.address;
      
      // Fallback for older Freighter versions
      if (!addr) {
         console.log("No address from requestAccess, falling back to setAllowed/getAddress");
         await freighterApi.setAllowed();
         const addrResponse = await freighterApi.getAddress();
         console.log("Address response:", addrResponse);
         if (addrResponse.error) throw new Error(addrResponse.error);
         addr = addrResponse.address;
      }

      if (!addr) {
        throw new Error("No address returned from Freighter.");
      }
      setLiveAddress(addr);
      sessionStorage.setItem("sb_wallet_address", addr);
      notifyWalletListeners();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(msg);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setLiveAddress(null);
    sessionStorage.removeItem("sb_wallet_address");
    notifyWalletListeners();
  }, []);

  return (
    <WalletContext.Provider
      value={{ address, connected: !!address, connecting, error, connect, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);

/** Truncate a Stellar address for display, e.g. GABC...XYZ */
export function truncateAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
