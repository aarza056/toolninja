const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = BigInt(62);

function bytesToBigInt(bytes: Uint8Array): bigint {
  let n = BigInt(0);
  for (let i = 0; i < bytes.length; i++) n = n * BigInt(256) + BigInt(bytes[i]);
  return n;
}

function bigIntToBytes(n: bigint): Uint8Array {
  if (n === BigInt(0)) return new Uint8Array([0]);
  const bytes: number[] = [];
  while (n > BigInt(0)) {
    bytes.unshift(Number(n % BigInt(256)));
    n /= BigInt(256);
  }
  return new Uint8Array(bytes);
}

export function base62Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";

  let leadingZeros = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) leadingZeros++;
    else break;
  }

  let n = bytesToBigInt(bytes);
  let out = "";
  while (n > BigInt(0)) {
    const rem = n % BASE;
    out = ALPHABET[Number(rem)] + out;
    n /= BASE;
  }

  return ALPHABET[0].repeat(leadingZeros) + out;
}

export function base62Decode(input: string): Uint8Array {
  const trimmed = input.trim();
  if (!trimmed) return new Uint8Array();

  for (const ch of trimmed) {
    if (!ALPHABET.includes(ch)) {
      throw new Error(`Invalid Base62 character: "${ch}". Only 0-9, A-Z, a-z are allowed.`);
    }
  }

  let leadingZeros = 0;
  for (const ch of trimmed) {
    if (ch === ALPHABET[0]) leadingZeros++;
    else break;
  }

  let n = BigInt(0);
  for (const ch of trimmed) {
    n = n * BASE + BigInt(ALPHABET.indexOf(ch));
  }

  const decoded = n === BigInt(0) && leadingZeros === trimmed.length ? new Uint8Array() : bigIntToBytes(n);
  const zeros = new Uint8Array(leadingZeros);
  const out = new Uint8Array(zeros.length + decoded.length);
  out.set(zeros, 0);
  out.set(decoded, zeros.length);
  return out;
}

export function base62EncodeText(text: string): string {
  return base62Encode(new TextEncoder().encode(text));
}

export function base62DecodeToText(input: string): string {
  const bytes = base62Decode(input);
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().replace(/^0x/i, "").replace(/\s+/g, "");
  if (clean.length % 2 !== 0) throw new Error("Hex string must have an even number of characters.");
  if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error("Invalid hex string — only 0-9 and a-f are allowed.");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  return bytes;
}
