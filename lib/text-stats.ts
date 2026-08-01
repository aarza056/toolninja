export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  topWords: { word: string; count: number }[];
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be", "been", "being",
  "to", "of", "in", "on", "at", "for", "with", "by", "from", "as", "it", "this", "that",
  "these", "those", "i", "you", "he", "she", "we", "they", "them", "his", "her", "its",
  "our", "your", "their", "not", "no", "if", "then", "so", "than", "too", "very", "can",
  "will", "just", "there", "have", "has", "had", "do", "does", "did", "would", "could",
  "should", "what", "which", "who", "when", "where", "why", "how", "all", "each", "into",
]);

export function computeTextStats(text: string): TextStats {
  const trimmed = text.trim();

  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const sentences = trimmed ? (trimmed.match(/[.!?]+(?=\s|$)/g) || []).length || (trimmed ? 1 : 0) : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length : 0;
  const readingTimeMinutes = Math.max(words > 0 ? 1 : 0, Math.round(words / 200));
  const speakingTimeMinutes = Math.max(words > 0 ? 1 : 0, Math.round(words / 130));

  const wordFreq = new Map<string, number>();
  const tokens = trimmed.toLowerCase().match(/[a-z0-9']+/g) || [];
  for (const token of tokens) {
    if (token.length < 3 || STOP_WORDS.has(token)) continue;
    wordFreq.set(token, (wordFreq.get(token) ?? 0) + 1);
  }
  const topWords = Array.from(wordFreq.entries())
    .map(([word, count]) => ({ word, count }))
    .filter((w) => w.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTimeMinutes, speakingTimeMinutes, topWords };
}
