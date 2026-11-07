"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { backoffSchedule, explainRateLimit, formatWait, retryCodeCurl, retryCodeJs, retryCodePython, type BackoffOptions, type Jitter } from "@/lib/retry-after";

const STORAGE_KEY = "toolninja:retry-after-tester";
const EXAMPLE = `HTTP/2 429
retry-after: 30
x-ratelimit-limit: 60
x-ratelimit-remaining: 0
x-ratelimit-reset: 30`;

const field = "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";
const label = "block text-xs text-[#888888] font-medium";
const heading = "text-sm font-semibold text-[#f5f5f5]";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface LogRow {
  n: number;
  status: number;
  retryAfter: string | null;
  remaining: string | null;
  note?: string;
}

export default function RetryAfterTesterClient() {
  const [raw, setRaw] = useState("");
  const [limit, setLimit] = useState(3);
  const [windowSeconds, setWindowSeconds] = useState(15);
  const [status, setStatus] = useState<429 | 503>(429);
  const [format, setFormat] = useState<"seconds" | "date">("seconds");
  const [log, setLog] = useState<LogRow[]>([]);
  const [running, setRunning] = useState(false);
  const [waiting, setWaiting] = useState<number | null>(null);
  const [testError, setTestError] = useState("");
  const [origin, setOrigin] = useState("https://toolninja.io");
  const stop = useRef(false);

  const [backoff, setBackoff] = useState<BackoffOptions>({ baseSeconds: 1, factor: 2, capSeconds: 60, attempts: 5, jitter: "full" });
  const [lang, setLang] = useState<"js" | "python" | "curl">("js");

  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      setRaw(localStorage.getItem(STORAGE_KEY) || EXAMPLE);
    } catch {
      setRaw(EXAMPLE);
    }
    return () => {
      stop.current = true;
    };
  }, []);
  useEffect(() => {
    if (!raw) return;
    try {
      localStorage.setItem(STORAGE_KEY, raw);
    } catch {}
  }, [raw]);

  const report = useMemo(() => explainRateLimit(raw), [raw]);
  const schedule = useMemo(() => backoffSchedule(backoff), [backoff]);
  const worst = schedule.reduce((n, s) => n + s.maxSeconds, 0);

  const query = `limit=${limit}&window=${windowSeconds}${status === 503 ? "&status=503" : ""}${format === "date" ? "&format=date" : ""}`;
  const path = `/api/mock/rate-limit?${query}`;
  const testUrl = `${origin}${path}`;
  const code = lang === "js" ? retryCodeJs(backoff) : lang === "python" ? retryCodePython(backoff) : retryCodeCurl(backoff, testUrl);

  const send = async (n: number): Promise<LogRow> => {
    const res = await fetch(path, { cache: "no-store" });
    const row: LogRow = { n, status: res.status, retryAfter: res.headers.get("retry-after"), remaining: res.headers.get("ratelimit-remaining") };
    setLog((l) => [...l, row]);
    return row;
  };

  /** Behaves like a well-mannered client: sends until refused, waits as long as it's told, tries once more */
  const run = async () => {
    stop.current = false;
    setRunning(true);
    setTestError("");
    setLog([]);
    try {
      let n = 1;
      let last = await send(n);
      while (last.status === 200 && n < limit + 2 && !stop.current) {
        n += 1;
        await sleep(150);
        last = await send(n);
      }
      if (last.status !== 200 && last.retryAfter && !stop.current) {
        const wait = /^\d+$/.test(last.retryAfter) ? Number(last.retryAfter) : Math.max(0, Math.ceil((Date.parse(last.retryAfter) - Date.now()) / 1000));
        for (let left = wait; left > 0 && !stop.current; left--) {
          setWaiting(left);
          await sleep(1000);
        }
        setWaiting(null);
        if (!stop.current) await send(n + 1);
      }
    } catch {
      setTestError("The test request failed. Check your connection and try again.");
    } finally {
      setWaiting(null);
      setRunning(false);
    }
  };

  return (
    <ToolLayout title="Retry-After & Rate Limit Tester" description="Read 429 and 503 headers, test your client against a real rate limiter, and copy retry code with exponential backoff">
      <div className="space-y-8 max-w-4xl">
        <section className="space-y-3">
          <h2 className={heading}>Read the headers</h2>
          <div>
            <label htmlFor="ra-input" className={`${label} mb-1`}>
              Response headers, as printed by curl -i or copied from dev tools
            </label>
            <textarea id="ra-input" value={raw} onChange={(e) => setRaw(e.target.value)} rows={6} spellCheck={false} className={`${field} w-full font-mono !text-xs`} />
          </div>
          <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
            <p className="text-sm font-medium text-[#f5f5f5]">{report.verdict}</p>
            {report.wait && <p className="text-xs text-[#888888] mt-0.5">Based on {report.wait.because}.</p>}
          </div>
          {report.headers.length > 0 && (
            <ul className="space-y-1.5">
              {report.headers.map((h, i) => (
                <li key={i} className="text-xs">
                  <span className={`font-mono ${h.bad ? "text-[#f87171]" : "text-[#c084fc]"}`}>
                    {h.name}: {h.value}
                  </span>
                  <span className="block text-[#999999] mt-0.5">{h.meaning}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className={heading}>Test against a real limiter</h2>
          <p className="text-xs text-[#888888]">A working endpoint for your own client: it allows the requests below per window, per visitor, then refuses with Retry-After until the window ends.</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className={label}>
              Requests allowed
              <input type="number" min={0} max={100} value={limit} onChange={(e) => setLimit(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} className={`${field} mt-1 w-24 block`} />
            </label>
            <label className={label}>
              Per (seconds)
              <input type="number" min={1} max={3600} value={windowSeconds} onChange={(e) => setWindowSeconds(Math.max(1, Math.min(3600, Number(e.target.value) || 1)))} className={`${field} mt-1 w-24 block`} />
            </label>
            <label className={label}>
              Refuse with
              <select value={status} onChange={(e) => setStatus(Number(e.target.value) as 429 | 503)} className={`${field} mt-1 block`}>
                <option value={429}>429 Too Many Requests</option>
                <option value={503}>503 Service Unavailable</option>
              </select>
            </label>
            <label className={label}>
              Retry-After as
              <select value={format} onChange={(e) => setFormat(e.target.value as "seconds" | "date")} className={`${field} mt-1 block`}>
                <option value="seconds">Seconds</option>
                <option value="date">HTTP date</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 p-2 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[6px] text-[#bbbbbb] break-all">{testUrl}</code>
            <CopyButton text={testUrl} size="sm" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={run} disabled={running} className="px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-[8px]">
              {running ? "Running…" : "Run the test here"}
            </button>
            {running && (
              <button onClick={() => (stop.current = true)} className="text-sm text-[#888888] hover:text-[#f5f5f5]">
                Stop
              </button>
            )}
            {waiting !== null && <p className="text-sm text-[#fbbf24]">Waiting as told: {waiting}s left</p>}
          </div>
          {testError && <p className="text-sm text-[#f87171]">{testError}</p>}
          {log.length > 0 && (
            <div className="overflow-x-auto border border-[#222222] rounded-[8px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[#888888] bg-[#111111]">
                    <th className="px-3 py-2 font-medium">Request</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Retry-After</th>
                    <th className="px-3 py-2 font-medium">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((r) => (
                    <tr key={r.n} className="border-t border-[#1a1a1a] font-mono">
                      <td className="px-3 py-1.5 text-[#bbbbbb]">{r.n}</td>
                      <td className={`px-3 py-1.5 ${r.status === 200 ? "text-[#4ade80]" : "text-[#f87171]"}`}>{r.status}</td>
                      <td className="px-3 py-1.5 text-[#bbbbbb]">{r.retryAfter ?? "—"}</td>
                      <td className="px-3 py-1.5 text-[#bbbbbb]">{r.remaining ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className={heading}>Backoff for when there&apos;s no Retry-After</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className={label}>
              First delay (s)
              <input type="number" min={0.1} step={0.1} value={backoff.baseSeconds} onChange={(e) => setBackoff({ ...backoff, baseSeconds: Math.max(0.1, Number(e.target.value) || 1) })} className={`${field} mt-1 w-24 block`} />
            </label>
            <label className={label}>
              Multiply by
              <input type="number" min={1} step={0.5} value={backoff.factor} onChange={(e) => setBackoff({ ...backoff, factor: Math.max(1, Number(e.target.value) || 2) })} className={`${field} mt-1 w-24 block`} />
            </label>
            <label className={label}>
              Longest delay (s)
              <input type="number" min={1} value={backoff.capSeconds} onChange={(e) => setBackoff({ ...backoff, capSeconds: Math.max(1, Number(e.target.value) || 60) })} className={`${field} mt-1 w-24 block`} />
            </label>
            <label className={label}>
              Retries
              <input type="number" min={1} max={20} value={backoff.attempts} onChange={(e) => setBackoff({ ...backoff, attempts: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} className={`${field} mt-1 w-20 block`} />
            </label>
            <label className={label}>
              Jitter
              <select value={backoff.jitter} onChange={(e) => setBackoff({ ...backoff, jitter: e.target.value as Jitter })} className={`${field} mt-1 block`}>
                <option value="full">Full (random, 0 to delay)</option>
                <option value="equal">Equal (half to delay)</option>
                <option value="none">None</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-[#888888]">
            {schedule.map((s) => (s.minSeconds === s.maxSeconds ? formatWait(s.maxSeconds) : `${formatWait(s.minSeconds)}–${formatWait(s.maxSeconds)}`)).join(" → ")}
            <span className="block mt-0.5">At most {formatWait(worst)} of waiting in total.{backoff.jitter === "none" ? " Without jitter, clients that failed together retry together." : ""}</span>
          </p>
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
                {(["js", "python", "curl"] as const).map((l) => (
                  <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 text-xs ${lang === l ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}>
                    {l === "js" ? "JavaScript" : l === "python" ? "Python" : "curl"}
                  </button>
                ))}
              </div>
              <CopyButton text={code} size="sm" />
            </div>
            <pre aria-label="Retry code" className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto max-h-96">{code}</pre>
          </div>
        </section>

        <p className="text-xs text-[#666666]">
          Pasted headers stay in your browser. The test endpoint keeps only an anonymous counter that expires with the window. To see which status codes are worth retrying, check <Link href="/tools/http-status-codes" className="text-[#a855f7] hover:underline">HTTP Status Codes</Link>.
        </p>
      </div>
    </ToolLayout>
  );
}
