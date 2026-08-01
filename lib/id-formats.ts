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
