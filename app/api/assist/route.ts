import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { tools } from "@/lib/tools";
import { getAllPosts } from "@/lib/blog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-5-5";
const MAX_QUESTION_CHARS = 3000;
const MAX_IMAGE_B64_CHARS = 1_400_000; // ~1 MB image; the client downsizes before sending
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

// Best-effort limits. Serverless instances don't share memory, so the hard ceiling on spend is the
// monthly limit set in the Anthropic console — these keep any single instance from burning through it.
const PER_IP_WINDOW_MS = 10 * 60 * 1000;
const PER_IP_WINDOW_MAX = 8;
const PER_IP_DAILY_MAX = 30;
const DAILY_CAP = Number(process.env.AI_DAILY_CAP ?? 500);

const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?toolninja\.io$/, /^https:\/\/[\w-]+\.vercel\.app$/, /^http:\/\/localhost(:\d+)?$/];

const AssistSchema = z.object({
  answer: z.string(),
  tools: z.array(z.object({ slug: z.string(), reason: z.string() })),
  guides: z.array(z.string()),
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

TOOL CATALOG (slug — name: what it does)
${tools.map((t) => `${t.slug} — ${t.name}: ${t.description}`).join("\n")}

GUIDES (slug — title)
${posts.map((p) => `${p.slug} — ${p.title}`).join("\n")}`;

const ipHits = new Map<string, number[]>();
let dayKey = "";
let dayCount = 0;

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function overLimit(ip: string): "ip" | "daily" | null {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dayKey) {
    dayKey = today;
    dayCount = 0;
    ipHits.clear();
  }
  if (dayCount >= DAILY_CAP) return "daily";
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < 24 * 3600 * 1000);
  const recent = hits.filter((t) => now - t < PER_IP_WINDOW_MS);
  if (recent.length >= PER_IP_WINDOW_MAX || hits.length >= PER_IP_DAILY_MAX) return "ip";
  hits.push(now);
  ipHits.set(ip, hits);
  dayCount++;
  return null;
}

function enabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY) && process.env.AI_ASSIST_ENABLED !== "false";
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function GET() {
  return json({ enabled: enabled() });
}

export async function POST(req: Request) {
  if (!enabled()) return json({ ok: false, reason: "disabled" }, 503);

  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.some((re) => re.test(origin))) return json({ ok: false, reason: "forbidden" }, 403);

  let body: { question?: unknown; image?: { mediaType?: unknown; data?: unknown } | null; context?: unknown };
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

  const limited = overLimit(clientIp(req));
  if (limited) return json({ ok: false, reason: limited === "daily" ? "daily_cap" : "rate_limited" }, 429);

  const content: Anthropic.ContentBlockParam[] = [];
  if (image) content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
  let text = question || "What is in this image, and which ToolNinja tool helps with it?";
  if (context) text += `\n\n(Local detector, for reference: ${context})`;
  content.push({ type: "text", text });

  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      // 1-hour cache: with light, spread-out traffic a 5-minute cache would expire between most questions
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral", ttl: "1h" } }],
      messages: [{ role: "user", content }],
      output_config: { effort: "low", format: zodOutputFormat(AssistSchema) },
    });

    // Token counts only — never the visitor's text. Visible in Vercel's function logs for cost tracking.
    const u = response.usage;
    console.info(
      `assist: model=${response.model} in=${u.input_tokens} cache_read=${u.cache_read_input_tokens ?? 0} cache_write=${u.cache_creation_input_tokens ?? 0} out=${u.output_tokens} image=${image ? "yes" : "no"}`
    );

    if (response.stop_reason === "refusal") return json({ ok: false, reason: "refusal" }, 200);
    const parsed = response.parsed_output;
    if (!parsed) return json({ ok: false, reason: "unparseable" }, 502);

    return json({
      ok: true,
      answer: parsed.answer,
      tools: parsed.tools.filter((t) => toolSlugs.has(t.slug)).slice(0, 3),
      guides: parsed.guides.filter((g) => postSlugs.has(g)).slice(0, 2),
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ ok: false, reason: "busy" }, 429);
    if (error instanceof Anthropic.APIError) {
      // Includes the account's monthly spend limit being reached — the client falls back to local results.
      console.error(`assist: Anthropic API error ${error.status}`);
      return json({ ok: false, reason: "unavailable" }, 503);
    }
    console.error("assist: unexpected error");
    return json({ ok: false, reason: "unavailable" }, 503);
  }
}
