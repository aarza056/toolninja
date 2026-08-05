const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export type TotpAlgorithm = "SHA-1" | "SHA-256" | "SHA-512";

export interface TotpOptions {
  digits: number;
  period: number;
  algorithm: TotpAlgorithm;
}

export const DEFAULT_TOTP_OPTIONS: TotpOptions = {
  digits: 6,
  period: 30,
  algorithm: "SHA-1",
};

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

export function generateRandomSecret(byteLength = 20): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return base32Encode(bytes);
}

function counterToBytes(counter: number): ArrayBuffer {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  const big = BigInt(counter);
  view.setUint32(0, Number(big >> BigInt(32)));
  view.setUint32(4, Number(big & BigInt(0xffffffff)));
  return buf;
}

async function hotp(keyBytes: Uint8Array, counter: number, digits: number, algorithm: TotpAlgorithm): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as BufferSource,
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"]
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, counterToBytes(counter)));
  const offset = sig[sig.length - 1] & 0x0f;
  const binCode =
    ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff);
  return (binCode % 10 ** digits).toString().padStart(digits, "0");
}

export async function generateTOTP(secret: string, opts: TotpOptions = DEFAULT_TOTP_OPTIONS, timestamp = Date.now()): Promise<string> {
  const keyBytes = base32Decode(secret);
  const counter = Math.floor(timestamp / 1000 / opts.period);
  return hotp(keyBytes, counter, opts.digits, opts.algorithm);
}

export function secondsRemaining(period: number, timestamp = Date.now()): number {
  const elapsed = Math.floor(timestamp / 1000) % period;
  return period - elapsed;
}

export function buildOtpauthUrl(secret: string, label: string, issuer: string, opts: TotpOptions = DEFAULT_TOTP_OPTIONS): string {
  const encodedLabel = encodeURIComponent(issuer ? `${issuer}:${label}` : label);
  const params = new URLSearchParams({
    secret,
    algorithm: opts.algorithm.replace("-", ""),
    digits: String(opts.digits),
    period: String(opts.period),
  });
  if (issuer) params.set("issuer", issuer);
  return `otpauth://totp/${encodedLabel}?${params.toString()}`;
}

export function parseOtpauthUrl(url: string): { secret: string; label: string; issuer: string; opts: TotpOptions } | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "otpauth:") return null;
    const secret = parsed.searchParams.get("secret");
    if (!secret) return null;
    const rawLabel = decodeURIComponent(parsed.pathname.replace(/^\/\/totp\//i, "").replace(/^\//, ""));
    const [labelIssuer, labelName] = rawLabel.includes(":") ? rawLabel.split(/:(.+)/) : [null, rawLabel];
    const issuer = parsed.searchParams.get("issuer") || labelIssuer || "";
    const algParam = (parsed.searchParams.get("algorithm") || "SHA1").toUpperCase();
    const algorithm: TotpAlgorithm = algParam === "SHA256" ? "SHA-256" : algParam === "SHA512" ? "SHA-512" : "SHA-1";
    return {
      secret,
      label: labelName || rawLabel,
      issuer,
      opts: {
        digits: Number(parsed.searchParams.get("digits")) || 6,
        period: Number(parsed.searchParams.get("period")) || 30,
        algorithm,
      },
    };
  } catch {
    return null;
  }
}
