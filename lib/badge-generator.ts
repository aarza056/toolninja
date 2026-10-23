export type BadgeStyle = "flat" | "flat-square" | "plastic" | "for-the-badge" | "social";

export interface BadgeOptions {
  label: string;
  message: string;
  color: string;
  style: BadgeStyle;
  logo?: string;
  logoColor?: string;
  labelColor?: string;
}

const DEFAULT_OPTIONS: BadgeOptions = {
  label: "build",
  message: "passing",
  color: "brightgreen",
  style: "flat",
};

function encodeSegment(s: string): string {
  // shields.io's static badge endpoint uses "-" as the segment separator, so a literal "-"
  // in the label/message text must be escaped as "--", and spaces as "_" (or %20).
  return encodeURIComponent(s.trim()).replace(/-/g, "--").replace(/%20/g, "_");
}

export function buildBadgeUrl(opts: Partial<BadgeOptions>): string {
  const o = { ...DEFAULT_OPTIONS, ...opts };
  const label = encodeSegment(o.label || " ");
  const message = encodeSegment(o.message || " ");
  const color = encodeURIComponent(o.color.replace(/^#/, ""));

  const params = new URLSearchParams({ style: o.style });
  if (o.logo) params.set("logo", o.logo);
  if (o.logoColor) params.set("logoColor", o.logoColor);
  if (o.labelColor) params.set("labelColor", o.labelColor.replace(/^#/, ""));

  return `https://img.shields.io/badge/${label}-${message}-${color}?${params.toString()}`;
}

export function buildMarkdown(imageUrl: string, altText: string, linkUrl?: string): string {
  const img = `![${altText}](${imageUrl})`;
  return linkUrl ? `[${img}](${linkUrl})` : img;
}

export function buildHtml(imageUrl: string, altText: string, linkUrl?: string): string {
  const img = `<img src="${imageUrl}" alt="${altText}" />`;
  return linkUrl ? `<a href="${linkUrl}">${img}</a>` : img;
}

export interface DynamicBadgePreset {
  id: string;
  label: string;
  description: string;
  buildUrl: (owner: string, repo: string) => string;
  buildLink?: (owner: string, repo: string) => string;
  altText: string;
}

// A handful of the most commonly used shields.io "dynamic" badges — these hit shields.io's
// own service-specific endpoints (not the static /badge/ one) so they stay live and accurate
// without the user needing to know the exact shields.io path for each service.
export const DYNAMIC_BADGE_PRESETS: DynamicBadgePreset[] = [
  {
    id: "npm-version",
    label: "npm version",
    description: "Latest published version on npm",
    buildUrl: (_owner, repo) => `https://img.shields.io/npm/v/${repo}`,
    buildLink: (_owner, repo) => `https://www.npmjs.com/package/${repo}`,
    altText: "npm version",
  },
  {
    id: "npm-downloads",
    label: "npm downloads",
    description: "Weekly download count from npm",
    buildUrl: (_owner, repo) => `https://img.shields.io/npm/dw/${repo}`,
    buildLink: (_owner, repo) => `https://www.npmjs.com/package/${repo}`,
    altText: "npm downloads",
  },
  {
    id: "github-stars",
    label: "GitHub stars",
    description: "Star count for a GitHub repository",
    buildUrl: (owner, repo) => `https://img.shields.io/github/stars/${owner}/${repo}`,
    buildLink: (owner, repo) => `https://github.com/${owner}/${repo}`,
    altText: "GitHub stars",
  },
  {
    id: "github-license",
    label: "License",
    description: "License detected from the repository",
    buildUrl: (owner, repo) => `https://img.shields.io/github/license/${owner}/${repo}`,
    buildLink: (owner, repo) => `https://github.com/${owner}/${repo}/blob/main/LICENSE`,
    altText: "License",
  },
  {
    id: "github-issues",
    label: "Open issues",
    description: "Count of open issues on a GitHub repository",
    buildUrl: (owner, repo) => `https://img.shields.io/github/issues/${owner}/${repo}`,
    buildLink: (owner, repo) => `https://github.com/${owner}/${repo}/issues`,
    altText: "Open issues",
  },
  {
    id: "github-last-commit",
    label: "Last commit",
    description: "Time since the last commit to the default branch",
    buildUrl: (owner, repo) => `https://img.shields.io/github/last-commit/${owner}/${repo}`,
    buildLink: (owner, repo) => `https://github.com/${owner}/${repo}/commits`,
    altText: "Last commit",
  },
  {
    id: "pypi-version",
    label: "PyPI version",
    description: "Latest published version on PyPI",
    buildUrl: (_owner, repo) => `https://img.shields.io/pypi/v/${repo}`,
    buildLink: (_owner, repo) => `https://pypi.org/project/${repo}/`,
    altText: "PyPI version",
  },
];
