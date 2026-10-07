export type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: string;
}

const MAX_URLS_PER_SITEMAP = 50000;

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function buildSitemapXml(urls: SitemapUrl[]): { xml: string; truncated: boolean } {
  const valid = urls.filter((u) => u.loc.trim());
  const truncated = valid.length > MAX_URLS_PER_SITEMAP;
  const used = truncated ? valid.slice(0, MAX_URLS_PER_SITEMAP) : valid;

  const entries = used.map((u) => {
    const parts = [`    <loc>${escapeXml(u.loc.trim())}</loc>`];
    if (u.lastmod) parts.push(`    <lastmod>${escapeXml(u.lastmod)}</lastmod>`);
    if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
    if (u.priority) parts.push(`    <priority>${u.priority}</priority>`);
    return `  <url>\n${parts.join("\n")}\n  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
  return { xml, truncated };
}

export function parseUrlList(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}
