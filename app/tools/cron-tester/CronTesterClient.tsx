"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Clock, AlertCircle, ChevronDown } from "lucide-react";

const STORAGE_KEY = "toolninja:cron-tester";

interface CronField {
  label: string;
  hint: string;
  min: number;
  max: number;
}

const FIELDS: CronField[] = [
  { label: "Minute", hint: "0–59", min: 0, max: 59 },
  { label: "Hour", hint: "0–23", min: 0, max: 23 },
  { label: "Day", hint: "1–31", min: 1, max: 31 },
  { label: "Month", hint: "1–12", min: 1, max: 12 },
  { label: "Weekday", hint: "0–7 (0,7=Sun)", min: 0, max: 7 },
];

const PRESETS: { label: string; value: string }[] = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every weekday at 9am", value: "0 9 * * 1-5" },
  { label: "Every Sunday at midnight", value: "0 0 * * 0" },
  { label: "1st of every month", value: "0 0 1 * *" },
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---------- Cron field parser ----------

function parseValues(field: string, min: number, max: number): number[] | null {
  const result = new Set<number>();

  for (const part of field.split(",")) {
    const trimmed = part.trim();

    // */step
    const stepWild = trimmed.match(/^\*\/(\d+)$/);
    if (stepWild) {
      const step = parseInt(stepWild[1], 10);
      if (step < 1) return null;
      for (let i = min; i <= max; i += step) result.add(i);
      continue;
    }

    // range/step or range
    const rangeStep = trimmed.match(/^(\d+)-(\d+)(?:\/(\d+))?$/);
    if (rangeStep) {
      const lo = parseInt(rangeStep[1], 10);
      const hi = parseInt(rangeStep[2], 10);
      const step = rangeStep[3] ? parseInt(rangeStep[3], 10) : 1;
      if (lo < min || hi > max || lo > hi || step < 1) return null;
      for (let i = lo; i <= hi; i += step) result.add(i);
      continue;
    }

    // wildcard
    if (trimmed === "*") {
      for (let i = min; i <= max; i++) result.add(i);
      continue;
    }

    // plain number
    const num = parseInt(trimmed, 10);
    if (isNaN(num) || num < min || num > max) return null;
    result.add(num);
  }

  return Array.from(result).sort((a, b) => a - b);
}

interface ParsedCron {
  minutes: number[];
  hours: number[];
  days: number[];
  months: number[];
  weekdays: number[];
}

function parseCron(expr: string): { parsed: ParsedCron; error: string } | { parsed: null; error: string } {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { parsed: null, error: `Expected 5 fields, got ${parts.length}. Format: minute hour day month weekday` };
  }

  const [minuteStr, hourStr, dayStr, monthStr, wdStr] = parts;

  const minutes = parseValues(minuteStr, 0, 59);
  if (!minutes) return { parsed: null, error: "Invalid minute field. Valid: 0–59, *, */n, n-m" };

  const hours = parseValues(hourStr, 0, 23);
  if (!hours) return { parsed: null, error: "Invalid hour field. Valid: 0–23, *, */n, n-m" };

  const days = parseValues(dayStr, 1, 31);
  if (!days) return { parsed: null, error: "Invalid day field. Valid: 1–31, *, */n, n-m" };

  const months = parseValues(monthStr, 1, 12);
  if (!months) return { parsed: null, error: "Invalid month field. Valid: 1–12, *, */n, n-m" };

  // Weekday 0 and 7 both mean Sunday; normalize 7→0
  const rawWd = parseValues(wdStr, 0, 7);
  if (!rawWd) return { parsed: null, error: "Invalid weekday field. Valid: 0–7 (0 and 7 = Sunday)" };
  const weekdays = Array.from(new Set(rawWd.map((d) => (d === 7 ? 0 : d)))).sort((a, b) => a - b);

  return { parsed: { minutes, hours, days, months, weekdays }, error: "" };
}

function matchesCron(d: Date, p: ParsedCron): boolean {
  const minute = d.getMinutes();
  const hour = d.getHours();
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const weekday = d.getDay();

  return (
    p.minutes.includes(minute) &&
    p.hours.includes(hour) &&
    p.days.includes(day) &&
    p.months.includes(month) &&
    p.weekdays.includes(weekday)
  );
}

function getNextRuns(parsed: ParsedCron, count: number): Date[] {
  const results: Date[] = [];
  // Start from next minute
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() + 1);

  const cursor = new Date(start);
  const limit = new Date(start.getTime() + 366 * 24 * 60 * 60 * 1000); // 1 year max

  while (results.length < count && cursor < limit) {
    if (matchesCron(cursor, parsed)) {
      results.push(new Date(cursor));
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return results;
}

function formatDate(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------- Human-readable description ----------

function describeField(field: string, type: "minute" | "hour" | "day" | "month" | "weekday"): string {
  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  if (field === "*") {
    return type === "minute"
      ? "every minute"
      : type === "hour"
      ? "every hour"
      : type === "day"
      ? "every day"
      : type === "month"
      ? "every month"
      : "every weekday";
  }

  const stepWild = field.match(/^\*\/(\d+)$/);
  if (stepWild) {
    const n = parseInt(stepWild[1], 10);
    const unit =
      type === "minute" ? "minute" : type === "hour" ? "hour" : type === "day" ? "day" : type === "month" ? "month" : "day";
    return `every ${n} ${unit}${n !== 1 ? "s" : ""}`;
  }

  const rangeStep = field.match(/^(\d+)-(\d+)(?:\/(\d+))?$/);
  if (rangeStep) {
    const lo = parseInt(rangeStep[1], 10);
    const hi = parseInt(rangeStep[2], 10);
    const step = rangeStep[3] ? parseInt(rangeStep[3], 10) : 1;

    const fmtVal = (v: number) => {
      if (type === "weekday") return WEEKDAY_NAMES[v] ?? String(v);
      if (type === "month") return MONTH_NAMES[v - 1] ?? String(v);
      return String(v);
    };

    const rangeStr = `${fmtVal(lo)} through ${fmtVal(hi)}`;
    return step > 1 ? `${rangeStr} every ${step}` : rangeStr;
  }

  // Plain numbers — could be comma-separated via the outer loop but we handle single here
  const nums = field.split(",").map(Number);
  const fmtVal = (v: number) => {
    if (type === "weekday") return WEEKDAY_NAMES[v] ?? String(v);
    if (type === "month") return MONTH_NAMES[v - 1] ?? String(v);
    if (type === "minute" || type === "hour") return String(v);
    return ordinal(v);
  };

  if (nums.length === 1) {
    const v = nums[0];
    if (type === "minute") return `at minute ${v}`;
    if (type === "hour") return `at ${v.toString().padStart(2, "0")}:00`;
    if (type === "day") return `on the ${ordinal(v)}`;
    if (type === "month") return `in ${MONTH_NAMES[v - 1] ?? v}`;
    if (type === "weekday") return `on ${WEEKDAY_NAMES[v] ?? v}`;
  }

  return nums.map(fmtVal).join(", ");
}

function buildDescription(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "";

  const [min, hr, day, mon, wd] = parts;

  const minuteDesc = describeField(min, "minute");
  const hourDesc = describeField(hr, "hour");
  const dayDesc = describeField(day, "day");
  const monthDesc = describeField(mon, "month");
  const wdDesc = describeField(wd, "weekday");

  // Special-case the most common patterns
  if (min === "*" && hr === "*") return `Runs ${minuteDesc}, ${hourDesc}`;
  if (hr === "*") return `Runs ${minuteDesc} of every hour`;

  let desc = "Runs ";
  desc += minuteDesc;
  if (hr !== "*") desc += `, ${hourDesc}`;
  if (day !== "*") desc += `, ${dayDesc}`;
  if (mon !== "*") desc += `, ${monthDesc}`;
  if (wd !== "*") desc += `, ${wdDesc}`;
  return desc;
}

export default function CronTesterClient() {
  const [expression, setExpression] = useState("*/5 * * * *");
  const [presetsOpen, setPresetsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.expression) setExpression(d.expression);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ expression }));
    } catch {}
  }, [expression]);

  const { parsed, error } = useMemo(() => parseCron(expression), [expression]);

  const [nextRuns, setNextRuns] = useState<Date[]>([]);
  const parsedRef = useRef(parsed);
  parsedRef.current = parsed;
  useEffect(() => {
    if (!parsedRef.current) { setNextRuns([]); return; }
    setNextRuns(getNextRuns(parsedRef.current, 8));
  }, [parsed]);

  const description = useMemo(() => {
    if (error || !parsed) return "";
    return buildDescription(expression);
  }, [expression, parsed, error]);

  const parts = expression.trim().split(/\s+/);
  const isValid = !error && parts.length === 5;

  return (
    <ToolLayout
      title="CRON Expression Tester"
      description="Validate cron expressions, see human-readable descriptions and the next scheduled run times."
    >
      <div className="max-w-2xl space-y-6">
        {/* Input + Presets */}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1.5">
            Cron Expression
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="*/5 * * * *"
              spellCheck={false}
              className={`flex-1 px-3 py-2 font-mono text-sm bg-[#111111] border rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${
                error ? "border-[#ef4444]" : "border-[#222222]"
              }`}
            />
            <div className="relative">
              <button
                onClick={() => setPresetsOpen((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors whitespace-nowrap"
              >
                Presets <ChevronDown size={14} />
              </button>
              {presetsOpen && (
                <div className="absolute right-0 top-full mt-1 z-10 bg-[#111111] border border-[#222222] rounded-[8px] shadow-xl min-w-[220px] py-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => {
                        setExpression(p.value);
                        setPresetsOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-4 px-3 py-2 text-sm text-[#f5f5f5] hover:bg-[#1a1a1a] transition-colors text-left"
                    >
                      <span>{p.label}</span>
                      <span className="font-mono text-xs text-[#888888]">{p.value}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {isValid && <CopyButton text={expression} />}
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-2">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>

        {/* Field breakdown */}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-2">Field Breakdown</label>
          <div className="grid grid-cols-5 gap-2">
            {FIELDS.map((f, i) => {
              const val = parts[i] ?? "";
              const active = isValid && val !== "";
              return (
                <div
                  key={f.label}
                  className={`flex flex-col items-center p-3 bg-[#111111] border rounded-[8px] ${
                    active ? "border-[#a855f7]/50" : "border-[#222222]"
                  }`}
                >
                  <span className="text-xs text-[#888888] mb-1">{f.label}</span>
                  <span
                    className={`font-mono text-sm font-semibold ${
                      active ? "text-[#a855f7]" : "text-[#444444]"
                    }`}
                  >
                    {val || "—"}
                  </span>
                  <span className="text-[10px] text-[#555555] mt-1">{f.hint}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Human-readable description */}
        {description && (
          <div className="flex items-start gap-3 p-4 bg-[#111111] border border-[#222222] rounded-[8px]">
            <Clock size={16} className="text-[#a855f7] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[#888888] font-medium mb-0.5">Human-readable</p>
              <p className="text-sm text-[#f5f5f5]">{description}</p>
            </div>
          </div>
        )}

        {/* Next run times */}
        {nextRuns.length > 0 && (
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-2">
              Next 8 Run Times
            </label>
            <div className="space-y-1.5">
              {nextRuns.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 bg-[#111111] border border-[#222222] rounded-[8px]"
                >
                  <span className="text-xs text-[#555555] w-4 text-right">{i + 1}</span>
                  <span className="flex-1 font-mono text-sm text-[#f5f5f5]">{formatDate(d)}</span>
                  <CopyButton text={formatDate(d)} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {isValid && nextRuns.length === 0 && (
          <div className="flex items-center gap-2 p-4 bg-[#111111] border border-[#ef4444] rounded-[8px]">
            <AlertCircle size={14} className="text-[#ef4444] shrink-0" />
            <span className="text-sm text-[#ef4444]">
              No matching run times found within the next year. Check day/month/weekday combination.
            </span>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
