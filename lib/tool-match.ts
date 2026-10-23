import { tools, type Tool } from "./tools";

const STOP = new Set(
  "a an and are as at be but by can do does for from get have how i in into is it its me my of on or so that the this to want what when where which why will with you your need make using use convert online free tool tools".split(
    " "
  )
);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t));
}

interface Indexed {
  tool: Tool;
  name: Set<string>;
  keywords: Set<string>;
  description: Set<string>;
  phrases: string[];
}

let index: Indexed[] | null = null;

function getIndex(): Indexed[] {
  if (!index) {
    index = tools.map((tool) => ({
      tool,
      name: new Set(tokens(tool.name)),
      keywords: new Set(tool.keywords.flatMap(tokens)),
      description: new Set(tokens(tool.description)),
      phrases: tool.keywords.map((k) => k.toLowerCase()),
    }));
  }
  return index;
}

/** Free, local tool finder: ranks the catalog against a plain-language problem description. */
export function matchTools(query: string, limit = 5): Tool[] {
  const q = query.toLowerCase();
  const qTokens = tokens(query);
  if (!qTokens.length) return [];

  const scored = getIndex().map((entry) => {
    let score = 0;
    for (const t of qTokens) {
      if (entry.name.has(t)) score += 6;
      if (entry.keywords.has(t)) score += 3;
      if (entry.description.has(t)) score += 2;
    }
    // Whole keyword phrases appearing in the question are a strong signal ("docker compose", "cron job")
    for (const phrase of entry.phrases) {
      if (phrase.length > 6 && q.includes(phrase)) score += 10;
    }
    return { tool: entry.tool, score };
  });

  const ranked = scored.filter((s) => s.score >= 5).sort((a, b) => b.score - a.score);
  if (!ranked.length) return [];
  // Drop weak tail matches that only share a generic word with the question
  const floor = ranked[0].score * 0.5;
  return ranked
    .filter((s) => s.score >= floor)
    .slice(0, limit)
    .map((s) => s.tool);
}
