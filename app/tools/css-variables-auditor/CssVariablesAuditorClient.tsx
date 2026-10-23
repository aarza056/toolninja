"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { AlertTriangle, CheckCircle2, Copy } from "lucide-react";
import { analyzeCssVariables } from "@/lib/css-variables";

const STORAGE_KEY = "toolninja:css-variables-auditor";

const SAMPLE = `:root {
  --color-primary: #a855f7;
  --color-bg: #0a0a0a;
  --spacing-sm: 8px;
  --spacing-md: 16px;
}

.card {
  background: var(--color-bg);
  color: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-card);
}

.button {
  --color-primary: #9333ea;
  padding: var(--spacing-sm) var(--spacing-md);
}
`;

function Pill({ text }: { text: string }) {
  const copy = () => navigator.clipboard.writeText(text).catch(() => {});
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono bg-[#111111] border border-[#222222] rounded-[4px] text-[#888888] hover:text-[#f5f5f5] hover:border-[#333333] transition-colors"
      title="Click to copy"
    >
      {text}
    </button>
  );
}

export default function CssVariablesAuditorClient() {
  const [css, setCss] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setCss(saved ?? SAMPLE);
    } catch {
      setCss(SAMPLE);
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, css); } catch {}
  }, [css]);

  const report = useMemo(() => (css.trim() ? analyzeCssVariables(css) : null), [css]);

  return (
    <ToolLayout title="CSS Custom Properties Auditor" description="Paste CSS and find every --token, its usage count, duplicates, and unused or undefined variables">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">CSS</label>
          <textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            spellCheck={false}
            className="w-full h-[520px] p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </div>

        <div className="space-y-4">
          {report && report.declarations.length === 0 && report.usages.length === 0 ? (
            <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
              No <code className="text-[#666666]">--custom-properties</code> found in this CSS
            </div>
          ) : report && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-center">
                  <div className="text-xl font-bold text-[#a855f7] font-mono">{new Set(report.declarations.map((d) => d.name)).size}</div>
                  <div className="text-[10px] text-[#888888] mt-0.5">declared</div>
                </div>
                <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-center">
                  <div className="text-xl font-bold text-[#f5f5f5] font-mono">{report.usages.length}</div>
                  <div className="text-[10px] text-[#888888] mt-0.5">used</div>
                </div>
                <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-center">
                  <div className={`text-xl font-bold font-mono ${report.unused.length + report.undefinedUsed.length > 0 ? "text-[#f59e0b]" : "text-[#22c55e]"}`}>
                    {report.unused.length + report.undefinedUsed.length}
                  </div>
                  <div className="text-[10px] text-[#888888] mt-0.5">issues</div>
                </div>
              </div>

              {report.undefinedUsed.length > 0 && (
                <div className="p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#ef4444] mb-2">
                    <AlertTriangle size={13} /> Used but never declared ({report.undefinedUsed.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.undefinedUsed.map((n) => <Pill key={n} text={n} />)}
                  </div>
                </div>
              )}

              {report.duplicates.length > 0 && (
                <div className="p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-[8px]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#f59e0b] mb-2">
                    <AlertTriangle size={13} /> Declared with different values more than once ({report.duplicates.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.duplicates.map((n) => <Pill key={n} text={n} />)}
                  </div>
                </div>
              )}

              {report.unused.length > 0 && (
                <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#888888] mb-2">
                    <Copy size={12} /> Declared but never used ({report.unused.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.unused.map((n) => <Pill key={n} text={n} />)}
                  </div>
                </div>
              )}

              {report.unused.length === 0 && report.undefinedUsed.length === 0 && report.duplicates.length === 0 && report.declarations.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-[8px] text-sm text-[#22c55e]">
                  <CheckCircle2 size={14} /> Every declared variable is used exactly once, consistently
                </div>
              )}

              <div>
                <label className="text-xs text-[#888888] font-medium block mb-2">All declarations</label>
                <div className="max-h-[260px] overflow-auto space-y-1.5 pr-1">
                  {report.declarations.map((d, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 bg-[#111111] border border-[#1a1a1a] rounded-[6px] text-xs">
                      <code className="text-[#a855f7] font-mono shrink-0">{d.name}</code>
                      <code className="text-[#888888] font-mono truncate flex-1 text-right">{d.value}</code>
                      <span className="text-[#444444] text-[10px] shrink-0 w-24 truncate text-right">{d.selector}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        Selector detection is best-effort — it reports the innermost rule a declaration sits in, not
        a full nesting/specificity chain (so a variable re-declared inside a media query shows its
        rule&apos;s selector, not the surrounding <code className="text-[#e879f9]">@media</code> condition).
        Good for spotting duplicate tokens and dead CSS variables quickly, not a substitute for a real
        CSS parser when that distinction matters.
      </div>
    </ToolLayout>
  );
}
