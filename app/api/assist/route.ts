import Anthropic from "@anthropic-ai/sdk";
import { getSettings } from "@/lib/site-settings";
import { countRequest, recordAsk, recordFailure, usd } from "@/lib/ninja-stats";
import { visitorId, originAllowed } from "@/lib/visitor";
import { safe, today } from "@/lib/kv";
import { notifyOnce } from "@/lib/telegram";
import { askNinja, IMAGE_TYPES, MAX_IMAGE_B64_CHARS, MAX_QUESTION_CHARS, type NinjaImage } from "@/lib/ninja-ask";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Limits are counted in shared storage (lib/ninja-stats). The daily cap and the on/off switch come
// from /admin settings, defaulting to AI_DAILY_CAP / AI_ASSIST_ENABLED. The hard ceiling on spend is
// still the monthly limit in the Anthropic console.
const PER_IP_WINDOW_MAX = 8; // per 10 minutes
const PER_IP_DAILY_MAX = 30;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  // "reason" only says which setting is missing — never anything about the key's value
  if (!process.env.ANTHROPIC_API_KEY) return json({ enabled: false, reason: "no_key" });
  if (!(await getSettings()).aiEnabled) return json({ enabled: false, reason: "switched_off" });
  return json({ enabled: true });
}

export async function POST(req: Request) {
  const settings = await getSettings();
  if (!process.env.ANTHROPIC_API_KEY || !settings.aiEnabled) return json({ ok: false, reason: "disabled" }, 503);

  if (!originAllowed(req)) return json({ ok: false, reason: "forbidden" }, 403);

  let body: {
    question?: unknown;
    image?: { mediaType?: unknown; data?: unknown } | null;
    context?: unknown;
    history?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, reason: "bad_request" }, 400);
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const context = typeof body.context === "string" ? body.context.slice(0, 1000) : "";
  const image: NinjaImage | null =
    body.image && typeof body.image.data === "string" && IMAGE_TYPES.includes(body.image.mediaType as NinjaImage["mediaType"])
      ? { mediaType: body.image.mediaType as NinjaImage["mediaType"], data: body.image.data }
      : null;

  if (!question && !image) return json({ ok: false, reason: "empty" }, 400);
  if (question.length > MAX_QUESTION_CHARS) return json({ ok: false, reason: "too_long" }, 413);
  if (image && image.data.length > MAX_IMAGE_B64_CHARS) return json({ ok: false, reason: "image_too_large" }, 413);

  const counts = await safe(() => countRequest(visitorId(req)), { window: 0, daily: 0, total: 0, monthMicro: 0 });

  // Monthly budget guard: pauses itself at the limit and resumes on the 1st (the counter is per month)
  const budget = settings.aiMonthlyBudgetMicro;
  if (budget > 0) {
    const month = today().slice(0, 7);
    if (counts.monthMicro >= budget) {
      await notifyOnce(
        `budget100:${month}`,
        40 * 86400,
        `🛑 <b>Ninja AI reached this month's budget</b> (${usd(counts.monthMicro)} of ${usd(budget)}). It's paused until the 1st — raise the budget in Admin → Ninja AI to resume now.`
      );
      await recordFailure("budget");
      return json({ ok: false, reason: "budget" }, 429);
    }
    if (counts.monthMicro >= budget * 0.8) {
      await notifyOnce(
        `budget80:${month}`,
        40 * 86400,
        `⚠️ <b>Ninja AI is at ${Math.round((counts.monthMicro / budget) * 100)}% of this month's budget</b> (${usd(counts.monthMicro)} of ${usd(budget)}).`,
        [[{ text: "⏸ Switch Ninja off now", data: "ninja:off" }]]
      );
    }
  }
  if (counts.total > settings.aiDailyCap) {
    await recordFailure("daily_cap");
    return json({ ok: false, reason: "daily_cap" }, 429);
  }
  if (counts.window > PER_IP_WINDOW_MAX || counts.daily > PER_IP_DAILY_MAX) {
    await recordFailure("rate_limited");
    return json({ ok: false, reason: "rate_limited" }, 429);
  }

  try {
    const r = await askNinja({ question, image, context, history: body.history });
    if (r.kind !== "ok") {
      await recordFailure(r.kind);
      return json({ ok: false, reason: r.kind }, r.kind === "refusal" ? 200 : 502);
    }
    await recordAsk({ ...r.usage, image: Boolean(image), topic: r.topic, tools: r.tools.map((t) => t.slug), unmet: r.unmet });
    return json({ ok: true, answer: r.answer, tools: r.tools, guides: r.guides });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      await recordFailure("busy");
      return json({ ok: false, reason: "busy" }, 429);
    }
    if (error instanceof Anthropic.APIError) {
      // Includes the account's monthly spend limit being reached — the client falls back to local results.
      console.error(`assist: Anthropic API error ${error.status}`);
      await recordFailure("api_error");
      return json({ ok: false, reason: "unavailable" }, 503);
    }
    console.error("assist: unexpected error");
    return json({ ok: false, reason: "unavailable" }, 503);
  }
}
