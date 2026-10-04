const TRANSLIT_MAP: Record<string, string> = {
  á: "a", à: "a", â: "a", ä: "a", ã: "a", å: "a", ā: "a",
  é: "e", è: "e", ê: "e", ë: "e", ē: "e",
  í: "i", ì: "i", î: "i", ï: "i", ī: "i",
  ó: "o", ò: "o", ô: "o", ö: "o", õ: "o", ō: "o", ø: "o",
  ú: "u", ù: "u", û: "u", ü: "u", ū: "u",
  ý: "y", ÿ: "y",
  ñ: "n", ç: "c", ß: "ss", æ: "ae", œ: "oe",
  ð: "d", þ: "th",
};

function transliterate(text: string): string {
  return text
    .split("")
    .map((ch) => TRANSLIT_MAP[ch.toLowerCase()] ?? ch)
    .join("");
}

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "of", "in", "on", "at", "to", "for",
  "with", "is", "are", "was", "were", "be", "as", "by", "it", "this", "that",
  "from", "into", "than", "then", "so", "if", "when", "while", "about",
]);

function removeStopwordsFrom(text: string): string {
  const words = text.split(/\s+/);
  const filtered = words.filter((w) => !STOPWORDS.has(w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()));
  // If every word was a stopword, fall back to the original rather than returning an empty slug.
  return (filtered.length > 0 ? filtered : words).join(" ");
}

export interface SlugifyOptions {
  separator: "-" | "_";
  lowercase: boolean;
  maxLength?: number;
  removeStopwords?: boolean;
}

export function slugify(text: string, options: SlugifyOptions): string {
  const { separator, lowercase, maxLength, removeStopwords } = options;

  const source = removeStopwords ? removeStopwordsFrom(text) : text;
  let result = transliterate(source.normalize("NFKD"));
  // Strip any remaining combining diacritical marks
  result = result.replace(/[̀-ͯ]/g, "");
  if (lowercase) result = result.toLowerCase();

  // Replace anything that isn't alphanumeric with the separator
  result = result.replace(/[^a-zA-Z0-9]+/g, separator);
  // Collapse repeated separators
  const sepEscaped = separator === "-" ? "\\-" : "_";
  result = result.replace(new RegExp(`${sepEscaped}{2,}`, "g"), separator);
  // Trim leading/trailing separators
  result = result.replace(new RegExp(`^${sepEscaped}+|${sepEscaped}+$`, "g"), "");

  if (maxLength && result.length > maxLength) {
    result = result.slice(0, maxLength).replace(new RegExp(`${sepEscaped}+$`), "");
  }

  return result;
}
