"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/hub/TopBar";
import LandingNav from "@/components/LandingNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return (
      <div className="min-h-screen mesh-bg-hero">
        <LandingNav />
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg">
      <Sidebar />
      <div className="md:pl-[15.5rem] pt-14 md:pt-0 min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
