export interface ModelPricing {
  id: string;
  provider: "Anthropic" | "OpenAI" | "Google";
  label: string;
  inputPer1M: number;
  outputPer1M: number;
}

// The date the rates in MODEL_PRICING were last checked against each provider's pricing page.
// Shown on the page as "Last reviewed" and "Prices last verified"; update it whenever the table is re-checked.
// TODO(owner): re-verify every rate below against the providers' official pricing pages, then
// update this date. The current values were not verified as part of the October 2026 review.
export const PRICES_LAST_VERIFIED = "2026-10-07";

// Approximate list pricing — providers change these often, so treat this as a starting point,
// not a bill.
export const MODEL_PRICING: ModelPricing[] = [
  { id: "claude-opus-5-5", provider: "Anthropic", label: "Claude Opus 5.5", inputPer1M: 4.0, outputPer1M: 20.0 },
  { id: "claude-sonnet-5-5", provider: "Anthropic", label: "Claude Sonnet 5.5", inputPer1M: 2.0, outputPer1M: 10.0 },
  { id: "claude-haiku-4-5", provider: "Anthropic", label: "Claude Haiku 4.5", inputPer1M: 1.0, outputPer1M: 5.0 },
  { id: "gpt-5.5", provider: "OpenAI", label: "GPT-5.5", inputPer1M: 5.0, outputPer1M: 30.0 },
  { id: "gpt-5", provider: "OpenAI", label: "GPT-5", inputPer1M: 1.25, outputPer1M: 10.0 },
  { id: "gemini-2.5-flash", provider: "Google", label: "Gemini 2.5 Flash", inputPer1M: 0.3, outputPer1M: 2.5 },
  { id: "gemini-2.5-flash-lite", provider: "Google", label: "Gemini 2.5 Flash-Lite", inputPer1M: 0.1, outputPer1M: 0.4 },
];

export interface TokenEstimate {
  tokens: number;
  words: number;
  characters: number;
}

/** The lowest and highest output-to-input price ratio across MODEL_PRICING, e.g. { min: 4, max: 8.3 }. */
export function outputInputPriceRatioRange(models: ModelPricing[] = MODEL_PRICING): { min: number; max: number } {
  const ratios = models.map((m) => m.outputPer1M / m.inputPer1M);
  return { min: Math.min(...ratios), max: Math.max(...ratios) };
}

function formatRatio(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** FAQ sentence describing the output/input price ratio, generated from the rate table so it can't drift. */
export function outputPriceRatioSentence(models: ModelPricing[] = MODEL_PRICING): string {
  const { min, max } = outputInputPriceRatioRange(models);
  return `Across the models listed here, output tokens cost between ${formatRatio(min)}x and ${formatRatio(max)}x the input rate.`;
}

// How far estimateTokens() lands from each family's real tokenizer. Each family uses its own
// tokenizer, so the error differs by family. null means it has not been measured.
// TODO(owner): measure the estimate against each provider's real counts (tiktoken for GPT,
// Anthropic's count_tokens endpoint for Claude, Gemini's countTokens) on a fixed sample set of
// prose, code and non-English text, record the method in a short methodology note, and fill in
// the ranges below. Until then the page only calls the result a rough estimate.
export const TOKENIZER_ACCURACY: { family: ModelPricing["provider"]; tokenizer: string; measuredRange: string | null }[] = [
  { family: "Anthropic", tokenizer: "Claude tokenizer", measuredRange: null },
  { family: "OpenAI", tokenizer: "tiktoken (o200k_base)", measuredRange: null },
  { family: "Google", tokenizer: "Gemini tokenizer", measuredRange: null },
];

/**
 * Approximates token count without shipping a full BPE tokenizer client-side. Modern BPE
 * tokenizers split on word boundaries first, then break long/unusual words into sub-word pieces
 * — so this mirrors that shape: each short word is ~1 token, longer words cost roughly one token
 * per 4 characters (the commonly-cited average for English text), and punctuation/whitespace runs
 * are counted separately since real tokenizers give them their own tokens too. Its error against
 * each provider's real tokenizer has not been measured (see TOKENIZER_ACCURACY): it is a rough
 * estimate, likely looser for code and non-English text than for plain English prose.
 */
export function estimateTokens(text: string): TokenEstimate {
  const characters = text.length;
  if (!text.trim()) return { tokens: 0, words: 0, characters };

  const pieces = text.match(/[A-Za-z0-9]+|[^\sA-Za-z0-9]/g) ?? [];
  const words = (text.match(/[A-Za-z0-9]+/g) ?? []).length;

  let tokens = 0;
  for (const piece of pieces) {
    if (/^[A-Za-z0-9]+$/.test(piece)) {
      tokens += Math.max(1, Math.ceil(piece.length / 4));
    } else {
      tokens += 1; // punctuation/symbol runs collapse to a single token each, like real tokenizers
    }
  }

  return { tokens, words, characters };
}

export function estimateCost(tokens: number, pricePer1M: number): number {
  return (tokens / 1_000_000) * pricePer1M;
}
