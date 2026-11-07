import { kv, safe } from "@/lib/kv";
import { mockResponse, readMockParams } from "@/lib/retry-after";
import { visitorId } from "@/lib/visitor";

// A real rate limiter to point your client at: `limit` requests per `window` seconds, then a 429 (or
// 503) with Retry-After until the window ends. It only counts anonymous visitors, briefly. CORS is
// open so it can be called from code on localhost; nothing here depends on who is asking.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HARD_LIMIT = 300; // requests per visitor per 10 minutes, whatever the test's own settings

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "Retry-After, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
  "Access-Control-Max-Age": "86400",
};
const COMMON = { ...CORS, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

async function handle(req: Request) {
  const visitor = visitorId(req);
  const hardKey = `tn:mockrl:all:${visitor}`;
  const used = await safe(async () => {
    const n = await kv().incr(hardKey);
    if (n === 1) await kv().expire(hardKey, 600);
    return n;
  }, 0);
  if (used > HARD_LIMIT) {
    return Response.json({ error: "Too many test requests from you in a short time. Try again in a few minutes." }, { status: 429, headers: { ...COMMON, "Retry-After": "600" } });
  }

  const p = readMockParams(new URL(req.url).searchParams);
  const now = Date.now();
  const windowMs = p.windowSeconds * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  // limit=0 is "always limited", which needs no counting
  let count = 1;
  if (p.limit > 0) {
    const key = `tn:mockrl:${visitor}:${p.limit}:${p.windowSeconds}:${windowStart}`;
    count = await safe(async () => {
      const n = await kv().incr(key);
      if (n === 1) await kv().expire(key, p.windowSeconds + 5);
      return n;
    }, 1);
  }

  const r = mockResponse(p, count, windowStart, now);
  const body = r.allowed
    ? { ok: true, message: "Request allowed.", remaining: r.remaining, windowResetsInSeconds: r.resetSeconds }
    : { ok: false, error: p.status === 503 ? "Service unavailable (test response)." : "Too many requests (test response).", retryAfter: r.headers["Retry-After"] };
  return Response.json(body, { status: r.status, headers: { ...COMMON, ...r.headers } });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
