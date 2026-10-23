export function generateUuidV4(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Extracts the byte at the given bit offset from a (safe-integer) timestamp
// using division/modulo rather than bitwise ops, since Date.now() exceeds the
// 32-bit range JS bitwise operators silently truncate to.
function timestampByte(ms: number, bitOffset: number): number {
  return Math.floor(ms / Math.pow(2, bitOffset)) % 256;
}

/** RFC 9562 UUID v7 — a 48-bit millisecond Unix timestamp prefix followed by
 * random bits, making generated IDs lexicographically (and roughly time-)sortable. */
export function generateUuidV7(): string {
  const timestamp = Date.now();
  const rand = new Uint8Array(10);
  crypto.getRandomValues(rand);

  const bytes = new Uint8Array(16);
  bytes[0] = timestampByte(timestamp, 40);
  bytes[1] = timestampByte(timestamp, 32);
  bytes[2] = timestampByte(timestamp, 24);
  bytes[3] = timestampByte(timestamp, 16);
  bytes[4] = timestampByte(timestamp, 8);
  bytes[5] = timestampByte(timestamp, 0);

  bytes[6] = 0x70 | (rand[0] & 0x0f); // version 7
  bytes[7] = rand[1];
  bytes[8] = 0x80 | (rand[2] & 0x3f); // variant 10
  bytes[9] = rand[3];
  bytes[10] = rand[4];
  bytes[11] = rand[5];
  bytes[12] = rand[6];
  bytes[13] = rand[7];
  bytes[14] = rand[8];
  bytes[15] = rand[9];

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// RFC 4122 well-known namespace UUIDs, for the "for some potentially interesting name spaces" table.
export const UUID_NAMESPACES = {
  DNS: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  URL: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
  OID: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
  X500: "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
} as const;

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

function bytesToUuidString(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** RFC 4122 UUID v5 — deterministic: the same namespace + name always produces the same UUID,
 * via SHA-1(namespace bytes + name bytes) with the version/variant nibbles overwritten. Useful
 * for idempotency keys and stable test fixtures where you want the same input to reproduce
 * the same ID every time, unlike v4's fully random output. */
export async function generateUuidV5(namespace: string, name: string): Promise<string> {
  const nsBytes = hexToBytes(namespace.replace(/-/g, ""));
  const nameBytes = new TextEncoder().encode(name);
  const combined = new Uint8Array(nsBytes.length + nameBytes.length);
  combined.set(nsBytes, 0);
  combined.set(nameBytes, nsBytes.length);

  const hashBuffer = await crypto.subtle.digest("SHA-1", combined);
  const hash = new Uint8Array(hashBuffer).slice(0, 16);
  hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // variant RFC 4122

  return bytesToUuidString(hash);
}

const NANOID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

/** URL-safe, collision-resistant short ID — the standard choice for public-facing
 * identifiers (share links, invite codes) where UUID's length and hyphens are unwelcome. */
export function generateNanoId(size = 21): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < size; i++) {
    id += NANOID_ALPHABET[bytes[i] & 63];
  }
  return id;
}
