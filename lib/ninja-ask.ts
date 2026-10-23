import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { tools } from "@/lib/tools";
import { getAllPosts } from "@/lib/blog";

// Ask Ninja's model call, shared by the public /api/assist route and the admin test console.
// Limits, stats and the HTTP layer live in the route; this is just "question in, structured answer out".

export const MODEL = "claude-haiku-5-5";
export const MAX_QUESTION_CHARS = 3000;
export const MAX_IMAGE_B64_CHARS = 1_400_000; // ~1 MB image; the client downsizes before sending
export const MAX_HISTORY_MESSAGES = 8; // last 4 question/answer pairs
export const MAX_HISTORY_CHARS = 8000;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;


export const AssistSchema = z.object({
  answer: z.string(),
  tools: z.array(z.object({ slug: z.string(), reason: z.string() })),
  guides: z.array(z.string()),
  topic: z.string(),
  unmet_need: z.string(),
});

export const toolSlugs = new Set(tools.map((t) => t.slug));
export const posts = getAllPosts();
export const postSlugs = new Set(posts.map((p) => p.slug));

// Kept byte-for-byte stable across requests so the API can serve it from the prompt cache.
export const SYSTEM_PROMPT = `You are Ninja, the assistant on ToolNinja (toolninja.io) — a site of free developer tools that run entirely in the browser.

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

export type NinjaImage = { mediaType: (typeof IMAGE_TYPES)[number]; data: string };

export interface NinjaInput {
  question: string;
  image?: NinjaImage | null;
  context?: string;
  history?: unknown;
}

type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number };

export type NinjaResult =
  | {
      kind: "ok";
      answer: string;
      tools: { slug: string; reason: string }[];
      guides: string[];
      topic: string;
      unmet: string;
      usage: Usage;
      model: string;
      ms: number;
    }
  | { kind: "refusal" | "unparseable"; usage: Usage };

/** Earlier turns of the conversation, text only, newest kept when trimming. */
export function buildHistory(raw: unknown): Anthropic.MessageParam[] {
  const history: Anthropic.MessageParam[] = [];
  if (!Array.isArray(raw)) return history;
  let budget = MAX_HISTORY_CHARS;
  for (const item of (raw as unknown[]).slice(-MAX_HISTORY_MESSAGES).reverse()) {
    const m = item as { role?: unknown; text?: unknown };
    if ((m.role !== "user" && m.role !== "assistant") || typeof m.text !== "string" || !m.text.trim()) continue;
    const t = m.text.slice(0, MAX_QUESTION_CHARS);
    if (t.length > budget) break;
    budget -= t.length;
    history.unshift({ role: m.role, content: t });
  }
  while (history.length && history[0].role !== "user") history.shift();
  return history;
}

/** Calls the model. Throws Anthropic API errors to the caller. */
export async function askNinja({ question, image, context, history }: NinjaInput): Promise<NinjaResult> {
  const content: Anthropic.ContentBlockParam[] = [];
  if (image) content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
  let text = question || "What is in this image, and which ToolNinja tool helps with it?";
  if (context) text += `\n\n(Local detector, for reference: ${context})`;
  content.push({ type: "text", text });

  const started = Date.now();
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    // 1-hour cache: with light, spread-out traffic a 5-minute cache would expire between most questions
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral", ttl: "1h" } }],
    messages: [...buildHistory(history), { role: "user", content }],
    output_config: { effort: "low", format: zodOutputFormat(AssistSchema) },
  });

  const u = response.usage;
  const usage: Usage = { input: u.input_tokens, output: u.output_tokens, cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0 };
  // Token counts only — never the visitor's text. Visible in Vercel's function logs.
  console.info(`assist: model=${response.model} in=${usage.input} cache_read=${usage.cacheRead} cache_write=${usage.cacheWrite} out=${usage.output} image=${image ? "yes" : "no"}`);

  if (response.stop_reason === "refusal") return { kind: "refusal", usage };
  const parsed = response.parsed_output;
  if (!parsed) return { kind: "unparseable", usage };
  return {
    kind: "ok",
    answer: parsed.answer,
    tools: parsed.tools.filter((t) => toolSlugs.has(t.slug)).slice(0, 3),
    guides: parsed.guides.filter((g) => postSlugs.has(g)).slice(0, 2),
    topic: parsed.topic,
    unmet: parsed.unmet_need,
    usage,
    model: response.model,
    ms: Date.now() - started,
  };
}
