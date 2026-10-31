// Official API list prices per 1M tokens, copied from each provider's own pricing page on 31 October 2026:
//   Anthropic  https://platform.claude.com/docs/en/about-claude/pricing
//   OpenAI     https://developers.openai.com/api/docs/pricing (and each model's page for long context)
//   Google     https://ai.google.dev/gemini-api/docs/pricing
// Shared by the LLM API Cost Calculator and the AI Token Counter. When a provider has announced a
// price change, it's recorded with its start date so the tools show both.

export const PRICES_CHECKED = "2026-10-31";

export const PRICING_SOURCES = {
  Anthropic: "https://platform.claude.com/docs/en/about-claude/pricing",
  OpenAI: "https://developers.openai.com/api/docs/pricing",
  Google: "https://ai.google.dev/gemini-api/docs/pricing",
} as const;

export type Provider = keyof typeof PRICING_SOURCES;

export interface Rates {
  input: number;
  output: number;
  /** A cache hit */
  cacheRead: number;
  /** Writing the prompt prefix to the cache; null = no write premium (Gemini's implicit caching bills a miss as normal input) */
  cacheWrite: number | null;
}

export interface PricedModel {
  id: string;
  provider: Provider;
  label: string;
  rates: Rates;
  /** Prompts with more input tokens than `above` pay these rates for the whole request */
  longContext?: { above: number; rates: Rates };
  /** An announced price change: these rates apply from `from` (YYYY-MM-DD) */
  change?: { from: string; rates: Rates };
  /** Batch price as a share of standard: 0.5 everywhere; cache reads differ on some Gemini models */
  batch: { tokens: number; cacheRead: number };
  note?: string;
}

const r = (input: number, output: number, cacheRead: number, cacheWrite: number | null): Rates => ({ input, output, cacheRead, cacheWrite });
const HALF = { tokens: 0.5, cacheRead: 0.5 };

export const LLM_MODELS: PricedModel[] = [
  // Anthropic: 5-minute cache writes (the default); the Batch API halves every token type, cache included
  { id: "claude-fable-5-1", provider: "Anthropic", label: "Claude Fable 5.1", rates: r(10, 50, 0.25, 12.5), batch: HALF },
  { id: "claude-opus-5-5", provider: "Anthropic", label: "Claude Opus 5.5", rates: r(4, 20, 0.2, 5), batch: HALF },
  { id: "claude-sonnet-5-5", provider: "Anthropic", label: "Claude Sonnet 5.5", rates: r(2, 10, 0.1, 2.5), batch: HALF },
  {
    id: "claude-haiku-5-5",
    provider: "Anthropic",
    label: "Claude Haiku 5.5",
    rates: r(0.1, 0.5, 0.01, 0.125),
    longContext: { above: 100_000, rates: r(0.5, 2.5, 0.05, 0.625) },
    batch: HALF,
  },
  // OpenAI: 30-minute cache writes; prompts over 272K input tokens pay 2x input/cache and 1.5x output
  { id: "gpt-6-astra", provider: "OpenAI", label: "GPT-6 Astra", rates: r(10, 50, 1, 12.5), longContext: { above: 272_000, rates: r(20, 75, 2, 25) }, batch: HALF },
  { id: "gpt-6.1-sol", provider: "OpenAI", label: "GPT-6.1 Sol", rates: r(2, 10, 0.1, 2.5), longContext: { above: 272_000, rates: r(4, 15, 0.2, 5) }, batch: HALF },
  { id: "gpt-6.1-terra", provider: "OpenAI", label: "GPT-6.1 Terra", rates: r(1, 5, 0.05, 1.25), longContext: { above: 272_000, rates: r(2, 7.5, 0.1, 2.5) }, batch: HALF },
  { id: "gpt-6-luna", provider: "OpenAI", label: "GPT-6 Luna", rates: r(0.1, 0.5, 0.01, 0.125), longContext: { above: 272_000, rates: r(0.2, 0.75, 0.02, 0.25) }, batch: HALF },
  // Google: implicit caching (no write fee; explicit caching adds a per-hour storage fee not modelled here)
  {
    id: "gemini-4-argon",
    provider: "Google",
    label: "Gemini 4 Argon",
    rates: r(2, 10, 0.1, null),
    change: { from: "2026-12-01", rates: r(4, 20, 0.2, null) },
    batch: HALF,
  },
  {
    id: "gemini-3.8-flash",
    provider: "Google",
    label: "Gemini 3.8 Flash",
    rates: r(0.75, 3.75, 0.075, null),
    change: { from: "2027-01-01", rates: r(1.5, 7.5, 0.15, null) },
    batch: HALF,
  },
  {
    id: "gemini-3.1-pro-preview",
    provider: "Google",
    label: "Gemini 3.1 Pro (preview)",
    rates: r(2, 12, 0.2, null),
    longContext: { above: 200_000, rates: r(4, 18, 0.4, null) },
    // Batch halves input and output; cached tokens cost the same as standard
    batch: { tokens: 0.5, cacheRead: 1 },
  },
  { id: "gemini-3.5-flash-lite", provider: "Google", label: "Gemini 3.5 Flash-Lite", rates: r(0.3, 2.5, 0.03, null), batch: { tokens: 0.5, cacheRead: 0.02 / 0.03 } },
];

/** The rates in force on a day (YYYY-MM-DD), switching to an announced change on its start date */
// (No model has both an announced change and a long-context tier; a test keeps it that way.)
export function ratesOn(m: PricedModel, day: string): { rates: Rates; long?: Rates } {
  if (m.change && day >= m.change.from) return { rates: m.change.rates };
  return { rates: m.rates, long: m.longContext?.rates };
}

export interface Workload {
  /** Requests per month */
  requests: number;
  /** All input tokens of one request, cached prefix included */
  inputTokens: number;
  /** Output tokens of one request, thinking/reasoning tokens included (they bill as output) */
  outputTokens: number;
  /** The reusable prefix (system prompt, tools, documents) that can be cached */
  cachedTokens: number;
  /** Share of requests that find the prefix in the cache, 0–1 */
  cacheHitRate: number;
  /** Share of requests sent through the Batch API, 0–1 */
  batchShare: number;
}

export interface CostBreakdown {
  input: number;
  cacheRead: number;
  cacheWrite: number;
  output: number;
  perRequest: number;
  perMonth: number;
  /** The same workload with no caching at all */
  perMonthNoCache: number;
  longContext: boolean;
}

const M = 1_000_000;

/** Cost of a workload on a model, priced on the given day */
export function workloadCost(m: PricedModel, w: Workload, day: string): CostBreakdown {
  const { rates: base, long } = ratesOn(m, day);
  const isLong = Boolean(m.longContext && long && w.inputTokens > m.longContext.above);
  const x = isLong ? long! : base;
  const cached = Math.min(Math.max(w.cachedTokens, 0), Math.max(w.inputTokens, 0));
  const fresh = Math.max(w.inputTokens, 0) - cached;
  const hit = Math.min(Math.max(w.cacheHitRate, 0), 1);
  const batch = Math.min(Math.max(w.batchShare, 0), 1);
  // Blend standard and batch prices by the share of traffic each gets
  const tokenK = 1 - batch + batch * m.batch.tokens;
  const readK = 1 - batch + batch * m.batch.cacheRead;

  const input = (fresh / M) * x.input * tokenK;
  const cacheRead = ((cached * hit) / M) * x.cacheRead * readK;
  const cacheWrite = ((cached * (1 - hit)) / M) * (x.cacheWrite ?? x.input) * tokenK;
  const output = (Math.max(w.outputTokens, 0) / M) * x.output * tokenK;
  const perRequest = input + cacheRead + cacheWrite + output;
  const noCache = ((Math.max(w.inputTokens, 0) / M) * x.input + (Math.max(w.outputTokens, 0) / M) * x.output) * tokenK;
  return { input, cacheRead, cacheWrite, output, perRequest, perMonth: perRequest * w.requests, perMonthNoCache: noCache * w.requests, longContext: isLong };
}

/** Today in UTC as YYYY-MM-DD */
export const today = (now = new Date()) => now.toISOString().slice(0, 10);
