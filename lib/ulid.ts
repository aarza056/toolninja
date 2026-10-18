// Crockford's Base32 alphabet — excludes I, L, O, U to avoid visual ambiguity with 1/1/0/V.
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeTime(time: number, len: number): string {
  let str = "";
  let t = time;
  for (let i = len - 1; i >= 0; i--) {
    const mod = t % 32;
    str = ENCODING[mod] + str;
    t = (t - mod) / 32;
  }
  return str;
}

function encodeRandom(len: number): string {
  // 256 is an exact multiple of 32, so byte % 32 introduces no modulo bias.
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let str = "";
  for (let i = 0; i < len; i++) str += ENCODING[bytes[i] % 32];
  return str;
}

export function generateULID(timestamp: number = Date.now()): string {
  return encodeTime(timestamp, 10) + encodeRandom(16);
}

function incrementBase32(str: string): string {
  const chars = str.split("");
  for (let i = chars.length - 1; i >= 0; i--) {
    const idx = ENCODING.indexOf(chars[i]);
    if (idx < 31) {
      chars[i] = ENCODING[idx + 1];
      return chars.join("");
    }
    chars[i] = ENCODING[0];
  }
  throw new Error("ULID random component overflowed within a single millisecond");
}

/** Spec "monotonic" mode: within one millisecond, each ULID's random part is the previous one + 1,
 * so a batch sorts in exactly the order it was generated. */
export function generateMonotonicULIDs(count: number, timestamp: number = Date.now()): string[] {
  const time = encodeTime(timestamp, 10);
  let random = encodeRandom(16);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i > 0) random = incrementBase32(random);
    out.push(time + random);
  }
  return out;
}

export function isValidULID(ulid: string): boolean {
  return /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(ulid);
}

export function ulidToDate(ulid: string): Date | null {
  if (!isValidULID(ulid)) return null;
  const timeChars = ulid.slice(0, 10).toUpperCase();
  let time = 0;
  for (const ch of timeChars) {
    const idx = ENCODING.indexOf(ch);
    if (idx === -1) return null;
    time = time * 32 + idx;
  }
  return new Date(time);
}
