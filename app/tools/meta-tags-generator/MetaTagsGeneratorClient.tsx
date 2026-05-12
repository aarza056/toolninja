"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Check, X, Globe } from "lucide-react";

function TwitterIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface MetaForm {
  title: string;
  description: string;
  url: string;
  siteName: string;
  image: string;
  author: string;
  keywords: string;
  type: "website" | "article" | "profile";
  twitterCard: "summary" | "summary_large_image";
  twitterSite: string;
  noIndex: boolean;
  noFollow: boolean;
}

const TITLE_MAX = 60;
const DESC_MAX = 160;

function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const over = len > max;
  return (
    <span className={`text-xs ${over ? "text-[#ef4444]" : len > max * 0.85 ? "text-[#f59e0b]" : "text-[#555555]"}`}>
      {len}/{max}
    </span>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#888888] uppercase tracking-wide">{label}</label>
        {hint && <span className="text-xs text-[#444444]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function MetaTagsGeneratorClient() {
  const [form, setForm] = useState<MetaForm>({
    title: "",
    description: "",
    url: "",
    siteName: "",
    image: "",
    author: "",
    keywords: "",
    type: "website",
    twitterCard: "summary_large_image",
    twitterSite: "",
    noIndex: false,
    noFollow: false,
  });

  const set = <K extends keyof MetaForm>(key: K, val: MetaForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const inputCls =
    "w-full bg-[#0a0a0a] border border-[#222222] rounded-[6px] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#444444] focus:outline-none focus:border-[#a855f7] transition-colors";

  const tags = useMemo(() => {
    const lines: string[] = [];
    const add = (tag: string) => lines.push(tag);

    // Basic
    if (form.title) add(`<title>${form.title}</title>`);
    if (form.description)
      add(`<meta name="description" content="${form.description}">`);
    if (form.keywords) add(`<meta name="keywords" content="${form.keywords}">`);
    if (form.author) add(`<meta name="author" content="${form.author}">`);
    if (form.url) add(`<link rel="canonical" href="${form.url}">`);

    // Robots
    const robotsDirectives: string[] = [];
    if (form.noIndex) robotsDirectives.push("noindex");
    else robotsDirectives.push("index");
    if (form.noFollow) robotsDirectives.push("nofollow");
    else robotsDirectives.push("follow");
    add(`<meta name="robots" content="${robotsDirectives.join(", ")}">`);

    // OG
    if (form.title || form.description || form.url) {
      add("");
      add(`<!-- Open Graph / Facebook -->`);
      add(`<meta property="og:type" content="${form.type}">`);
      if (form.url) add(`<meta property="og:url" content="${form.url}">`);
      if (form.title) add(`<meta property="og:title" content="${form.title}">`);
      if (form.description)
        add(`<meta property="og:description" content="${form.description}">`);
      if (form.image) add(`<meta property="og:image" content="${form.image}">`);
      if (form.siteName)
        add(`<meta property="og:site_name" content="${form.siteName}">`);
    }

    // Twitter
    if (form.title || form.description) {
      add("");
      add(`<!-- Twitter -->`);
      add(`<meta property="twitter:card" content="${form.twitterCard}">`);
      if (form.url) add(`<meta property="twitter:url" content="${form.url}">`);
      if (form.title)
        add(`<meta property="twitter:title" content="${form.title}">`);
      if (form.description)
        add(`<meta property="twitter:description" content="${form.description}">`);
      if (form.image)
        add(`<meta property="twitter:image" content="${form.image}">`);
      if (form.twitterSite)
        add(`<meta name="twitter:site" content="@${form.twitterSite.replace(/^@/, "")}">`);
    }

    return lines.join("\n");
  }, [form]);

  // Quality checklist
  const checks = useMemo(
    () => [
      { label: "Title set", ok: form.title.length > 0 },
      { label: `Title length (≤${TITLE_MAX})`, ok: form.title.length > 0 && form.title.length <= TITLE_MAX },
      { label: "Description set", ok: form.description.length > 0 },
      {
        label: `Description length (≤${DESC_MAX})`,
        ok: form.description.length > 0 && form.description.length <= DESC_MAX,
      },
      { label: "Canonical URL set", ok: form.url.length > 0 },
      { label: "OG image set", ok: form.image.length > 0 },
      { label: "Site name set", ok: form.siteName.length > 0 },
    ],
    [form]
  );

  const score = checks.filter((c) => c.ok).length;

  return (
    <ToolLayout
      title="Meta Tags Generator"
      description="Generate Open Graph, Twitter Card, and SEO meta tags with live preview."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Form ── */}
        <div className="space-y-4">
          <Field
            label="Page Title"
            hint={`${form.title.length}/${TITLE_MAX}`}
          >
            <div className="relative">
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="My Awesome Page"
                maxLength={80}
                className={inputCls}
              />
              <div className="absolute right-3 top-2.5">
                <CharCounter value={form.title} max={TITLE_MAX} />
              </div>
            </div>
          </Field>

          <Field
            label="Description"
            hint={`${form.description.length}/${DESC_MAX}`}
          >
            <div className="relative">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="A brief description of the page content for search engines and social sharing."
                rows={3}
                maxLength={200}
                className={inputCls + " resize-none pr-16"}
              />
              <div className="absolute right-3 top-2.5">
                <CharCounter value={form.description} max={DESC_MAX} />
              </div>
            </div>
          </Field>

          <Field label="Canonical URL">
            <input
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://example.com/page"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Site Name">
              <input
                value={form.siteName}
                onChange={(e) => set("siteName", e.target.value)}
                placeholder="My Site"
                className={inputCls}
              />
            </Field>
            <Field label="Author">
              <input
                value={form.author}
                onChange={(e) => set("author", e.target.value)}
                placeholder="Jane Doe"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="OG Image URL">
            <input
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
              placeholder="https://example.com/og-image.png"
              className={inputCls}
            />
          </Field>

          <Field label="Keywords">
            <input
              value={form.keywords}
              onChange={(e) => set("keywords", e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Page Type">
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value as MetaForm["type"])}
                className={inputCls}
              >
                <option value="website">Website</option>
                <option value="article">Article</option>
                <option value="profile">Profile</option>
              </select>
            </Field>
            <Field label="Twitter Card">
              <select
                value={form.twitterCard}
                onChange={(e) => set("twitterCard", e.target.value as MetaForm["twitterCard"])}
                className={inputCls}
              >
                <option value="summary_large_image">Large Image</option>
                <option value="summary">Summary</option>
              </select>
            </Field>
          </div>

          <Field label="Twitter @handle">
            <input
              value={form.twitterSite}
              onChange={(e) => set("twitterSite", e.target.value)}
              placeholder="@yourhandle"
              className={inputCls}
            />
          </Field>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.noIndex}
                onChange={(e) => set("noIndex", e.target.checked)}
                className="accent-[#a855f7]"
              />
              <span className="text-sm text-[#888888]">noindex</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.noFollow}
                onChange={(e) => set("noFollow", e.target.checked)}
                className="accent-[#a855f7]"
              />
              <span className="text-sm text-[#888888]">nofollow</span>
            </label>
          </div>
        </div>

        {/* ── Right: Previews + Checklist ── */}
        <div className="space-y-4">
          {/* Google preview */}
          <div className="border border-[#222222] rounded-[8px] p-4 bg-[#111111]">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={12} className="text-[#555555]" />
              <span className="text-xs text-[#555555] uppercase tracking-wide font-semibold">Google Search</span>
            </div>
            <div className="space-y-0.5">
              <div className="text-[15px] text-[#8ab4f8] truncate leading-snug">
                {form.title || <span className="text-[#444444] italic">Page title</span>}
              </div>
              <div className="text-xs text-[#4caf50] truncate">
                {form.url || <span className="text-[#444444]">https://example.com/page</span>}
              </div>
              <div className="text-xs text-[#bdc1c6] leading-relaxed line-clamp-2">
                {form.description || (
                  <span className="text-[#444444] italic">
                    Meta description will appear here. Keep it under 160 characters for best display.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Twitter preview */}
          <div className="border border-[#222222] rounded-[8px] overflow-hidden bg-[#111111]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1a1a1a]">
              <span className="text-[#555555]"><TwitterIcon size={12} /></span>
              <span className="text-xs text-[#555555] uppercase tracking-wide font-semibold">Twitter / X Card</span>
            </div>
            <div>
              {form.image ? (
                <div className="h-36 bg-[#0a0a0a] flex items-center justify-center border-b border-[#1a1a1a]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.image}
                    alt="OG preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="h-24 bg-[#0a0a0a] flex items-center justify-center border-b border-[#1a1a1a]">
                  <span className="text-xs text-[#333333]">OG image will appear here</span>
                </div>
              )}
              <div className="px-3 py-2.5">
                <div className="text-xs text-[#555555] truncate">{form.url || "example.com"}</div>
                <div className="text-sm font-semibold text-[#f5f5f5] truncate mt-0.5">
                  {form.title || <span className="text-[#444444] italic">Page Title</span>}
                </div>
                <div className="text-xs text-[#888888] line-clamp-2 mt-0.5">
                  {form.description || <span className="text-[#444444] italic">Description</span>}
                </div>
              </div>
            </div>
          </div>

          {/* LinkedIn preview */}
          <div className="border border-[#222222] rounded-[8px] overflow-hidden bg-[#111111]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1a1a1a]">
              <span className="text-[#555555]"><LinkedinIcon size={12} /></span>
              <span className="text-xs text-[#555555] uppercase tracking-wide font-semibold">LinkedIn / Slack</span>
            </div>
            <div className="flex gap-3 p-3">
              <div className="w-16 h-16 bg-[#0a0a0a] rounded-[4px] flex-shrink-0 border border-[#1a1a1a] overflow-hidden">
                {form.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.image}
                    alt="preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#f5f5f5] truncate">
                  {form.title || <span className="text-[#444444] italic">Page Title</span>}
                </div>
                <div className="text-xs text-[#888888] mt-0.5 line-clamp-2">
                  {form.description || <span className="text-[#444444] italic">Description</span>}
                </div>
                <div className="text-xs text-[#555555] mt-1 truncate">
                  {form.siteName || form.url || "example.com"}
                </div>
              </div>
            </div>
          </div>

          {/* Quality checklist */}
          <div className="border border-[#222222] rounded-[8px] p-4 bg-[#111111]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#888888] uppercase tracking-wide">SEO Checklist</span>
              <span className={`text-xs font-bold ${score === checks.length ? "text-[#22c55e]" : score >= checks.length * 0.6 ? "text-[#f59e0b]" : "text-[#ef4444]"}`}>
                {score}/{checks.length}
              </span>
            </div>
            <ul className="space-y-1.5">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  {c.ok ? (
                    <Check size={13} className="text-[#22c55e] flex-shrink-0" />
                  ) : (
                    <X size={13} className="text-[#ef4444] flex-shrink-0" />
                  )}
                  <span className={`text-xs ${c.ok ? "text-[#888888]" : "text-[#666666]"}`}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Generated tags */}
      <div className="mt-6 border border-[#222222] rounded-[8px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#222222] bg-[#0d0d0d]">
          <span className="text-xs text-[#888888] font-medium">Generated Meta Tags</span>
          <CopyButton text={tags} size="sm" label="Copy All Tags" />
        </div>
        <pre className="p-4 text-xs text-[#a855f7] font-mono overflow-x-auto whitespace-pre leading-relaxed bg-[#111111]">
          {tags || (
            <span className="text-[#444444] italic not-italic">
              Fill in the fields above to generate your meta tags…
            </span>
          )}
        </pre>
      </div>
    </ToolLayout>
  );
}
