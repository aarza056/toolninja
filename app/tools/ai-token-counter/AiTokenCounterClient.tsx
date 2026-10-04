"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { Trash2, Info } from "lucide-react";
import { MODEL_PRICING, estimateTokens, estimateCost } from "@/lib/token-counter";

const STORAGE_KEY = "toolninja:ai-token-counter";

function formatCost(n: number): string {
  if (n === 0) return "$0.00";
  if (n < 0.01) return `$${n.toFixed(5)}`;
  return `$${n.toFixed(4)}`;
}

const PROVIDER_COLORS: Record<string, string> = {
  Anthropic: "text-[#a855f7]",
  OpenAI: "text-[#22c55e]",
  Google: "text-[#3b82f6]",
};

export default function AiTokenCounterClient() {
  const [input, setInput] = useState("");
  const [outputRatio, setOutputRatio] = useState(1); // assumed output tokens, as a multiple of input

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const estimate = useMemo(() => estimateTokens(input), [input]);
  const assumedOutputTokens = Math.round(estimate.tokens * outputRatio);

  return (
    <ToolLayout
      title="AI Token Counter & Cost Estimator"
      description="Estimate how many tokens your prompt costs, and what it'd run across Claude, GPT, and Gemini"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">Text / prompt</label>
            {input && (
              <button
                onClick={() => setInput("")}
                className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#ef4444] transition-colors"
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a prompt, a document, or a system message…"
            className="w-full h-[calc(100vh-320px)] min-h-[300px] p-3 text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] leading-relaxed"
            spellCheck={true}
          />

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <div className="text-lg font-semibold text-[#a855f7] font-mono">~{estimate.tokens.toLocaleString()}</div>
              <div className="text-[11px] text-[#888888] mt-0.5">estimated tokens</div>
            </div>
            <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <div className="text-lg font-semibold text-[#f5f5f5] font-mono">{estimate.words.toLocaleString()}</div>
              <div className="text-[11px] text-[#888888] mt-0.5">words</div>
            </div>
            <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <div className="text-lg font-semibold text-[#f5f5f5] font-mono">{estimate.characters.toLocaleString()}</div>
              <div className="text-[11px] text-[#888888] mt-0.5">characters</div>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 text-xs text-[#555555]">
            <Info size={13} className="shrink-0 mt-0.5" />
            <span>
              This is a character/word-based approximation, not the real tokenizer each provider
              uses internally — expect it to land within roughly 10–15% of the actual count for
              plain English text. For an exact count against Claude&apos;s own tokenizer, use the
              Messages API&apos;s <code className="text-[#888888]">count_tokens</code> endpoint.
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[#888888] font-medium">Assumed output length</label>
              <span className="text-xs font-mono text-[#a855f7]">{assumedOutputTokens.toLocaleString()} tokens</span>
            </div>
            <input
              type="range"
              min={0}
              max={4}
              step={0.25}
              value={outputRatio}
              onChange={(e) => setOutputRatio(Number(e.target.value))}
              className="w-full accent-[#a855f7]"
            />
            <p className="text-[10px] text-[#555555] mt-1">
              {outputRatio.toFixed(2)}× your input length — drag to model a shorter reply or a long generated response.
            </p>
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-2">Estimated cost by model</label>
            <div className="space-y-2">
              {MODEL_PRICING.map((m) => {
                const cost = estimateCost(estimate.tokens, m.inputPer1M) + estimateCost(assumedOutputTokens, m.outputPer1M);
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                    <div className="min-w-0">
                      <div className="text-sm text-[#f5f5f5] truncate">{m.label}</div>
                      <div className={`text-[10px] ${PROVIDER_COLORS[m.provider] ?? "text-[#888888]"}`}>{m.provider}</div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-sm font-mono text-[#f5f5f5]">{formatCost(cost)}</div>
                      <div className="text-[10px] text-[#555555]">
                        ${m.inputPer1M}/${m.outputPer1M} per 1M
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
            Prices are approximate list rates as of October 2026 and change often — this is a
            ballpark for comparing models relatively, not a bill. Always check the provider&apos;s
            own pricing page before budgeting against it.
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
