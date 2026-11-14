import { fetchPage } from "@/lib/safe-fetch";
import { kv, safe } from "@/lib/kv";
import { visitorId, originAllowed } from "@/lib/visitor";

// Fetches a site's /robots.txt for the robots.txt Tester, the way a crawler would: one request,
// redirects followed, public addresses only (lib/safe-fetch), and a size limit just above Google's
// 500 KiB, so the tester can say when a file is too big. Rules are tested in the browser.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA = "ToolNinja-RobotsTester/1.0 (+https://toolninja.io/tools/robots-txt-tester)";
const LIMIT = 30; // fetches per visitor per 10 minutes
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  if (!originAllowed(req)) return json({ ok: false, error: "forbidden" }, 403);
  let url = "";
  try {
    const body = await req.json();
    url = typeof body?.url === "string" ? body.url.slice(0, 2000).trim() : "";
  } catch {}
  if (!url) return json({ ok: false, error: "Enter a website address." }, 400);

  let site: URL;
  try {
    site = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
  } catch {
    return json({ ok: false, error: "That isn't a valid URL." }, 400);
  }

  const key = `tn:robots:${visitorId(req)}`;
  const used = await safe(async () => {
    const n = await kv().incr(key);
    if (n === 1) await kv().expire(key, 600);
    return n;
  }, 0);
  if (used > LIMIT) return json({ ok: false, error: "Too many requests in a short time — try again in a few minutes." }, 429);

  const robotsUrl = `${site.origin}/robots.txt`;
  // Crawlers read robots.txt whatever its Content-Type, and follow redirects to another host too
  const r = await fetchPage(robotsUrl, { userAgent: UA, maxBytes: 520 * 1024, accept: /.*/ });
  if (!r.ok) return json({ ok: false, error: r.error }, 422);
  const { status, finalUrl, headers, body, truncated, chain } = r.result;
  const contentType = headers.find(([k]) => k.toLowerCase() === "content-type")?.[1] ?? null;
  return json({ ok: true, robotsUrl, finalUrl, status, contentType, body: body ?? "", truncated: !!truncated, redirects: chain.length });
}
