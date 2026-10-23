import { releases } from "@/lib/changelog";
import { tools } from "@/lib/tools";
import { getAllPosts } from "@/lib/blog";
import type { ResolvedItem, ResolvedRelease } from "@/app/changelog/ChangelogClient";

// Turns the slug-based changelog into display data (names, descriptions, links) from the registries.
// Items pointing at a tool or guide that no longer exists are dropped rather than shown broken.
export function resolveReleases(): ResolvedRelease[] {
  const toolBySlug = new Map(tools.map((t) => [t.slug, t]));
  const postBySlug = new Map(getAllPosts().map((p) => [p.slug, p]));

  return releases.map((r) => {
    const d = new Date(`${r.date}T12:00:00Z`);
    const items: ResolvedItem[] = [];
    for (const item of r.items) {
      if (item.tool) {
        const tool = toolBySlug.get(item.tool);
        if (!tool) continue;
        items.push({ kind: item.kind, title: tool.name, text: item.text ?? tool.description, href: `/tools/${tool.slug}` });
      } else if (item.post) {
        const post = postBySlug.get(item.post);
        if (!post) continue;
        items.push({ kind: item.kind, title: post.title, text: item.text, href: `/blog/${post.slug}` });
      } else if (item.tools) {
        const chips = item.tools.flatMap((s) => {
          const t = toolBySlug.get(s);
          return t ? [{ name: t.name, href: `/tools/${t.slug}` }] : [];
        });
        items.push({ kind: item.kind, text: item.text, href: item.href, chips });
      } else {
        items.push({ kind: item.kind, text: item.text, href: item.href });
      }
    }
    return {
      id: r.date,
      date: r.date,
      dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }),
      month: d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
      title: r.title,
      summary: r.summary,
      items,
    };
  });
}
