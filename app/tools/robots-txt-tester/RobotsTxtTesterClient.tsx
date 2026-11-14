"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Info, X, XCircle } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { chooseGroups, parseRobotsFull, statusMeaning, testPath, CRAWLERS, ROBOTS_EXAMPLE, ROBOTS_EXAMPLE_PATHS, type RobotsIssue } from "@/lib/robots-test";

const STORAGE_KEY = "toolninja:robots-txt-tester";
const field = "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

const ISSUE_ICON: Record<RobotsIssue["severity"], JSX.Element> = {
  error: <XCircle size={13} className="text-[#f87171] mt-0.5 shrink-0" />,
  warning: <AlertTriangle size={13} className="text-[#fbbf24] mt-0.5 shrink-0" />,
  info: <Info size={13} className="text-[#60a5fa] mt-0.5 shrink-0" />,
};

interface Fetched {
  finalUrl: string;
  status: number;
  contentType: string | null;
  truncated: boolean;
  redirects: number;
}

export default function RobotsTxtTesterClient() {
  const [robots, setRobots] = useState("");
  const [paths, setPaths] = useState("");
  const [crawler, setCrawler] = useState("Googlebot");
  const [custom, setCustom] = useState("");
  const [site, setSite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [matrixPath, setMatrixPath] = useState(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      setRobots(typeof saved?.robots === "string" ? saved.robots : ROBOTS_EXAMPLE);
      setPaths(typeof saved?.paths === "string" ? saved.paths : ROBOTS_EXAMPLE_PATHS.join("\n"));
      if (typeof saved?.crawler === "string") setCrawler(saved.crawler);
      if (typeof saved?.site === "string") setSite(saved.site);
    } catch {
      setRobots(ROBOTS_EXAMPLE);
      setPaths(ROBOTS_EXAMPLE_PATHS.join("\n"));
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ robots: robots.length < 600_000 ? robots : "", paths, crawler, site }));
    } catch {}
  }, [robots, paths, crawler, site, loaded]);

  const token = crawler === "custom" ? custom.trim() || "*" : crawler;
  const parsed = useMemo(() => parseRobotsFull(robots), [robots]);
  const choice = useMemo(() => chooseGroups(parsed, token), [parsed, token]);
  const list = useMemo(
    () =>
      paths
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 100),
    [paths]
  );
  const verdicts = useMemo(() => list.map((p) => testPath(choice, p)), [list, choice]);
  const crawlerInfo = CRAWLERS.find((c) => c.token === token);
  const status = fetched ? statusMeaning(fetched.status) : null;
  const looksHtml = /^\s*<(!doctype|html|head|body)/i.test(robots);

  const matrix = useMemo(() => {
    const p = list[Math.min(matrixPath, list.length - 1)];
    if (!p) return [];
    return CRAWLERS.map((c) => {
      const ch = chooseGroups(parsed, c.token);
      return { crawler: c, verdict: testPath(ch, p), via: ch.matched };
    });
  }, [parsed, list, matrixPath]);

  const fetchRobots = async () => {
    setBusy(true);
    setError("");
    setFetched(null);
    try {
      const res = await fetch("/api/robots-fetch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: site }) });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Couldn't fetch robots.txt.");
        return;
      }
      setFetched({ finalUrl: data.finalUrl, status: data.status, contentType: data.contentType, truncated: data.truncated, redirects: data.redirects });
      setRobots(data.status >= 200 && data.status < 300 ? data.body : "");
    } catch {
      setError("Couldn't reach the tester. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout title="robots.txt Tester" description="Test URLs against a robots.txt for Googlebot, Bingbot, GPTBot, ClaudeBot or any crawler, and see the exact rule that allows or blocks each one">
      <div className="space-y-6 max-w-5xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (site.trim() && !busy) fetchRobots();
          }}
          className="flex flex-wrap gap-2"
        >
          <input aria-label="Website to fetch robots.txt from" value={site} onChange={(e) => setSite(e.target.value)} placeholder="example.com" spellCheck={false} className={`${field} flex-1 min-w-[220px] font-mono`} />
          <button type="submit" disabled={busy || !site.trim()} className="px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-[8px]">
            {busy ? "Fetching…" : "Fetch robots.txt"}
          </button>
        </form>
        {error && <p className="text-sm text-[#f87171]">{error}</p>}
        {fetched && status && (
          <div className={`p-3 bg-[#111111] border rounded-[8px] text-xs ${status.verdict === "disallow-all" ? "border-[#f87171]/40" : "border-[#222222]"}`}>
            <p className="text-[#d4d4d4]">
              <span className="font-mono break-all">{fetched.finalUrl}</span> answered <span className="font-medium">{fetched.status}</span>
              {fetched.contentType ? ` (${fetched.contentType})` : ""}
              {fetched.redirects ? ` after ${fetched.redirects} redirect${fetched.redirects === 1 ? "" : "s"}` : ""}.
            </p>
            <p className="text-[#999999] mt-1">{status.text}</p>
            {fetched.truncated && <p className="text-[#f87171] mt-1">The file is larger than 500 KiB; Google ignores everything after that point.</p>}
            {fetched.contentType && !/text\/plain/i.test(fetched.contentType) && status.verdict === "rules" && <p className="text-[#fbbf24] mt-1">Serve robots.txt as text/plain. Google reads it anyway, but other crawlers may not.</p>}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="robots-text" className="text-xs text-[#888888] font-medium">
                robots.txt
              </label>
              <button type="button" onClick={() => { setRobots(ROBOTS_EXAMPLE); setPaths(ROBOTS_EXAMPLE_PATHS.join("\n")); setFetched(null); }} className="text-xs text-[#a855f7] hover:underline">
                Example
              </button>
            </div>
            <textarea id="robots-text" value={robots} onChange={(e) => setRobots(e.target.value)} rows={16} spellCheck={false} className={`${field} w-full font-mono !text-xs`} placeholder={"User-agent: *\nDisallow: /admin/"} />
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="robots-crawler" className="text-xs text-[#888888] font-medium block mb-1">
                Crawler
              </label>
              <select id="robots-crawler" value={crawler} onChange={(e) => setCrawler(e.target.value)} className={`${field} w-full`}>
                {CRAWLERS.map((c) => (
                  <option key={c.token} value={c.token}>
                    {c.label}
                  </option>
                ))}
                <option value="custom">Other (type its name)</option>
              </select>
              {crawler === "custom" && <input aria-label="Crawler user-agent token" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="MyBot" spellCheck={false} className={`${field} w-full font-mono mt-2`} />}
              {crawlerInfo?.note && <p className="text-xs text-[#888888] mt-1">{crawlerInfo.note}</p>}
            </div>
            <div>
              <label htmlFor="robots-paths" className="text-xs text-[#888888] font-medium block mb-1">
                URLs or paths to test (one per line)
              </label>
              <textarea id="robots-paths" value={paths} onChange={(e) => setPaths(e.target.value)} rows={9} spellCheck={false} className={`${field} w-full font-mono !text-xs`} />
            </div>
          </div>
        </div>

        {looksHtml && <p className="flex items-start gap-2 text-xs text-[#f87171]"><XCircle size={13} className="mt-0.5 shrink-0" /> This is an HTML page, not a robots.txt. Sites that answer every path with their app shell serve this instead; crawlers then find no valid rules.</p>}

        <div>
          <p className="text-xs text-[#999999] mb-2">
            <span className="text-[#d4d4d4] font-medium">{token}:</span> {choice.reason}
          </p>
          <ul className="space-y-1.5">
            {verdicts.map((v, i) => (
              <li key={i} className="flex flex-wrap items-start gap-x-3 gap-y-1 p-2.5 bg-[#111111] border border-[#222222] rounded-[8px]">
                <span className={`flex items-center gap-1 text-xs font-medium w-[72px] shrink-0 ${v.allowed ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                  {v.allowed ? <Check size={13} /> : <X size={13} />} {v.allowed ? "Allowed" : "Blocked"}
                </span>
                <span className="font-mono text-xs text-[#f5f5f5] break-all flex-1 min-w-[160px]">{v.path}</span>
                <span className="text-xs text-[#888888]">
                  {v.note ??
                    (v.rule ? (
                      <>
                        <span className="font-mono text-[#c084fc]">
                          {v.rule.allow ? "Allow" : "Disallow"}: {v.rule.path}
                        </span>{" "}
                        line {v.rule.line}
                        {v.matching.length > 1 && ` · beats ${v.matching.length - 1} other matching rule${v.matching.length > 2 ? "s" : ""}`}
                      </>
                    ) : (
                      "No rule matches"
                    ))}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {list.length > 0 && (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h2 className="text-sm font-semibold text-[#d4d4d4]">Every crawler for</h2>
              <select aria-label="URL for the crawler table" value={Math.min(matrixPath, list.length - 1)} onChange={(e) => setMatrixPath(Number(e.target.value))} className={`${field} !py-1 font-mono !text-xs max-w-full`}>
                {list.map((p, i) => (
                  <option key={i} value={i}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {matrix.map((m) => (
                <div key={m.crawler.token} className="flex items-center gap-2 text-xs">
                  {m.verdict.allowed ? <Check size={13} className="text-[#4ade80] shrink-0" /> : <X size={13} className="text-[#f87171] shrink-0" />}
                  <span className="text-[#d4d4d4]">{m.crawler.token}</span>
                  <span className="text-[#555555] truncate">{m.via && m.via !== m.crawler.token ? `via ${m.via}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-[#d4d4d4] mb-2">
            File check{parsed.groups.length ? `: ${parsed.groups.length} group${parsed.groups.length === 1 ? "" : "s"}, ${parsed.sitemaps.length} sitemap${parsed.sitemaps.length === 1 ? "" : "s"}` : ""}
          </h2>
          {parsed.issues.length === 0 ? (
            <p className="flex items-center gap-2 text-xs text-[#86efac]">
              <Check size={13} /> No problems found.
            </p>
          ) : (
            <ul className="space-y-1">
              {parsed.issues.map((i, k) => (
                <li key={k} className="flex items-start gap-2 text-xs text-[#bbbbbb]">
                  {ISSUE_ICON[i.severity]}
                  <span>
                    {i.line > 0 && <span className="text-[#666666]">Line {i.line}: </span>}
                    {i.message}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-[#666666]">
          Matching follows RFC 9309 and Google&apos;s documented rules, and runs in your browser. Fetch robots.txt asks our server to request that one file. robots.txt controls crawling, not indexing: a blocked page can still appear in search results if other sites link to it. To keep a page out, allow crawling and use noindex. Write a new file with the <Link href="/tools/robots-txt-generator" className="text-[#a855f7] hover:underline">robots.txt Generator</Link>, or see what a crawler can reach with the <Link href="/tools/sitemap-generator" className="text-[#a855f7] hover:underline">XML Sitemap Generator</Link>.
        </p>
      </div>
    </ToolLayout>
  );
}
