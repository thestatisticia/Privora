import Link from "next/link";

export function HubPage({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto px-6 md:px-10 py-10 md:py-12 animate-fade-in-up ${
        wide ? "max-w-6xl" : "max-w-5xl"
      }`}
    >
      {children}
    </div>
  );
}

export function HubBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm text-stellar-muted hover:text-[var(--foreground)] mb-7 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}

export function HubSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-white mb-4 tracking-tight">{children}</h2>
  );
}

export function HubPageTitle({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-10">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{children}</h1>
      {subtitle && <p className="text-stellar-muted text-sm md:text-base">{subtitle}</p>}
    </div>
  );
}

export function DetailTable({ children }: { children: React.ReactNode }) {
  return <div className="surface mb-8 overflow-hidden">{children}</div>;
}

export function DetailRow({
  label,
  value,
  mono,
  last,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-6 px-6 py-4 ${
        last ? "" : "border-b border-[var(--border-subtle)]"
      }`}
    >
      <span className="text-sm text-stellar-muted">{label}</span>
      <span className={`text-sm text-[var(--foreground)] text-right ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export function MetricCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface p-6">
      <p className="text-[11px] text-stellar-muted uppercase tracking-[0.14em] font-semibold mb-3">
        {label}
      </p>
      {children}
    </div>
  );
}
