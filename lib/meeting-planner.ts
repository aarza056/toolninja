export interface CityOption {
  id: string;
  label: string;
}

export const MEETING_CITIES: CityOption[] = [
  { id: "UTC", label: "UTC" },
  { id: "America/Los_Angeles", label: "Los Angeles" },
  { id: "America/Denver", label: "Denver" },
  { id: "America/Chicago", label: "Chicago" },
  { id: "America/New_York", label: "New York" },
  { id: "America/Toronto", label: "Toronto" },
  { id: "America/Mexico_City", label: "Mexico City" },
  { id: "America/Sao_Paulo", label: "São Paulo" },
  { id: "Europe/London", label: "London" },
  { id: "Europe/Lisbon", label: "Lisbon" },
  { id: "Europe/Paris", label: "Paris" },
  { id: "Europe/Berlin", label: "Berlin" },
  { id: "Europe/Warsaw", label: "Warsaw" },
  { id: "Europe/Athens", label: "Athens" },
  { id: "Europe/Moscow", label: "Moscow" },
  { id: "Africa/Johannesburg", label: "Johannesburg" },
  { id: "Africa/Lagos", label: "Lagos" },
  { id: "Asia/Istanbul", label: "Istanbul" },
  { id: "Asia/Dubai", label: "Dubai" },
  { id: "Asia/Karachi", label: "Karachi" },
  { id: "Asia/Kolkata", label: "Mumbai / Delhi" },
  { id: "Asia/Dhaka", label: "Dhaka" },
  { id: "Asia/Bangkok", label: "Bangkok" },
  { id: "Asia/Singapore", label: "Singapore" },
  { id: "Asia/Hong_Kong", label: "Hong Kong" },
  { id: "Asia/Shanghai", label: "Shanghai" },
  { id: "Asia/Seoul", label: "Seoul" },
  { id: "Asia/Tokyo", label: "Tokyo" },
  { id: "Australia/Perth", label: "Perth" },
  { id: "Australia/Sydney", label: "Sydney" },
  { id: "Pacific/Auckland", label: "Auckland" },
];

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
}

function getZonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  return {
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10),
    day: parseInt(get("day"), 10),
    hour,
  };
}

function dayNumber(p: { year: number; month: number; day: number }): number {
  return Math.round(Date.UTC(p.year, p.month - 1, p.day) / 86400000);
}

export interface HourCell {
  /** Hour (0-23) in the reference timezone this column represents. */
  refHour: number;
  /** Local hour (0-23) in the target city for that same instant. */
  localHour: number;
  /** -1, 0, or +1 (or more, near the international date line) relative to the reference day. */
  dayOffset: number;
}

/** Builds a 24-cell row mapping each hour of the reference day to this city's local hour,
 * using the browser's Intl engine for every lookup so DST transitions are always correct —
 * no manual UTC-offset arithmetic. */
export function buildHourGrid(timeZone: string, referenceUtcMidnight: number, referenceTimeZone: string): HourCell[] {
  const cells: HourCell[] = [];
  const refDayParts = getZonedParts(new Date(referenceUtcMidnight), referenceTimeZone);
  const refDayNum = dayNumber(refDayParts);

  // referenceUtcMidnight is midnight *in referenceTimeZone*, expressed as a UTC instant by the
  // caller (see localMidnightAsUtc). Stepping by whole hours from that instant and re-reading
  // each city's local time keeps every cell DST-correct even across a transition mid-grid.
  for (let h = 0; h < 24; h++) {
    const instant = new Date(referenceUtcMidnight + h * 3600000);
    const local = getZonedParts(instant, timeZone);
    const dayOffset = dayNumber(local) - refDayNum;
    cells.push({ refHour: h, localHour: local.hour, dayOffset });
  }
  return cells;
}

/** Finds the UTC instant corresponding to local midnight (00:00) on the given date, in the
 * given timezone — the anchor point buildHourGrid steps forward from. */
export function localMidnightAsUtc(dateStr: string, timeZone: string): number {
  // Binary-search-free approach: start from a UTC-midnight guess for the same Y-M-D, then
  // correct using the actual offset Intl reports for that instant (handles all UTC offsets,
  // including fractional ones like UTC+5:30).
  const [y, m, d] = dateStr.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  const offsetMinutes = getOffsetMinutes(timeZone, new Date(guess));
  return guess - offsetMinutes * 60000;
}

function getOffsetMinutes(timeZone: string, atDate: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  });
  const part = dtf.formatToParts(atDate).find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
  const match = part.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  return sign * (hours * 60 + minutes);
}

export function getOffsetLabel(timeZone: string, atDate: Date = new Date()): string {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" });
  return dtf.formatToParts(atDate).find((p) => p.type === "timeZoneName")?.value ?? "";
}

export function formatHour12(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${period}`;
}

export type HourKind = "sleep" | "off" | "work";

export interface WorkHours {
  start: number;
  /** Exclusive; smaller than start for a night shift (22–6) */
  end: number;
}

export const DEFAULT_HOURS: WorkHours = { start: 9, end: 18 };

/** Working hours as given; the 2 hours before and 4 hours after count as awake; the rest as asleep. */
export function classifyHour(hour: number, hours: WorkHours = DEFAULT_HOURS): HourKind {
  // Hours since the start of work, wrapping past midnight, so night shifts work too
  const since = (hour - hours.start + 24) % 24;
  const length = (hours.end - hours.start + 24) % 24 || 24;
  if (since < length) return "work";
  if (since < length + 4 || since >= 22) return "off";
  return "sleep";
}

export interface RankedHour {
  /** Hour in the reference time zone */
  refHour: number;
  work: number;
  off: number;
  sleep: number;
}

/**
 * Every hour of the day, best first: most people in working hours, then fewest asleep. Ties keep
 * the earlier hour, so the result is stable.
 */
export function rankMeetingHours(rows: { hours: WorkHours; localHourAt: (refHour: number) => number }[]): RankedHour[] {
  const ranked: RankedHour[] = [];
  for (let refHour = 0; refHour < 24; refHour++) {
    const r: RankedHour = { refHour, work: 0, off: 0, sleep: 0 };
    for (const row of rows) r[classifyHour(row.localHourAt(refHour), row.hours)]++;
    ranked.push(r);
  }
  return ranked.sort((a, b) => b.work - a.work || a.sleep - b.sleep || a.refHour - b.refHour);
}

export interface MeetingLink {
  ref?: string;
  date?: string;
  cities?: string[];
  hour?: number | null;
  /** Only hours that differ from the default are written */
  hours?: Record<string, WorkHours>;
}

const isKnownZone = (tz: string) => MEETING_CITIES.some((c) => c.id === tz);

/** The query string of a shareable link to this plan */
export function encodeMeetingLink(m: MeetingLink): string {
  const q = new URLSearchParams();
  if (m.ref) q.set("ref", m.ref);
  if (m.date) q.set("date", m.date);
  if (m.cities?.length) q.set("cities", m.cities.join(","));
  if (m.hour !== null && m.hour !== undefined) q.set("hour", String(m.hour));
  const custom = Object.entries(m.hours ?? {}).filter(([, h]) => h.start !== DEFAULT_HOURS.start || h.end !== DEFAULT_HOURS.end);
  if (custom.length) q.set("hours", custom.map(([tz, h]) => `${tz}:${h.start}-${h.end}`).join(","));
  return q.toString();
}

/** Reads a shared link, ignoring anything that isn't valid (it comes from the URL) */
export function decodeMeetingLink(search: string): MeetingLink {
  const q = new URLSearchParams(search);
  const out: MeetingLink = {};
  const ref = q.get("ref");
  if (ref && isKnownZone(ref)) out.ref = ref;
  const date = q.get("date");
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date))) out.date = date;
  const cities = q.get("cities")?.split(",").filter(isKnownZone);
  if (cities?.length) out.cities = cities.filter((c, i) => cities.indexOf(c) === i).slice(0, 20);
  const hour = Number(q.get("hour") ?? NaN);
  if (Number.isInteger(hour) && hour >= 0 && hour <= 23) out.hour = hour;
  const hours: Record<string, WorkHours> = {};
  for (const part of (q.get("hours") ?? "").split(",")) {
    const m = /^(.+):(\d{1,2})-(\d{1,2})$/.exec(part);
    if (m && isKnownZone(m[1]) && Number(m[2]) <= 23 && Number(m[3]) <= 23 && m[2] !== m[3]) hours[m[1]] = { start: Number(m[2]), end: Number(m[3]) };
  }
  if (Object.keys(hours).length) out.hours = hours;
  return out;
}

function icsTimestamp(utcMs: number): string {
  // RFC 5545's UTC form: YYYYMMDDTHHMMSSZ
  return new Date(utcMs).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

/** Builds a minimal, valid RFC 5545 .ics file for a single meeting — all times as an absolute
 * UTC instant, so it opens correctly in any calendar app regardless of the recipient's own
 * time zone (unlike specifying a floating local time, which is the usual source of ICS bugs). */
export function buildIcsFile(opts: {
  title: string;
  startUtcMs: number;
  durationMinutes: number;
  description?: string;
}): string {
  const endUtcMs = opts.startUtcMs + opts.durationMinutes * 60_000;
  const uid = `${opts.startUtcMs}-${Math.random().toString(36).slice(2)}@toolninja.io`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ToolNinja//Meeting Planner//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsTimestamp(Date.now())}`,
    `DTSTART:${icsTimestamp(opts.startUtcMs)}`,
    `DTEND:${icsTimestamp(endUtcMs)}`,
    `SUMMARY:${escapeIcsText(opts.title)}`,
    ...(opts.description ? [`DESCRIPTION:${escapeIcsText(opts.description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}
