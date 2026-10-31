"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import { LLM_MODELS, PRICES_CHECKED, PRICING_SOURCES, today, workloadCost, type Provider, type Workload } from "@/lib/llm-pricing";

const STORAGE_KEY = "toolninja:llm-api-cost-calculator";
const PROVIDERS: Provider[] = ["Anthropic", "OpenAI", "Google"];
const PROVIDER_COLORS: Record<Provider, string> = { Anthropic: "text-[#c084fc]", OpenAI: "text-[#4ade80]", Google: "text-[#60a5fa]" };

interface Form {
  requests: number;
  per: "day" | "month";
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  hitRate: number; // %
  batch: number; // %
  providers: Provider[];
}

const PRESETS: { label: string; form: Omit<Form, "providers"> }[] = [
  { label: "Support chatbot", form: { requests: 3000, per: "day", inputTokens: 6000, outputTokens: 400, cachedTokens: 4000, hitRate: 90, batch: 0 } },
  { label: "RAG answers", form: { requests: 1000, per: "day", inputTokens: 12000, outputTokens: 600, cachedTokens: 2000, hitRate: 80, batch: 0 } },
  { label: "Coding agent", form: { requests: 400, per: "day", inputTokens: 60000, outputTokens: 2500, cachedTokens: 50000, hitRate: 95, batch: 0 } },
  { label: "Nightly classification", form: { requests: 50000, per: "day", inputTokens: 800, outputTokens: 20, cachedTokens: 500, hitRate: 95, batch: 100 } },
];

const DEFAULT: Form = { ...PRESETS[0].form, providers: PROVIDERS };

function money(n: number): string {
  if (n === 0) return "$0";
  if (n >= 100) return `$${Math.round(n).toLocaleString("en-US")}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toPrecision(2)}`;
}

const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function NumberField({ label, value, onChange, hint, step = 100 }: { label: string; value: number; onChange: (v: number) => void; hint?: string; step?: number }) {
  return (
    <label className="block text-xs text-[#888888] font-medium">
      {label}
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="mt-1 w-full px-3 py-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
      />
      {hint && <span className="block mt-1 text-[11px] font-normal text-[#555555]">{hint}</span>}
    </label>
  );
}

function Slider({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint: string }) {
  return (
    <label className="block text-xs text-[#888888] font-medium">
      <span className="flex justify-between">
        {label} <span className="font-mono text-[#a855f7]">{value}%</span>
      </span>
      <input type="range" min={0} max={100} step={5} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full mt-1.5 accent-[#a855f7]" />
      <span className="block text-[11px] font-normal text-[#555555]">{hint}</span>
    </label>
  );
}

export default function LlmApiCostCalculatorClient() {
  const [form, setForm] = useState<Form>(DEFAULT);
  const [day, setDay] = useState(PRICES_CHECKED);

  useEffect(() => {
    setDay(today());
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && typeof saved === "object") setForm({ ...DEFAULT, ...saved, providers: Array.isArray(saved.providers) && saved.providers.length ? saved.providers : PROVIDERS });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const cachedTooBig = form.cachedTokens > form.inputTokens;

  const rows = useMemo(() => {
    const w: Workload = {
      requests: form.per === "day" ? form.requests * 30 : form.requests,
      inputTokens: form.inputTokens,
      outputTokens: form.outputTokens,
      cachedTokens: Math.min(form.cachedTokens, form.inputTokens),
      cacheHitRate: form.hitRate / 100,
      batchShare: form.batch / 100,
    };
    return LLM_MODELS.filter((m) => form.providers.includes(m.provider))
      .map((m) => {
        const cost = workloadCost(m, w, day);
        // An announced price change that hasn't started yet: show what the same workload will cost
        const upcoming = m.change && day < m.change.from ? { from: m.change.from, perMonth: workloadCost(m, w, m.change.from).perMonth } : null;
        return { m, cost, upcoming };
      })
      .sort((a, b) => a.cost.perMonth - b.cost.perMonth);
  }, [form, day]);

  const cheapest = rows[0]?.cost.perMonth;

  return (
    <ToolLayout title="LLM API Cost Calculator" description="Estimate your monthly Claude, GPT and Gemini API bill — with prompt caching, batch discounts and long-context pricing">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setForm((f) => ({ ...p.form, providers: f.providers }))}
                className="px-2.5 py-1 text-xs rounded-[6px] bg-[#111111] border border-[#222222] text-[#aaaaaa] hover:border-[#a855f7]/50 hover:text-[#f5f5f5]"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <NumberField label="Requests" value={form.requests} onChange={(v) => set({ requests: v })} />
            <select
              value={form.per}
              onChange={(e) => set({ per: e.target.value as Form["per"] })}
              aria-label="Requests per"
              className="px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            >
              <option value="day">per day</option>
              <option value="month">per month</option>
            </select>
          </div>
          <NumberField label="Input tokens per request" value={form.inputTokens} onChange={(v) => set({ inputTokens: v })} hint="Everything you send: system prompt, tools, history, documents and the question." />
          <NumberField label="Output tokens per request" value={form.outputTokens} onChange={(v) => set({ outputTokens: v })} hint="Include thinking / reasoning tokens — they're billed as output." />
          <NumberField
            label="Cacheable prefix (tokens)"
            value={form.cachedTokens}
            onChange={(v) => set({ cachedTokens: v })}
            hint="The part that's identical on every request — system prompt, tool definitions, shared documents."
          />
          {cachedTooBig && <p className="text-xs text-[#fbbf24]">The cached prefix can&apos;t be larger than the input; it&apos;s capped at {form.inputTokens.toLocaleString()} tokens.</p>}
          <Slider label="Cache hit rate" value={form.hitRate} onChange={(v) => set({ hitRate: v })} hint="Requests that reuse a cached prefix. The rest pay to write it." />
          <Slider label="Sent through the Batch API" value={form.batch} onChange={(v) => set({ batch: v })} hint="Batch requests cost half and finish within 24 hours." />

          <div className="flex flex-wrap gap-3 text-xs">
            {PROVIDERS.map((p) => (
              <label key={p} className="flex items-center gap-1.5 text-[#bbbbbb]">
                <input
                  type="checkbox"
                  checked={form.providers.includes(p)}
                  onChange={(e) => set({ providers: e.target.checked ? [...form.providers, p] : form.providers.filter((x) => x !== p) })}
                  className="accent-[#a855f7]"
                />
                {p}
              </label>
            ))}
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="overflow-x-auto border border-[#1e1e1e] rounded-[8px]">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-[#111111]">
                <tr>
                  {["Model", "Per request", "Per month", "Caching saves", ""].map((c) => (
                    <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-[#888] uppercase tracking-wide border-b border-[#1e1e1e] whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ m, cost, upcoming }) => {
                  const saved = cost.perMonthNoCache - cost.perMonth;
                  return (
                    <tr key={m.id} className="even:bg-[#0d0d0d] align-top">
                      <td className="px-3 py-2 border-b border-[#161616]">
                        <div className="text-[#f5f5f5] whitespace-nowrap">{m.label}</div>
                        <div className={`text-[11px] ${PROVIDER_COLORS[m.provider]}`}>{m.provider}</div>
                      </td>
                      <td className="px-3 py-2 border-b border-[#161616] font-mono text-[#bbbbbb] whitespace-nowrap">{money(cost.perRequest)}</td>
                      <td className="px-3 py-2 border-b border-[#161616] font-mono whitespace-nowrap">
                        <span className={cost.perMonth === cheapest ? "text-[#4ade80] font-semibold" : "text-[#f5f5f5]"}>{money(cost.perMonth)}</span>
                      </td>
                      <td className="px-3 py-2 border-b border-[#161616] font-mono text-[#888888] whitespace-nowrap">{saved > 0.005 ? money(saved) : "—"}</td>
                      <td className="px-3 py-2 border-b border-[#161616] text-[11px] text-[#888888] min-w-[160px]">
                        {cost.longContext && <div className="text-[#fbbf24]">Long-context rates (over {(m.longContext!.above / 1000).toLocaleString()}K input)</div>}
                        {upcoming && (
                          <div className="text-[#fbbf24]">
                            From {fmtDay(upcoming.from)}: {money(upcoming.perMonth)}/month
                          </div>
                        )}
                        {m.provider === "Google" && form.cachedTokens > 0 && <div>Implicit caching; no write fee</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <p className="text-sm text-[#888888]">Pick at least one provider.</p>}

          {rows[0] && (
            <p className="text-xs text-[#888888] leading-relaxed">
              Per request on {rows[0].m.label}: input {money(rows[0].cost.input)}, cache reads {money(rows[0].cost.cacheRead)}, cache writes {money(rows[0].cost.cacheWrite)}, output {money(rows[0].cost.output)}. A month is 30 days.
            </p>
          )}

          <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#777777] leading-relaxed space-y-1.5">
            <p>
              List prices from the{" "}
              {PROVIDERS.map((p, i) => (
                <span key={p}>
                  <a href={PRICING_SOURCES[p]} target="_blank" rel="noopener noreferrer" className="text-[#a855f7] hover:underline">
                    {p}
                  </a>
                  {i < PROVIDERS.length - 2 ? ", " : i === PROVIDERS.length - 2 ? " and " : ""}
                </span>
              ))}{" "}
              pricing pages, checked {fmtDay(PRICES_CHECKED)}; priced for {fmtDay(day)}. Cache writes use Anthropic&apos;s 5-minute and OpenAI&apos;s 30-minute rates. Taxes, fast/priority
              tiers, data-residency surcharges and Gemini&apos;s explicit-cache storage fees aren&apos;t included.
            </p>
            <p>
              Not sure how many tokens your prompt is? Paste it into the{" "}
              <Link href="/tools/ai-token-counter" className="text-[#a855f7] hover:underline">
                AI Token Counter
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

