// The parts of the sitemap crawler with no network in them: robots.txt rules, same-site checks, and
// reading links out of a page's HTML. Used by /api/crawl-page; safe in client code too.

export const CRAWLER_UA = "ToolNinjaSitemapBot";

export interface RobotsRules {
  rules: { allow: boolean; path: string }[];
  crawlDelay: number | null;
  sitemaps: string[];
}

/** The group that applies to our crawler: its own group if there is one, otherwise the * group (RFC 9309) */
export function parseRobots(text: string, ua = CRAWLER_UA): RobotsRules {
  type Group = { agents: string[]; rules: RobotsRules["rules"]; delay: number | null };
  const groups: Group[] = [];
  const sitemaps: string[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "sitemap") {
      if (value) sitemaps.push(value);
      continue;
    }
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [], delay: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (key === "allow" || key === "disallow") {
      // An empty Disallow means "nothing is disallowed"
      if (value) current.rules.push({ allow: key === "allow", path: value });
    } else if (key === "crawl-delay") {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0) current.delay = n;
    }
  }
  const name = ua.toLowerCase();
  const mine = groups.filter((g) => g.agents.some((a) => a !== "*" && name.includes(a)));
  const chosen = mine.length ? mine : groups.filter((g) => g.agents.includes("*"));
  return { rules: chosen.flatMap((g) => g.rules), crawlDelay: chosen.map((g) => g.delay).find((d) => d !== null) ?? null, sitemaps };
}

function ruleRegex(path: string): RegExp {
  const anchored = path.endsWith("$");
  const body = (anchored ? path.slice(0, -1) : path)
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

/** The longest matching rule wins; on a tie, Allow wins (RFC 9309). pathAndQuery starts with "/" */
export function isAllowed(rules: RobotsRules, pathAndQuery: string): boolean {
  let best: { allow: boolean; len: number } | null = null;
  for (const r of rules.rules) {
    if (!ruleRegex(r.path).test(pathAndQuery)) continue;
    if (!best || r.path.length > best.len || (r.path.length === best.len && r.allow)) best = { allow: r.allow, len: r.path.length };
  }
  return best ? best.allow : true;
}

const bare = (host: string) => host.toLowerCase().replace(/^www\./, "");
export const sameSite = (a: string, b: string) => bare(a) === bare(b);

// Files a sitemap of pages shouldn't list; a HEAD-free guess from the extension saves a fetch
const NOT_A_PAGE = /\.(?:jpe?g|png|gif|webp|avif|svg|ico|bmp|tiff?|pdf|zip|gz|tgz|rar|7z|tar|dmg|exe|msi|apk|mp[34]|m4[av]|webm|mov|avi|ogg|wav|woff2?|ttf|eot|otf|css|js|mjs|map|json|xml|rss|atom|txt|csv|docx?|xlsx?|pptx?)$/i;
const TRACKING = /^(?:utm_[a-z]+|gclid|fbclid|msclkid|mc_cid|mc_eid|ref|ref_src)$/i;

/** An absolute, clean page URL on this site — or null if the link isn't one worth crawling */
export function normalizeLink(href: string, base: string, rootHost: string): string | null {
  const h = href.trim();
  if (!h || /^(?:mailto|tel|javascript|data|sms|ftp|file):/i.test(h) || h.startsWith("#")) return null;
  let u: URL;
  try {
    u = new URL(h, base);
  } catch {
    return null;
  }
  if ((u.protocol !== "http:" && u.protocol !== "https:") || !sameSite(u.hostname, rootHost)) return null;
  if (NOT_A_PAGE.test(u.pathname)) return null;
  u.hash = "";
  u.username = "";
  u.password = "";
  Array.from(u.searchParams.keys())
    .filter((k) => TRACKING.test(k))
    .forEach((k) => u.searchParams.delete(k));
  return u.href;
}

const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/gi, "&")
    .replace(/&#0*38;/g, "&")
    .replace(/&#x0*26;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");

/** The value of an attribute inside one tag's text (double-quoted, single-quoted or bare) */
function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return m ? decodeEntities(m[1] ?? m[2] ?? m[3] ?? "") : null;
}

export interface PageInfo {
  title: string;
  links: string[];
  canonical: string | null;
  noindex: boolean;
  nofollow: boolean;
}

export function readPage(html: string, pageUrl: string, rootHost: string): PageInfo {
  // Links in comments and scripts aren't links
  const clean = html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ");
  let base = pageUrl;
  const baseTag = /<base\b[^>]*>/i.exec(clean);
  if (baseTag) {
    const href = attr(baseTag[0], "href");
    if (href) {
      try {
        base = new URL(href, pageUrl).href;
      } catch {}
    }
  }
  const seen = new Set<string>();
  const links: string[] = [];
  const re = /<a\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    const href = attr(m[0], "href");
    if (!href || /\bnofollow\b/i.test(attr(m[0], "rel") ?? "")) continue;
    const link = normalizeLink(href, base, rootHost);
    if (link && !seen.has(link)) {
      seen.add(link);
      links.push(link);
    }
  }
  let robots = "";
  let canonical: string | null = null;
  const tags = clean.match(/<(?:meta|link)\b[^>]*>/gi) ?? [];
  for (const t of tags) {
    if (/^<meta/i.test(t) && /^(?:robots|toolninjasitemapbot)$/i.test(attr(t, "name") ?? "")) robots += ` ${attr(t, "content") ?? ""}`;
    if (/^<link/i.test(t) && /(?:^|\s)canonical(?:\s|$)/i.test(attr(t, "rel") ?? "") && !canonical) {
      const href = attr(t, "href");
      if (href) canonical = normalizeLink(href, base, rootHost);
    }
  }
  const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(clean)?.[1] ?? "";
  return {
    title: decodeEntities(title).replace(/\s+/g, " ").trim(),
    links,
    canonical,
    noindex: /\b(?:noindex|none)\b/i.test(robots),
    nofollow: /\b(?:nofollow|none)\b/i.test(robots),
  };
}

// ─── the crawl itself ────────────────────────────────────────────────────────

/** What /api/crawl-page answers for one URL */
export interface CrawlResponse {
  ok: boolean;
  url?: string;
  finalUrl?: string;
  status?: number;
  error?: string;
  skipped?: "robots" | "offsite" | "not-html" | "error";
  canonical?: string | null;
  noindex?: boolean;
  links?: string[];
  lastModified?: string | null;
  crawlDelay?: number | null;
}

export interface CrawlResult {
  pages: { url: string; lastmod: string | null }[];
  broken: { url: string; status: number }[];
  noindex: string[];
  blocked: string[];
  failed: { url: string; error: string }[];
  /** Stopped at the page limit with links still unvisited */
  hitLimit: boolean;
  /** Why the crawl ended early, if it did (rate limit, or the visitor pressed Stop) */
  stopped: string | null;
}

export interface CrawlOptions {
  fetchPage: (url: string) => Promise<CrawlResponse>;
  maxPages: number;
  concurrency?: number;
  /** Pause between requests, per worker; a site's Crawl-delay raises it */
  delayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  shouldStop?: () => boolean;
  onProgress?: (p: { visited: number; queued: number; pages: number }) => void;
}

const isoDay = (httpDate: string | null | undefined) => {
  const t = httpDate ? Date.parse(httpDate) : NaN;
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
};

/** Breadth-first over one site, visiting each URL once, until the queue is empty or maxPages is reached */
export async function crawlSite(start: string, opts: CrawlOptions): Promise<CrawlResult> {
  const root = new URL(start);
  const first = normalizeLink(start, start, root.hostname) ?? start;
  const queue = [first];
  const seen = new Set<string>([first]);
  const listed = new Set<string>();
  const out: CrawlResult = { pages: [], broken: [], noindex: [], blocked: [], failed: [], hitLimit: false, stopped: null };
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const concurrency = opts.concurrency ?? 3;
  let delay = opts.delayMs ?? 250;
  let visited = 0;
  let active = 0;

  const worker = async () => {
    while (!out.stopped) {
      if (opts.shouldStop?.()) {
        out.stopped = "Stopped.";
        return;
      }
      if (visited >= opts.maxPages) return;
      const url = queue.shift();
      if (!url) {
        if (active === 0) return;
        await sleep(50); // another worker may still add links
        continue;
      }
      visited++;
      active++;
      let r: CrawlResponse;
      try {
        r = await opts.fetchPage(url);
      } catch (e) {
        r = { ok: false, error: e instanceof Error ? e.message : "request failed" };
      }
      active--;
      if (r.crawlDelay) delay = Math.max(delay, Math.min(r.crawlDelay * 1000, 5000) * concurrency);
      if (!r.ok) {
        if (r.status === 429) out.stopped = r.error ?? "Rate limited.";
        else out.failed.push({ url, error: r.error ?? "request failed" });
      } else if (r.skipped === "robots") out.blocked.push(url);
      else if ((r.status ?? 0) >= 400) out.broken.push({ url, status: r.status ?? 0 });
      else if (r.noindex) out.noindex.push(r.finalUrl ?? url);
      else if (!r.skipped) {
        const loc = r.canonical ?? r.finalUrl ?? url;
        if (!listed.has(loc)) {
          listed.add(loc);
          out.pages.push({ url: loc, lastmod: isoDay(r.lastModified) });
        }
      }
      for (const link of r.links ?? []) {
        if (!seen.has(link)) {
          seen.add(link);
          queue.push(link);
        }
      }
      opts.onProgress?.({ visited, queued: queue.length, pages: out.pages.length });
      await sleep(delay);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  out.hitLimit = !out.stopped && visited >= opts.maxPages && queue.length > 0;
  return out;
}
