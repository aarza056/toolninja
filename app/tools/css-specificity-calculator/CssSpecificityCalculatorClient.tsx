"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { computeSpecificity, specificityToString, compareSpecificity } from "@/lib/css-specificity";
import { Trophy, Gauge, Zap } from "lucide-react";

const STORAGE_KEY = "toolninja:css-specificity-calculator";

const EXAMPLE = `#nav .item:hover
.nav-item.active
nav ul li a
div:not(.foo, #bar)
* html body`;

export default function CssSpecificityCalculatorClient() {
  const [input, setInput] = useState("");
  const [important, setImportant] = useState<Record<number, boolean>>({});

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

  const rows = useMemo(() => {
    const selectors = input.split("\n").map((s) => s.trim()).filter(Boolean);
    const computed = selectors.map((selector, i) => ({
      selector,
      specificity: computeSpecificity(selector),
      important: !!important[i],
    }));

    // !important overrides specificity entirely — among several !important rules, specificity
    // still breaks the tie between them; a single non-important rule never beats any !important one.
    const candidates = computed.some((r) => r.important) ? computed.filter((r) => r.important) : computed;
    const maxSpecificity = candidates.reduce(
      (max, r) => (compareSpecificity(r.specificity, max) > 0 ? r.specificity : max),
      { ids: 0, classes: 0, types: 0 }
    );
    const winnerIsImportant = candidates.some((r) => r.important);

    return computed.map((r) => ({
      ...r,
      isWinner:
        computed.length > 1 &&
        r.important === winnerIsImportant &&
        compareSpecificity(r.specificity, maxSpecificity) === 0,
    }));
  }, [input, important]);

  const toggleImportant = (i: number) => setImportant((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <ToolLayout
      title="CSS Specificity Calculator"
      description="Calculate and compare the specificity of CSS selectors"
    >
      <div className="mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">
          CSS Selectors (one per line — enter two or more to compare which wins)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"#nav .item:hover\n.nav-item.active\nnav ul li a"}
          rows={6}
          spellCheck={false}
          className="w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
      </div>

      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-3 p-3 rounded-[8px] border ${
                row.isWinner
                  ? "bg-[#22c55e]/10 border-[#22c55e]/30"
                  : "bg-[#111111] border-[#222222]"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {row.isWinner ? (
                  <Trophy size={14} className="text-[#22c55e] shrink-0" />
                ) : (
                  <Gauge size={14} className="text-[#555555] shrink-0" />
                )}
                <code className="text-sm text-[#f5f5f5] truncate">{row.selector}</code>
                {row.important && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-[#f97316]/15 text-[#f97316] border border-[#f97316]/30 font-semibold tracking-wider shrink-0">
                    !IMPORTANT
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => toggleImportant(i)}
                  title="Toggle !important on this selector"
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded-[6px] border transition-colors ${
                    row.important
                      ? "bg-[#f97316]/15 border-[#f97316]/40 text-[#f97316]"
                      : "bg-[#1a1a1a] border-[#222222] text-[#555555] hover:text-[#888888]"
                  }`}
                >
                  <Zap size={11} /> !important
                </button>
                <span className="text-xs text-[#555555] hidden sm:inline">
                  {row.specificity.ids} id{row.specificity.ids !== 1 ? "s" : ""} · {row.specificity.classes} class{row.specificity.classes !== 1 ? "es" : ""}/attr/pseudo-class · {row.specificity.types} element{row.specificity.types !== 1 ? "s" : ""}
                </span>
                <span
                  className={`font-mono text-sm font-semibold px-2 py-0.5 rounded-[6px] ${
                    row.isWinner ? "text-[#22c55e] bg-[#22c55e]/10" : "text-[#a855f7] bg-[#a855f7]/10"
                  }`}
                >
                  {specificityToString(row.specificity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        Specificity is shown as (IDs, classes/attributes/pseudo-classes, elements/pseudo-elements) — compared
        left to right, so any ID beats any number of classes, and any class beats any number of elements.
        Toggle <code className="text-[#e879f9]">!important</code> on a selector above to see it override
        specificity entirely — any <code className="text-[#e879f9]">!important</code> rule beats every
        non-important one regardless of specificity, with specificity only breaking ties among multiple{" "}
        <code className="text-[#e879f9]">!important</code> rules. Inline{" "}
        <code className="text-[#e879f9]">style=&quot;&quot;</code> attributes aren&apos;t represented here.{" "}
        <code className="text-[#e879f9]">:where()</code> always contributes zero;{" "}
        <code className="text-[#e879f9]">:not()</code>, <code className="text-[#e879f9]">:is()</code>, and{" "}
        <code className="text-[#e879f9]">:has()</code> contribute the specificity of their most specific
        argument.
      </div>
    </ToolLayout>
  );
}
