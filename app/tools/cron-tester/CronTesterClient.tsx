"use client";

import { useEffect, useMemo, useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Clock, AlertCircle, AlertTriangle, ChevronDown } from "lucide-react";
import { DIALECTS, parseCron, nextRuns, describe, convert, minGapMs, type CronDialect } from "@/lib/cron";

const STORAGE_KEY = "toolninja:cron-tester";

const FIELD_LABELS: Record<CronDialect, string[]> = {
  standard: ["Minute", "Hour", "Day", "Month", "Weekday"],
  github: ["Minute", "Hour", "Day", "Month", "Weekday"],
  kubernetes: ["Minute", "Hour", "Day", "Month", "Weekday"],
  aws: ["Minute", "Hour", "Day", "Month", "Weekday", "Year"],
  quartz: ["Second", "Minute", "Hour", "Day", "Month", "Weekday", "Year"],
  spring: ["Second", "Minute", "Hour", "Day", "Month", "Weekday"],
};

const PRESETS: Record<"five" | "aws" | "seconds", { label: string; value: string }[]> = {
  five: [
    { label: "Every 15 minutes", value: "*/15 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every day at 03:00", value: "0 3 * * *" },
    { label: "Weekdays at 09:00", value: "0 9 * * 1-5" },
    { label: "Sundays at midnight", value: "0 0 * * 0" },
    { label: "1st of every month", value: "0 0 1 * *" },
  ],
  aws: [
    { label: "Every 15 minutes", value: "cron(0/15 * * * ? *)" },
    { label: "Weekdays at 09:00", value: "cron(0 9 ? * MON-FRI *)" },
    { label: "Last day of the month", value: "cron(0 0 L * ? *)" },
    { label: "Last Friday at 18:00", value: "cron(0 18 ? * 6L *)" },
    { label: "2nd Tuesday at 10:00", value: "cron(0 10 ? * 3#2 *)" },
  ],
  seconds: [
    { label: "Every 30 seconds", value: "0/30 * * * * ?" },
    { label: "Weekdays at 09:00", value: "0 0 9 ? * MON-FRI" },
    { label: "Last day of the month", value: "0 0 0 L * ?" },
    { label: "Weekday nearest the 15th", value: "0 0 12 15W * ?" },
  ],
};

const presetsFor = (d: CronDialect) => (d === "aws" ? PRESETS.aws : d === "quartz" ? PRESETS.seconds : d === "spring" ? PRESETS.seconds.map((p) => ({ ...p, value: p.value.replace(/\?/g, "*") })) : PRESETS.five);

const COMMON_ZONES = ["UTC", "America/Los_Angeles", "America/New_York", "America/Sao_Paulo", "Europe/London", "Europe/Berlin", "Europe/Moscow", "Asia/Yerevan", "Asia/Dubai", "Asia/Kolkata", "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney"];

function allZones(): string[] {
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone");
    if (list?.length) return Array.from(new Set(["UTC", ...list]));
  } catch {}
  return COMMON_ZONES;
}

function formatRun(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, { timeZone, weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(ms));
}

function snippet(dialect: CronDialect, expr: string, tz: string): string | null {
  if (dialect === "github") {
    return `on:\n  schedule:\n    - cron: "${expr}"${tz !== "UTC" ? `\n      timezone: "${tz}"` : ""}`;
  }
  if (dialect === "kubernetes") {
    return `apiVersion: batch/v1\nkind: CronJob\nmetadata:\n  name: my-job\nspec:\n  schedule: "${expr}"\n  timeZone: "${tz}"\n  jobTemplate:\n    spec:\n      template:\n        spec:\n          restartPolicy: OnFailure\n          containers:\n            - name: job\n              image: busybox:1.36\n              command: ["sh", "-c", "date"]`;
  }
  if (dialect === "aws") {
    const e = /^cron\(/i.test(expr) ? expr : `cron(${expr})`;
    return `aws scheduler create-schedule --name my-schedule \\\n  --schedule-expression "${e}" \\\n  --schedule-expression-timezone "${tz}" \\\n  --flexible-time-window '{"Mode": "OFF"}' \\\n  --target '{"Arn": "<target-arn>", "RoleArn": "<role-arn>"}'`;
  }
  if (dialect === "spring") return `@Scheduled(cron = "${expr}", zone = "${tz}")\npublic void run() { … }`;
  if (dialect === "standard") return tz === "UTC" || tz === "local" ? `# crontab -e\n${expr} /path/to/command` : `# crontab -e — cronie (Fedora, RHEL, Arch) honours CRON_TZ; Debian/Ubuntu cron uses the server's time zone\nCRON_TZ=${tz}\n${expr} /path/to/command`;
  return null;
}

export default function CronTesterClient() {
  const [expression, setExpression] = useState("0 9 * * 1-5");
  const [dialect, setDialect] = useState<CronDialect>("standard");
  const [tz, setTz] = useState("UTC");
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [zones, setZones] = useState<string[]>(COMMON_ZONES);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setZones(allZones());
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (d.expression) setExpression(d.expression);
      if (d.dialect && DIALECTS.some((x) => x.id === d.dialect)) setDialect(d.dialect);
      if (d.tz) setTz(d.tz);
      else setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ expression, dialect, tz }));
    } catch {}
  }, [expression, dialect, tz]);

  // Refresh "next runs" once a minute
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const result = useMemo(() => parseCron(expression, dialect), [expression, dialect]);
  const parsed = result.parsed;
  const runs = useMemo(() => (parsed ? nextRuns(parsed, 8, tz, now) : []), [parsed, tz, now]);
  const description = parsed ? describe(parsed) : "";
  const parts = expression.trim().replace(/^cron\((.*)\)$/i, "$1").split(/\s+/);
  const labels = FIELD_LABELS[dialect];

  const warnings = [...result.warnings];
  if (parsed && dialect === "github") {
    if (runs.length > 1 && minGapMs(runs) < 5 * 60_000) warnings.push("GitHub runs scheduled workflows at most once every 5 minutes — runs closer together are skipped.");
    if (parsed.fields.minute!.values.has(0) && parsed.fields.minute!.values.size === 1) warnings.push("Minute 0 is GitHub's busiest moment; runs can be delayed or dropped. Pick another minute, e.g. 7 or 23.");
  }

  const conversions = parsed ? DIALECTS.filter((d) => d.id !== dialect).map((d) => ({ ...d, ...convert(parsed, d.id) })) : [];
  const snip = parsed ? snippet(dialect, expression.trim(), tz) : null;

  return (
    <ToolLayout title="CRON Expression Tester" description="Test cron schedules for Linux, GitHub Actions, Kubernetes, AWS EventBridge, Quartz and Spring — in any time zone">
      <div className="max-w-3xl space-y-6">
        <div className="flex flex-wrap gap-1">
          {DIALECTS.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                if (d.id === dialect) return;
                // Carry the schedule over when it converts cleanly, otherwise load the dialect's example
                const conv = parsed ? convert(parsed, d.id).expr : undefined;
                setDialect(d.id);
                setExpression(conv ?? d.example);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${dialect === d.id ? "bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/30" : "text-[#888888] hover:text-[#f5f5f5] border-transparent"}`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1.5">Cron expression</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder={DIALECTS.find((d) => d.id === dialect)!.example}
              spellCheck={false}
              className={`flex-1 min-w-0 px-3 py-2 font-mono text-sm bg-[#111111] border rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${result.error ? "border-[#ef4444]" : "border-[#222222]"}`}
            />
            <div className="relative">
              <button onClick={() => setPresetsOpen((o) => !o)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] whitespace-nowrap">
                Presets <ChevronDown size={14} />
              </button>
              {presetsOpen && (
                <div className="absolute right-0 top-full mt-1 z-10 bg-[#111111] border border-[#222222] rounded-[8px] shadow-xl min-w-[260px] py-1">
                  {presetsFor(dialect).map((p) => (
                    <button
                      key={p.value}
                      onClick={() => {
                        setExpression(p.value);
                        setPresetsOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-4 px-3 py-2 text-sm text-[#f5f5f5] hover:bg-[#1a1a1a] text-left"
                    >
                      <span>{p.label}</span>
                      <span className="font-mono text-xs text-[#888888]">{p.value}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {parsed && <CopyButton text={expression.trim()} />}
          </div>
          {result.error && (
            <div className="flex items-start gap-1.5 text-xs text-[#ef4444] mt-2">
              <AlertCircle size={12} className="shrink-0 mt-0.5" /> {result.error}
            </div>
          )}
          {warnings.map((w) => (
            <div key={w} className="flex items-start gap-1.5 text-xs text-[#fbbf24] mt-2">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {w}
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs text-[#888888] font-medium block mb-2">Field breakdown</label>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
            {labels.map((l, i) => {
              const val = parts[i] ?? "";
              const active = Boolean(parsed) && val !== "";
              return (
                <div key={l} className={`flex flex-col items-center p-2.5 bg-[#111111] border rounded-[8px] min-w-0 ${active ? "border-[#a855f7]/50" : "border-[#222222]"}`}>
                  <span className="text-[10px] sm:text-xs text-[#888888] mb-1">{l}</span>
                  <span className={`font-mono text-xs sm:text-sm font-semibold truncate max-w-full ${active ? "text-[#a855f7]" : "text-[#444444]"}`}>{val || "—"}</span>
                </div>
              );
            })}
          </div>
        </div>

        {description && (
          <div className="flex items-start gap-3 p-4 bg-[#111111] border border-[#222222] rounded-[8px]">
            <Clock size={16} className="text-[#a855f7] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[#888888] font-medium mb-0.5">Human-readable</p>
              <p className="text-sm text-[#f5f5f5]">{description}</p>
            </div>
          </div>
        )}

        {parsed && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs text-[#888888] font-medium">Next 8 runs</label>
              <label className="flex items-center gap-2 text-xs text-[#888888]">
                Time zone
                <select value={tz} onChange={(e) => setTz(e.target.value)} className="px-2 py-1 text-xs bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] max-w-[220px]">
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {dialect === "github" && tz !== "UTC" && <p className="text-xs text-[#888888] mb-2">GitHub uses UTC unless the schedule sets timezone: (supported since March 2026) — see the snippet below.</p>}
            {runs.length ? (
              <div className="space-y-1.5">
                {runs.map((ms, i) => (
                  <div key={ms} className="flex items-center gap-3 px-3 py-2.5 bg-[#111111] border border-[#222222] rounded-[8px]">
                    <span className="text-xs text-[#555555] w-4 text-right">{i + 1}</span>
                    <span className="flex-1 font-mono text-sm text-[#f5f5f5]">{formatRun(ms, tz)}</span>
                    <span className="hidden sm:inline text-[10px] font-mono text-[#555555]">{new Date(ms).toISOString().replace(".000", "")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-[#111111] border border-[#ef4444] rounded-[8px] text-sm text-[#ef4444]">
                <AlertCircle size={14} className="shrink-0" /> No run in the next five years — check the day, month and weekday combination (e.g. 30 February never happens).
              </div>
            )}
            <p className="mt-2 text-[11px] text-[#555555]">Times that don&apos;t exist when clocks spring forward are skipped; when clocks fall back, a repeated time runs once.</p>
          </div>
        )}

        {snip && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#888888] font-medium">Use it in {DIALECTS.find((d) => d.id === dialect)!.label}</label>
              <CopyButton text={snip} size="sm" />
            </div>
            <pre className="p-3 font-mono text-xs bg-[#0a0a0a] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto">{snip}</pre>
          </div>
        )}

        {conversions.length > 0 && (
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-2">Same schedule in other formats</label>
            <div className="divide-y divide-[#1f1f1f] border border-[#222222] rounded-[8px] bg-[#111111]">
              {conversions.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-36 shrink-0 text-xs text-[#888888]">{c.label}</span>
                  {c.expr ? (
                    <>
                      <code className="flex-1 min-w-0 font-mono text-xs text-[#f5f5f5] truncate">{c.expr}</code>
                      <CopyButton text={c.expr} size="sm" />
                    </>
                  ) : (
                    <span className="flex-1 text-xs text-[#666666]">{c.note}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
