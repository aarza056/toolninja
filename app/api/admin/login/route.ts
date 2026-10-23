import { createHash, createHmac } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  PENDING_COOKIE,
  PENDING_SECONDS,
  adminConfigured,
  createPending,
  createSession,
  safeEqual,
  verifyPending,
} from "@/lib/admin-session";
import { codeRequiredStrict, sessionVersion, verifyCode } from "@/lib/two-factor";
import { notify, esc } from "@/lib/telegram";
import { kv, safe } from "@/lib/kv";
import { clientIp, networkId, originAllowed } from "@/lib/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Two steps: password, then (when enabled) a 6-digit authenticator code or a backup code.
// 3 wrong answers — password or code — lock sign-in for 30 minutes. The lock is keyed on the
// hashed network identity (IP, or IPv6 /64) alone — not the browser — so switching user agents
// doesn't reset it. The IP itself is never stored, only an HMAC of it.
//
// Fails closed: every attempt is counted *before* the password or code is checked, and if the
// counter can't be read or written (storage outage) sign-in is refused. A broken store can
// therefore never mean unlimited guesses. The in-memory dev store can't fail, so dev is unaffected.
const MAX_WRONG = 3;
const LOCK_SECONDS = 30 * 60;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const lockKey = (req: Request) =>
  `tn:login:fail:${createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "")
    .update(`login|${networkId(clientIp(req))}`)
    .digest("hex")
    .slice(0, 24)}`;

/** Reads the attempt counter; null means storage is unavailable (→ refuse sign-in). */
async function attemptsSoFar(key: string): Promise<number | null> {
  try {
    return Number(await kv().get(key)) || 0;
  } catch {
    return null;
  }
}

/** Counts this attempt and (re)starts the 30-minute window, in one round trip. null = not counted. */
async function chargeAttempt(key: string): Promise<number | null> {
  try {
    const [n] = await kv().batch().incr(key).expire(key, LOCK_SECONDS).exec();
    const count = Number(n);
    return Number.isFinite(count) && count > 0 ? count : null;
  } catch {
    return null;
  }
}

function describeAgent(ua: string): string {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Unknown browser";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "unknown OS";
  return `${browser} on ${os}`;
}

export async function POST(req: Request) {
  const back = (query = "") => NextResponse.redirect(new URL(`/admin/login${query ? `?${query}` : ""}`, req.url), 303);
  if (!originAllowed(req)) return back("error=forbidden");
  if (!adminConfigured()) return back("error=not_configured");

  const key = lockKey(req);
  const before = await attemptsSoFar(key);
  if (before === null) return back("error=unavailable");
  // Checked before counting, so hammering a locked sign-in doesn't extend the lock
  if (before >= MAX_WRONG) return back("error=locked");
  const n = await chargeAttempt(key);
  if (n === null) return back("error=unavailable");

  const wrong = async (step: "password" | "code") => {
    await new Promise((r) => setTimeout(r, 400));
    if (n >= MAX_WRONG) {
      await notify(`🔒 <b>Admin sign-in locked</b> for 30 minutes after ${MAX_WRONG} wrong ${step === "code" ? "codes" : "passwords"}.\n${esc(describeAgent(req.headers.get("user-agent") ?? ""))}`);
      const res = back("error=locked");
      res.cookies.set(PENDING_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    }
    return back(`error=wrong_${step}&left=${MAX_WRONG - n}${step === "code" ? "&step=code" : ""}`);
  };

  const form = await req.formData().catch(() => null);
  const step = String(form?.get("step") ?? "password");

  if (step === "code") {
    if (!(await verifyPending(cookies().get(PENDING_COOKIE)?.value))) return back("error=expired");
    const kind = await verifyCode(String(form?.get("code") ?? ""));
    if (!kind) return wrong("code");
    return signIn(req, key, kind === "backup");
  }

  const password = String(form?.get("password") ?? "");
  // Compare hashes so the comparison is constant-time regardless of length
  if (!safeEqual(sha(password), sha(process.env.ADMIN_PASSWORD!))) return wrong("password");

  let needsCode: boolean;
  try {
    needsCode = await codeRequiredStrict();
  } catch {
    // Can't tell whether 2FA is on — refuse rather than fall back to password-only
    return back("error=unavailable");
  }
  if (needsCode) {
    // The right password shouldn't use up one of the tries for the code step. Refund it rather than
    // resetting the counter — re-entering a known password must not grant fresh code guesses.
    await safe(() => kv().batch().incrby(key, -1).exec(), []);
    const res = back("step=code");
    res.cookies.set(PENDING_COOKIE, await createPending(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: PENDING_SECONDS,
    });
    return res;
  }
  return signIn(req, key, false);
}

async function signIn(req: Request, lock: string, usedBackup: boolean) {
  await safe(() => kv().del(lock), undefined);
  const session = await createSession(await sessionVersion());
  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(ADMIN_COOKIE, session.value, { httpOnly: true, secure, sameSite: "strict", path: "/", maxAge: session.maxAge });
  res.cookies.set(PENDING_COOKIE, "", { path: "/", maxAge: 0 });
  await notify(
    `🔐 <b>New admin sign-in</b>\n${esc(describeAgent(req.headers.get("user-agent") ?? ""))}${usedBackup ? "\n⚠️ A backup code was used." : ""}`,
    [[{ text: "That wasn't me — sign out everywhere", data: "sess:revoke" }]]
  );
  return res;
}
