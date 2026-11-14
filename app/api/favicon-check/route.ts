import { fetchBytes, fetchPage } from "@/lib/safe-fetch";
import { readImage, readManifest, readPageIcons, type CheckedIcon, type DeclaredIcon, type FaviconReport, type ManifestInfo } from "@/lib/favicon-check";
import { sameSite } from "@/lib/site-crawl";
import { kv, safe } from "@/lib/kv";
import { visitorId, originAllowed } from "@/lib/visitor";

// The Favicon Checker: reads a public page's icon links and web app manifest, then requests each icon
// to see what it really is. Public addresses only (lib/safe-fetch), icons on the same site or a
// CDN, a few hundred KB per file, a dozen files per check, and a per-visitor limit.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA = "ToolNinja-FaviconCheck/1.0 (+https://toolninja.io/tools/favicon-checker)";
const LIMIT = 20; // checks per visitor per 10 minutes
const MAX_ICONS = 14;
const MAX_ICON_BYTES = 512 * 1024;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function checkIcon(icon: DeclaredIcon): Promise<CheckedIcon> {
  if (icon.href.startsWith("data:")) {
    const m = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(icon.href);
    if (!m) return { ...icon, status: null, error: "Unreadable data: URL" };
    const bytes = m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]), "utf8");
    return { ...icon, href: `data:${m[1]}… (inline)`, status: 200, contentType: m[1], bytes: bytes.length, image: readImage(new Uint8Array(bytes)) };
  }
  const r = await fetchBytes(icon.href, { userAgent: UA, maxBytes: MAX_ICON_BYTES, accept: "image/*,*/*;q=0.8" });
  if (!r.ok) return { ...icon, status: null, error: r.error };
  const { status, headers, bytes, finalUrl } = r.result;
  const contentType = headers.find(([k]) => k.toLowerCase() === "content-type")?.[1];
  const length = Number(headers.find(([k]) => k.toLowerCase() === "content-length")?.[1]);
  return {
    ...icon,
    status,
    finalUrl: finalUrl !== icon.href ? finalUrl : undefined,
    contentType,
    bytes: Number.isFinite(length) && length > 0 ? length : bytes?.length,
    image: bytes ? readImage(new Uint8Array(bytes)) : undefined,
  };
}

export async function POST(req: Request) {
  if (!originAllowed(req)) return json({ ok: false, error: "forbidden" }, 403);
  let url = "";
  try {
    const body = await req.json();
    url = typeof body?.url === "string" ? body.url.slice(0, 2000).trim() : "";
  } catch {}
  if (!url) return json({ ok: false, error: "Enter a website address." }, 400);

  const key = `tn:favcheck:${visitorId(req)}`;
  const used = await safe(async () => {
    const n = await kv().incr(key);
    if (n === 1) await kv().expire(key, 600);
    return n;
  }, 0);
  if (used > LIMIT) return json({ ok: false, error: "Too many checks in a short time — try again in a few minutes." }, 429);

  const page = await fetchPage(url, { userAgent: UA, maxBytes: 1024 * 1024, accept: /text\/html|application\/xhtml/i });
  if (!page.ok) return json({ ok: false, error: page.error }, 422);
  const { finalUrl, status, body } = page.result;
  if (body === undefined) return json({ ok: false, error: status >= 400 ? `The page answered HTTP ${status}.` : "That address didn't return an HTML page." }, 422);

  const found = readPageIcons(body, finalUrl);
  const origin = new URL(finalUrl).origin;
  const host = new URL(finalUrl).hostname;

  let manifest: ManifestInfo | null = null;
  let manifestStatus: number | null = null;
  if (found.manifest && /^https?:/.test(found.manifest)) {
    const m = await fetchPage(found.manifest, { userAgent: UA, maxBytes: 256 * 1024, accept: /json|text\/plain|^$/i, stayOn: (h) => sameSite(h, host) || /cdn|static|assets/i.test(h) });
    if (m.ok) {
      manifestStatus = m.result.status;
      if (m.result.body !== undefined) manifest = readManifest(m.result.body, m.result.finalUrl);
      else if (m.result.status < 400) manifest = { icons: [], error: "The manifest isn't served as JSON (check its Content-Type: application/manifest+json)." };
    }
  }

  // What browsers ask for even when it isn't declared
  const defaults: DeclaredIcon[] = [{ href: `${origin}/favicon.ico`, rel: "icon", source: "default" }];
  if (!found.icons.some((i) => i.rel.startsWith("apple-touch-icon"))) defaults.push({ href: `${origin}/apple-touch-icon.png`, rel: "apple-touch-icon", source: "default" });

  const seen = new Set<string>();
  const all = [...found.icons, ...(manifest?.icons ?? []), ...defaults].filter((i) => {
    const k = `${i.href}|${i.source === "default" ? "d" : "x"}`;
    if (seen.has(i.href) && i.source === "default") return false;
    if (seen.has(k)) return false;
    seen.add(k);
    seen.add(i.href);
    return true;
  });
  const checked = await Promise.all(all.slice(0, MAX_ICONS).map(checkIcon));
  // An undeclared /apple-touch-icon.png that 404s isn't worth listing
  const icons = checked.filter((i) => !(i.source === "default" && i.rel === "apple-touch-icon" && (i.status === null || i.status >= 400)));

  const report: FaviconReport = { pageUrl: finalUrl, pageStatus: status, icons, manifestUrl: found.manifest, manifest, manifestStatus, themeColor: found.themeColor };
  return json({ ok: true, report, skipped: Math.max(0, all.length - MAX_ICONS) });
}
