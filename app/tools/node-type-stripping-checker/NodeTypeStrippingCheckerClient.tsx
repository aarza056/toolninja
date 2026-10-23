"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { findTypeStrippingIssues } from "@/lib/node-type-stripping";
import { CheckCircle, AlertTriangle } from "lucide-react";

const STORAGE_KEY = "toolninja:node-type-stripping-checker";

const EXAMPLE = `enum Color {
  Red,
  Green,
  Blue,
}

class Point {
  constructor(private x: number, public y: number) {}
}

namespace Utils {
  export const VERSION = "1.0.0";
}

@Component({ selector: "app-root" })
class AppRoot {}
`;

const KIND_LABELS: Record<string, string> = {
  enum: "Enum",
  "parameter-property": "Parameter property",
  namespace: "Namespace / module",
  decorator: "Decorator",
};

export default function NodeTypeStrippingCheckerClient() {
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

  const findings = useMemo(() => findTypeStrippingIssues(input), [input]);

  return (
    <ToolLayout
      title="Node.js Type-Stripping Checker"
      description="Scan a TypeScript file for syntax Node's built-in type stripping can't run directly"
    >
      <div className="mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">TypeScript source</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a .ts file…"
          rows={16}
          spellCheck={false}
          className="w-full p-3 font-mono text-xs resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
      </div>

      {input.trim() && (
        <div className="space-y-2">
          {findings.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-[8px] text-sm text-[#22c55e]">
              <CheckCircle size={16} className="shrink-0" />
              No unsupported syntax found — this file should run with `node file.ts` as-is.
            </div>
          ) : (
            findings.map((f, i) => (
              <div key={i} className="p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-[8px]">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <AlertTriangle size={13} className="text-[#f59e0b] shrink-0" />
                  <span className="text-[#f59e0b] font-semibold">{KIND_LABELS[f.kind]}</span>
                  <span className="text-[#888888]">line {f.line} — {f.snippet}</span>
                </div>
                <p className="text-xs text-[#cccccc] leading-relaxed mt-1.5">{f.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        This is a heuristic scanner, not a real TypeScript parser — it can misread unusual formatting
        or code inside template literals. Treat findings as things worth a manual look, not a guaranteed
        pass/fail. Node&apos;s type stripping (on by default since Node 24, via the amaro/SWC-based
        transform) erases type-only syntax but performs zero type checking — always run{" "}
        <code className="text-[#e879f9]">tsc --noEmit</code> in CI regardless.
      </div>
    </ToolLayout>
  );
}
