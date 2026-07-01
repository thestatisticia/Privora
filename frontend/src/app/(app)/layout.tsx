import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen mesh-bg-app">
      <Sidebar />
      <div className="md:pl-[16.5rem] pt-14 md:pt-0 min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
