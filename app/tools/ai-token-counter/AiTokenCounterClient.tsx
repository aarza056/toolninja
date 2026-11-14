"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import ToolLayout from "@/components/ToolLayout";
import { Trash2, Info, FileText, Upload, X, Lock } from "lucide-react";
import Link from "next/link";
import { modelPricing, estimateTokens, estimateCost } from "@/lib/token-counter";
import { PRICES_CHECKED, PRICING_SOURCES, today, type Provider } from "@/lib/llm-pricing";
import type { ExtractedFile } from "@/lib/file-text";

interface CountedFile extends ExtractedFile {
  tokens: number;
  words: number;
  characters: number;
}

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

interface Props {
  /** Show one provider's models first (the /tools/ai-token-counter/<provider> pages) */
  provider?: Provider;
  heading?: string;
  intro?: string;
}

export default function AiTokenCounterClient({ provider, heading, intro }: Props = {}) {
  const [input, setInput] = useState("");
  const [outputRatio, setOutputRatio] = useState(1); // assumed output tokens, as a multiple of input
  // Files are counted in the browser and kept only in memory, never saved or sent
  const [files, setFiles] = useState<CountedFile[]>([]);
  const [reading, setReading] = useState("");
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const addFiles = async (list: FileList | File[]) => {
    setFileError("");
    const picked = Array.from(list).slice(0, 20);
    setReading("Opening…");
    // Loaded on first use, so the file readers cost nothing until someone opens a file
    let extractText: typeof import("@/lib/file-text").extractText;
    try {
      ({ extractText } = await import("@/lib/file-text"));
    } catch {
      setReading("");
      setFileError("Couldn't load the file reader. Check your connection and try again.");
      return;
    }
    for (const file of picked) {
      setReading(`Reading ${file.name}…`);
      try {
        const r = await extractText(file, (done, total) => setReading(`Reading ${file.name}: page ${done} of ${total}…`));
        const e = estimateTokens(r.text);
        setFiles((prev) => [...prev, { ...r, ...e }]);
      } catch (err) {
        setFileError(err instanceof Error ? err.message : `Couldn't read ${file.name}.`);
      }
    }
    setReading("");
  };

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

  const textEstimate = useMemo(() => estimateTokens(input), [input]);
  const estimate = useMemo(
    () => files.reduce((sum, f) => ({ tokens: sum.tokens + f.tokens, words: sum.words + f.words, characters: sum.characters + f.characters }), textEstimate),
    [files, textEstimate]
  );
  const assumedOutputTokens = Math.round(estimate.tokens * outputRatio);
  // Priced on the visitor's date, so announced price changes apply on time; the page's provider first
  const models = useMemo(() => {
    const all = modelPricing(today());
    return provider ? [...all.filter((m) => m.provider === provider), ...all.filter((m) => m.provider !== provider)] : all;
  }, [provider]);

  return (
    <ToolLayout
      title={heading ?? "AI Token Counter & Cost Estimator"}
      description={intro ?? "Estimate how many tokens your prompt costs, and what it'd run across Claude, GPT, and Gemini"}
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

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            className={`mt-3 p-3 border border-dashed rounded-[8px] text-xs transition-colors ${dragging ? "border-[#a855f7] bg-[#a855f7]/5" : "border-[#2a2a2a]"}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => fileInput.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#2a2a2a] text-[#d4d4d4] hover:border-[#a855f7]">
                <Upload size={13} /> Count tokens in files
              </button>
              <span className="text-[#777777]">PDF, Word, PowerPoint, OpenDocument, Markdown, CSV, JSON or code. Drop them here.</span>
              <input
                ref={fileInput}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.docx,.pptx,.odt,.odp,.txt,.md,.csv,.tsv,.json,.jsonl,.xml,.html,.htm,.js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.rb,.php,.cs,.c,.cpp,.h,.sql,.yaml,.yml,.toml,.log,.srt,.vtt,.ipynb,text/*"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            <p className="flex items-center gap-1.5 mt-2 text-[#666666]">
              <Lock size={11} className="text-[#4ade80]" /> Files are read in your browser and never uploaded.
            </p>
            {reading && <p className="mt-2 text-[#a855f7]">{reading}</p>}
            {fileError && <p className="mt-2 text-[#f87171]">{fileError}</p>}
            {files.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {files.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <FileText size={13} className="text-[#888888] mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[#d4d4d4] break-all">{f.name}</span>
                        <span className="font-mono text-[#a855f7]">~{f.tokens.toLocaleString()} tokens</span>
                        <span className="text-[#666666]">
                          {f.words.toLocaleString()} words{f.pages ? ` · ${f.pages} ${f.kind === "pptx" ? "slide" : "page"}${f.pages === 1 ? "" : "s"}` : ""}
                        </span>
                      </div>
                      {f.note && <p className="text-[#fbbf24] mt-0.5">{f.note}</p>}
                    </div>
                    <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-[#666666] hover:text-[#ef4444]">
                      <X size={13} />
                    </button>
                  </li>
                ))}
                {files.length > 1 || input.trim() ? (
                  <li className="text-[#888888] pt-1 border-t border-[#1f1f1f]">
                    Total with {input.trim() ? "the text above" : "all files"}: <span className="font-mono text-[#f5f5f5]">~{estimate.tokens.toLocaleString()} tokens</span>
                  </li>
                ) : null}
              </ul>
            )}
            {files.some((f) => f.kind === "pdf") && (
              <p className="mt-2 text-[#666666]">
                This counts the PDF&apos;s text. Sending the PDF file itself costs more: Claude and Gemini also look at each page as an image, which is billed on top.
              </p>
            )}
          </div>

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
              {models.map((m) => {
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
            Standard list prices from the{" "}
            <a href={PRICING_SOURCES.Anthropic} target="_blank" rel="noopener noreferrer" className="text-[#a855f7] hover:underline">Anthropic</a>,{" "}
            <a href={PRICING_SOURCES.OpenAI} target="_blank" rel="noopener noreferrer" className="text-[#a855f7] hover:underline">OpenAI</a> and{" "}
            <a href={PRICING_SOURCES.Google} target="_blank" rel="noopener noreferrer" className="text-[#a855f7] hover:underline">Google</a> pricing pages, checked {PRICES_CHECKED}. For a monthly budget with caching and batch discounts, use the{" "}
            <Link href="/tools/llm-api-cost-calculator" className="text-[#a855f7] hover:underline">LLM API Cost Calculator</Link>.
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
