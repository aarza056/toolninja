import { createHash, createHmac } from "crypto";
import { today } from "@/lib/kv";

// Anonymous visitor identity for rate limits and duplicate-vote checks.
//
// IPs are never stored: the network identity is hashed with a salt that changes every day, so a
// stored id can't be turned back into an IP or linked to the same visitor on another day.
//
// The identity is the IP alone — never the User-Agent. Anything the client controls (UA, cookies)
// would let one person reset their limits just by changing it.

/**
 * The client's IP. On Vercel this is trustworthy: Vercel's edge sets `x-forwarded-for` (and
 * `x-real-ip`) itself and overwrites any value the client sent, so it can't be spoofed. Off Vercel
 * (local dev) the header is whatever the request carries, which is fine for testing.
 */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Expands an IPv6 address to its 8 hextets, or null if it isn't one. */
function ipv6Hextets(ip: string): string[] | null {
  if (!ip.includes(":")) return null;
  const clean = ip.replace(/^\[|\]$/g, "").split("%")[0]; // brackets, zone id
  const [head, tail = ""] = clean.split("::");
  const left = head ? head.split(":") : [];
  const right = clean.includes("::") ? (tail ? tail.split(":") : []) : [];
  // an embedded IPv4 tail ("::ffff:1.2.3.4") counts as two hextets
  const expandV4 = (parts: string[]) =>
    parts.flatMap((p) => {
      if (!p.includes(".")) return [p];
      const o = p.split(".").map(Number);
      return [((o[0] << 8) | o[1]).toString(16), ((o[2] << 8) | o[3]).toString(16)];
    });
  const l = expandV4(left);
  const r = expandV4(right);
  const missing = 8 - l.length - r.length;
  if (missing < 0 || (!clean.includes("::") && missing !== 0)) return null;
  const all = [...l, ...Array(missing).fill("0"), ...r].map((h) => h.toLowerCase().padStart(4, "0"));
  return all.every((h) => /^[0-9a-f]{4}$/.test(h)) ? all : null;
}

/**
 * The network identity used for limits: an IPv4 address, or the /64 prefix of an IPv6 address.
 * A single IPv6 host usually controls a whole /64 and can rotate through it freely, so keying on the
 * full address would hand it billions of fresh identities.
 *
 * Trade-off: visitors behind one shared NAT (an office, a carrier-grade NAT, a /64 shared by a
 * hosting provider) share one identity and therefore one set of limits. The per-visitor limits are
 * set generously for that reason.
 */
export function networkId(ip: string): string {
  const h = ipv6Hextets(ip);
  if (!h) return ip;
  // IPv4-mapped IPv6 (::ffff:a.b.c.d) is really an IPv4 client
  if (h.slice(0, 5).every((x) => x === "0000") && h[5] === "ffff") {
    const n = (parseInt(h[6], 16) << 16) | parseInt(h[7], 16);
    return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  }
  return `${h.slice(0, 4).join(":")}::/64`;
}

/** Hashed, daily-rotating visitor id derived from the network identity only. */
export function visitorId(req: Request): string {
  const salt = createHmac("sha256", process.env.ADMIN_SESSION_SECRET || "toolninja-dev-salt")
    .update(`visitor|${today()}`)
    .digest("hex");
  return createHash("sha256").update(`${salt}|${networkId(clientIp(req))}`).digest("hex").slice(0, 24);
}

// ─── Origin check ───────────────────────────────────────────────────────────

const PRODUCTION_ORIGINS = ["https://toolninja.io", "https://www.toolninja.io"];

/**
 * Origins allowed to call our APIs from a browser: the production domains plus this very deployment's
 * own URLs, taken from Vercel's system environment variables (set on every deployment). A preview
 * build therefore accepts requests from itself only — not from every *.vercel.app site.
 * localhost is accepted only outside production builds.
 */
export function allowedOrigins(env: Record<string, string | undefined> = process.env): string[] {
  const vercel = [env.VERCEL_URL, env.VERCEL_BRANCH_URL, env.VERCEL_PROJECT_PRODUCTION_URL]
    .filter((h): h is string => Boolean(h))
    .map((h) => `https://${h}`);
  return [...PRODUCTION_ORIGINS, ...vercel];
}

function isLocalhost(origin: string): boolean {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

/** Requests from browsers carry an Origin; reject ones from other sites. */
export function originAllowed(req: Request, env: Record<string, string | undefined> = process.env): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin GETs and non-browser clients don't send one
  if (allowedOrigins(env).includes(origin)) return true;
  return env.NODE_ENV !== "production" && isLocalhost(origin);
}
