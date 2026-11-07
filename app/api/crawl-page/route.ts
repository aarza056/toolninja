import { fetchPage } from "@/lib/safe-fetch";
import { CRAWLER_UA, isAllowed, parseRobots, readPage, sameSite, type RobotsRules } from "@/lib/site-crawl";
import { kv, safe } from "@/lib/kv";
import { visitorId, originAllowed } from "@/lib/visitor";

// One page of a sitemap crawl. The browser drives the crawl, one request per page, so a crawl needs no
// long-running function and stops the moment the tab closes. Everything that protects other sites is
// enforced here, not in the browser: public addresses only (lib/safe-fetch), one site per crawl, its
// robots.txt, a size limit, and request limits per visitor and per target site.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USER_AGENT = `${CRAWLER_UA}/1.0 (+https://toolninja.io/tools/sitemap-generator)`;
const MAX_HTML = 2 * 1024 * 1024;
const MAX_ROBOTS = 512 * 1024;
const VISITOR_LIMIT = 1500; // pages per visitor per hour
const SITE_LIMIT = 1500; // pages per target site per hour, whoever asks
const HOUR = 3600;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function overLimit(key: string, limit: number): Promise<boolean> {
  const used = await safe(async () => {
    const n = await kv().incr(key);
    if (n === 1) await kv().expire(key, HOUR);
    return n;
  }, 0);
  return used > limit;
}

/** robots.txt for the site, cached briefly. No robots.txt (or an unreachable one) allows everything */
async function robotsFor(origin: string, host: string): Promise<RobotsRules> {
  const key = `tn:crawl:robots:${host.toLowerCase()}`;
  const cached = await safe(() => kv().get(key), null);
  let text = cached;
  if (text === null) {
    const r = await fetchPage(`${origin}/robots.txt`, { userAgent: USER_AGENT, maxBytes: MAX_ROBOTS, accept: /text\/plain|^$/i, stayOn: (h) => sameSite(h, host) });
    text = r.ok && r.result.status === 200 ? (r.result.body ?? "") : "";
    await safe(() => kv().set(key, text ?? "", { ex: 600 }), false);
  }
  return parseRobots(text);
}

export async function POST(req: Request) {
  if (!originAllowed(req)) return json({ ok: false, error: "forbidden" }, 403);
  let url = "";
  try {
    const body = await req.json();
    url = typeof body?.url === "string" ? body.url.slice(0, 2000) : "";
  } catch {}

  let target: URL;
  try {
    target = new URL(/^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`);
  } catch {
    return json({ ok: false, error: "That isn't a valid URL." }, 400);
  }
  const host = target.hostname;

  if (await overLimit(`tn:crawl:v:${visitorId(req)}`, VISITOR_LIMIT)) return json({ ok: false, error: "You've crawled a lot of pages in the last hour — try again later." }, 429);
  if (await overLimit(`tn:crawl:h:${host.toLowerCase().replace(/^www\./, "")}`, SITE_LIMIT)) return json({ ok: false, error: "This site has had many crawl requests in the last hour — try again later." }, 429);

  const robots = await robotsFor(target.origin, host);
  if (!isAllowed(robots, `${target.pathname}${target.search}`)) return json({ ok: true, url: target.href, skipped: "robots", crawlDelay: robots.crawlDelay });

  const r = await fetchPage(target.href, { userAgent: USER_AGENT, maxBytes: MAX_HTML, accept: /text\/html|application\/xhtml/i, stayOn: (h) => sameSite(h, host) });
  if (!r.ok) return json({ ok: false, url: target.href, error: r.error }, 422);
  const { status, finalUrl, headers, body, leftSite } = r.result;
  const lastModified = headers.find(([k]) => k.toLowerCase() === "last-modified")?.[1] ?? null;
  const robotsHeader = headers
    .filter(([k]) => k.toLowerCase() === "x-robots-tag")
    .map(([, v]) => v)
    .join(",");
  if (leftSite) return json({ ok: true, url: target.href, finalUrl, status, skipped: "offsite", crawlDelay: robots.crawlDelay });
  if (body === undefined) return json({ ok: true, url: target.href, finalUrl, status, skipped: status >= 200 && status < 300 ? "not-html" : "error", crawlDelay: robots.crawlDelay });

  const page = readPage(body, finalUrl, host);
  const noindex = page.noindex || /\b(?:noindex|none)\b/i.test(robotsHeader);
  const nofollow = page.nofollow || /\b(?:nofollow|none)\b/i.test(robotsHeader);
  return json({
    ok: true,
    url: target.href,
    finalUrl,
    status,
    title: page.title.slice(0, 200),
    canonical: page.canonical,
    noindex,
    links: nofollow ? [] : page.links.slice(0, 2000),
    lastModified,
    crawlDelay: robots.crawlDelay,
  });
}
