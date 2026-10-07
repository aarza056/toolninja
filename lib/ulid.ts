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
