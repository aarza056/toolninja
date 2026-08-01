"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { CSP_DIRECTIVES, CSP_KEYWORDS, buildCsp, analyzeCsp, type CspWarning } from "@/lib/csp-builder";

const STORAGE_KEY = "toolninja:csp-builder";
type Mode = "build" | "analyze";

const SEVERITY_META: Record<CspWarning["severity"], { color: string; bg: string; icon: typeof AlertCircle; label: string }> = {
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: AlertCircle, label: "High" },
  medium: { color: "#f97316", bg: "rgba(249,115,22,0.1)", icon: AlertTriangle, label: "Medium" },
  low: { color: "#eab308", bg: "rgba(234,179,8,0.1)", icon: Info, label: "Low" },
};

export default function CspBuilderClient() {
  const [mode, setMode] = useState<Mode>("build");
  const [directives, setDirectives] = useState<Record<string, string>>({
    "default-src": "'self'",
    "script-src": "'self'",
    "style-src": "'self'",
    "img-src": "'self' data:",
    "object-src": "'none'",
    "base-uri": "'self'",
    "frame-ancestors": "'self'",
  });
  const [upgradeInsecure, setUpgradeInsecure] = useState(true);
  const [pastedCsp, setPastedCsp] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.directives) setDirectives(parsed.directives);
        if (parsed.upgradeInsecure !== undefined) setUpgradeInsecure(parsed.upgradeInsecure);
        if (parsed.pastedCsp) setPastedCsp(parsed.pastedCsp);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ directives, upgradeInsecure, pastedCsp })); } catch {}
  }, [directives, upgradeInsecure, pastedCsp]);

  const updateDirective = (key: string, value: string) => {
    setDirectives((prev) => ({ ...prev, [key]: value }));
  };

  const addKeyword = (key: string, keyword: string) => {
    setDirectives((prev) => {
      const current = prev[key] ?? "";
      if (current.includes(keyword)) return prev;
      return { ...prev, [key]: (current ? current + " " : "") + keyword };
    });
  };

  const cspString = useMemo(() => buildCsp(directives, upgradeInsecure), [directives, upgradeInsecure]);
  const metaTag = `<meta http-equiv="Content-Security-Policy" content="${cspString}">`;
  const headerLine = `Content-Security-Policy: ${cspString}`;

  const warnings = useMemo(() => analyzeCsp(pastedCsp), [pastedCsp]);
  const parsedForAnalysis = useMemo(() => {
    const result: Record<string, string[]> = {};
    pastedCsp.split(";").map((s) => s.trim()).filter(Boolean).forEach((part) => {
      const [key, ...values] = part.split(/\s+/);
      if (key) result[key] = values;
    });
    return result;
  }, [pastedCsp]);

  return (
    <ToolLayout title="CSP Header Builder & Analyzer" description="Build a Content-Security-Policy header visually, or paste one to check for unsafe directives">
      {/* Mode tabs */}
      <div className="flex rounded-[6px] border border-[#222222] overflow-hidden mb-4 w-fit">
        <button
          onClick={() => setMode("build")}
          className={`px-4 py-2 text-sm transition-colors ${mode === "build" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
        >
          Build
        </button>
        <button
          onClick={() => setMode("analyze")}
          className={`px-4 py-2 text-sm border-l border-[#222222] transition-colors ${mode === "analyze" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
        >
          Analyze
        </button>
      </div>

      {mode === "build" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            {CSP_DIRECTIVES.map((d) => (
              <div key={d.key}>
                <div className="flex items-baseline justify-between mb-1">
                  <label className="text-xs text-[#888888] font-medium">{d.label}</label>
                  <span className="text-[10px] text-[#555555] font-mono">{d.key}</span>
                </div>
                <input
                  type="text"
                  value={directives[d.key] ?? ""}
                  onChange={(e) => updateDirective(d.key, e.target.value)}
                  placeholder={d.desc}
                  spellCheck={false}
                  className="w-full px-3 py-1.5 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] mb-1"
                />
                <div className="flex flex-wrap gap-1">
                  {CSP_KEYWORDS.map((kw) => (
                    <button
                      key={kw}
                      onClick={() => addKeyword(d.key, kw)}
                      className="px-1.5 py-0.5 text-[10px] font-mono bg-[#1a1a1a] hover:bg-[#222222] text-[#666666] hover:text-[#a855f7] border border-[#222222] rounded transition-colors"
                    >
                      +{kw}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm text-[#888888] pt-2">
              <input type="checkbox" checked={upgradeInsecure} onChange={(e) => setUpgradeInsecure(e.target.checked)} className="accent-[#a855f7]" />
              upgrade-insecure-requests
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#888888] font-medium">HTTP Header</label>
                <CopyButton text={headerLine} size="sm" />
              </div>
              <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto whitespace-pre-wrap break-all">
                {headerLine}
              </pre>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#888888] font-medium">HTML &lt;meta&gt; tag</label>
                <CopyButton text={metaTag} size="sm" />
              </div>
              <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto whitespace-pre-wrap break-all">
                {metaTag}
              </pre>
              <p className="mt-1.5 text-xs text-[#555555]">
                Note: frame-ancestors, report-uri, and sandbox are ignored when set via &lt;meta&gt; — use the HTTP header for those.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Paste an existing CSP</label>
            <textarea
              value={pastedCsp}
              onChange={(e) => setPastedCsp(e.target.value)}
              placeholder="default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'"
              rows={6}
              spellCheck={false}
              className="w-full p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
            {Object.keys(parsedForAnalysis).length > 0 && (
              <div className="mt-3 space-y-1">
                {Object.entries(parsedForAnalysis).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs font-mono">
                    <span className="text-[#a855f7] shrink-0">{k}</span>
                    <span className="text-[#888888] break-all">{v.join(" ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-2">
              {pastedCsp.trim() ? `${warnings.length} issue${warnings.length !== 1 ? "s" : ""} found` : "Findings"}
            </label>
            {!pastedCsp.trim() ? (
              <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
                Paste a CSP header to check it for unsafe directives
              </div>
            ) : warnings.length === 0 ? (
              <div className="flex items-center gap-2 p-4 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-[8px] text-[#22c55e] text-sm">
                <CheckCircle2 size={16} />
                No common issues found in this policy.
              </div>
            ) : (
              <div className="space-y-2">
                {warnings.map((w, i) => {
                  const meta = SEVERITY_META[w.severity];
                  const Icon = meta.icon;
                  return (
                    <div key={i} className="p-3 rounded-[8px] border" style={{ borderColor: meta.color + "33", background: meta.bg }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={13} style={{ color: meta.color }} />
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#888888] leading-relaxed">{w.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
