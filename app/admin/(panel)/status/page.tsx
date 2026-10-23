import type { Metadata } from "next";
import { headers } from "next/headers";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { runChecks, type CheckState } from "@/lib/system-status";
import { Card } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Status" };
export const dynamic = "force-dynamic";

const ICON: Record<CheckState, JSX.Element> = {
  ok: <CheckCircle2 size={16} className="text-[#4ade80]" aria-label="OK" />,
  warn: <AlertTriangle size={16} className="text-[#fbbf24]" aria-label="Warning" />,
  fail: <XCircle size={16} className="text-[#f87171]" aria-label="Problem" />,
};

export default async function StatusAdmin() {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "toolninja.io";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const checks = await runChecks(`${proto}://${host}`);
  const groups = Array.from(new Set(checks.map((c) => c.group)));
  const counts = { ok: 0, warn: 0, fail: 0 };
  checks.forEach((c) => counts[c.state]++);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-[#4ade80]">{ICON.ok} {counts.ok} OK</span>
        <span className="flex items-center gap-1.5 text-[#fbbf24]">{ICON.warn} {counts.warn} warnings</span>
        <span className="flex items-center gap-1.5 text-[#f87171]">{ICON.fail} {counts.fail} problems</span>
        <span className="text-xs text-[#666666] self-center">Checked live just now</span>
      </div>
      {groups.map((g) => (
        <Card key={g} title={g}>
          <ul className="divide-y divide-[#1a1a1a]">
            {checks
              .filter((c) => c.group === g)
              .map((c) => (
                <li key={c.label} className="flex items-start gap-3 py-2.5">
                  <span className="mt-0.5 shrink-0">{ICON[c.state]}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-[#dddddd]">{c.label}</span>
                    <span className="block text-xs text-[#888888] break-words">{c.detail}</span>
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
