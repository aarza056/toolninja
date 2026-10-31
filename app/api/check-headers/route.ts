import { fetchHeaders } from "@/lib/safe-fetch";
import { kv, safe } from "@/lib/kv";
import { visitorId, originAllowed } from "@/lib/visitor";

// "Check a URL" for the Security Headers Checker: fetches a public page's response headers (never
// its body) through lib/safe-fetch, plus its HSTS preload status from hstspreload.org.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 30; // checks per visitor per 10 minutes
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

interface Preload {
  status: string;
  errors: string[];
  warnings: string[];
}

/** hstspreload.org's own status and eligibility check for the base domain */
async function preloadInfo(host: string): Promise<Preload | null> {
  const domain = host.replace(/^www\./, "");
  const get = (path: string) => fetch(`https://hstspreload.org/api/v2/${path}?domain=${encodeURIComponent(domain)}`, { cache: "no-store", signal: AbortSignal.timeout(8000) }).then((r) => (r.ok ? r.json() : null));
  const [status, check] = await Promise.all([safe(() => get("status"), null), safe(() => get("preloadable"), null)]);
  if (!status && !check) return null;
  const msgs = (x: unknown) => (Array.isArray(x) ? x.map((e: { summary?: string; message?: string }) => e.message || e.summary || "").filter(Boolean) : []);
  return { status: typeof status?.status === "string" ? status.status : "unknown", errors: msgs(check?.errors), warnings: msgs(check?.warnings) };
}

export async function POST(req: Request) {
  if (!originAllowed(req)) return json({ ok: false, error: "forbidden" }, 403);
  let url = "";
  try {
    const body = await req.json();
    url = typeof body?.url === "string" ? body.url.slice(0, 2000) : "";
  } catch {}
  if (!url.trim()) return json({ ok: false, error: "Enter a URL to check." }, 400);

  const key = `tn:hdrcheck:${visitorId(req)}`;
  const used = await safe(async () => {
    const n = await kv().incr(key);
    if (n === 1) await kv().expire(key, 600);
    return n;
  }, 0);
  if (used > LIMIT) return json({ ok: false, error: "Too many checks in a short time — try again in a few minutes." }, 429);

  const r = await fetchHeaders(url);
  if (!r.ok) return json({ ok: false, error: r.error }, 422);
  const final = new URL(r.result.finalUrl);
  const preload = final.protocol === "https:" ? await preloadInfo(final.hostname) : null;
  return json({ ok: true, ...r.result, preload });
}
