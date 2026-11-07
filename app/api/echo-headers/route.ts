import { kv, safe } from "@/lib/kv";
import { inspectRequest } from "@/lib/request-headers";
import { clientIp, visitorId } from "@/lib/visitor";

// Shows a request's headers back to whoever sent it. Nothing is stored apart from an anonymous counter
// for the rate limit. No CORS header: other sites have no reason to read a visitor's details from here.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 120; // per visitor per 10 minutes
const HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

export async function GET(req: Request) {
  const key = `tn:echo:${visitorId(req)}`;
  const used = await safe(async () => {
    const n = await kv().incr(key);
    if (n === 1) await kv().expire(key, 600);
    return n;
  }, 0);
  if (used > LIMIT) return Response.json({ ok: false, error: "Too many requests in a short time. Try again in a few minutes." }, { status: 429, headers: { ...HEADERS, "Retry-After": "600" } });

  const pairs: [string, string][] = [];
  req.headers.forEach((value, name) => pairs.push([name, value]));
  return Response.json({ ok: true, method: req.method, ip: clientIp(req), ...inspectRequest(pairs) }, { headers: HEADERS });
}
