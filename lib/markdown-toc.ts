export interface TocHeading {
  level: number;
  text: string;
  slug: string;
}

/** Mirrors GitHub's own heading-slug algorithm closely enough for practical use: lowercase,
 * strip characters that aren't letters/numbers/spaces/hyphens, collapse spaces to hyphens. */
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function extractHeadings(markdown: string): TocHeading[] {
  const lines = markdown.split("\n");
  const headings: TocHeading[] = [];
  const slugCounts = new Map<string, number>();
  let inCodeFence = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2].trim();
    const baseSlug = slugify(text);
    const count = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, count + 1);
    const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;

    headings.push({ level, text, slug });
  }

  return headings;
}

export function buildTocMarkdown(headings: TocHeading[]): string {
  if (headings.length === 0) return "";
  const minLevel = Math.min(...headings.map((h) => h.level));
  return headings
    .map((h) => `${"  ".repeat(h.level - minLevel)}- [${h.text}](#${h.slug})`)
    .join("\n");
}

export function buildTocHtml(headings: TocHeading[]): string {
  if (headings.length === 0) return "";
  const minLevel = Math.min(...headings.map((h) => h.level));
  const items = headings
    .map((h) => `${"  ".repeat(h.level - minLevel)}<li><a href="#${h.slug}">${h.text}</a></li>`)
    .join("\n");
  return `<ul>\n${items}\n</ul>`;
}
