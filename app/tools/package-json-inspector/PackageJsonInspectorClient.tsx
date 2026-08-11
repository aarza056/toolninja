"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import { AlertTriangle, ShieldAlert, Info, CheckCircle2 } from "lucide-react";
import { inspectPackageJson, type ScriptRisk } from "@/lib/package-json-inspector";

const STORAGE_KEY = "toolninja:package-json-inspector";

const RISK_STYLE: Record<ScriptRisk, { badge: string; icon: typeof ShieldAlert }> = {
  high: { badge: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30", icon: ShieldAlert },
  medium: { badge: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30", icon: AlertTriangle },
  info: { badge: "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30", icon: Info },
};

const SAMPLE = `{
  "name": "example-app",
  "version": "1.0.0",
  "scripts": {
    "preinstall": "node setup.mjs",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "left-pad": "^1.3.0",
    "some-lib": "*",
    "internal-pkg": "git+https://github.com/example/internal-pkg.git",
    "react": "18.2.0"
  }
}`;

export default function PackageJsonInspectorClient() {
  const [input, setInput] = useState("");

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

  const result = useMemo(() => (input.trim() ? inspectPackageJson(input) : null), [input]);

  const highRiskCount = result?.lifecycleScripts.filter((s) => s.risk === "high").length ?? 0;

  return (
    <ToolLayout
      title="package.json Script Inspector"
      description="Paste a package.json and see exactly which scripts run automatically on install, and which dependencies aren't pinned"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">package.json</label>
            <button onClick={() => setInput(SAMPLE)} className="text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors">
              Load example
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your package.json here…"
            spellCheck={false}
            rows={22}
            className="w-full p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] resize-none"
          />
        </div>

        <div className="space-y-4">
          {result && !result.valid && (
            <div className="p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px] text-sm text-[#ef4444]">
              {result.error}
            </div>
          )}

          {result && result.valid && (
            <>
              <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                <div className="flex items-center gap-2">
                  {highRiskCount > 0 ? (
                    <ShieldAlert size={16} className="text-[#ef4444]" />
                  ) : (
                    <CheckCircle2 size={16} className="text-[#22c55e]" />
                  )}
                  <p className="text-sm text-[#f5f5f5]">
                    {highRiskCount > 0
                      ? `${highRiskCount} lifecycle script${highRiskCount !== 1 ? "s" : ""} that run automatically on install`
                      : "No high-risk auto-running lifecycle scripts found"}
                  </p>
                </div>
                {result.packageName && <p className="text-xs text-[#555555] mt-1">Package: {result.packageName}</p>}
              </div>

              <div>
                <label className="text-xs text-[#888888] font-medium block mb-2">Lifecycle scripts</label>
                {result.lifecycleScripts.length === 0 ? (
                  <p className="text-xs text-[#555555]">None found.</p>
                ) : (
                  <div className="space-y-2">
                    {result.lifecycleScripts.map((s) => {
                      const style = RISK_STYLE[s.risk];
                      const Icon = style.icon;
                      return (
                        <div key={s.name} className={`p-3 rounded-[8px] border ${style.badge}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Icon size={13} />
                            <code className="text-xs font-mono font-semibold">{s.name}</code>
                            {s.autoRuns && <span className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-black/20 uppercase tracking-wide">Auto-runs</span>}
                          </div>
                          <code className="block text-xs font-mono text-[#f5f5f5] bg-black/20 rounded-[4px] px-2 py-1 mb-1.5 break-all">{s.command}</code>
                          <p className="text-xs opacity-90">{s.note}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {result.looseDependencies.length > 0 && (
                <div>
                  <label className="text-xs text-[#888888] font-medium block mb-2">
                    Unpinned dependencies ({result.looseDependencies.length} of {result.totalDependencies})
                  </label>
                  <div className="space-y-1.5">
                    {result.looseDependencies.map((d) => (
                      <div key={d.name} className="flex items-start gap-2 p-2 bg-[#111111] border border-[#222222] rounded-[6px]">
                        <code className="text-xs font-mono text-[#f5f5f5] shrink-0">{d.name}</code>
                        <code className="text-xs font-mono text-[#888888] shrink-0">{d.version}</code>
                        {d.note && <p className="text-[10px] text-[#555555] ml-auto text-right">{d.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!result && (
            <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px] text-sm">
              Paste a package.json to inspect its lifecycle scripts and dependency pinning
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
