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

export interface SlugifyOptions {
  separator: "-" | "_";
  lowercase: boolean;
  maxLength?: number;
}

export function slugify(text: string, options: SlugifyOptions): string {
  const { separator, lowercase, maxLength } = options;

  let result = transliterate(text.normalize("NFKD"));
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
