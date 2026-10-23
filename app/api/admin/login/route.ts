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
import { codeRequired, sessionVersion, verifyCode } from "@/lib/two-factor";
import { notify, esc } from "@/lib/telegram";
import { kv, safe } from "@/lib/kv";
import { clientIp, originAllowed } from "@/lib/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Two steps: password, then (when enabled) a 6-digit authenticator code or a backup code.
// 3 wrong answers — password or code — lock sign-in for 30 minutes. The lock is keyed on the
// hashed IP alone (not the browser), so switching user agents doesn't reset it.
const MAX_WRONG = 3;
const LOCK_SECONDS = 30 * 60;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const lockKey = (req: Request) =>
  `tn:login:fail:${createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "").update(`login|${clientIp(req)}`).digest("hex").slice(0, 24)}`;

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
  const failures = Number(await safe(() => kv().get(key), "0")) || 0;
  if (failures >= MAX_WRONG) return back("error=locked");

  const wrong = async (step: "password" | "code") => {
    const n = await safe(() => kv().incr(key), failures + 1);
    await safe(() => kv().expire(key, LOCK_SECONDS), undefined); // the lock counts from the latest wrong attempt
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

  if (await codeRequired()) {
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
