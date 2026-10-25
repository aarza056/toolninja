// IPv4 CIDR helpers shared by the calculator's checks and the /tools/cidr-calculator/<prefix> pages.

export function ipToNum(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) return null;
  return parts.reduce((n, p) => n * 256 + Number(p), 0);
}

export function numToIp(n: number): string {
  return [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join(".");
}

export interface Block {
  start: number;
  end: number;
  prefix: number;
  cidr: string;
}

/** Parses "10.0.0.0/16" (host bits are allowed and dropped, like most tools do). */
export function parseCidr(input: string): Block | null {
  const m = /^\s*([\d.]+)\s*\/\s*(\d{1,2})\s*$/.exec(input);
  if (!m) return null;
  const ip = ipToNum(m[1]);
  const prefix = Number(m[2]);
  if (ip === null || prefix > 32) return null;
  const size = 2 ** (32 - prefix);
  const start = Math.floor(ip / size) * size;
  return { start, end: start + size - 1, prefix, cidr: `${numToIp(start)}/${prefix}` };
}

export function containsIp(cidr: string, ip: string): boolean | null {
  const b = parseCidr(cidr);
  const n = ipToNum(ip);
  if (!b || n === null) return null;
  return n >= b.start && n <= b.end;
}

export type Relation = "same" | "first-contains-second" | "second-contains-first" | "separate";

/** Two CIDR blocks are always either nested or completely separate — never partly overlapping. */
export function relation(a: string, b: string): { relation: Relation; a: Block; b: Block } | null {
  const x = parseCidr(a);
  const y = parseCidr(b);
  if (!x || !y) return null;
  if (x.start === y.start && x.end === y.end) return { relation: "same", a: x, b: y };
  if (x.start <= y.start && x.end >= y.end) return { relation: "first-contains-second", a: x, b: y };
  if (y.start <= x.start && y.end >= x.end) return { relation: "second-contains-first", a: x, b: y };
  return { relation: "separate", a: x, b: y };
}

export interface PrefixFacts {
  prefix: number;
  mask: string;
  wildcard: string;
  binaryMask: string;
  hostBits: number;
  total: number;
  /** Usable host addresses: total − 2, except /31 (2, point-to-point links, RFC 3021) and /32 (1) */
  usable: number;
  /** AWS VPC subnets reserve 5 addresses and allow /16–/28 */
  awsUsable: number | null;
  /** How many /24 networks fit (only for /24 and larger) */
  slash24s: number | null;
}

export function prefixFacts(prefix: number): PrefixFacts {
  const hostBits = 32 - prefix;
  const total = 2 ** hostBits;
  const maskNum = 2 ** 32 - total;
  const binary = maskNum.toString(2).padStart(32, "0");
  return {
    prefix,
    mask: numToIp(maskNum),
    wildcard: numToIp(total - 1),
    binaryMask: binary.match(/.{8}/g)!.join("."),
    hostBits,
    total,
    usable: prefix === 32 ? 1 : prefix === 31 ? 2 : total - 2,
    awsUsable: prefix >= 16 && prefix <= 28 ? total - 5 : null,
    slash24s: prefix <= 24 ? 2 ** (24 - prefix) : null,
  };
}

/** Where each prefix size typically shows up — written per prefix, not generated. */
export const PREFIX_USES: Record<number, string> = {
  0: "Means \"every IPv4 address\". You see 0.0.0.0/0 as the default route and in firewall rules that allow or block all traffic — handle with care.",
  8: "The size of the old Class A networks. 10.0.0.0/8 is the largest private range, often split up for a whole company network.",
  12: "172.16.0.0/12 is the middle private range (172.16.0.0–172.31.255.255). Docker picks its default bridge networks from it.",
  16: "A classic private network size (like 192.168.0.0/16 or a 10.x.0.0/16 VPC). The largest VPC AWS allows, and a common choice for Kubernetes pod networks.",
  20: "Room for 16 /24 subnets. A popular VPC or cluster size when /16 is too wasteful.",
  21: "Eight /24s together — a medium office or a VPC split across a few availability zones.",
  22: "Four /24 networks combined (1,024 addresses). Common for mid-size VPC subnets and campus networks.",
  23: "Two /24s side by side — 510 usable hosts, handy when a /24 just ran out.",
  24: "The most common network of all: 256 addresses with mask 255.255.255.0, like the 192.168.1.0/24 behind most home routers.",
  25: "Half a /24 — 126 usable hosts. Used to split one /24 into two segments.",
  26: "A quarter of a /24 — 62 usable hosts. A typical small office VLAN or app subnet.",
  27: "30 usable hosts — small server subnets and DMZs.",
  28: "14 usable hosts; the smallest subnet AWS allows (11 usable there, since AWS reserves 5).",
  29: "6 usable hosts — small blocks of public IPs from an ISP.",
  30: "2 usable hosts — the traditional size for point-to-point router links.",
  31: "Point-to-point links without wasting addresses (RFC 3021): both addresses are usable, no network or broadcast address.",
  32: "A single host. Used for loopbacks, host routes and allow-listing exactly one IP in a firewall or security group.",
};
