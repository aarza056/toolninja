// Cron expressions in the dialects people actually paste: Linux/Vixie cron, GitHub Actions,
// Kubernetes CronJob, AWS EventBridge, Quartz and Spring. Next run times are computed in any IANA
// time zone, with daylight-saving gaps skipped and repeated times run once (EventBridge's rule).
//
// Dialect facts (October 2026 docs):
//   Linux        5 fields, 0–7 = Sun–Sun, names, @daily…; day-of-month OR day-of-week when both are set
//   GitHub       5 fields, weekday 0–6, names, no @daily; UTC unless the schedule has `timezone:`; ≥ 5 min apart
//   Kubernetes   5 fields like Linux plus @macros; time zone via .spec.timeZone (CRON_TZ= is rejected)
//   EventBridge  cron(min hour dom month dow year); weekday 1–7 = SUN–SAT; exactly one of dom/dow is ?; L W #
//   Quartz       sec min hour dom month dow [year]; weekday 1–7 = SUN–SAT; one of dom/dow must be ?; L W #
//   Spring       sec min hour dom month dow; weekday 0–7 (0/7 = SUN) or MON–SUN; L W #, ? allowed

export type CronDialect = "standard" | "github" | "kubernetes" | "aws" | "quartz" | "spring";

export const DIALECTS: { id: CronDialect; label: string; example: string }[] = [
  { id: "standard", label: "Linux / crontab", example: "0 9 * * 1-5" },
  { id: "github", label: "GitHub Actions", example: "30 5 * * 1-5" },
  { id: "kubernetes", label: "Kubernetes CronJob", example: "0 3 * * *" },
  { id: "aws", label: "AWS EventBridge", example: "cron(0 9 ? * MON-FRI *)" },
  { id: "quartz", label: "Quartz (Java)", example: "0 0 9 ? * MON-FRI" },
  { id: "spring", label: "Spring @Scheduled", example: "0 0 9 * * MON-FRI" },
];

type FieldName = "second" | "minute" | "hour" | "dom" | "month" | "dow" | "year";

interface FieldSpec {
  name: FieldName;
  min: number;
  max: number;
}

interface ParsedField {
  text: string;
  values: Set<number>;
  /** Field was * (or ?) — matters for the Linux day-of-month/day-of-week rule */
  any: boolean;
  question: boolean;
  lastDay?: number; // L or L-n (offset)
  lastWeekday?: boolean; // LW
  nearestWeekday?: number; // nW
  nthDow?: [number, number][]; // [dow 0-6, n]
  lastDow?: number[]; // dow 0-6 for "5L"
}

export interface ParsedCron {
  dialect: CronDialect;
  fields: Partial<Record<FieldName, ParsedField>>;
  hasSeconds: boolean;
  /** Linux-style: when both day fields are restricted, either may match */
  dayOr: boolean;
}

export interface CronResult {
  parsed?: ParsedCron;
  error?: string;
  warnings: string[];
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

/** Weekday numbering per dialect, mapped to JS getDay() (0 = Sunday). */
function dowFromDialect(n: number, dialect: CronDialect): number {
  if (dialect === "aws" || dialect === "quartz") return (n - 1 + 7) % 7; // 1 = SUN
  return n % 7; // 0 or 7 = SUN
}

function specs(dialect: CronDialect, count: number): FieldSpec[] {
  const dowRange = dialect === "aws" || dialect === "quartz" ? [1, 7] : dialect === "github" ? [0, 6] : [0, 7];
  const core: FieldSpec[] = [
    { name: "minute", min: 0, max: 59 },
    { name: "hour", min: 0, max: 23 },
    { name: "dom", min: 1, max: 31 },
    { name: "month", min: 1, max: 12 },
    { name: "dow", min: dowRange[0], max: dowRange[1] },
  ];
  if (dialect === "aws") return [...core, { name: "year", min: 1970, max: 2199 }];
  if (dialect === "quartz" || dialect === "spring") {
    const withSec = [{ name: "second" as const, min: 0, max: 59 }, ...core];
    return count === 7 && dialect === "quartz" ? [...withSec, { name: "year", min: 1970, max: 2099 }] : withSec;
  }
  return core;
}

function parseNumber(token: string, spec: FieldSpec): number {
  const t = token.toUpperCase();
  if (spec.name === "month" && MONTHS.includes(t)) return MONTHS.indexOf(t) + 1;
  if (spec.name === "dow" && DAYS.includes(t)) return NaN; // resolved by the caller (dialect numbering)
  if (!/^\d+$/.test(t)) throw new Error(`"${token}" isn't a number`);
  const n = Number(t);
  if (n < spec.min || n > spec.max) throw new Error(`${n} is out of range (${spec.min}–${spec.max})`);
  return n;
}

function parseField(text: string, spec: FieldSpec, dialect: CronDialect): ParsedField {
  const f: ParsedField = { text, values: new Set(), any: false, question: false };
  const quartzLike = dialect === "aws" || dialect === "quartz" || dialect === "spring";
  const dowName = (t: string) => {
    const i = DAYS.indexOf(t.toUpperCase());
    if (i < 0) return null;
    // Names map to the dialect's own numbering so ranges like MON-FRI work everywhere
    return dialect === "aws" || dialect === "quartz" ? i + 1 : i;
  };
  const num = (t: string) => {
    if (spec.name === "dow") {
      const named = dowName(t);
      if (named !== null) return named;
    }
    return parseNumber(t, spec);
  };
  const addRange = (lo: number, hi: number, step: number) => {
    if (step < 1) throw new Error("a step must be at least 1");
    if (lo > hi) throw new Error(`range ${lo}-${hi} runs backwards`);
    for (let i = lo; i <= hi; i += step) f.values.add(spec.name === "dow" ? dowFromDialect(i, dialect) : i);
  };

  if (text === "?") {
    if (!quartzLike && dialect !== "kubernetes") throw new Error('"?" is only valid in Quartz, Spring, EventBridge and Kubernetes');
    if (spec.name !== "dom" && spec.name !== "dow") throw new Error('"?" is only allowed in the day-of-month and day-of-week fields');
    f.any = true;
    f.question = true;
    return f;
  }

  for (const part of text.split(",")) {
    if (!part) throw new Error("empty list item");
    const up = part.toUpperCase();
    // Specials (Quartz / EventBridge / Spring)
    if (spec.name === "dom" && /^L(-\d+)?$/.test(up)) {
      if (!quartzLike) throw new Error('"L" isn\'t supported in this dialect');
      f.lastDay = up.length > 1 ? Number(up.slice(2)) : 0;
      continue;
    }
    if (spec.name === "dom" && up === "LW") {
      if (!quartzLike) throw new Error('"LW" isn\'t supported in this dialect');
      f.lastWeekday = true;
      continue;
    }
    if (spec.name === "dom" && /^\d+W$/.test(up)) {
      if (!quartzLike) throw new Error('"W" isn\'t supported in this dialect');
      f.nearestWeekday = parseNumber(up.slice(0, -1), spec);
      continue;
    }
    if (spec.name === "dow" && /^[A-Z0-9]+#\d$/.test(up)) {
      if (!quartzLike) throw new Error('"#" isn\'t supported in this dialect');
      const [d, n] = up.split("#");
      if (Number(n) < 1 || Number(n) > 5) throw new Error(`#${n}: the week number must be 1–5`);
      (f.nthDow ??= []).push([dowFromDialect(num(d), dialect), Number(n)]);
      continue;
    }
    if (spec.name === "dow" && /^[A-Z0-9]+L$/.test(up) && up !== "L") {
      if (!quartzLike) throw new Error('"L" isn\'t supported in this dialect');
      (f.lastDow ??= []).push(dowFromDialect(num(up.slice(0, -1)), dialect));
      continue;
    }
    if (spec.name === "dow" && up === "L") {
      if (!quartzLike) throw new Error('"L" isn\'t supported in this dialect');
      f.values.add(6); // last day of the week = Saturday
      continue;
    }

    const [rangePart, stepPart, extra] = part.split("/");
    if (extra !== undefined) throw new Error(`"${part}" has more than one "/"`);
    const step = stepPart === undefined ? 1 : Number(stepPart);
    if (stepPart !== undefined && !/^\d+$/.test(stepPart)) throw new Error(`step "${stepPart}" isn't a number`);
    if (rangePart === "*") {
      if (stepPart === undefined) f.any = true;
      addRange(spec.min, spec.max, step);
    } else if (rangePart.includes("-")) {
      const [a, b] = rangePart.split("-");
      addRange(num(a), num(b), step);
    } else {
      const start = num(rangePart);
      // "20/15" means from 20 to the end of the range, every 15
      if (stepPart !== undefined) addRange(start, spec.max, step);
      else f.values.add(spec.name === "dow" ? dowFromDialect(start, dialect) : start);
    }
  }
  return f;
}

export function parseCron(input: string, dialect: CronDialect): CronResult {
  const warnings: string[] = [];
  let expr = input.trim();
  if (!expr) return { error: "Enter a cron expression.", warnings };

  if (/^(CRON_TZ|TZ)=/i.test(expr)) {
    if (dialect === "kubernetes") return { error: "Kubernetes rejects CRON_TZ= / TZ= inside the schedule. Set .spec.timeZone (e.g. \"Europe/Berlin\") instead.", warnings };
    warnings.push("A CRON_TZ= prefix only works in some cron implementations — pick the time zone below instead.");
    expr = expr.replace(/^\S+\s+/, "");
  }
  if (dialect === "aws") {
    const m = /^cron\((.*)\)$/i.exec(expr);
    if (m) expr = m[1].trim();
    else if (/^rate\(/i.test(expr)) return { error: "That's a rate() expression — this tester handles cron(). rate(5 minutes) simply runs every 5 minutes from the start date.", warnings };
  } else if (/^cron\(/i.test(expr)) {
    return { error: "cron(…) is EventBridge syntax — switch the format to AWS EventBridge.", warnings };
  }

  if (expr.startsWith("@")) {
    const macro = MACROS[expr.toLowerCase()];
    if (expr.toLowerCase() === "@reboot") return { error: "@reboot runs once when the machine starts — there's no schedule to show.", warnings };
    if (!macro) return { error: `Unknown shortcut "${expr}".`, warnings };
    if (dialect === "github") return { error: `GitHub Actions doesn't support ${expr} — use "${macro}" (and change the minute so it doesn't run at the busy top of the hour).`, warnings };
    if (dialect !== "standard" && dialect !== "kubernetes") return { error: `${expr} isn't supported in ${DIALECTS.find((d) => d.id === dialect)!.label}.`, warnings };
    expr = macro;
  }

  const parts = expr.split(/\s+/);
  const expected = dialect === "aws" ? [6] : dialect === "quartz" ? [6, 7] : dialect === "spring" ? [6] : [5];
  if (!expected.includes(parts.length)) {
    let hint = "";
    if (parts.length === 6 && expected[0] === 5) hint = " Six fields usually means seconds (Quartz/Spring) or a year (EventBridge) — switch the format.";
    if (parts.length === 5 && expected[0] === 6) hint = dialect === "aws" ? " EventBridge needs a 6th field for the year — add * at the end." : " This format starts with a seconds field — add 0 at the front.";
    return { error: `Expected ${expected.join(" or ")} fields, got ${parts.length}.${hint}`, warnings };
  }

  const fieldSpecs = specs(dialect, parts.length);
  const fields: Partial<Record<FieldName, ParsedField>> = {};
  for (let i = 0; i < fieldSpecs.length; i++) {
    try {
      fields[fieldSpecs[i].name] = parseField(parts[i], fieldSpecs[i], dialect);
    } catch (e) {
      return { error: `${label(fieldSpecs[i].name)} field "${parts[i]}": ${e instanceof Error ? e.message : "invalid"}.`, warnings };
    }
  }

  const dom = fields.dom!;
  const dow = fields.dow!;
  const domRestricted = !dom.any;
  const dowRestricted = !dow.any;
  if (dialect === "aws" || dialect === "quartz") {
    if (dom.question === dow.question) {
      return { error: dom.question ? 'Only one of day-of-month and day-of-week can be "?".' : `${dialect === "aws" ? "EventBridge" : "Quartz"} needs "?" in either day-of-month or day-of-week (e.g. "? * MON-FRI" or "1 * ?"). You can't set both, and "*" in both isn't allowed either.`, warnings };
    }
  }
  if (dialect === "github") {
    if (fields.dow!.text.split(",").some((p) => /(^|-)7($|\/)/.test(p))) warnings.push("GitHub's weekday range is 0–6; use 0 for Sunday.");
  }
  if (dialect === "github" || dialect === "standard" || dialect === "kubernetes") {
    if (domRestricted && dowRestricted) warnings.push("Both day-of-month and day-of-week are set, so the job runs when EITHER matches (classic cron rule) — not only on days matching both.");
  }
  if (dialect === "spring" && domRestricted && dowRestricted) warnings.push("Spring requires BOTH day-of-month and day-of-week to match.");

  // Linux semantics: a field that starts with * counts as unrestricted for the either/or rule
  const dayOr = (dialect === "standard" || dialect === "github" || dialect === "kubernetes") && !dom.text.startsWith("*") && !dow.text.startsWith("*");
  const parsed: ParsedCron = { dialect, fields, hasSeconds: Boolean(fields.second), dayOr };
  return { parsed, warnings };
}

function label(n: FieldName): string {
  return { second: "Seconds", minute: "Minute", hour: "Hour", dom: "Day-of-month", month: "Month", dow: "Day-of-week", year: "Year" }[n];
}

// ─── matching & next runs ────────────────────────────────────────────────────

interface Parts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dow: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();
export function partsIn(ms: number, timeZone: string): Parts {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      weekday: "short",
    });
    formatters.set(timeZone, f);
  }
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(ms))) p[x.type] = x.value;
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour) % 24,
    minute: Number(p.minute),
    second: Number(p.second),
    dow: DAYS.indexOf(p.weekday.slice(0, 3).toUpperCase()),
  };
}

const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

function dayMatches(c: ParsedCron, p: Parts): boolean {
  const dom = c.fields.dom!;
  const dow = c.fields.dow!;
  const dim = daysInMonth(p.year, p.month);
  const domSpecial =
    (dom.lastDay !== undefined && p.day === dim - dom.lastDay) ||
    (dom.lastWeekday === true && p.day === lastWeekday(p.year, p.month)) ||
    (dom.nearestWeekday !== undefined && p.day === nearestWeekday(p.year, p.month, dom.nearestWeekday));
  const domMatch = dom.any || dom.values.has(p.day) || domSpecial;
  const dowSpecial = (dow.nthDow ?? []).some(([d, n]) => d === p.dow && Math.ceil(p.day / 7) === n) || (dow.lastDow ?? []).some((d) => d === p.dow && p.day + 7 > dim);
  const dowMatch = dow.any || dow.values.has(p.dow) || dowSpecial;
  return c.dayOr ? domMatch || dowMatch : domMatch && dowMatch;
}

function weekdayOf(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
function lastWeekday(y: number, m: number): number {
  let d = daysInMonth(y, m);
  while (weekdayOf(y, m, d) === 0 || weekdayOf(y, m, d) === 6) d--;
  return d;
}
/** Quartz "15W": the weekday nearest the 15th, never crossing into another month. */
function nearestWeekday(y: number, m: number, target: number): number {
  const dim = daysInMonth(y, m);
  const d = Math.min(target, dim);
  const wd = weekdayOf(y, m, d);
  if (wd === 6) return d === 1 ? 3 : d - 1;
  if (wd === 0) return d === dim ? d - 2 : d + 1;
  return d;
}

const has = (f: ParsedField | undefined, v: number) => !f || f.any || f.values.has(v);

export function nextRuns(c: ParsedCron, count: number, timeZone: string, from = Date.now()): number[] {
  const step = c.hasSeconds ? 1000 : 60000;
  let t = Math.floor(from / step) * step + step;
  const out: number[] = [];
  const seenWall = new Set<string>();
  const end = from + 5 * 366 * 86400000;
  const HOUR = 3600000;

  for (let guard = 0; guard < 400000 && t < end && out.length < count; guard++) {
    const p = partsIn(t, timeZone);
    const elapsed = (p.hour * 3600 + p.minute * 60 + p.second) * 1000;
    // Jump whole units when a coarse field can't match. Jumps land an hour early and re-check, so a
    // 23- or 25-hour daylight-saving day never makes us skip past midnight.
    if (c.fields.year && !has(c.fields.year, p.year)) {
      if (Array.from(c.fields.year.values).every((y) => y < p.year)) break;
      t += Math.max(HOUR, 86400000 - elapsed - HOUR);
      continue;
    }
    if (!has(c.fields.month, p.month)) {
      t += Math.max(HOUR, (daysInMonth(p.year, p.month) - p.day) * 86400000 + 86400000 - elapsed - HOUR);
      continue;
    }
    if (!dayMatches(c, p)) {
      t += Math.max(HOUR, 86400000 - elapsed - HOUR);
      continue;
    }
    if (!has(c.fields.hour, p.hour)) {
      t += HOUR - (p.minute * 60 + p.second) * 1000;
      continue;
    }
    if (!has(c.fields.minute, p.minute)) {
      t += 60000 - p.second * 1000;
      continue;
    }
    if (c.fields.second && !has(c.fields.second, p.second)) {
      t += 1000;
      continue;
    }
    // When clocks go back, the same wall time happens twice — run once
    const wall = `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
    if (!seenWall.has(wall)) {
      seenWall.add(wall);
      out.push(t);
    }
    t += step;
  }
  return out;
}

// ─── description ─────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

function list(values: number[], fmt: (n: number) => string): string {
  // Collapse consecutive runs into ranges: Monday through Friday
  const sorted = [...values].sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const v of sorted) {
    const g = groups[groups.length - 1];
    if (g && v === g[g.length - 1] + 1) g.push(v);
    else groups.push([v]);
  }
  const parts = groups.map((g) => (g.length >= 3 ? `${fmt(g[0])} through ${fmt(g[g.length - 1])}` : g.map(fmt).join(", ")));
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
}

function stepOf(f: ParsedField): number | null {
  const m = /^\*\/(\d+)$/.exec(f.text);
  return m ? Number(m[1]) : null;
}

export function describe(c: ParsedCron): string {
  const { second, minute, hour, dom, month, dow, year } = c.fields;
  const pieces: string[] = [];
  const mins = Array.from(minute!.values);
  const hrs = Array.from(hour!.values);

  if (second && !second.any && !(second.values.size === 1 && second.values.has(0))) {
    const s = stepOf(second);
    pieces.push(s ? `every ${s} seconds` : `at second ${list(Array.from(second.values), String)}`);
  } else if (second?.any) pieces.push("every second");

  if (!minute!.any && !hour!.any && mins.length * hrs.length <= 6) {
    const times = hrs.sort((a, b) => a - b).flatMap((h) => mins.sort((a, b) => a - b).map((m) => `${pad(h)}:${pad(m)}`));
    pieces.push(`at ${times.length > 1 ? `${times.slice(0, -1).join(", ")} and ${times[times.length - 1]}` : times[0]}`);
  } else {
    const ms = stepOf(minute!);
    if (minute!.any) pieces.push(second && !second.any ? "of every minute" : "every minute");
    else if (ms) pieces.push(`every ${ms} minutes`);
    else pieces.push(`at minute ${list(mins, String)}${hour!.any ? " past every hour" : ""}`);
    const hs = stepOf(hour!);
    if (hs) pieces.push(`every ${hs} hours`);
    else if (!hour!.any) pieces.push(`during the ${list(hrs, (h) => `${pad(h)}:00`)} hour${hrs.length > 1 ? "s" : ""}`);
  }

  const dayParts: string[] = [];
  if (!dom!.any) {
    if (dom!.lastDay !== undefined) dayParts.push(dom!.lastDay ? `${dom!.lastDay} days before the end of the month` : "on the last day of the month");
    if (dom!.lastWeekday) dayParts.push("on the last weekday of the month");
    if (dom!.nearestWeekday) dayParts.push(`on the weekday nearest the ${ordinal(dom!.nearestWeekday)}`);
    if (dom!.values.size) dayParts.push(stepOf(dom!) ? `every ${stepOf(dom!)} days` : `on the ${list(Array.from(dom!.values), ordinal)}`);
  }
  if (!dow!.any) {
    const named: string[] = [];
    if (dow!.values.size) named.push(`on ${list(Array.from(dow!.values), (d) => DAY_NAMES[d])}`);
    for (const [d, n] of dow!.nthDow ?? []) named.push(`on the ${ordinal(n)} ${DAY_NAMES[d]}`);
    for (const d of dow!.lastDow ?? []) named.push(`on the last ${DAY_NAMES[d]}`);
    dayParts.push(named.join(" and "));
  }
  if (dayParts.length) pieces.push(dayParts.join(c.dayOr ? " or " : ", "));
  if (!month!.any) pieces.push(`in ${list(Array.from(month!.values), (m) => MONTH_NAMES[m - 1])}`);
  if (year && !year.any) pieces.push(`in ${list(Array.from(year.values), String)}`);
  const s = pieces.join(", ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── converting between dialects ─────────────────────────────────────────────

/**
 * The same schedule written for another dialect, or a reason it can't be. Only plain schedules
 * convert — L/W/# and the Linux either/or day rule have no equivalent everywhere.
 */
export function convert(c: ParsedCron, to: CronDialect): { expr?: string; note?: string } {
  const f = c.fields;
  if (f.year && !f.year.any) return { note: "Has a year restriction" };
  if (f.dom!.lastDay !== undefined || f.dom!.lastWeekday || f.dom!.nearestWeekday || f.dow!.nthDow || f.dow!.lastDow) {
    if (to !== "aws" && to !== "quartz" && to !== "spring") return { note: "L / W / # don't exist in this format" };
  }
  if (f.second && !(f.second.values.size === 1 && f.second.values.has(0))) {
    if (to !== "quartz" && to !== "spring") return { note: "Runs on seconds, which this format can't express" };
  }
  const domSet = !f.dom!.any;
  const dowSet = !f.dow!.any;
  if (domSet && dowSet) {
    if (c.dayOr && to !== "standard" && to !== "github" && to !== "kubernetes") return { note: "Uses the either-day rule, which this format can't express" };
    if (!c.dayOr && (to === "standard" || to === "github" || to === "kubernetes")) return { note: "Needs both days to match, which classic cron can't express" };
    if (to === "aws" || to === "quartz") return { note: 'Both day fields set — this format needs "?" in one of them' };
  }

  // Re-render each field from its values (names and steps are normalised to lists/ranges)
  const render = (field: ParsedField, mapDow?: (d: number) => number): string => {
    if (field.any) return "*";
    const original = field.text;
    if (!mapDow && /^[\d*,\-/]+$/.test(original)) return original;
    const vals = Array.from(field.values).map((v) => (mapDow ? mapDow(v) : v)).sort((a, b) => a - b);
    const groups: string[] = [];
    let i = 0;
    while (i < vals.length) {
      let j = i;
      while (j + 1 < vals.length && vals[j + 1] === vals[j] + 1) j++;
      groups.push(j - i >= 2 ? `${vals[i]}-${vals[j]}` : vals.slice(i, j + 1).join(","));
      i = j + 1;
    }
    return groups.join(",");
  };
  const toDow = (d: number) => (to === "aws" || to === "quartz" ? d + 1 : d);
  let dowText: string;
  if (f.dow!.nthDow?.length) dowText = f.dow!.nthDow.map(([d, n]) => `${toDow(d)}#${n}`).join(",");
  else if (f.dow!.lastDow?.length) dowText = f.dow!.lastDow.map((d) => `${toDow(d)}L`).join(",");
  else dowText = render(f.dow!, toDow);
  let domText = f.dom!.lastDay !== undefined ? (f.dom!.lastDay ? `L-${f.dom!.lastDay}` : "L") : f.dom!.lastWeekday ? "LW" : f.dom!.nearestWeekday ? `${f.dom!.nearestWeekday}W` : render(f.dom!);

  if (to === "aws" || to === "quartz") {
    if (!dowSet) dowText = "?";
    else if (!domSet) domText = "?";
  }
  const core = [render(f.minute!), render(f.hour!), domText, render(f.month!), dowText];
  if (to === "github" && /(^|[,-])7($|[,-])/.test(dowText)) return { note: "Uses 7 for Sunday, which GitHub doesn't accept" };
  const fieldsOut = to === "aws" ? [...core, "*"] : to === "quartz" || to === "spring" ? ["0", ...core] : core;
  if ((to === "quartz" || to === "spring") && f.second) fieldsOut[0] = render(f.second);
  const expr = fieldsOut.join(" ");
  return { expr: to === "aws" ? `cron(${expr})` : expr };
}

/** Smallest gap between consecutive runs, for GitHub's 5-minute minimum. */
export function minGapMs(runs: number[]): number {
  let min = Infinity;
  for (let i = 1; i < runs.length; i++) min = Math.min(min, runs[i] - runs[i - 1]);
  return min;
}
