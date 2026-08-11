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

/** Simple, fixed working-hours model (9 AM – 6 PM = work, 7–9 AM & 6–10 PM = off, else sleep) —
 * a reasonable default for visualizing overlap, not a per-person customizable schedule. */
export function classifyHour(hour: number): HourKind {
  if (hour >= 9 && hour < 18) return "work";
  if ((hour >= 7 && hour < 9) || (hour >= 18 && hour < 22)) return "off";
  return "sleep";
}
