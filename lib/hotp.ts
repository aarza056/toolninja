import { base32Decode, hotp, type TotpAlgorithm } from "./totp";

export interface HotpOptions {
  digits: number;
  algorithm: TotpAlgorithm;
}

export const DEFAULT_HOTP_OPTIONS: HotpOptions = {
  digits: 6,
  algorithm: "SHA-1",
};

export async function generateHOTP(secret: string, counter: number, opts: HotpOptions = DEFAULT_HOTP_OPTIONS): Promise<string> {
  const keyBytes = base32Decode(secret);
  return hotp(keyBytes, counter, opts.digits, opts.algorithm);
}

export function buildHotpOtpauthUrl(secret: string, label: string, issuer: string, counter: number, opts: HotpOptions = DEFAULT_HOTP_OPTIONS): string {
  const encodedLabel = encodeURIComponent(issuer ? `${issuer}:${label}` : label);
  const params = new URLSearchParams({
    secret,
    algorithm: opts.algorithm.replace("-", ""),
    digits: String(opts.digits),
    counter: String(counter),
  });
  if (issuer) params.set("issuer", issuer);
  return `otpauth://hotp/${encodedLabel}?${params.toString()}`;
}

export function parseHotpOtpauthUrl(url: string): { secret: string; label: string; issuer: string; counter: number; opts: HotpOptions } | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "otpauth:" || parsed.host.toLowerCase() !== "hotp") return null;
    const secret = parsed.searchParams.get("secret");
    if (!secret) return null;
    const rawLabel = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    const [labelIssuer, labelName] = rawLabel.includes(":") ? rawLabel.split(/:(.+)/) : [null, rawLabel];
    const issuer = parsed.searchParams.get("issuer") || labelIssuer || "";
    const algParam = (parsed.searchParams.get("algorithm") || "SHA1").toUpperCase();
    const algorithm: TotpAlgorithm = algParam === "SHA256" ? "SHA-256" : algParam === "SHA512" ? "SHA-512" : "SHA-1";
    return {
      secret,
      label: labelName || rawLabel,
      issuer,
      counter: Number(parsed.searchParams.get("counter")) || 0,
      opts: {
        digits: Number(parsed.searchParams.get("digits")) || 6,
        algorithm,
      },
    };
  } catch {
    return null;
  }
}
