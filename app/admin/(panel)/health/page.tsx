import type { Metadata } from "next";
import Link from "next/link";
import { runContentHealth, type Severity } from "@/lib/content-health";
import { Badge, Card, Stat } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Content health" };
export const dynamic = "force-dynamic";

const TONE: Record<Severity, "bad" | "warn" | "info"> = { error: "bad", warn: "warn", info: "info" };
const WORD: Record<Severity, string> = { error: "fix", warn: "improve", info: "idea" };

export default function HealthAdmin() {
  const { findings, stats } = runContentHealth();
  const errors = findings.filter((f) => f.severity === "error").reduce((n, f) => n + f.items.length, 0);
  const warns = findings.filter((f) => f.severity === "warn").reduce((n, f) => n + f.items.length, 0);
  const pct = (n: number) => `${Math.round((n / stats.tools) * 100)}%`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Must fix" value={errors} sub={errors ? "broken links or pages" : "nothing broken"} />
        <Stat label="Worth improving" value={warns} />
        <Stat label="Tools with FAQ" value={pct(stats.withFaq)} sub={`${stats.withFaq} of ${stats.tools}`} />
        <Stat label="Tools with a guide" value={pct(stats.withGuide)} sub={`${stats.withGuide} of ${stats.tools}`} />
        <Stat label="Custom titles" value={pct(stats.customMeta)} sub={`${stats.customMeta} of ${stats.tools}`} />
      </div>

      {!findings.length && <Card>Everything checks out.</Card>}

      {findings.map((f) => (
        <Card
          key={f.title}
          title={`${f.title} (${f.items.length})`}
          action={
            <span className="flex items-center gap-2">
              <span className="text-[11px] text-[#666666]">{f.area}</span>
              <Badge tone={TONE[f.severity]}>{WORD[f.severity]}</Badge>
            </span>
          }
        >
          <p className="text-xs text-[#777777] mb-3">{f.hint}</p>
          <details open={f.severity === "error" || f.items.length <= 8}>
            <summary className="text-xs text-[#888888] cursor-pointer hover:text-[#f5f5f5] mb-2">Show {f.items.length}</summary>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {f.items.map((it, i) => (
                <li key={i} className="min-w-0 truncate">
                  {it.href ? (
                    <Link href={it.href} className="text-[#dddddd] hover:text-[#a855f7]">
                      {it.label}
                    </Link>
                  ) : (
                    <span className="text-[#dddddd]">{it.label}</span>
                  )}
                  {it.detail && <span className="text-xs text-[#777777]"> · {it.detail}</span>}
                </li>
              ))}
            </ul>
          </details>
        </Card>
      ))}
    </div>
  );
}
