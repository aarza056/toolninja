#!/usr/bin/env node
// Reports SEO problems across every prerendered page: <title> and meta description length,
// leftover meta keywords, canonical URLs that don't match the page, and JSON-LD that doesn't
// parse, repeats a type, or misses the fields Google needs for that type.
// Run after `next build`: `npm run check:seo`. Exits 1 when any page breaks a limit, so it can
// gate CI. Limits follow what search results usually show without truncation.
import fs from "node:fs";
import path from "node:path";

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;
const APP_DIR = path.join(process.cwd(), ".next", "server", "app");
const SITE_URL = "https://toolninja.io";

// Required properties per schema.org type (a minimal subset of Google's structured data docs).
const REQUIRED = {
  WebSite: ["name", "url"],
  Organization: ["name", "url"],
  SoftwareApplication: ["name", "applicationCategory", "offers"],
  BlogPosting: ["headline", "datePublished", "dateModified", "author"],
  BreadcrumbList: ["itemListElement"],
  FAQPage: ["mainEntity"],
  WebPage: ["name", "url"],
  Blog: ["name", "url"],
};
// Types that must appear at most once per page.
const SINGLETON = ["WebSite", "Organization", "SoftwareApplication", "BlogPosting", "BreadcrumbList", "FAQPage"];

function checkJsonLd(route, html, problems) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const nodes = [];
  for (const [, raw] of blocks) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      problems.push({ route, issue: `JSON-LD does not parse: ${e.message}` });
      continue;
    }
    for (const item of Array.isArray(data) ? data : [data]) {
      if (item["@context"] !== "https://schema.org") problems.push({ route, issue: "JSON-LD block without https://schema.org @context" });
      nodes.push(...(item["@graph"] ?? [item]));
    }
  }
  const counts = {};
  for (const node of nodes) {
    const type = node["@type"];
    counts[type] = (counts[type] ?? 0) + 1;
    for (const key of REQUIRED[type] ?? []) {
      if (node[key] === undefined || node[key] === "") problems.push({ route, issue: `${type} is missing "${key}"` });
    }
    if (type === "BreadcrumbList") {
      node.itemListElement.forEach((el, i) => {
        if (el.position !== i + 1 || !el.name || !el.item) problems.push({ route, issue: `BreadcrumbList item ${i + 1} is incomplete` });
      });
    }
    if (type === "FAQPage") {
      for (const q of node.mainEntity) {
        if (!q.name || !q.acceptedAnswer?.text) problems.push({ route, issue: "FAQPage question without name or answer text" });
      }
    }
  }
  for (const type of SINGLETON) {
    if ((counts[type] ?? 0) > 1) problems.push({ route, issue: `JSON-LD repeats ${type} ${counts[type]} times` });
  }
  if (!counts.WebSite || !counts.Organization) problems.push({ route, issue: "missing site-wide WebSite/Organization JSON-LD" });
  if (route.startsWith("/tools/") && !counts.SoftwareApplication) problems.push({ route, issue: "tool page without SoftwareApplication JSON-LD" });
  if (route.startsWith("/blog/") && !counts.BlogPosting) problems.push({ route, issue: "blog post without BlogPosting JSON-LD" });
}

if (!fs.existsSync(APP_DIR)) {
  console.error("No build output found. Run `next build` first.");
  process.exit(2);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return e.name.endsWith(".html") ? [full] : [];
  });
}

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'");
}

const problems = [];
let pages = 0;
for (const file of walk(APP_DIR)) {
  const route = ("/" + path.relative(APP_DIR, file).replace(/\\/g, "/").replace(/(index)?\.html$/, "")).replace(/(.)\/$/, "$1");
  if (route.startsWith("/_")) continue; // _not-found, _error
  const html = fs.readFileSync(file, "utf8");
  pages++;
  const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/g)].map((m) => decode(m[1]));
  const descs = [...html.matchAll(/<meta name="description" content="([^"]*)"/g)].map((m) => decode(m[1]));
  const keywords = /<meta name="keywords"/.test(html);

  if (titles.length !== 1) problems.push({ route, issue: `expected 1 <title>, found ${titles.length}` });
  if (descs.length !== 1) problems.push({ route, issue: `expected 1 meta description, found ${descs.length}` });
  if (keywords) problems.push({ route, issue: "has a meta keywords tag" });
  for (const t of titles) {
    if (t.length > TITLE_MAX) problems.push({ route, issue: `title ${t.length} > ${TITLE_MAX}: ${t}` });
    if (/\s{2,}/.test(t)) problems.push({ route, issue: `title has repeated whitespace: ${t}` });
  }
  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]);
  const expected = route === "/" ? SITE_URL : SITE_URL + route;
  if (canonicals.length !== 1) problems.push({ route, issue: `expected 1 canonical, found ${canonicals.length}` });
  else if (canonicals[0] !== expected) problems.push({ route, issue: `canonical ${canonicals[0]} should be ${expected}` });
  checkJsonLd(route, html, problems);
  if (route.startsWith("/tools/")) {
    const related = html.match(/<section data-related-tools[^>]*>([\s\S]*?)<\/section>/);
    const links = related ? (related[1].match(/href="\/tools\//g) ?? []).length : 0;
    if (links < 3) problems.push({ route, issue: `only ${links} related tool link(s); curate 3-5 in lib/related-tools.ts` });
  }
  for (const d of descs) {
    if (d.length > DESCRIPTION_MAX) problems.push({ route, issue: `description ${d.length} > ${DESCRIPTION_MAX}: ${d}` });
    if (d.length < 50) problems.push({ route, issue: `description only ${d.length} chars: ${d}` });
  }
}

// Every tool a post is mapped to in lib/blog-tool-map.ts must be linked from the post body.
const mapSrc = fs.readFileSync(path.join(process.cwd(), "lib", "blog-tool-map.ts"), "utf8");
for (const [, post, list] of mapSrc.matchAll(/^  "([^"]+)": \[(.*)\],$/gm)) {
  const file = path.join(process.cwd(), "content", "blog", `${post}.md`);
  if (!fs.existsSync(file)) {
    problems.push({ route: `/blog/${post}`, issue: "listed in lib/blog-tool-map.ts but has no markdown file" });
    continue;
  }
  const body = fs.readFileSync(file, "utf8").split(/^---$/m).slice(2).join("---");
  for (const [, tool] of list.matchAll(/"([^"]+)"/g)) {
    if (!body.includes(`](/tools/${tool})`)) problems.push({ route: `/blog/${post}`, issue: `body doesn't link /tools/${tool}` });
  }
}

for (const p of problems) console.log(`${p.route}\n  ${p.issue}`);
console.log(`\nChecked ${pages} pages: ${problems.length} problem(s).`);
process.exit(problems.length ? 1 : 0);
