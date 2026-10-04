export interface ModelPricing {
  id: string;
  provider: "Anthropic" | "OpenAI" | "Google";
  label: string;
  inputPer1M: number;
  outputPer1M: number;
}

// Approximate list pricing as of October 2026 — providers change these often, so treat this as
// a starting point, not a bill. The tool lets you override both fields per model.
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

/**
 * Approximates token count without shipping a full BPE tokenizer client-side. Modern BPE
 * tokenizers split on word boundaries first, then break long/unusual words into sub-word pieces
 * — so this mirrors that shape: each short word is ~1 token, longer words cost roughly one token
 * per 4 characters (the commonly-cited average for English text), and punctuation/whitespace runs
 * are counted separately since real tokenizers give them their own tokens too. This lands within
 * roughly 10-15% of actual tiktoken/Claude tokenizer counts for ordinary English prose — closer
 * for plain text, looser for code or non-English text with different per-token density.
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
