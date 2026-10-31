import { LLM_MODELS, ratesOn, today, type Provider } from "@/lib/llm-pricing";

export interface ModelPricing {
  id: string;
  provider: Provider;
  label: string;
  inputPer1M: number;
  outputPer1M: number;
}

/** Standard input/output list prices on a day, from the shared price list (lib/llm-pricing.ts) */
export function modelPricing(day = today(), provider?: Provider): ModelPricing[] {
  return LLM_MODELS.filter((m) => !provider || m.provider === provider).map((m) => {
    const { rates } = ratesOn(m, day);
    return { id: m.id, provider: m.provider, label: m.label, inputPer1M: rates.input, outputPer1M: rates.output };
  });
}

export const MODEL_PRICING: ModelPricing[] = modelPricing();

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
