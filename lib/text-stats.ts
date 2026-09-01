export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  topWords: { word: string; count: number }[];
  readability: ReadabilityStats | null;
}

export interface ReadabilityStats {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  level: string;
  syllables: number;
}

/** Approximates syllable count via the standard vowel-group heuristic used by most readability
 * tools: count runs of consecutive vowels, drop a trailing silent "e", floor at 1 syllable. */
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const groups = w.match(/[aeiouy]+/g) || [];
  let count = groups.length;
  if (w.endsWith("e") && !w.endsWith("le") && count > 1) count--;
  return Math.max(1, count);
}

function readabilityLevel(fleschScore: number): string {
  if (fleschScore >= 90) return "Very easy (5th grade)";
  if (fleschScore >= 70) return "Easy (7th grade)";
  if (fleschScore >= 60) return "Standard (8th–9th grade)";
  if (fleschScore >= 50) return "Fairly difficult (10th–12th grade)";
  if (fleschScore >= 30) return "Difficult (college level)";
  return "Very difficult (college graduate)";
}

function computeReadability(text: string, wordCount: number, sentenceCount: number): ReadabilityStats | null {
  if (wordCount < 1 || sentenceCount < 1) return null;

  const wordTokens = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
  if (wordTokens.length === 0) return null;

  const syllables = wordTokens.reduce((sum, w) => sum + countSyllables(w), 0);
  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllables / wordTokens.length;

  const fleschReadingEase = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  const fleschKincaidGrade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;

  return {
    fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
    fleschKincaidGrade: Math.round(Math.max(0, fleschKincaidGrade) * 10) / 10,
    level: readabilityLevel(fleschReadingEase),
    syllables,
  };
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

  const readability = computeReadability(trimmed, words, sentences);

  return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTimeMinutes, speakingTimeMinutes, topWords, readability };
}
