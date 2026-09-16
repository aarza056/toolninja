"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { checkTs7Migration } from "@/lib/ts7-migration";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";

const STORAGE_KEY = "toolninja:ts7-migration-checker";

const EXAMPLE = `{
  "compilerOptions": {
    "target": "es5",
    "module": "umd",
    "importsNotUsedAsValues": "remove",
    "strict": true,
    "esModuleInterop": true
  }
}`;

export default function Ts7MigrationCheckerClient() {
  const [input, setInput] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setInput(saved ?? EXAMPLE);
    } catch {
      setInput(EXAMPLE);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const { findings, parseError } = useMemo(() => checkTs7Migration(input), [input]);

  return (
    <ToolLayout
      title="TypeScript 7 Migration Checker"
      description="Paste a tsconfig.json and see exactly which compiler options TypeScript 7's Go-based compiler removes"
    >
      <div className="mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">tsconfig.json</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your tsconfig.json…"
          rows={14}
          spellCheck={false}
          className={`w-full p-3 font-mono text-xs resize-y bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${parseError ? "border-[#ef4444]" : "border-[#222222]"}`}
        />
        {parseError && (
          <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
            <AlertCircle size={12} /> {parseError}
          </div>
        )}
      </div>

      {!parseError && input.trim() && (
        <div className="space-y-2">
          {findings.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-[8px] text-sm text-[#22c55e]">
              <CheckCircle size={16} className="shrink-0" />
              No removed-in-TypeScript-7 options found in this config.
            </div>
          ) : (
            findings.map((f, i) => (
              <div key={i} className="p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px]">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <AlertTriangle size={13} className="text-[#ef4444] shrink-0" />
                  <span className="text-[#ef4444] font-semibold">{f.option}</span>
                  <span className="text-[#888888]">: {JSON.stringify(f.value)}</span>
                </div>
                <p className="text-xs text-[#cccccc] leading-relaxed mt-1.5">{f.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        Checks against the compiler options TypeScript 7&apos;s Go-based compiler (Project Corsa, package name
        typescript-go/tsgo) turns from a 6.0 deprecation warning into a hard build error: removed{" "}
        <code className="text-[#e879f9]">target</code> values (es3/es5 — ES2015 is now the floor), removed{" "}
        <code className="text-[#e879f9]">module</code> values (amd/umd/systemjs/none), and the flag options
        keyofStringsOnly, importsNotUsedAsValues, out, prepend, charset, and noStrictGenericChecks. This
        doesn&apos;t replace a real <code className="text-[#e879f9]">tsc</code> run — it just surfaces the
        known removals instantly, without installing anything.
      </div>
    </ToolLayout>
  );
}
