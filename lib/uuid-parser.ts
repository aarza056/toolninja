const ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
// BigInt() rather than a `122192928000000000n` literal — this project's TS target resolves
// below ES2020, where BigInt literal syntax isn't allowed even though the BigInt() constructor is.
const GREGORIAN_OFFSET_100NS = BigInt("122192928000000000"); // 100ns ticks between 1582-10-15 and 1970-01-01

export interface UuidParseResult {
  kind: "uuid";
  raw: string;
  version: number;
  versionLabel: string;
  variant: string;
  timestamp: Date | null;
  timestampNote: string | null;
  groups: [string, string, string, string, string];
}

export interface UlidParseResult {
  kind: "ulid";
  raw: string;
  timestamp: Date;
  randomPart: string;
}

export type ParseResult = UuidParseResult | UlidParseResult;

const VERSION_LABELS: Record<number, string> = {
  1: "Time-based (Gregorian timestamp + MAC/node)",
  2: "DCE Security",
  3: "Name-based (MD5)",
  4: "Random",
  5: "Name-based (SHA-1)",
  6: "Reordered time-based (sortable)",
  7: "Unix Epoch time-based (sortable)",
  8: "Custom / vendor-defined",
};

function variantLabel(nibble: number): string {
  if (nibble >= 0 && nibble <= 7) return "NCS (reserved, legacy)";
  if (nibble >= 8 && nibble <= 11) return "RFC 4122 / RFC 9562 (standard)";
  if (nibble === 12 || nibble === 13) return "Microsoft (reserved, legacy)";
  return "Reserved for future use";
}

function decodeGregorianTimestamp(time100ns: bigint): Date {
  const unixMs = (time100ns - GREGORIAN_OFFSET_100NS) / BigInt(10000);
  return new Date(Number(unixMs));
}

export function parseUuid(input: string): UuidParseResult | null {
  const uuid = input.trim().toLowerCase();
  const match = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/.exec(uuid);
  if (!match) return null;

  const [, g1, g2, g3, g4, g5] = match;
  const version = parseInt(g3[0], 16);
  const variant = variantLabel(parseInt(g4[0], 16));

  let timestamp: Date | null = null;
  let timestampNote: string | null = null;

  if (version === 1) {
    const timeLow = BigInt("0x" + g1);
    const timeMid = BigInt("0x" + g2);
    const timeHi = BigInt("0x" + g3.slice(1));
    const time100ns = (timeHi << BigInt(48)) | (timeMid << BigInt(32)) | timeLow;
    timestamp = decodeGregorianTimestamp(time100ns);
    timestampNote = "Decoded from the v1 time fields — only as accurate as the clock on the system that generated it.";
  } else if (version === 6) {
    const timeHigh = (BigInt("0x" + g1) << BigInt(16)) | BigInt("0x" + g2);
    const timeLow = BigInt("0x" + g3.slice(1));
    const time100ns = (timeHigh << BigInt(12)) | timeLow;
    timestamp = decodeGregorianTimestamp(time100ns);
  } else if (version === 7) {
    const unixMs = (BigInt("0x" + g1) << BigInt(16)) | BigInt("0x" + g2);
    timestamp = new Date(Number(unixMs));
  }

  return {
    kind: "uuid",
    raw: uuid,
    version,
    versionLabel: VERSION_LABELS[version] ?? "Unrecognized version",
    variant,
    timestamp,
    timestampNote,
    groups: [g1, g2, g3, g4, g5],
  };
}

export function isValidUlid(input: string): boolean {
  const s = input.trim().toUpperCase();
  if (s.length !== 26) return false;
  return Array.from(s).every((c) => ULID_ALPHABET.includes(c));
}

export function parseUlid(input: string): UlidParseResult | null {
  const ulid = input.trim().toUpperCase();
  if (!isValidUlid(ulid)) return null;

  const timePart = ulid.slice(0, 10);
  let value = 0;
  for (const c of timePart) {
    value = value * 32 + ULID_ALPHABET.indexOf(c);
  }

  return {
    kind: "ulid",
    raw: ulid,
    timestamp: new Date(value),
    randomPart: ulid.slice(10),
  };
}

export function parseId(input: string): ParseResult | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const uuid = parseUuid(trimmed);
  if (uuid) return uuid;
  const ulid = parseUlid(trimmed);
  if (ulid) return ulid;
  return null;
}
