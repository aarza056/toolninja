"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, X } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { locationLabel, matchLocation, parseNginxConfig, NGINX_EXAMPLE, NGINX_EXAMPLE_URLS, type MatchResult, type NginxLocation } from "@/lib/nginx-location";

const STORAGE_KEY = "toolninja:nginx-location-tester";
const field = "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

const KIND: Record<string, string> = {
  "=": "exact",
  "^~": "prefix, no regex",
  "~": "regex",
  "~*": "regex, any case",
  "": "prefix",
  "@": "named",
};

function Result({ r, all, open, onToggle }: { r: MatchResult; all: NginxLocation[]; open: boolean; onToggle: () => void }) {
  const loc = r.location;
  return (
    <li className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-mono text-[#f5f5f5] break-all">{r.uri}</span>
        {r.query && <span className="font-mono text-xs text-[#666666] break-all">?{r.query}</span>}
        <ArrowRight size={14} className="text-[#666666] shrink-0" />
        {r.error ? (
          <span className="text-[#f87171]">400 Bad Request</span>
        ) : r.redirect ? (
          <span className="text-[#fbbf24]">301 → {r.redirect}</span>
        ) : loc ? (
          <span className="font-mono text-[#c084fc] break-all">
            {locationLabel(loc)} <span className="text-[#666666] text-xs">line {loc.line}</span>
          </span>
        ) : (
          <span className="text-[#f87171]">no location</span>
        )}
      </div>
      <p className="text-xs text-[#999999]">{r.reason}</p>
      {(r.captures.length > 0 || Object.keys(r.named).length > 0) && (
        <div className="flex flex-wrap gap-1.5 text-xs font-mono">
          {r.captures.map((c, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[#bbbbbb]">
              ${i + 1} = {c === "" ? "(empty)" : c}
            </span>
          ))}
          {Object.entries(r.named).map(([k, v]) => (
            <span key={k} className="px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[#bbbbbb]">
              ${k} = {v}
            </span>
          ))}
        </div>
      )}
      {loc && loc.directives.length > 0 && !r.redirect && (
        <pre className="text-xs font-mono text-[#888888] whitespace-pre-wrap break-all">{loc.directives.map((d) => `${d};`).join("\n")}</pre>
      )}
      {r.steps.length > 0 && (
        <div>
          <button type="button" onClick={onToggle} className="text-xs text-[#a855f7] hover:underline">
            {open ? "Hide" : "Show"} every step
          </button>
          {open && (
            <ol className="mt-2 space-y-1">
              {r.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  {s.matched ? <Check size={13} className="text-[#4ade80] mt-0.5 shrink-0" /> : <X size={13} className="text-[#666666] mt-0.5 shrink-0" />}
                  <span className="font-mono text-[#bbbbbb] break-all">{locationLabel(all[s.locationId])}</span>
                  <span className="text-[#777777]">{s.note}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </li>
  );
}

export default function NginxLocationTesterClient() {
  const [config, setConfig] = useState("");
  const [urls, setUrls] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      setConfig(typeof saved?.config === "string" ? saved.config : NGINX_EXAMPLE);
      setUrls(typeof saved?.urls === "string" ? saved.urls : NGINX_EXAMPLE_URLS.join("\n"));
    } catch {
      setConfig(NGINX_EXAMPLE);
      setUrls(NGINX_EXAMPLE_URLS.join("\n"));
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, urls }));
    } catch {}
  }, [config, urls, loaded]);

  const parsed = useMemo(() => parseNginxConfig(config), [config]);
  const results = useMemo(
    () =>
      urls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean)
        .slice(0, 50)
        .map((u) => matchLocation(parsed, u)),
    [parsed, urls]
  );

  // The order nginx effectively checks top-level locations in
  const order = useMemo(() => {
    const top = parsed.locations;
    const exact = top.filter((l) => l.modifier === "=");
    const prefix = top.filter((l) => l.modifier === "" || l.modifier === "^~").sort((a, b) => b.pattern.length - a.pattern.length);
    const regex = top.filter((l) => l.modifier === "~" || l.modifier === "~*");
    return { exact, prefix, regex, named: top.filter((l) => l.modifier === "@") };
  }, [parsed]);

  const regexErrors = parsed.all.filter((l) => l.regexError);

  return (
    <ToolLayout title="Nginx Location Tester" description="Paste your nginx config and test URLs to see which location block handles each one, and why">
      <div className="space-y-6 max-w-5xl">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="nginx-config" className="text-xs text-[#888888] font-medium">
                nginx config (a server block or just the location blocks)
              </label>
              <button type="button" onClick={() => { setConfig(NGINX_EXAMPLE); setUrls(NGINX_EXAMPLE_URLS.join("\n")); }} className="text-xs text-[#a855f7] hover:underline">
                Example
              </button>
            </div>
            <textarea id="nginx-config" value={config} onChange={(e) => setConfig(e.target.value)} rows={18} spellCheck={false} className={`${field} w-full font-mono !text-xs`} />
          </div>
          <div>
            <label htmlFor="nginx-urls" className="text-xs text-[#888888] font-medium block mb-1">
              URLs to test (one per line)
            </label>
            <textarea id="nginx-urls" value={urls} onChange={(e) => setUrls(e.target.value)} rows={18} spellCheck={false} placeholder={"/\n/api/users\nhttps://example.com/img/a.png"} className={`${field} w-full font-mono !text-xs`} />
          </div>
        </div>

        {(parsed.warnings.length > 0 || regexErrors.length > 0) && (
          <ul className="space-y-1">
            {parsed.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#fbbf24]">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {w}
              </li>
            ))}
            {regexErrors.map((l) => (
              <li key={l.id} className="flex items-start gap-2 text-xs text-[#fbbf24]">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" /> Line {l.line}: {l.regexError}
              </li>
            ))}
          </ul>
        )}

        {parsed.all.length === 0 ? (
          <p className="text-sm text-[#888888]">No location blocks found yet. Paste a server block, or lines like <code className="font-mono text-[#bbbbbb]">location /api/ {"{ ... }"}</code>.</p>
        ) : (
          <ul className="space-y-2">
            {results.map((r, i) => (
              <Result key={i} r={r} all={parsed.all} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
            ))}
          </ul>
        )}

        {parsed.all.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[#d4d4d4] mb-2">The order nginx checks your locations in</h2>
            <ol className="space-y-1 text-xs">
              {[...order.exact, ...order.prefix, ...order.regex].map((l, i) => (
                <li key={l.id} className="flex flex-wrap items-center gap-2">
                  <span className="text-[#666666] w-5 text-right">{i + 1}.</span>
                  <span className="font-mono text-[#bbbbbb] break-all">{locationLabel(l)}</span>
                  <span className="px-1.5 py-0.5 rounded border border-[#2a2a2a] text-[#888888]">{KIND[l.modifier]}</span>
                  {l.children.length > 0 && <span className="text-[#777777]">{l.children.length} nested</span>}
                  <span className="text-[#555555]">line {l.line}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-[#777777] mt-2">
              Exact matches first, then the longest matching prefix. A ^~ prefix stops there; otherwise regexes are tried top to bottom, and the first that matches wins over the prefix.
              {order.named.length > 0 && ` Named locations (${order.named.map((l) => l.pattern).join(", ")}) are only reached through try_files, error_page or a rewrite.`}
            </p>
          </div>
        )}

        <p className="text-xs text-[#666666]">
          Runs in your browser; your config isn&apos;t sent anywhere. Regexes run with JavaScript&apos;s engine, which agrees with nginx&apos;s PCRE for the patterns configs use; PCRE-only syntax is flagged. Rewrites, <code className="font-mono">if</code> blocks and try_files aren&apos;t followed. Moving from Apache? Try the <Link href="/tools/htaccess-to-nginx" className="text-[#a855f7] hover:underline">.htaccess to Nginx Converter</Link>, and test patterns in the <Link href="/tools/regex-tester" className="text-[#a855f7] hover:underline">Regex Tester</Link>.
        </p>
      </div>
    </ToolLayout>
  );
}
