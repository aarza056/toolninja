import { resolveReleases } from "@/lib/changelog-resolve";

const BASE_URL = "https://toolninja.io";

export const dynamic = "force-static";

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

const LABELS = { feature: "Feature", new: "New tool", improved: "Improved", guide: "Guide", fix: "Fix" } as const;

export function GET() {
  const releases = resolveReleases();
  const items = releases
    .map((r) => {
      const lines = r.items.map((i) => {
        const label = LABELS[i.kind];
        const head = i.title ? `<strong>${escapeXml(i.title)}</strong>${i.text ? ` — ${escapeXml(i.text)}` : ""}` : escapeXml(i.text ?? "");
        const linked = i.href ? `<a href="${BASE_URL}${i.href}">${head}</a>` : head;
        const chips = i.chips ? `: ${i.chips.map((c) => escapeXml(c.name)).join(", ")}` : "";
        return `<li>${label}: ${linked}${chips}</li>`;
      });
      const html = `<p>${escapeXml(r.summary)}</p><ul>${lines.join("")}</ul>`;
      return `    <item>
      <title>${escapeXml(r.title)}</title>
      <link>${BASE_URL}/changelog#${r.id}</link>
      <guid isPermaLink="false">toolninja-release-${r.id}</guid>
      <pubDate>${new Date(`${r.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description><![CDATA[${html}]]></description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ToolNinja Changelog</title>
    <link>${BASE_URL}/changelog</link>
    <description>New developer tools, improvements, guides and fixes on ToolNinja.</description>
    <language>en</language>
    <atom:link href="${BASE_URL}/changelog/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date(`${releases[0].date}T12:00:00Z`).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
