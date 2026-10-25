import { createHmac, timingSafeEqual } from "crypto";

// Verifies webhook signatures in the Svix format Resend uses: HMAC-SHA256 over
// "<svix-id>.<svix-timestamp>.<raw body>" with the base64 key after "whsec_"; the svix-signature
// header holds one or more space-separated "v1,<base64>" entries.

const TOLERANCE_SECONDS = 5 * 60;

export function verifySvix(secret: string, headers: { id: string | null; timestamp: string | null; signature: string | null }, body: string, now = Date.now()): boolean {
  const { id, timestamp, signature } = headers;
  if (!secret || !id || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > TOLERANCE_SECONDS) return false;
  let key: Buffer;
  try {
    key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  } catch {
    return false;
  }
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return signature.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

/** Builds a valid signature header — used by tests. */
export function signSvix(secret: string, id: string, timestamp: string, body: string): string {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  return `v1,${createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64")}`;
}
