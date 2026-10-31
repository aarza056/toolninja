// IPv4 set operations and subnet planning: the CIDR Merge tool (merge, deduplicate, subtract, range
// to CIDR) and the VLSM Subnet Planner. Addresses are plain numbers (0 … 2^32-1), which doubles
// represent exactly.
import { ipToNum, numToIp } from "@/lib/cidr-info";

export interface Range {
  start: number;
  end: number;
}

const MAX = 2 ** 32 - 1;

function maskToPrefix(mask: string): number | null {
  const n = ipToNum(mask);
  if (n === null) return null;
  const bits = n.toString(2).padStart(32, "0");
  return /^1*0*$/.test(bits) ? bits.indexOf("0") === -1 ? 32 : bits.indexOf("0") : null;
}

/**
 * One line of input: 10.0.0.0/24, a single IP, a range (10.0.0.1-10.0.0.50) or an IP with a subnet
 * mask (10.0.0.0 255.255.255.0). Host bits in a CIDR are dropped, like most tools do.
 */
export function parseEntry(raw: string): Range | { error: string } {
  const s = raw.trim();
  let m = /^([\d.]+)\s*\/\s*(\d{1,2})$/.exec(s);
  if (m) {
    const ip = ipToNum(m[1]);
    const p = Number(m[2]);
    if (ip === null || p > 32) return { error: `“${s}” isn't a valid CIDR block` };
    const size = 2 ** (32 - p);
    const start = Math.floor(ip / size) * size;
    return { start, end: start + size - 1 };
  }
  m = /^([\d.]+)\s*(?:-|–|to)\s*([\d.]+)$/i.exec(s);
  if (m) {
    const a = ipToNum(m[1]);
    const b = ipToNum(m[2]);
    if (a === null || b === null) return { error: `“${s}” isn't a valid IP range` };
    return a <= b ? { start: a, end: b } : { start: b, end: a };
  }
  m = /^([\d.]+)\s+([\d.]+)$/.exec(s);
  if (m) {
    const ip = ipToNum(m[1]);
    const p = maskToPrefix(m[2]);
    if (ip === null || p === null) return { error: `“${s}” isn't an IP and subnet mask` };
    return parseEntry(`${m[1]}/${p}`);
  }
  const ip = ipToNum(s);
  if (ip !== null) return { start: ip, end: ip };
  return { error: `“${s}” isn't an IP, CIDR block or range` };
}

/** Splits text on new lines, commas, semicolons and spaces between entries; skips # comments */
export function parseList(text: string): { ranges: Range[]; errors: string[]; count: number } {
  const ranges: Range[] = [];
  const errors: string[] = [];
  const items = text
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*$/, ""))
    .flatMap((l) => l.split(/[,;]|\s{2,}|\t/))
    .map((x) => x.trim())
    .filter(Boolean)
    // "10.0.0.1 - 10.0.0.9" and "10.0.0.0 255.255.255.0" stay whole; other single spaces separate entries
    .flatMap((x) => (/^[\d.]+\s*(-|–|to)\s*[\d.]+$/i.test(x) || /^[\d.]+\s+255\.[\d.]+$/.test(x) ? [x] : x.split(/\s+/)));
  for (const item of items) {
    const r = parseEntry(item);
    if ("error" in r) errors.push(r.error);
    else ranges.push(r);
  }
  return { ranges, errors, count: items.length };
}

/** Sorted, with overlapping and touching ranges joined */
export function mergeRanges(ranges: Range[]): Range[] {
  const sorted = ranges.slice().sort((a, b) => a.start - b.start || a.end - b.end);
  const out: Range[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.start <= last.end + 1) last.end = Math.max(last.end, r.end);
    else out.push({ ...r });
  }
  return out;
}

/** `a` minus everything in `b` */
export function subtractRanges(a: Range[], b: Range[]): Range[] {
  let rest = mergeRanges(a);
  for (const cut of mergeRanges(b)) {
    const next: Range[] = [];
    for (const r of rest) {
      if (cut.end < r.start || cut.start > r.end) next.push(r);
      else {
        if (cut.start > r.start) next.push({ start: r.start, end: cut.start - 1 });
        if (cut.end < r.end) next.push({ start: cut.end + 1, end: r.end });
      }
    }
    rest = next;
  }
  return rest;
}

/** The fewest CIDR blocks that cover exactly start…end */
export function rangeToCidrs(start: number, end: number): string[] {
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    // Largest block aligned at `cur` that doesn't pass `end`
    let size = cur === 0 ? 2 ** 32 : 2 ** Math.min(32, countTrailingZeros(cur));
    while (cur + size - 1 > end) size /= 2;
    out.push(`${numToIp(cur)}/${32 - Math.log2(size)}`);
    if (cur + size > MAX) break;
    cur += size;
  }
  return out;
}

function countTrailingZeros(n: number): number {
  let z = 0;
  while (z < 32 && n % 2 === 0) {
    n /= 2;
    z++;
  }
  return z;
}

export const rangesToCidrs = (ranges: Range[]) => ranges.flatMap((r) => rangeToCidrs(r.start, r.end));
export const rangeSize = (ranges: Range[]) => ranges.reduce((n, r) => n + (r.end - r.start + 1), 0);
export const formatRange = (r: Range) => (r.start === r.end ? numToIp(r.start) : `${numToIp(r.start)}-${numToIp(r.end)}`);

// ─── VLSM ──────────────────────────────────────────────────────────────────

export interface SubnetNeed {
  name: string;
  hosts: number;
}

export interface PlannedSubnet {
  name: string;
  hosts: number;
  cidr: string;
  prefix: number;
  mask: string;
  network: string;
  firstHost: string;
  lastHost: string;
  broadcast: string;
  usable: number;
  /** Usable addresses left over after the hosts asked for */
  spare: number;
}

export type VlsmResult = { ok: true; subnets: PlannedSubnet[]; free: string[]; used: number; total: number } | { ok: false; error: string; needed?: number };

/** Usable hosts in a block of this prefix: AWS/Azure reserve 5 per subnet; otherwise network + broadcast, except /31 and /32 */
export function usableHosts(prefix: number, cloud: boolean): number {
  const total = 2 ** (32 - prefix);
  if (cloud) return total - 5;
  if (prefix === 32) return 1;
  if (prefix === 31) return 2;
  return total - 2;
}

/** The smallest prefix whose usable hosts cover `hosts` (null if even the largest allowed can't) */
export function prefixFor(hosts: number, cloud: boolean): number | null {
  // /30 is the smallest general-purpose subnet (/31 only works on point-to-point links, RFC 3021);
  // AWS subnets go from /16 to /28
  const longest = cloud ? 28 : 30;
  const shortest = cloud ? 16 : 0;
  for (let p = longest; p >= shortest; p--) if (usableHosts(p, cloud) >= hosts) return p;
  return null;
}

const MASK = (p: number) => numToIp(p === 0 ? 0 : 2 ** 32 - 2 ** (32 - p));

/**
 * Variable-length subnetting: biggest subnet first, each placed at the next aligned address, which
 * packs power-of-two blocks without gaps. `cloud` = AWS/Azure rules (5 reserved, /16–/28).
 */
export function planVlsm(base: string, needs: SubnetNeed[], cloud = false): VlsmResult {
  const parsed = parseEntry(base);
  if ("error" in parsed || !/\//.test(base)) return { ok: false, error: "Enter the address space to split as a CIDR block, like 10.0.0.0/24." };
  const valid = needs.filter((n) => n.hosts > 0);
  if (!valid.length) return { ok: false, error: "Add at least one subnet with a number of hosts." };
  const sized = valid.map((n, i) => ({ ...n, i, prefix: prefixFor(n.hosts, cloud) }));
  const tooBig = sized.find((n) => n.prefix === null);
  if (tooBig) return { ok: false, error: `“${tooBig.name || "Subnet"}” needs ${tooBig.hosts.toLocaleString("en-US")} hosts — more than ${cloud ? "an AWS subnet (/16) can hold" : "IPv4 allows"}.` };

  const order = sized.slice().sort((a, b) => a.prefix! - b.prefix! || a.i - b.i);
  const needed = order.reduce((n, s) => n + 2 ** (32 - s.prefix!), 0);
  const total = parsed.end - parsed.start + 1;
  if (needed > total) {
    const fits = 32 - Math.ceil(Math.log2(needed));
    return { ok: false, error: `These subnets need ${needed.toLocaleString("en-US")} addresses, but ${base.trim()} has ${total.toLocaleString("en-US")} — a /${fits} would fit them.`, needed };
  }

  let cur = parsed.start;
  const placed: { i: number; subnet: PlannedSubnet }[] = [];
  for (const s of order) {
    const size = 2 ** (32 - s.prefix!);
    cur = Math.ceil(cur / size) * size; // already aligned when sizes descend; kept for safety
    const usable = usableHosts(s.prefix!, cloud);
    const p = s.prefix!;
    const firstHost = p >= 31 && !cloud ? cur : cloud ? cur + 4 : cur + 1; // AWS reserves the first four
    const lastHost = p >= 31 && !cloud ? cur + size - 1 : cur + size - 2;
    placed.push({
      i: s.i,
      subnet: {
        name: s.name || `Subnet ${s.i + 1}`,
        hosts: s.hosts,
        cidr: `${numToIp(cur)}/${p}`,
        prefix: p,
        mask: MASK(p),
        network: numToIp(cur),
        firstHost: numToIp(firstHost),
        lastHost: numToIp(lastHost),
        broadcast: numToIp(cur + size - 1),
        usable,
        spare: usable - s.hosts,
      },
    });
    cur += size;
  }
  const free = cur <= parsed.end ? rangeToCidrs(cur, parsed.end) : [];
  // Back in the order they were entered
  return { ok: true, subnets: placed.sort((a, b) => a.i - b.i).map((p) => p.subnet), free, used: needed, total };
}
