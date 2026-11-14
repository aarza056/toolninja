"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Info, XCircle } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { actualSizes, evaluateFavicons, iconOk, type CheckState, type CheckedIcon, type FaviconReport } from "@/lib/favicon-check";
import { buildFaviconHtmlSnippet } from "@/lib/favicon";

const STORAGE_KEY = "toolninja:favicon-checker";
const field = "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

const STATE: Record<CheckState, JSX.Element> = {
  pass: <Check size={15} className="text-[#4ade80] mt-0.5 shrink-0" />,
  warn: <AlertTriangle size={15} className="text-[#fbbf24] mt-0.5 shrink-0" />,
  fail: <XCircle size={15} className="text-[#f87171] mt-0.5 shrink-0" />,
  info: <Info size={15} className="text-[#60a5fa] mt-0.5 shrink-0" />,
};

const SOURCE: Record<CheckedIcon["source"], string> = { html: "<link>", manifest: "manifest", default: "not declared" };

function kb(n?: number) {
  if (!n) return "";
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

function Preview({ icon }: { icon: CheckedIcon }) {
  const [failed, setFailed] = useState(false);
  if (!iconOk(icon) || failed || icon.href.startsWith("data:")) return <div className="w-10 h-10 rounded bg-[#1a1a1a] border border-[#2a2a2a]" />;
  return (
    <div className="flex gap-1 items-end">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon.finalUrl ?? icon.href} alt="" width={32} height={32} onError={() => setFailed(true)} className="w-8 h-8 object-contain rounded bg-[#f5f5f5] p-0.5" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon.finalUrl ?? icon.href} alt="" width={16} height={16} className="w-4 h-4 object-contain" />
    </div>
  );
}

export default function FaviconCheckerClient() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<FaviconReport | null>(null);
  const [skipped, setSkipped] = useState(0);

  useEffect(() => {
    try {
      setUrl(localStorage.getItem(STORAGE_KEY) || "");
    } catch {}
  }, []);

  const checks = useMemo(() => (report ? evaluateFavicons(report) : []), [report]);
  const score = checks.filter((c) => c.state !== "info");
  const passed = score.filter((c) => c.state === "pass").length;

  const run = async () => {
    setBusy(true);
    setError("");
    setReport(null);
    try {
      localStorage.setItem(STORAGE_KEY, url);
    } catch {}
    try {
      const res = await fetch("/api/favicon-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Couldn't check that site.");
        return;
      }
      setReport(data.report);
      setSkipped(data.skipped ?? 0);
    } catch {
      setError("Couldn't reach the checker. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const snippet = buildFaviconHtmlSnippet();

  return (
    <ToolLayout title="Favicon Checker" description="Enter a website to see every favicon it serves, their real sizes and formats, and what's missing for Google, iPhone and Android">
      <div className="space-y-6 max-w-4xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim() && !busy) run();
          }}
          className="flex flex-wrap gap-2"
        >
          <input aria-label="Website to check" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com" spellCheck={false} className={`${field} flex-1 min-w-[220px] font-mono`} />
          <button type="submit" disabled={busy || !url.trim()} className="px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-[8px]">
            {busy ? "Checking…" : "Check favicons"}
          </button>
        </form>
        {error && <p className="text-sm text-[#f87171]">{error}</p>}

        {report && (
          <div className="space-y-6">
            <p className="text-xs text-[#888888]">
              <span className="font-mono text-[#bbbbbb] break-all">{report.pageUrl}</span> · {passed} of {score.length} checks passed
              {report.themeColor && (
                <>
                  {" "}
                  · theme-color <span className="inline-block w-3 h-3 rounded-sm align-middle border border-[#333333]" style={{ background: report.themeColor }} /> <span className="font-mono">{report.themeColor}</span>
                </>
              )}
            </p>

            <ul className="space-y-2">
              {checks.map((c) => (
                <li key={c.id} className="flex items-start gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                  {STATE[c.state]}
                  <div className="min-w-0">
                    <p className="text-sm text-[#f5f5f5]">{c.title}</p>
                    <p className="text-xs text-[#999999] mt-0.5 whitespace-pre-line break-words">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div>
              <h2 className="text-sm font-semibold text-[#d4d4d4] mb-2">Icons found ({report.icons.length})</h2>
              <ul className="space-y-2">
                {report.icons.map((i, k) => (
                  <li key={k} className="flex items-start gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                    <Preview icon={i} />
                    <div className="min-w-0 flex-1 text-xs space-y-0.5">
                      <p className="font-mono text-[#d4d4d4] break-all">{i.href}</p>
                      <p className="text-[#888888]">
                        <span className="text-[#c084fc]">{i.rel}</span> · {SOURCE[i.source]}
                        {i.sizes ? ` · declares ${i.sizes}` : ""}
                        {i.purpose ? ` · purpose ${i.purpose}` : ""}
                      </p>
                      {iconOk(i) ? (
                        <p className="text-[#bbbbbb]">
                          {i.image!.format.toUpperCase()} · {actualSizes(i).join(", ") || "size unknown"} · {kb(i.bytes)}
                          {i.image!.frames && i.image!.frames.length > 1 ? ` · ${i.image!.frames.length} images inside` : ""}
                        </p>
                      ) : (
                        <p className="text-[#f87171]">{i.error ?? (i.status && i.status >= 400 ? `HTTP ${i.status}` : "Not a recognizable image")}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {skipped > 0 && <p className="text-xs text-[#777777] mt-2">{skipped} more icon{skipped === 1 ? "" : "s"} weren&apos;t checked (the limit is 14 per check).</p>}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-[#d4d4d4] mb-2">The tags a site needs today</h2>
          <div className="flex items-start gap-2">
            <pre className="flex-1 min-w-0 p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#bbbbbb] whitespace-pre-wrap break-all">{snippet}</pre>
            <CopyButton text={snippet} size="sm" />
          </div>
          <p className="text-xs text-[#777777] mt-1">
            Plus /favicon.ico at the site root. Missing files? Make all of them from one image with the <Link href="/tools/favicon-generator" className="text-[#a855f7] hover:underline">Favicon Generator</Link>.
          </p>
        </div>

        <p className="text-xs text-[#666666]">
          Check favicons asks our server to request the page, its web app manifest and up to 14 icon files, reading each image&apos;s format and size from its bytes. Nothing is stored. Google Search can take weeks to show a new favicon after it recrawls your home page.
        </p>
      </div>
    </ToolLayout>
  );
}
