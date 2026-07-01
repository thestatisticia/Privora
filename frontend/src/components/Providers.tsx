"use client";

import { ThemeProvider } from "@/lib/theme";
import { WalletProvider } from "@/lib/wallet";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WalletProvider>{children}</WalletProvider>
    </ThemeProvider>
  );
}
