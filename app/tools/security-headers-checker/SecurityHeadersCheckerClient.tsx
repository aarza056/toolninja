"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { CheckCircle2, XCircle, AlertTriangle, Info, Wrench } from "lucide-react";
import { analyzeHeaders, buildFixSnippet, type HeaderSeverity, type FixSnippetFormat } from "@/lib/security-headers";

const FORMATS: { id: FixSnippetFormat; label: string }[] = [
  { id: "nginx", label: "Nginx" },
  { id: "express", label: "Express" },
  { id: "apache", label: "Apache" },
];

const STORAGE_KEY = "toolninja:security-headers-checker";

const SAMPLE = `HTTP/1.1 200 OK
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Referrer-Policy: no-referrer
Cache-Control: no-store`;

const SEVERITY_META: Record<HeaderSeverity, { label: string; color: string }> = {
  critical: { label: "Critical", color: "text-[#ef4444]" },
  recommended: { label: "Recommended", color: "text-[#f59e0b]" },
  info: { label: "Info", color: "text-[#3b82f6]" },
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-[#22c55e]";
  if (score >= 50) return "text-[#f59e0b]";
  return "text-[#ef4444]";
}

export default function SecurityHeadersCheckerClient() {
  const [input, setInput] = useState("");
  const [showFix, setShowFix] = useState(false);
  const [fixFormat, setFixFormat] = useState<FixSnippetFormat>("nginx");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setInput(saved ?? SAMPLE);
    } catch {
      setInput(SAMPLE);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const report = useMemo(() => (input.trim() ? analyzeHeaders(input) : null), [input]);
  const fixSnippet = useMemo(() => (report ? buildFixSnippet(report.checks, fixFormat) : ""), [report, fixFormat]);

  return (
    <ToolLayout
      title="HTTP Security Headers Checker"
      description="Paste raw response headers and check them against HSTS, CSP, X-Frame-Options, and more"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">Raw response headers</label>
            <button onClick={() => setInput(SAMPLE)} className="text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors">
              Load example
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Paste headers, one per line — e.g. from curl -I or DevTools' Network tab:\n\nStrict-Transport-Security: max-age=63072000\nContent-Security-Policy: default-src 'self'\n..."}
            spellCheck={false}
            rows={20}
            className="w-full p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] resize-none"
          />
          <p className="text-xs text-[#555555] mt-2">
            Get real headers with <code className="text-[#888888]">curl -I https://example.com</code>, or copy them from your browser&apos;s Network tab (click a request → Headers → Response Headers).
          </p>
        </div>

        <div>
          {report && (
            <>
              <div className="flex items-center gap-4 p-4 bg-[#111111] border border-[#222222] rounded-[8px] mb-4">
                <div className={`text-3xl font-bold font-mono ${scoreColor(report.score)}`}>{report.score}</div>
                <div>
                  <p className="text-sm text-[#f5f5f5]">Security header score</p>
                  {report.criticalMissing > 0 ? (
                    <p className="text-xs text-[#ef4444]">{report.criticalMissing} critical header{report.criticalMissing !== 1 ? "s" : ""} missing</p>
                  ) : (
                    <p className="text-xs text-[#22c55e]">No critical headers missing</p>
                  )}
                </div>
              </div>

              {fixSnippet && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowFix((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors mb-2"
                  >
                    <Wrench size={12} /> {showFix ? "Hide" : "Generate"} fix snippet for missing/misconfigured headers
                  </button>
                  {showFix && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
                          {FORMATS.map((f) => (
                            <button
                              key={f.id}
                              onClick={() => setFixFormat(f.id)}
                              className={`px-2.5 py-1 text-xs transition-colors ${fixFormat === f.id ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                        <CopyButton text={fixSnippet} size="sm" />
                      </div>
                      <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto max-h-[200px]">
                        {fixSnippet}
                      </pre>
                      <p className="text-[10px] text-[#555555] mt-1.5">
                        Generic recommended values — especially review the Content-Security-Policy
                        value before using it, since the right CSP depends entirely on what your
                        specific page actually loads.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {report.checks.map((check) => {
                  const meta = SEVERITY_META[check.severity];
                  const isGood = check.present && check.message === "Present and looks correctly configured.";
                  const Icon = !check.present ? XCircle : isGood ? CheckCircle2 : AlertTriangle;
                  const iconColor = !check.present ? "text-[#ef4444]" : isGood ? "text-[#22c55e]" : "text-[#f59e0b]";
                  return (
                    <div key={check.name} className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={14} className={iconColor} />
                        <code className="text-xs font-mono font-semibold text-[#f5f5f5]">{check.name}</code>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-[3px] bg-black/30 uppercase tracking-wide ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      {check.value && (
                        <code className="block text-[10px] font-mono text-[#666666] mb-1 break-all">{check.value}</code>
                      )}
                      <p className="text-xs text-[#888888]">{check.message}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!report && (
            <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px] text-sm flex flex-col items-center gap-2">
              <Info size={24} strokeWidth={1} />
              Paste response headers to see the analysis
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
