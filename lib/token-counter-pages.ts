// Content for the /tools/ai-token-counter/<provider> pages, for the searches that name one provider
// ("claude token counter", "gemini token counter", "gpt token calculator").
import type { Provider } from "@/lib/llm-pricing";

export const TOKEN_COUNTER_PAGES: Record<string, { provider: Provider; name: string; exact: string; notes: string[]; faq: { q: string; a: string }[] }> = {
  claude: {
    provider: "Anthropic",
    name: "Claude",
    exact: "For an exact count, call Anthropic's free count_tokens endpoint (POST /v1/messages/count_tokens) with the same model ID you'll use — counts are model-specific.",
    notes: [
      "Anthropic doesn't publish Claude's tokenizer, so any offline counter (this one included) is an estimate.",
      "OpenAI's tiktoken undercounts Claude by roughly 15–20% on typical text, and more on code and non-English text — don't use it for Claude budgets.",
      "Newer Claude models (Sonnet 5 and later, Haiku 5.5) use a newer tokenizer that counts about 30% more tokens for the same text than the models before them.",
    ],
    faq: [
      { q: "How do I count Claude tokens exactly?", a: "Send the request to the Messages API's count_tokens endpoint with your model ID; it returns input_tokens without running the model. Tokens differ between Claude generations, so count with the model you'll actually use." },
      { q: "Why does my Claude bill show more tokens than tiktoken said?", a: "tiktoken is OpenAI's tokenizer. Claude splits text differently, typically into 15–20% more tokens, and newer Claude models count about 30% more than older ones." },
    ],
  },
  gpt: {
    provider: "OpenAI",
    name: "GPT",
    exact: "For an exact count, use OpenAI's open-source tiktoken library with your model's encoding, or read usage.input_tokens from an API response.",
    notes: [
      "OpenAI publishes its tokenizers in the open-source tiktoken library, so exact offline counts are possible in Python and JavaScript.",
      "Reasoning tokens are billed as output tokens even though you don't see them — budget for them on top of the visible answer.",
      "GPT-6 prompts with more than 272K input tokens pay 2× input and 1.5× output for the whole request.",
    ],
    faq: [
      { q: "How many tokens is a word for GPT models?", a: "About 0.75 words per token for ordinary English, or roughly 4 characters per token. Code, numbers and other languages use more tokens per character." },
      { q: "Do reasoning tokens count toward the price?", a: "Yes. Reasoning (thinking) tokens are billed at the output rate, so a short visible answer can still cost thousands of output tokens." },
    ],
  },
  gemini: {
    provider: "Google",
    name: "Gemini",
    exact: "For an exact count, call the Gemini API's countTokens method with your model, or read usageMetadata from a response.",
    notes: [
      "Google's rule of thumb is about 4 characters per token for Gemini models.",
      "Gemini 3.1 Pro charges higher rates for prompts over 200K tokens, for the whole request.",
      "Some Gemini prices have announced increases (Gemini 4 Argon from 1 December 2026, Gemini 3.8 Flash from 1 January 2027); the cost column switches automatically on those dates.",
    ],
    faq: [
      { q: "How do I count Gemini tokens exactly?", a: "Use the countTokens method of the Gemini API (or the SDK's count_tokens) with the model you'll call. It returns the token count without generating anything." },
      { q: "Do thinking tokens count for Gemini?", a: "Yes. Gemini bills thinking tokens at the output price, which Google's pricing page notes as \"output price (including thinking tokens)\"." },
    ],
  },
};
