export type SortMode = "none" | "alpha" | "alpha-desc" | "numeric" | "numeric-desc" | "length" | "length-desc";

export function sortLines(lines: string[], mode: SortMode): string[] {
  const copy = [...lines];
  switch (mode) {
    case "alpha":
      return copy.sort((a, b) => a.localeCompare(b));
    case "alpha-desc":
      return copy.sort((a, b) => b.localeCompare(a));
    case "numeric":
      return copy.sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b));
    case "numeric-desc":
      return copy.sort((a, b) => parseFloat(b) - parseFloat(a) || b.localeCompare(a));
    case "length":
      return copy.sort((a, b) => a.length - b.length);
    case "length-desc":
      return copy.sort((a, b) => b.length - a.length);
    default:
      return copy;
  }
}

export function dedupeLines(lines: string[], caseSensitive: boolean): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const key = caseSensitive ? line : line.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(line);
    }
  }
  return out;
}

export function removeEmptyLines(lines: string[]): string[] {
  return lines.filter((l) => l.trim().length > 0);
}

export function trimLines(lines: string[]): string[] {
  return lines.map((l) => l.trim());
}

export function shuffleLines(lines: string[]): string[] {
  const copy = [...lines];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function reverseLines(lines: string[]): string[] {
  return [...lines].reverse();
}

export function numberLines(lines: string[]): string[] {
  return lines.map((l, i) => `${i + 1}. ${l}`);
}

export interface ListOptions {
  trim: boolean;
  removeEmpty: boolean;
  dedupe: boolean;
  dedupeCaseSensitive: boolean;
  sort: SortMode;
  numbered: boolean;
}

export function processLines(text: string, opts: ListOptions): string[] {
  let lines = text.split("\n");
  if (opts.trim) lines = trimLines(lines);
  if (opts.removeEmpty) lines = removeEmptyLines(lines);
  if (opts.dedupe) lines = dedupeLines(lines, opts.dedupeCaseSensitive);
  if (opts.sort !== "none") lines = sortLines(lines, opts.sort);
  if (opts.numbered) lines = numberLines(lines);
  return lines;
}
