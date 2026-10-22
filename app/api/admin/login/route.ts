import { createHash, createHmac } from "crypto";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminConfigured, createSession, safeEqual } from "@/lib/admin-session";
import { kv, safe } from "@/lib/kv";
import { clientIp, originAllowed } from "@/lib/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 3 wrong passwords lock sign-in for 30 minutes. Keyed on the (hashed) IP alone — not the browser —
// so switching user agents doesn't reset it. The IP itself is never stored.
const MAX_WRONG = 3;
const LOCK_SECONDS = 30 * 60;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const lockKey = (req: Request) =>
  `tn:login:fail:${createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "").update(`login|${clientIp(req)}`).digest("hex").slice(0, 24)}`;

export async function POST(req: Request) {
  const back = (error?: string) => NextResponse.redirect(new URL(`/admin/login${error ? `?error=${error}` : ""}`, req.url), 303);
  if (!originAllowed(req)) return back("forbidden");
  if (!adminConfigured()) return back("not_configured");

  const key = lockKey(req);
  const failures = Number(await safe(() => kv().get(key), "0")) || 0;
  if (failures >= MAX_WRONG) return back("locked");

  const form = await req.formData().catch(() => null);
  const password = String(form?.get("password") ?? "");
  // Compare hashes so the comparison is constant-time regardless of length
  if (!safeEqual(sha(password), sha(process.env.ADMIN_PASSWORD!))) {
    const n = await safe(() => kv().incr(key), failures + 1);
    // the 30-minute lock counts from the latest wrong attempt
    await safe(() => kv().expire(key, LOCK_SECONDS), undefined);
    await new Promise((r) => setTimeout(r, 400));
    return back(n >= MAX_WRONG ? "locked" : `wrong&left=${MAX_WRONG - n}`);
  }
  await safe(() => kv().del(key), undefined);

  const session = await createSession();
  const res = NextResponse.redirect(new URL("/admin", req.url), 303);
  res.cookies.set(ADMIN_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: session.maxAge,
  });
  return res;
}
