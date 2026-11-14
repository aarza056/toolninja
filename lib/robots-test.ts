// A robots.txt tester that follows RFC 9309 and Google's documented behavior:
//   - a crawler obeys one set of rules: every group naming its user-agent token (merged), or else the
//     `*` groups (merged). Google's specialised crawlers fall back to Googlebot's group; AdsBot ignores `*`
//   - the most specific (longest) matching rule wins; on a tie, Allow wins
//   - `*` matches any run of characters, `$` anchors the end; matching is case-sensitive
//   - /robots.txt itself is always allowed

export interface RobotsRule {
  allow: boolean;
  path: string;
  line: number;
}

export interface RobotsGroupInfo {
  agents: string[];
  rules: RobotsRule[];
  crawlDelay: number | null;
  line: number;
}

export interface RobotsIssue {
  line: number;
  severity: "error" | "warning" | "info";
  message: string;
}

export interface ParsedRobots {
  groups: RobotsGroupInfo[];
  sitemaps: { url: string; line: number }[];
  issues: RobotsIssue[];
  bytes: number;
}

export const GOOGLE_LIMIT_BYTES = 500 * 1024;

const KNOWN = new Set(["user-agent", "allow", "disallow", "sitemap", "crawl-delay", "host", "clean-param", "request-rate", "visit-time", "noindex", "nofollow"]);
const TYPOS: Record<string, string> = {
  "useragent": "user-agent",
  "user agent": "user-agent",
  "user-agents": "user-agent",
  "dissallow": "disallow",
  "disalow": "disallow",
  "dissalow": "disallow",
  "disallowed": "disallow",
  "allowed": "allow",
  "site-map": "sitemap",
  "sitemaps": "sitemap",
};

export function parseRobotsFull(text: string): ParsedRobots {
  const bytes = new TextEncoder().encode(text).length;
  const issues: RobotsIssue[] = [];
  const groups: RobotsGroupInfo[] = [];
  const sitemaps: { url: string; line: number }[] = [];
  let current: RobotsGroupInfo | null = null;
  let lastWasAgent = false;
  const src = text.replace(/^﻿/, "");
  const lines = src.split(/\r\n|\r|\n/);

  lines.forEach((raw, i) => {
    const n = i + 1;
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) return;
    const m = /^([A-Za-z][A-Za-z -]*?)\s*:\s*(.*)$/.exec(line);
    if (!m) {
      issues.push({ line: n, severity: "warning", message: `"${line.slice(0, 60)}" isn't a directive (directives look like Name: value). Crawlers ignore this line.` });
      return;
    }
    let key = m[1].toLowerCase().trim();
    const value = m[2].trim();
    if (TYPOS[key]) {
      // Google accepts some misspellings, but other crawlers don't
      issues.push({ line: n, severity: "warning", message: `"${m[1]}" is a misspelling of ${TYPOS[key].replace(/^\w/, (c) => c.toUpperCase())}. Google may accept it; other crawlers will ignore it.` });
      key = TYPOS[key];
    }
    if (key === "sitemap") {
      if (!/^https?:\/\//i.test(value)) issues.push({ line: n, severity: "warning", message: "Sitemap needs a full URL, starting with https://." });
      if (value) sitemaps.push({ url: value, line: n });
      return;
    }
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [], crawlDelay: null, line: n };
        groups.push(current);
      }
      if (!value) issues.push({ line: n, severity: "warning", message: "Empty User-agent line." });
      else {
        if (value !== "*" && /[^A-Za-z_*-]/.test(value.replace(/\/[\d.]+$/, ""))) {
          issues.push({ line: n, severity: "info", message: `User-agent "${value}": crawlers match only the product name (letters, - and _), so this is read as "${value.split(/[^A-Za-z_-]/)[0] || value}".` });
        }
        if (value !== "*" && value.includes("*")) issues.push({ line: n, severity: "warning", message: "Wildcards aren't supported in User-agent names (only a lone * for all crawlers)." });
        current.agents.push(value);
      }
      lastWasAgent = true;
      return;
    }
    lastWasAgent = false;
    if (!KNOWN.has(key)) {
      issues.push({ line: n, severity: "warning", message: `Unknown directive "${m[1]}". Crawlers ignore it.` });
      return;
    }
    if (key === "noindex" || key === "nofollow") {
      issues.push({ line: n, severity: "error", message: `${m[1]} isn't supported in robots.txt: Google stopped honoring it in 2019. Use a robots meta tag or the X-Robots-Tag header.` });
      return;
    }
    if (key === "host" || key === "clean-param") {
      issues.push({ line: n, severity: "info", message: `${m[1]} is Yandex-only; other crawlers ignore it.` });
      return;
    }
    if (key === "request-rate" || key === "visit-time") {
      issues.push({ line: n, severity: "info", message: `${m[1]} is a non-standard extension most crawlers ignore.` });
      return;
    }
    if (!current) {
      issues.push({ line: n, severity: "error", message: `${m[1]} comes before any User-agent line, so no crawler applies it.` });
      return;
    }
    if (key === "crawl-delay") {
      const d = Number(value);
      if (!Number.isFinite(d) || d < 0) issues.push({ line: n, severity: "warning", message: `Crawl-delay "${value}" isn't a number.` });
      else {
        current.crawlDelay = d;
        issues.push({ line: n, severity: "info", message: "Googlebot ignores Crawl-delay. Bing and Yandex respect it." });
      }
      return;
    }
    if (!value) {
      // An empty Disallow allows everything; an empty Allow does nothing
      return;
    }
    if (!value.startsWith("/") && !value.startsWith("*")) {
      issues.push({ line: n, severity: "warning", message: `"${value}" should start with / (or *). Google treats it as if it did; other crawlers may not match it at all.` });
    }
    const dollar = value.indexOf("$");
    if (dollar >= 0 && dollar !== value.length - 1) issues.push({ line: n, severity: "warning", message: "$ only means “end of URL” as the last character; elsewhere it's a literal $." });
    current.rules.push({ allow: key === "allow", path: value.startsWith("/") || value.startsWith("*") ? value : `/${value}`, line: n });
  });

  if (bytes > GOOGLE_LIMIT_BYTES) issues.push({ line: 0, severity: "error", message: `The file is ${(bytes / 1024).toFixed(0)} KiB. Google reads only the first 500 KiB and ignores the rest.` });
  for (const g of groups) {
    if (!g.rules.length && g.agents.length) issues.push({ line: g.line, severity: "info", message: `The group for ${g.agents.join(", ")} has no rules, so those crawlers may crawl everything.` });
  }
  issues.sort((a, b) => a.line - b.line);
  return { groups, sitemaps, issues, bytes };
}

export interface Crawler {
  token: string;
  label: string;
  /** Google's crawlers that use Googlebot's rules when no group names them */
  fallback?: string;
  /** Doesn't obey the * group: it must be named */
  ignoresStar?: boolean;
  note?: string;
}

export const CRAWLERS: Crawler[] = [
  { token: "Googlebot", label: "Googlebot (Google Search)" },
  { token: "Googlebot-Image", label: "Googlebot-Image", fallback: "Googlebot" },
  { token: "Googlebot-Video", label: "Googlebot-Video", fallback: "Googlebot" },
  { token: "Googlebot-News", label: "Googlebot-News", fallback: "Googlebot" },
  { token: "Storebot-Google", label: "Storebot-Google (Shopping)", fallback: "Googlebot" },
  { token: "Google-Extended", label: "Google-Extended (Gemini training)", note: "Not a crawler: a robots.txt token that controls whether Googlebot's crawl is used to train Gemini. It doesn't affect Search." },
  { token: "AdsBot-Google", label: "AdsBot-Google (Google Ads)", ignoresStar: true, note: "Ignores the * group; it obeys only rules that name it." },
  { token: "Mediapartners-Google", label: "Mediapartners-Google (AdSense)", ignoresStar: true, note: "Ignores the * group; it obeys only rules that name it." },
  { token: "Bingbot", label: "Bingbot" },
  { token: "DuckDuckBot", label: "DuckDuckBot" },
  { token: "YandexBot", label: "YandexBot" },
  { token: "Baiduspider", label: "Baiduspider" },
  { token: "Applebot", label: "Applebot (Siri, Spotlight)" },
  { token: "Applebot-Extended", label: "Applebot-Extended (Apple AI training)", note: "Not a crawler: a token that controls whether Applebot's crawl trains Apple's models." },
  { token: "GPTBot", label: "GPTBot (OpenAI training)" },
  { token: "OAI-SearchBot", label: "OAI-SearchBot (ChatGPT search)" },
  { token: "ChatGPT-User", label: "ChatGPT-User (user-initiated)" },
  { token: "ClaudeBot", label: "ClaudeBot (Anthropic training)" },
  { token: "Claude-SearchBot", label: "Claude-SearchBot (Claude search)" },
  { token: "Claude-User", label: "Claude-User (user-initiated)" },
  { token: "PerplexityBot", label: "PerplexityBot" },
  { token: "CCBot", label: "CCBot (Common Crawl)" },
  { token: "Bytespider", label: "Bytespider (ByteDance)" },
  { token: "meta-externalagent", label: "meta-externalagent (Meta AI)" },
  { token: "facebookexternalhit", label: "facebookexternalhit (link previews)" },
  { token: "Twitterbot", label: "Twitterbot (link previews)" },
  { token: "AhrefsBot", label: "AhrefsBot" },
  { token: "SemrushBot", label: "SemrushBot" },
];

/** The product token a User-agent line names: up to the first character that isn't a letter, - or _ */
const productOf = (agent: string) => (agent === "*" ? "*" : agent.split(/[^A-Za-z_-]/)[0].toLowerCase());

export interface GroupChoice {
  groups: RobotsGroupInfo[];
  /** How the groups were chosen */
  reason: string;
  /** The token whose groups were used */
  matched: string | null;
}

export function chooseGroups(parsed: ParsedRobots, token: string): GroupChoice {
  const want = token.trim().toLowerCase() || "*";
  const crawler = CRAWLERS.find((c) => c.token.toLowerCase() === want);
  const named = (t: string) => parsed.groups.filter((g) => g.agents.some((a) => productOf(a) === t));
  const mine = want === "*" ? [] : named(want);
  if (mine.length) {
    const hasStar = parsed.groups.some((g) => g.agents.includes("*") && g.rules.length);
    return {
      groups: mine,
      reason: `${mine.length > 1 ? `${mine.length} groups name` : "A group names"} ${token}${mine.length > 1 ? "; their rules are combined" : ""}.${hasStar ? ` ${token} ignores the * group completely, so none of the * rules apply to it. Repeat any you still want in its own group.` : ""}`,
      matched: token,
    };
  }
  if (crawler?.fallback) {
    const fb = named(crawler.fallback.toLowerCase());
    if (fb.length) return { groups: fb, reason: `No group names ${token}, so it follows ${crawler.fallback}'s rules, as Google's specialised crawlers do.`, matched: crawler.fallback };
  }
  if (crawler?.ignoresStar) return { groups: [], reason: `No group names ${token}, and it ignores the * group, so everything is allowed for it.`, matched: null };
  const star = parsed.groups.filter((g) => g.agents.includes("*"));
  if (star.length) return { groups: star, reason: `${want === "*" ? "The" : `No group names ${token}, so the`} * group applies${star.length > 1 ? " (its groups are combined)" : ""}.`, matched: "*" };
  return { groups: [], reason: `No group applies to ${token}, so everything is allowed.`, matched: null };
}

const UNRESERVED = /[A-Za-z0-9\-._~]/;

/** Percent-encoding normalized the same way on both sides: %xx upper-cased, unreserved characters decoded, non-ASCII encoded */
export function normalizePath(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "%" && /^[0-9A-Fa-f]{2}$/.test(s.slice(i + 1, i + 3))) {
      const ch = String.fromCharCode(parseInt(s.slice(i + 1, i + 3), 16));
      out += UNRESERVED.test(ch) ? ch : `%${s.slice(i + 1, i + 3).toUpperCase()}`;
      i += 2;
    } else if (c.charCodeAt(0) > 127) {
      out += encodeURIComponent(c);
    } else out += c;
  }
  return out;
}

const regexCache = new Map<string, RegExp>();
function patternRegex(pattern: string): RegExp {
  let re = regexCache.get(pattern);
  if (re) return re;
  const norm = normalizePath(pattern);
  const anchored = norm.endsWith("$");
  const body = (anchored ? norm.slice(0, -1) : norm).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*+/g, ".*");
  re = new RegExp(`^${body}${anchored ? "$" : ""}`);
  regexCache.set(pattern, re);
  return re;
}

export function ruleMatches(pattern: string, path: string): boolean {
  return patternRegex(pattern).test(normalizePath(path));
}

export interface PathVerdict {
  input: string;
  path: string;
  allowed: boolean;
  rule: RobotsRule | null;
  /** Every rule that matched, longest first */
  matching: RobotsRule[];
  note?: string;
}

/** Turns a full URL or a path into the path + query crawlers match against */
export function toPath(input: string): string {
  const s = input.trim();
  const abs = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i.exec(s);
  let p = abs ? s.slice(abs[0].length) : s;
  p = p.replace(/#.*$/, "");
  if (!p.startsWith("/")) p = `/${p}`;
  return p;
}

export function testPath(choice: GroupChoice, input: string): PathVerdict {
  const path = toPath(input);
  if (path === "/robots.txt") return { input, path, allowed: true, rule: null, matching: [], note: "/robots.txt is always allowed." };
  const rules = choice.groups.flatMap((g) => g.rules);
  const matching = rules.filter((r) => ruleMatches(r.path, path));
  matching.sort((a, b) => b.path.length - a.path.length || (a.allow === b.allow ? a.line - b.line : a.allow ? -1 : 1));
  const rule = matching[0] ?? null;
  return { input, path, allowed: rule ? rule.allow : true, rule, matching };
}

/** What a crawler does with the HTTP status of robots.txt (Google's documented handling) */
export function statusMeaning(status: number): { verdict: "rules" | "allow-all" | "disallow-all"; text: string } {
  if (status >= 200 && status < 300) return { verdict: "rules", text: "Crawlers read and follow the rules in the file." };
  if (status === 429 || status >= 500) return { verdict: "disallow-all", text: `A ${status} makes Google treat the whole site as disallowed until robots.txt answers again. After 30 days it uses the last cached copy, or crawls without restrictions if the site is otherwise reachable.` };
  if (status >= 400) return { verdict: "allow-all", text: `A ${status} means “no robots.txt”: crawlers may crawl everything.` };
  return { verdict: "allow-all", text: `Status ${status}: Google follows up to five redirects, then treats robots.txt as missing.` };
}

export const ROBOTS_EXAMPLE = `User-agent: *
Disallow: /admin/
Disallow: /search
Disallow: /*?sort=
Allow: /admin/public/
Disallow: /*.pdf$

User-agent: Googlebot
Disallow: /drafts/

User-agent: GPTBot
User-agent: ClaudeBot
Disallow: /

Sitemap: https://example.com/sitemap.xml
`;

export const ROBOTS_EXAMPLE_PATHS = ["/", "/admin/settings", "/admin/public/logo.png", "/search?q=shoes", "/products?sort=price", "/files/report.pdf", "/files/report.pdf?v=2", "/drafts/new-post"];
