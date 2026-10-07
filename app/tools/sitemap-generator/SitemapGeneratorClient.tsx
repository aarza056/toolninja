"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Download, AlertTriangle, ArrowRight } from "lucide-react";
import { buildSitemapXml, parseUrlList, isValidUrl, type ChangeFreq } from "@/lib/sitemap-xml";

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

export default function SitemapGeneratorClient() {
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
        lastmod: includeLastmod ? today : undefined,
        changefreq: changefreq || undefined,
        priority: priority || undefined,
      }))
    );
  }, [urls, invalidUrls, includeLastmod, today, changefreq, priority]);

  return (
    <ToolLayout title="XML Sitemap Generator" description="Paste your page URLs and get a ready-to-upload sitemap.xml">
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
            Include lastmod (today&apos;s date)
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
            Paste at least one page URL to generate a sitemap
          </div>
        )
      )}
    </ToolLayout>
  );
}
