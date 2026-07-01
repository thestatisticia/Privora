import LandingNav from "@/components/LandingNav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen mesh-bg-hero">
      <LandingNav />
      <main>{children}</main>
    </div>
  );
}
