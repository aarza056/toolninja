import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { tools } from "@/lib/tools";
import { getAllPosts } from "@/lib/blog";
import { getSettings } from "@/lib/site-settings";
import { countRequest, recordAsk, recordFailure } from "@/lib/ninja-stats";
import { visitorId, originAllowed } from "@/lib/visitor";
import { safe } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-5-5";
const MAX_QUESTION_CHARS = 3000;
const MAX_IMAGE_B64_CHARS = 1_400_000; // ~1 MB image; the client downsizes before sending
const MAX_HISTORY_MESSAGES = 8; // last 4 question/answer pairs
const MAX_HISTORY_CHARS = 8000;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

// Limits are counted in shared storage (lib/ninja-stats). The daily cap and the on/off switch come
// from /admin settings, defaulting to AI_DAILY_CAP / AI_ASSIST_ENABLED. The hard ceiling on spend is
// still the monthly limit in the Anthropic console.
const PER_IP_WINDOW_MAX = 8; // per 10 minutes
const PER_IP_DAILY_MAX = 30;

const AssistSchema = z.object({
  answer: z.string(),
  tools: z.array(z.object({ slug: z.string(), reason: z.string() })),
  guides: z.array(z.string()),
  topic: z.string(),
  unmet_need: z.string(),
});

const toolSlugs = new Set(tools.map((t) => t.slug));
const posts = getAllPosts();
const postSlugs = new Set(posts.map((p) => p.slug));

// Kept byte-for-byte stable across requests so the API can serve it from the prompt cache.
const SYSTEM_PROMPT = `You are Ninja, the assistant on ToolNinja (toolninja.io) — a site of free developer tools that run entirely in the browser.

Your job: understand what the visitor is trying to do, give a short practical answer, and point them to the ToolNinja tools and guides that solve it.

Rules:
- Keep "answer" under 120 words. Plain, direct developer language. You may use short Markdown: **bold**, \`inline code\`, and simple bullet lists. No headings.
- Recommend at most 3 tools and 2 guides, best first. Use ONLY slugs that appear in the catalogs below — never invent one. If nothing fits, return empty lists.
- Give each tool a one-line "reason" saying what it will do for this visitor.
- If the visitor pasted something, say what it is and what it means before suggesting tools.
- If the input contains a secret (API key, private key, password, real token, card number), warn them to rotate or revoke it, and do not repeat the secret back.
- If the request has nothing to do with software development, say briefly that you help with developer problems and suggest the closest useful tool, if any.
- If you are not sure, say so rather than guessing.
- Reply in the visitor's language.
- The visitor may ask follow-up questions; use the earlier messages in the conversation for context.
- "topic": a 1-3 word lowercase label for the subject, e.g. "jwt", "cron", "docker compose", "cors error". Never include anything from a secret.
- "unmet_need": if no tool in the catalog really solves the request, one short sentence describing the tool the visitor would need (e.g. "Convert Kubernetes YAML to Helm chart"). Never copy the visitor's data, names, URLs or secrets into it. Otherwise an empty string.

TOOL CATALOG (slug — name: what it does)
${tools.map((t) => `${t.slug} — ${t.name}: ${t.description}`).join("\n")}

GUIDES (slug — title)
${posts.map((p) => `${p.slug} — ${p.title}`).join("\n")}`;


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
  const image =
    body.image &&
    typeof body.image.data === "string" &&
    IMAGE_TYPES.includes(body.image.mediaType as (typeof IMAGE_TYPES)[number])
      ? { mediaType: body.image.mediaType as (typeof IMAGE_TYPES)[number], data: body.image.data }
      : null;

  if (!question && !image) return json({ ok: false, reason: "empty" }, 400);
  if (question.length > MAX_QUESTION_CHARS) return json({ ok: false, reason: "too_long" }, 413);
  if (image && image.data.length > MAX_IMAGE_B64_CHARS) return json({ ok: false, reason: "image_too_large" }, 413);

  const counts = await safe(() => countRequest(visitorId(req)), { window: 0, daily: 0, total: 0 });
  if (counts.total > settings.aiDailyCap) {
    await recordFailure("daily_cap");
    return json({ ok: false, reason: "daily_cap" }, 429);
  }
  if (counts.window > PER_IP_WINDOW_MAX || counts.daily > PER_IP_DAILY_MAX) {
    await recordFailure("rate_limited");
    return json({ ok: false, reason: "rate_limited" }, 429);
  }

  const content: Anthropic.ContentBlockParam[] = [];
  if (image) content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
  let text = question || "What is in this image, and which ToolNinja tool helps with it?";
  if (context) text += `\n\n(Local detector, for reference: ${context})`;
  content.push({ type: "text", text });

  // Earlier turns of the conversation, text only, newest kept when trimming
  const history: Anthropic.MessageParam[] = [];
  if (Array.isArray(body.history)) {
    let budget = MAX_HISTORY_CHARS;
    const recent = (body.history as unknown[]).slice(-MAX_HISTORY_MESSAGES).reverse();
    for (const item of recent) {
      const m = item as { role?: unknown; text?: unknown };
      if ((m.role !== "user" && m.role !== "assistant") || typeof m.text !== "string" || !m.text.trim()) continue;
      const t = m.text.slice(0, MAX_QUESTION_CHARS);
      if (t.length > budget) break;
      budget -= t.length;
      history.unshift({ role: m.role, content: t });
    }
    while (history.length && history[0].role !== "user") history.shift();
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      // 1-hour cache: with light, spread-out traffic a 5-minute cache would expire between most questions
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral", ttl: "1h" } }],
      messages: [...history, { role: "user", content }],
      output_config: { effort: "low", format: zodOutputFormat(AssistSchema) },
    });

    // Token counts only — never the visitor's text. Visible in Vercel's function logs for cost tracking.
    const u = response.usage;
    console.info(
      `assist: model=${response.model} in=${u.input_tokens} cache_read=${u.cache_read_input_tokens ?? 0} cache_write=${u.cache_creation_input_tokens ?? 0} out=${u.output_tokens} image=${image ? "yes" : "no"}`
    );

    if (response.stop_reason === "refusal") {
      await recordFailure("refusal");
      return json({ ok: false, reason: "refusal" }, 200);
    }
    const parsed = response.parsed_output;
    if (!parsed) {
      await recordFailure("unparseable");
      return json({ ok: false, reason: "unparseable" }, 502);
    }

    const recommended = parsed.tools.filter((t) => toolSlugs.has(t.slug)).slice(0, 3);
    await recordAsk({
      input: u.input_tokens,
      output: u.output_tokens,
      cacheRead: u.cache_read_input_tokens ?? 0,
      cacheWrite: u.cache_creation_input_tokens ?? 0,
      image: Boolean(image),
      topic: parsed.topic,
      tools: recommended.map((t) => t.slug),
      unmet: parsed.unmet_need,
    });

    return json({
      ok: true,
      answer: parsed.answer,
      tools: recommended,
      guides: parsed.guides.filter((g) => postSlugs.has(g)).slice(0, 2),
    });
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
