import { originAllowed, visitorId } from "@/lib/visitor";
import { subscribe, siteUrlFor } from "@/lib/newsletter";
import { emailConfigured } from "@/lib/email-send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  if (!originAllowed(req)) return json({ ok: false, reason: "forbidden" }, 403);
  if (!emailConfigured()) return json({ ok: false, reason: "unavailable" }, 503);

  let body: { email?: unknown; source?: unknown; website?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, reason: "bad_request" }, 400);
  }
  // Honeypot: a field people never see. Bots fill it; pretend it worked.
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true });
  if (typeof body.email !== "string") return json({ ok: false, reason: "invalid" }, 400);

  const source = typeof body.source === "string" ? body.source.replace(/[^\w/.-]/g, "").slice(0, 80) : "";
  const result = await subscribe(body.email, { who: visitorId(req), source, siteUrl: siteUrlFor(req.headers.get("origin")) });
  if (result.ok) return json({ ok: true });
  const status = result.reason === "invalid" ? 400 : result.reason === "rate_limited" ? 429 : 503;
  return json(result, status);
}
