import { addRating, checkToken, isTool, logSpam, submitComment, MAX_COMMENT } from "@/lib/reviews";
import { visitorId, originAllowed } from "@/lib/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
// What every blocked bot sees — identical to a real success
const THANKS = { ok: true, status: "thanks" };

export async function POST(req: Request) {
  if (!originAllowed(req)) return json({ ok: false, error: "forbidden" }, 403);

  let body: { type?: unknown; slug?: unknown; stars?: unknown; comment?: unknown; token?: unknown; website?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  const slug = typeof body.slug === "string" ? body.slug : "";
  const stars = Number(body.stars);
  if (!isTool(slug) || !Number.isInteger(stars) || stars < 1 || stars > 5) return json({ ok: false, error: "bad_request" }, 400);

  // Honeypot: a field real visitors never see
  if (typeof body.website === "string" && body.website.trim()) {
    await logSpam("honeypot", slug);
    return json(THANKS);
  }
  const tokenCheck = checkToken(body.token, slug);
  if (tokenCheck !== "ok") {
    await logSpam(tokenCheck, slug);
    return json(THANKS);
  }

  const visitor = visitorId(req);
  try {
    if (body.type === "comment") {
      const comment = typeof body.comment === "string" ? body.comment : "";
      if (comment.length > MAX_COMMENT * 2) return json({ ok: false, error: "too_long" }, 413);
      const outcome = await submitComment(slug, stars, comment, visitor);
      if (outcome === "paused") return json({ ok: false, error: "paused" }, 503);
      if (outcome === "rate_limited") return json({ ok: false, error: "rate_limited" }, 429);
      return json(THANKS);
    }
    const result = await addRating(slug, stars, visitor);
    return json({ ok: true, status: result === "duplicate" ? "already_rated" : "thanks" });
  } catch (e) {
    console.error("reviews:", e instanceof Error ? e.message : "error");
    return json({ ok: false, error: "unavailable" }, 503);
  }
}
