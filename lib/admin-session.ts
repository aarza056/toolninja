// Signed admin session cookie. Uses Web Crypto so the same code verifies in middleware (edge)
// and in server components/actions (node).
//
// Session value: "<exp>.<ver>.<sig>". `ver` is the session generation stored in Redis — bumping it
// ("sign out everywhere") invalidates every existing session; requireAdmin checks it on the server.
// Between password and 2FA code there's a short-lived "pending" cookie that only allows the code step.

export const ADMIN_COOKIE = "tn_admin";
export const PENDING_COOKIE = "tn_admin_2fa";
export const SESSION_DAYS = 7;
export const PENDING_SECONDS = 5 * 60;

const enc = new TextEncoder();

function b64url(buf: ArrayBuffer): string {
  let s = "";
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export async function createSession(ver: number): Promise<{ value: string; maxAge: number }> {
  const maxAge = SESSION_DAYS * 86400;
  const exp = Math.floor(Date.now() / 1000) + maxAge;
  const sig = await sign(`admin|${exp}|${ver}`, process.env.ADMIN_SESSION_SECRET!);
  return { value: `${exp}.${ver}.${sig}`, maxAge };
}

/** Signature + expiry only (works on the edge). Returns the session generation, or null. */
export async function verifySession(value: string | undefined): Promise<number | null> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!value || !secret || !process.env.ADMIN_PASSWORD) return null;
  const [expStr, verStr, sig] = value.split(".");
  const exp = Number(expStr);
  const ver = Number(verStr);
  if (!exp || !Number.isInteger(ver) || !sig || exp < Date.now() / 1000) return null;
  return safeEqual(sig, await sign(`admin|${exp}|${ver}`, secret)) ? ver : null;
}

export async function createPending(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + PENDING_SECONDS;
  return `${exp}.${await sign(`pending|${exp}`, process.env.ADMIN_SESSION_SECRET!)}`;
}

export async function verifyPending(value: string | undefined): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!value || !secret) return false;
  const [expStr, sig] = value.split(".");
  const exp = Number(expStr);
  if (!exp || !sig || exp < Date.now() / 1000) return false;
  return safeEqual(sig, await sign(`pending|${exp}`, secret));
}
