// Unix timestamp helpers: unit detection, standard text formats, relative time and ready-to-paste
// code for the same instant in common languages (including the Temporal API, built into Chrome,
// Firefox and Node 26).

export type TsUnit = "s" | "ms" | "us" | "ns";

export interface ParsedTimestamp {
  ms: number;
  unit: TsUnit;
}

/** Detects seconds / milliseconds / microseconds / nanoseconds from the number of digits. */
export function parseTimestamp(input: string): ParsedTimestamp | null {
  const t = input.trim().replace(/[_,\s]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  const digits = t.replace(/^-/, "").split(".")[0].length;
  const n = Number(t);
  const unit: TsUnit = digits <= 11 ? "s" : digits <= 14 ? "ms" : digits <= 17 ? "us" : "ns";
  const ms = unit === "s" ? n * 1000 : unit === "ms" ? n : unit === "us" ? n / 1000 : n / 1e6;
  if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) return null; // outside the Date range
  return { ms, unit };
}

export const UNIT_LABEL: Record<TsUnit, string> = { s: "seconds", ms: "milliseconds", us: "microseconds", ns: "nanoseconds" };

/** Accepts ISO 8601, RFC 2822 / HTTP dates and other strings Date understands. */
export function parseDateString(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? null : ms;
}

export function relativeTime(ms: number, now = Date.now()): string {
  const diff = (ms - now) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  // Round the magnitude so past and future round the same way (Math.round(-1.5) is -1)
  const signed = (n: number) => Math.sign(diff) * Math.round(n);
  for (const [unit, secs] of units) if (abs >= secs) return rtf.format(signed(abs / secs), unit);
  return abs < 5 ? "just now" : rtf.format(signed(abs), "second");
}

/** ISO 8601 with the zone's own offset, e.g. 2026-10-24T14:30:00+02:00 */
export function isoInZone(ms: number, timeZone: string): string {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "longOffset" });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(ms))) p[x.type] = x.value;
  const offset = (p.timeZoneName ?? "GMT").replace("GMT", "") || "+00:00";
  const frac = ms % 1000 ? `.${String(((ms % 1000) + 1000) % 1000).padStart(3, "0")}` : "";
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${frac}${offset === "+00:00" ? "Z" : offset}`;
}

export interface FormatRow {
  label: string;
  value: string;
}

export function formats(ms: number, timeZone: string): FormatRow[] {
  const d = new Date(ms);
  return [
    { label: "ISO 8601 (UTC)", value: d.toISOString() },
    { label: `ISO 8601 (${timeZone})`, value: isoInZone(ms, timeZone) },
    { label: "RFC 2822 / HTTP", value: d.toUTCString() },
    { label: "Unix seconds", value: String(Math.floor(ms / 1000)) },
    { label: "Unix milliseconds", value: String(Math.floor(ms)) },
  ];
}

export interface Snippet {
  lang: string;
  toDate: string;
  now: string;
}

export function snippets(ms: number, timeZone: string): Snippet[] {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(ms);
  return [
    { lang: "JavaScript (Temporal)", toDate: `Temporal.Instant.fromEpochMilliseconds(${m}).toZonedDateTimeISO("${timeZone}")`, now: "Temporal.Now.instant().epochMilliseconds" },
    { lang: "JavaScript (Date)", toDate: `new Date(${m})`, now: "Math.floor(Date.now() / 1000)" },
    { lang: "Python", toDate: `datetime.fromtimestamp(${s}, tz=timezone.utc)  # from datetime import datetime, timezone`, now: "int(time.time())" },
    { lang: "Go", toDate: `time.Unix(${s}, 0).UTC()`, now: "time.Now().Unix()" },
    { lang: "Java", toDate: `Instant.ofEpochSecond(${s})`, now: "Instant.now().getEpochSecond()" },
    { lang: "C#", toDate: `DateTimeOffset.FromUnixTimeSeconds(${s})`, now: "DateTimeOffset.UtcNow.ToUnixTimeSeconds()" },
    { lang: "PHP", toDate: `new DateTimeImmutable('@${s}')`, now: "time()" },
    { lang: "Rust (chrono)", toDate: `DateTime::from_timestamp(${s}, 0)`, now: "Utc::now().timestamp()" },
    { lang: "PostgreSQL", toDate: `to_timestamp(${s})`, now: "extract(epoch from now())::bigint" },
    { lang: "MySQL", toDate: `FROM_UNIXTIME(${s})`, now: "UNIX_TIMESTAMP()" },
    { lang: "SQLite", toDate: `datetime(${s}, 'unixepoch')`, now: "unixepoch()" },
    { lang: "Bash", toDate: `date -u -d @${s}    # macOS: date -u -r ${s}`, now: "date +%s" },
  ];
}

/** Epoch ms for a wall-clock time ("2026-10-24T14:30") in an IANA zone. */
export function wallTimeToEpoch(local: string, timeZone: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(local);
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map((x) => Number(x ?? 0));
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, s);
  const f = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
  const offsetAt = (t: number) => {
    const p: Record<string, number> = {};
    for (const x of f.formatToParts(new Date(t))) if (x.type !== "literal") p[x.type] = Number(x.value);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - t;
  };
  // Two passes settle the offset, including across daylight-saving changes
  let t = asUtc - offsetAt(asUtc);
  t = asUtc - offsetAt(t);
  return t;
}

/** True when the running JS engine has the Temporal API built in. */
export function hasNativeTemporal(): boolean {
  return typeof (globalThis as { Temporal?: unknown }).Temporal !== "undefined";
}
