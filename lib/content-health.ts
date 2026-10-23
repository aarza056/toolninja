import fs from "fs";
import path from "path";
import { tools, LATEST_TOOL_SLUGS } from "@/lib/tools";
import { getAllPosts } from "@/lib/blog";
import { toolContent } from "@/lib/tool-content";
import { customToolMeta } from "@/lib/metadata";
import { releases } from "@/lib/changelog";

// Static checks over the site's own content — run on demand in /admin, no external calls.

export type Severity = "error" | "warn" | "info";

export interface Finding {
  severity: Severity;
  area: "Tools" | "SEO" | "Guides" | "Site";
  title: string;
  hint: string;
  items: { label: string; href?: string; detail?: string }[];
}

const TITLE_MAX = 60; // Google usually truncates beyond ~60 characters
const DESC_MIN = 110;
const DESC_MAX = 160;

export function runContentHealth(): { findings: Finding[]; stats: Record<string, number> } {
  const posts = getAllPosts();
  const slugs = new Set(tools.map((t) => t.slug));
  const postSlugs = new Set(posts.map((p) => p.slug));
  const toolLink = (slug: string) => `/tools/${slug}`;
  const findings: Finding[] = [];
  const add = (f: Finding) => f.items.length && findings.push(f);

  // ── Tools ──
  add({
    severity: "error",
    area: "Tools",
    title: "Tools without a page",
    hint: "Registered in lib/tools.ts but there's no app/tools/<slug>/page.tsx — the link 404s.",
    items: tools.filter((t) => !fs.existsSync(path.join(process.cwd(), "app", "tools", t.slug, "page.tsx"))).map((t) => ({ label: t.name, detail: t.slug })),
  });
  add({
    severity: "warn",
    area: "Tools",
    title: "Tools without an About section",
    hint: "No entry in lib/tool-content.ts — the page has no explanatory text for search engines.",
    items: tools.filter((t) => !toolContent[t.slug]).map((t) => ({ label: t.name, href: toolLink(t.slug) })),
  });
  add({
    severity: "info",
    area: "Tools",
    title: "Tools without an FAQ",
    hint: "FAQs answer real search questions and add FAQ structured data.",
    items: tools.filter((t) => toolContent[t.slug] && !(toolContent[t.slug].faq?.length)).map((t) => ({ label: t.name, href: toolLink(t.slug) })),
  });
  add({
    severity: "info",
    area: "Tools",
    title: "Short About sections",
    hint: "Under ~400 characters. A couple of sentences more helps visitors and ranking.",
    items: tools
      .filter((t) => toolContent[t.slug] && toolContent[t.slug].about.length < 400)
      .map((t) => ({ label: t.name, href: toolLink(t.slug), detail: `${toolContent[t.slug].about.length} chars` })),
  });
  const guided = new Set(posts.flatMap((p) => p.relatedTools));
  add({
    severity: "info",
    area: "Tools",
    title: "Tools with no guide",
    hint: "No blog post links to them — candidates for the next how-to article.",
    items: tools.filter((t) => !guided.has(t.slug)).map((t) => ({ label: t.name, href: toolLink(t.slug) })),
  });

  // ── SEO ──
  add({
    severity: "warn",
    area: "SEO",
    title: "Tools using the generic title & description",
    hint: "No hand-written entry in lib/metadata.ts.",
    items: tools.filter((t) => !customToolMeta(t.slug)).map((t) => ({ label: t.name, href: toolLink(t.slug) })),
  });
  add({
    severity: "warn",
    area: "SEO",
    title: `Titles longer than ${TITLE_MAX} characters`,
    hint: "Google truncates them in results.",
    items: tools
      .map((t) => ({ t, m: customToolMeta(t.slug) }))
      .filter(({ m }) => m && m.title.length > TITLE_MAX)
      .map(({ t, m }) => ({ label: t.name, href: toolLink(t.slug), detail: `${m!.title.length} chars — “${m!.title}”` })),
  });
  add({
    severity: "info",
    area: "SEO",
    title: `Descriptions outside ${DESC_MIN}–${DESC_MAX} characters`,
    hint: "Too short wastes the snippet; too long gets cut off.",
    items: tools
      .map((t) => ({ t, m: customToolMeta(t.slug) }))
      .filter(({ m }) => m && (m.description.length < DESC_MIN || m.description.length > DESC_MAX))
      .map(({ t, m }) => ({ label: t.name, href: toolLink(t.slug), detail: `${m!.description.length} chars` })),
  });

  // ── Guides ──
  add({
    severity: "error",
    area: "Guides",
    title: "Guides linking to tools that don't exist",
    hint: "relatedTools in the post's front matter has an unknown slug.",
    items: posts.flatMap((p) => p.relatedTools.filter((s) => !slugs.has(s)).map((s) => ({ label: p.title, href: `/blog/${p.slug}`, detail: s }))),
  });
  add({
    severity: "warn",
    area: "Guides",
    title: "Guides that link to no tool",
    hint: "Every guide should send readers to the tool that solves it.",
    items: posts.filter((p) => !p.relatedTools.length).map((p) => ({ label: p.title, href: `/blog/${p.slug}` })),
  });
  add({
    severity: "info",
    area: "Guides",
    title: `Guide descriptions outside ${DESC_MIN}–${DESC_MAX} characters`,
    hint: "Used as the search-result snippet.",
    items: posts
      .filter((p) => p.description.length < DESC_MIN || p.description.length > DESC_MAX)
      .map((p) => ({ label: p.title, href: `/blog/${p.slug}`, detail: `${p.description.length} chars` })),
  });

  // ── Site ──
  add({
    severity: "error",
    area: "Site",
    title: "Unknown slugs in “latest tools”",
    hint: "LATEST_TOOL_SLUGS in lib/tools.ts powers the NEW badges and What's New popup.",
    items: LATEST_TOOL_SLUGS.filter((s) => !slugs.has(s)).map((s) => ({ label: s })),
  });
  add({
    severity: "warn",
    area: "Site",
    title: "Changelog entries pointing at missing tools or guides",
    hint: "They're silently hidden on /changelog — fix the slug in lib/changelog.ts.",
    items: releases.flatMap((r) =>
      r.items.flatMap((i) => [
        ...(i.tool && !slugs.has(i.tool) ? [{ label: `${r.date} · ${r.title}`, detail: `tool: ${i.tool}` }] : []),
        ...(i.post && !postSlugs.has(i.post) ? [{ label: `${r.date} · ${r.title}`, detail: `guide: ${i.post}` }] : []),
        ...(i.tools ?? []).filter((s) => !slugs.has(s)).map((s) => ({ label: `${r.date} · ${r.title}`, detail: `tool: ${s}` })),
      ])
    ),
  });

  const order: Severity[] = ["error", "warn", "info"];
  findings.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
  return {
    findings,
    stats: {
      tools: tools.length,
      guides: posts.length,
      withFaq: tools.filter((t) => toolContent[t.slug]?.faq?.length).length,
      withGuide: tools.filter((t) => guided.has(t.slug)).length,
      customMeta: tools.filter((t) => customToolMeta(t.slug)).length,
    },
  };
}
