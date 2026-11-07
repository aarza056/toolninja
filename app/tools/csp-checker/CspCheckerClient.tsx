"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { checkCsp, splitPolicies, type CspReport, type CspSeverity } from "@/lib/csp-check";

const STORAGE_KEY = "toolninja:csp-checker";
const EXAMPLE = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src * data:";

const field = "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

const SEVERITY: Record<CspSeverity, { label: string; tone: string }> = {
  high: { label: "High", tone: "text-[#f87171] border-[#f87171]/30" },
  medium: { label: "Medium", tone: "text-[#fbbf24] border-[#fbbf24]/30" },
  low: { label: "Low", tone: "text-[#60a5fa] border-[#60a5fa]/30" },
  info: { label: "Note", tone: "text-[#888888] border-[#444444]" },
};

const GRADE_TONE: Record<CspReport["grade"], string> = { A: "text-[#4ade80]", B: "text-[#86efac]", C: "text-[#fbbf24]", D: "text-[#fb923c]", F: "text-[#f87171]" };

interface Fetched {
  finalUrl: string;
  status: number;
  reports: CspReport[];
}

function Report({ report, label }: { report: CspReport; label?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 p-4 bg-[#111111] border border-[#222222] rounded-[8px]">
        <p className={`text-4xl font-bold ${GRADE_TONE[report.grade]}`}>{report.grade}</p>
        <div className="min-w-0">
          <p className="text-sm text-[#f5f5f5]">{report.score} out of 100</p>
          <p className="text-xs text-[#888888]">
            {label ? `${label} · ` : ""}
            {report.directives.length} directive{report.directives.length === 1 ? "" : "s"} · {report.findings.filter((f) => f.severity !== "info").length} issue{report.findings.filter((f) => f.severity !== "info").length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {report.findings.length > 0 && (
        <ul className="space-y-2">
          {report.findings.map((f, i) => (
            <li key={i} className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-1.5 py-0.5 text-[11px] border rounded ${SEVERITY[f.severity].tone}`}>{SEVERITY[f.severity].label}</span>
                <span className="text-sm text-[#f5f5f5]">{f.title}</span>
              </div>
              <p className="text-xs text-[#999999] mt-1.5">{f.detail}</p>
              {f.fix && <p className="text-xs text-[#c084fc] mt-1">{f.fix}</p>}
            </li>
          ))}
        </ul>
      )}

      {report.passes.length > 0 && (
        <ul className="space-y-1">
          {report.passes.map((p) => (
            <li key={p} className="flex items-start gap-2 text-xs text-[#86efac]">
              <Check size={13} className="mt-0.5 shrink-0" /> {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CspCheckerClient() {
  const [input, setInput] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const [missing, setMissing] = useState<{ finalUrl: string; status: number } | null>(null);

  useEffect(() => {
    try {
      setInput(localStorage.getItem(STORAGE_KEY) || EXAMPLE);
    } catch {
      setInput(EXAMPLE);
    }
  }, []);
  useEffect(() => {
    if (!input) return;
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const pasted = useMemo(() => splitPolicies(input.replace(/^content-security-policy(-report-only)?\s*:\s*/i, "")).map((p) => checkCsp(p, { reportOnly: /^content-security-policy-report-only/i.test(input.trim()) })), [input]);

  const check = async () => {
    setBusy(true);
    setError("");
    setFetched(null);
    setMissing(null);
    try {
      const res = await fetch("/api/check-headers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, preload: false }) });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Couldn't check that URL.");
        return;
      }
      const headers = data.headers as [string, string][];
      const all = (name: string) => headers.filter(([k]) => k.toLowerCase() === name).flatMap(([, v]) => splitPolicies(v));
      const hasFrameOptions = headers.some(([k]) => k.toLowerCase() === "x-frame-options");
      const enforced = all("content-security-policy").map((p) => checkCsp(p, { hasFrameOptions }));
      const reportOnly = all("content-security-policy-report-only").map((p) => checkCsp(p, { hasFrameOptions, reportOnly: true }));
      const reports = [...enforced, ...reportOnly];
      if (!reports.length) setMissing({ finalUrl: data.finalUrl, status: data.status });
      else setFetched({ finalUrl: data.finalUrl, status: data.status, reports });
    } catch {
      setError("Couldn't reach the checker. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout title="CSP Checker" description="Paste a Content-Security-Policy or enter a URL to find unsafe-inline, wildcards and missing directives, with a score and a fix for each">
      <div className="space-y-6 max-w-4xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim() && !busy) check();
          }}
          className="flex flex-wrap gap-2"
        >
          <input aria-label="URL to check" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" spellCheck={false} className={`${field} flex-1 min-w-[240px] font-mono`} />
          <button type="submit" disabled={busy || !url.trim()} className="px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-[8px]">
            {busy ? "Checking…" : "Check URL"}
          </button>
        </form>
        {error && <p className="text-sm text-[#f87171]">{error}</p>}

        {missing && (
          <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px]">
            <p className="text-sm text-[#f5f5f5]">
              <span className="text-[#f87171] font-medium">No Content-Security-Policy header</span> on <span className="font-mono break-all">{missing.finalUrl}</span> ({missing.status}).
            </p>
            <p className="text-xs text-[#888888] mt-1">This looks at response headers only, so a policy in a &lt;meta&gt; tag won&apos;t show here. Paste it below to check it. To write one, start with the <Link href="/tools/csp-builder" className="text-[#a855f7] hover:underline">CSP Builder</Link>.</p>
          </div>
        )}

        {fetched && (
          <div className="space-y-4">
            <p className="text-xs text-[#888888]">
              <span className="font-mono text-[#bbbbbb] break-all">{fetched.finalUrl}</span> returned {fetched.status}
              {fetched.reports.length > 1 ? ` and ${fetched.reports.length} policies. A browser enforces all of them, so a resource has to pass each one.` : "."}
            </p>
            {fetched.reports.map((r, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <pre className="flex-1 min-w-0 p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#bbbbbb] whitespace-pre-wrap break-all">{r.policy}</pre>
                  <CopyButton text={r.policy} size="sm" />
                </div>
                <Report report={r} label={fetched.reports.length > 1 ? `Policy ${i + 1}` : undefined} />
              </div>
            ))}
          </div>
        )}

        <div>
          <label htmlFor="csp-input" className="text-xs text-[#888888] font-medium block mb-1">
            Or paste a policy
          </label>
          <textarea id="csp-input" value={input} onChange={(e) => setInput(e.target.value)} rows={5} spellCheck={false} className={`${field} w-full font-mono !text-xs`} />
        </div>

        {pasted.length > 1 && <p className="text-xs text-[#888888]">{pasted.length} policies, separated by commas. A browser enforces all of them.</p>}
        <div className="space-y-6">
          {pasted.map((r, i) => (
            <Report key={i} report={r} label={pasted.length > 1 ? `Policy ${i + 1}` : undefined} />
          ))}
        </div>

        <p className="text-xs text-[#666666]">
          Pasted policies are checked in your browser and never sent anywhere. Check URL asks our server to request that page once and read its headers. Scores are this tool&apos;s own guide, not a standard. See every response header in the <Link href="/tools/security-headers-checker" className="text-[#a855f7] hover:underline">Security Headers Checker</Link>.
        </p>
      </div>
    </ToolLayout>
  );
}
