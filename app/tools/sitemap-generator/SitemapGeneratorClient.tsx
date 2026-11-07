"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Download, AlertTriangle, ArrowRight, Globe, Loader2 } from "lucide-react";
import { buildSitemapXml, parseUrlList, isValidUrl, type ChangeFreq } from "@/lib/sitemap-xml";
import { crawlSite, type CrawlResponse, type CrawlResult } from "@/lib/site-crawl";

const STORAGE_KEY = "toolninja:sitemap-generator";
const CHANGEFREQ_OPTIONS: (ChangeFreq | "")[] = ["", "always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const MAX_PAGE_OPTIONS = [50, 100, 250, 500];

function IssueList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <details className="text-xs text-[#999999]">
      <summary className="cursor-pointer text-[#bbbbbb]">
        {title} ({items.length})
      </summary>
      <ul className="mt-1 max-h-40 overflow-auto space-y-0.5 font-mono break-all">
        {items.map((u) => (
          <li key={u}>{u}</li>
        ))}
      </ul>
    </details>
  );
}

export default function SitemapGeneratorClient() {
  const [site, setSite] = useState("");
  const [maxPages, setMaxPages] = useState(100);
  const [crawling, setCrawling] = useState(false);
  const [progress, setProgress] = useState<{ visited: number; queued: number; pages: number } | null>(null);
  const [crawl, setCrawl] = useState<CrawlResult | null>(null);
  const [crawlError, setCrawlError] = useState("");
  const [lastmods, setLastmods] = useState<Record<string, string | null>>({});
  const stopRef = useRef(false);
  const [urlsText, setUrlsText] = useState("");
  const [changefreq, setChangefreq] = useState<ChangeFreq | "">("weekly");
  const [includeLastmod, setIncludeLastmod] = useState(true);
  const [priority, setPriority] = useState("0.8");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUrlsText(parsed.urlsText ?? "");
        setChangefreq(parsed.changefreq ?? "weekly");
        setIncludeLastmod(parsed.includeLastmod ?? true);
        setPriority(parsed.priority ?? "0.8");
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ urlsText, changefreq, includeLastmod, priority }));
    } catch {}
  }, [urlsText, changefreq, includeLastmod, priority]);

  const urls = useMemo(() => parseUrlList(urlsText), [urlsText]);
  const invalidUrls = useMemo(() => urls.filter((u) => !isValidUrl(u)), [urls]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { xml, truncated } = useMemo(() => {
    if (urls.length === 0 || invalidUrls.length > 0) return { xml: "", truncated: false };
    return buildSitemapXml(
      urls.map((loc) => ({
        loc,
        // A crawled page uses its real Last-Modified date, or none if the server didn't send one;
        // a pasted URL has no known date, so it gets today's
        lastmod: !includeLastmod ? undefined : loc in lastmods ? (lastmods[loc] ?? undefined) : today,
        changefreq: changefreq || undefined,
        priority: priority || undefined,
      }))
    );
  }, [urls, invalidUrls, includeLastmod, today, changefreq, priority, lastmods]);

  async function startCrawl() {
    const raw = site.trim();
    if (!raw || crawling) return;
    let start: string;
    try {
      start = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).href;
    } catch {
      setCrawlError("That isn't a valid URL.");
      return;
    }
    stopRef.current = false;
    setCrawling(true);
    setCrawlError("");
    setCrawl(null);
    setProgress({ visited: 0, queued: 1, pages: 0 });
    const result = await crawlSite(start, {
      maxPages,
      shouldStop: () => stopRef.current,
      onProgress: setProgress,
      fetchPage: async (url) => {
        const res = await fetch("/api/crawl-page", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
        const data = (await res.json()) as CrawlResponse;
        return res.status === 429 ? { ok: false, status: 429, error: data.error } : data;
      },
    });
    setCrawl(result);
    setCrawling(false);
    if (result.pages.length) {
      setUrlsText(result.pages.map((p) => p.url).join("\n"));
      setLastmods(Object.fromEntries(result.pages.map((p) => [p.url, p.lastmod])));
    } else {
      setCrawlError(result.failed[0]?.error ?? result.stopped ?? "No indexable pages found at that address.");
    }
  }

  return (
    <ToolLayout title="XML Sitemap Generator" description="Crawl your site or paste your page URLs and get a ready-to-upload sitemap.xml">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          startCrawl();
        }}
        className="flex flex-col sm:flex-row gap-2 mb-2"
      >
        <label className="flex flex-1 items-center gap-2 px-3 py-2 bg-[#111111] border border-[#222222] rounded-[8px] focus-within:border-[#a855f7]">
          <Globe size={14} className="text-[#666666] shrink-0" />
          <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="example.com" aria-label="Website to crawl" spellCheck={false} className="flex-1 min-w-0 bg-transparent text-sm font-mono text-[#f5f5f5] focus:outline-none" />
        </label>
        <select value={maxPages} onChange={(e) => setMaxPages(Number(e.target.value))} aria-label="Maximum pages" className="px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]">
          {MAX_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              Up to {n} pages
            </option>
          ))}
        </select>
        {crawling ? (
          <button type="button" onClick={() => (stopRef.current = true)} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-[8px] bg-[#1a1a1a] border border-[#333333] text-[#f5f5f5]">
            <Loader2 size={14} className="animate-spin" /> Stop
          </button>
        ) : (
          <button type="submit" disabled={!site.trim()} className="px-4 py-2 text-sm rounded-[8px] bg-[#a855f7] hover:bg-[#9333ea] text-white disabled:opacity-50">
            Crawl site
          </button>
        )}
      </form>
      <p className="text-xs text-[#555555] mb-3">
        Our server follows the links on your site — one site at a time, respecting robots.txt, skipping noindex pages. Nothing is stored. Or paste URLs below; that part never leaves your browser.
      </p>
      {progress && crawling && (
        <p className="text-xs text-[#a855f7] mb-3" aria-live="polite">
          Visited {progress.visited} · {progress.queued} waiting · {progress.pages} pages found
        </p>
      )}
      {crawlError && <p className="text-sm text-[#f87171] mb-3">{crawlError}</p>}
      {crawl && crawl.pages.length > 0 && (
        <div className="mb-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px] space-y-1.5">
          <p className="text-sm text-[#4ade80]">
            Found {crawl.pages.length} page{crawl.pages.length === 1 ? "" : "s"}.
            {crawl.hitLimit && <span className="text-[#fbbf24]"> Stopped at your limit of {maxPages} — there are more links to follow.</span>}
            {crawl.stopped && <span className="text-[#fbbf24]"> {crawl.stopped}</span>}
          </p>
          <IssueList title="Broken links" items={crawl.broken.map((b) => `${b.status} ${b.url}`)} />
          <IssueList title="Left out: noindex" items={crawl.noindex} />
          <IssueList title="Left out: blocked by robots.txt" items={crawl.blocked} />
          <IssueList title="Couldn't load" items={crawl.failed.map((f) => `${f.url} — ${f.error}`)} />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">
            Page URLs (one per line) {urls.length > 0 && `— ${urls.length} URL${urls.length !== 1 ? "s" : ""}`}
          </label>
          <textarea
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            placeholder={"https://example.com/\nhttps://example.com/about\nhttps://example.com/blog"}
            spellCheck={false}
            className="w-full h-64 p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
          {invalidUrls.length > 0 && (
            <div className="flex items-start gap-1.5 text-xs text-[#ef4444] mt-1.5">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>
                {invalidUrls.length} line{invalidUrls.length !== 1 ? "s" : ""} aren&apos;t valid absolute http(s) URLs:{" "}
                <code className="font-mono">{invalidUrls.slice(0, 3).join(", ")}</code>{invalidUrls.length > 3 ? "…" : ""}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Change frequency</label>
              <select
                value={changefreq}
                onChange={(e) => setChangefreq(e.target.value as ChangeFreq | "")}
                className="w-full px-2.5 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              >
                {CHANGEFREQ_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c || "(omit)"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Priority (0.0–1.0)</label>
              <input
                type="text"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="0.8"
                className="w-full px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#888888] cursor-pointer">
            <input type="checkbox" checked={includeLastmod} onChange={(e) => setIncludeLastmod(e.target.checked)} className="accent-[#a855f7]" />
            Include lastmod (real date for crawled pages, today for pasted URLs)
          </label>

          {truncated && (
            <div className="flex items-center gap-2 p-2.5 bg-[#f97316]/10 border border-[#f97316]/30 rounded-[8px] text-xs text-[#f97316]">
              <AlertTriangle size={13} /> Sitemaps are capped at 50,000 URLs each — only the first 50,000 are included. Split the rest into additional sitemap files and list them all in a sitemap index.
            </div>
          )}

          <Link href="/tools/robots-txt-generator" className="inline-flex items-center gap-1 text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors">
            Add this sitemap&apos;s URL to your robots.txt <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {xml ? (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">sitemap.xml</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => download("sitemap.xml", xml)}
                className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
              >
                <Download size={12} /> Download
              </button>
              <CopyButton text={xml} size="sm" />
            </div>
          </div>
          <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto max-h-[400px]">
            {xml}
          </pre>
        </div>
      ) : (
        !invalidUrls.length && (
          <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px] text-sm">
            Crawl your site or paste at least one page URL to generate a sitemap
          </div>
        )
      )}
    </ToolLayout>
  );
}
