import type { ReactNode } from "react";
import Link from "next/link";

export function Card({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`p-5 bg-[#0f0f10] border border-[#1f1f1f] rounded-xl ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="text-sm font-semibold text-[#f5f5f5]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, href }: { label: string; value: ReactNode; sub?: ReactNode; href?: string }) {
  const body = (
    <div className="h-full p-4 bg-[#0f0f10] border border-[#1f1f1f] rounded-xl hover:border-[#2e2e2e] transition-colors">
      <p className="text-[11px] uppercase tracking-wider text-[#777777] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#f5f5f5] tabular-nums">{value}</p>
      {sub && <p className="text-xs text-[#888888] mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

const TONES = {
  neutral: "bg-[#1f1f1f] text-[#aaaaaa]",
  good: "bg-[#22c55e]/10 text-[#4ade80]",
  warn: "bg-[#f59e0b]/10 text-[#fbbf24]",
  bad: "bg-[#ef4444]/10 text-[#f87171]",
  info: "bg-[#a855f7]/10 text-[#c084fc]",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded ${TONES[tone]}`}>{children}</span>;
}

export function Alert({ tone, children }: { tone: "warn" | "bad" | "info"; children: ReactNode }) {
  const c = { warn: "border-[#f59e0b]/30 bg-[#f59e0b]/5 text-[#fbbf24]", bad: "border-[#ef4444]/30 bg-[#ef4444]/5 text-[#f87171]", info: "border-[#a855f7]/30 bg-[#a855f7]/5 text-[#c4a5f7]" }[tone];
  return <div className={`flex flex-wrap items-center gap-3 px-4 py-3 text-sm border rounded-xl ${c}`}>{children}</div>;
}

export function Button({ children, tone = "neutral", name, value }: { children: ReactNode; tone?: "neutral" | "primary" | "danger" | "good"; name?: string; value?: string }) {
  const c = {
    neutral: "bg-[#1a1a1a] border-[#2e2e2e] text-[#dddddd] hover:border-[#444]",
    primary: "bg-[#a855f7] border-[#a855f7] text-white hover:bg-[#9333ea]",
    danger: "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#f87171] hover:bg-[#ef4444]/20",
    good: "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#4ade80] hover:bg-[#22c55e]/20",
  }[tone];
  return (
    <button type="submit" name={name} value={value} className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${c}`}>
      {children}
    </button>
  );
}

export function Stars({ value, size = "text-sm" }: { value: number; size?: string }) {
  const full = Math.round(value);
  return (
    <span className={`${size} tracking-tight`} aria-label={`${value.toFixed(1)} out of 5`}>
      <span className="text-[#fbbf24]">{"★".repeat(full)}</span>
      <span className="text-[#333333]">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export const ago = (ts: number) => {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};
