import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet";
import { ThemeProvider } from "@/lib/theme";
import AppShell from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

const display = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  title: "Privora — Anonymous Voting on Stellar",
  description:
    "Vote privately on Stellar Soroban with zero-knowledge proofs. Prove you're eligible without revealing who you are or how you voted.",
  openGraph: {
    title: "Privora",
    description: "Anonymous governance on Stellar — zero-knowledge voting on Soroban.",
    type: "website",
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: "Privora" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('privora-theme')||localStorage.getItem('sb-theme');document.documentElement.classList.add(t==='light'?'light':'dark');}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className={`${display.variable} ${inter.variable} antialiased bg-stellar-base text-[var(--foreground)]`}>
        <ThemeProvider>
          <WalletProvider>
            <AppShell>{children}</AppShell>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
