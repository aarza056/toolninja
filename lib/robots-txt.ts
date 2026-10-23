export interface RobotsGroup {
  id: number;
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
}

export const AI_CRAWLER_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "Google-Extended",
  "anthropic-ai",
  "ClaudeBot",
  "CCBot",
  "PerplexityBot",
  "Bytespider",
  "Applebot-Extended",
];

export function buildRobotsTxt(groups: RobotsGroup[], sitemaps: string[]): string {
  const lines: string[] = [];

  groups.forEach((group) => {
    const agents = group.userAgent.split("\n").map((a) => a.trim()).filter(Boolean);
    (agents.length > 0 ? agents : ["*"]).forEach((agent) => lines.push(`User-agent: ${agent}`));
    group.allow.map((p) => p.trim()).filter(Boolean).forEach((p) => lines.push(`Allow: ${p}`));
    group.disallow.map((p) => p.trim()).filter(Boolean).forEach((p) => lines.push(`Disallow: ${p}`));
    if (group.crawlDelay) lines.push(`Crawl-delay: ${group.crawlDelay}`);
    lines.push("");
  });

  const cleanSitemaps = sitemaps.map((s) => s.trim()).filter(Boolean);
  if (cleanSitemaps.length > 0) {
    cleanSitemaps.forEach((s) => lines.push(`Sitemap: ${s}`));
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}
