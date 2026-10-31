"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { GATEWAYS, SCENARIOS, formatCardNumber, type Scenario } from "@/lib/payment-test-cards";
import { ExternalLink, Search } from "lucide-react";

const STORAGE_KEY = "toolninja:payment-test-cards";

const SCENARIO_TONE: Record<Scenario, string> = {
  success: "text-[#4ade80]",
  decline: "text-[#f87171]",
  "3ds": "text-[#60a5fa]",
  fraud: "text-[#fbbf24]",
  other: "text-[#aaaaaa]",
};

export default function PaymentTestCardsClient() {
  const [gatewayId, setGatewayId] = useState(GATEWAYS[0].id);
  const [scenario, setScenario] = useState<Scenario | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && GATEWAYS.some((g) => g.id === saved)) setGatewayId(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, gatewayId);
    } catch {}
  }, [gatewayId]);

  const gateway = GATEWAYS.find((g) => g.id === gatewayId) ?? GATEWAYS[0];
  const available = useMemo(() => SCENARIOS.filter((s) => gateway.cards.some((c) => c.scenario === s.id)), [gateway]);
  const q = query.trim().toLowerCase().replace(/\s/g, "");
  const cards = gateway.cards.filter(
    (c) => (scenario === "all" || c.scenario === scenario) && (!q || c.number.includes(q) || c.brand.toLowerCase().replace(/\s/g, "").includes(q) || c.result.toLowerCase().replace(/\s/g, "").includes(q))
  );

  return (
    <ToolLayout title="Payment Test Cards" description="Official test card numbers for Stripe, Adyen, Braintree, PayPal, Checkout.com and Square — success, declines and 3-D Secure">
      <div className="max-w-5xl space-y-5">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Payment provider">
          {GATEWAYS.map((g) => (
            <button
              key={g.id}
              role="tab"
              aria-selected={g.id === gateway.id}
              onClick={() => {
                setGatewayId(g.id);
                setScenario("all");
              }}
              className={`px-3 py-1.5 text-sm rounded-[6px] border transition-colors ${
                g.id === gateway.id ? "border-[#a855f7]/60 bg-[#a855f7]/10 text-[#f5f5f5]" : "border-[#222222] bg-[#111111] text-[#999999] hover:text-[#f5f5f5]"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-sm text-[#bbbbbb] leading-relaxed space-y-1.5">
          <p>{gateway.rules}</p>
          {gateway.declineHow && <p className="text-[#999999]">{gateway.declineHow}</p>}
          <a href={gateway.docs} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#a855f7] hover:underline">
            {gateway.name} testing docs <ExternalLink size={11} />
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[{ id: "all" as const, label: "All" }, ...available].map((s) => (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                scenario === s.id ? "border-[#a855f7]/60 bg-[#a855f7]/10 text-[#f5f5f5]" : "border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
              }`}
            >
              {s.label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 px-2.5 py-1 bg-[#111111] border border-[#222222] rounded-[6px] focus-within:border-[#a855f7]">
            <Search size={13} className="text-[#666666]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Brand, number or result"
              aria-label="Filter cards"
              className="w-44 bg-transparent text-xs text-[#f5f5f5] focus:outline-none"
            />
          </label>
        </div>

        <div className="overflow-x-auto border border-[#1e1e1e] rounded-[8px]">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-[#111111]">
              <tr>
                {["Card number", "Brand", "Result", "Expiry / CVC", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[#888] uppercase tracking-wide border-b border-[#1e1e1e] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cards.map((c, i) => (
                <tr key={`${c.number}-${i}`} className="even:bg-[#0d0d0d] align-top">
                  <td className="px-3 py-2 border-b border-[#161616] font-mono text-[#f5f5f5] whitespace-nowrap">{formatCardNumber(c.number)}</td>
                  <td className="px-3 py-2 border-b border-[#161616] text-[#bbbbbb] whitespace-nowrap">{c.brand}</td>
                  <td className={`px-3 py-2 border-b border-[#161616] ${SCENARIO_TONE[c.scenario]}`}>{c.result}</td>
                  <td className="px-3 py-2 border-b border-[#161616] font-mono text-xs text-[#999999] whitespace-nowrap">
                    {c.expiry ?? "Any future"} · {c.cvc ?? "Any"}
                  </td>
                  <td className="px-3 py-2 border-b border-[#161616] text-right">
                    <CopyButton text={c.number} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cards.length === 0 && <p className="p-4 text-sm text-[#888888]">No {gateway.name} test cards match that filter.</p>}
        </div>

        {gateway.extra && (scenario === "all" || scenario === "decline") && (
          <div>
            <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mb-2">{gateway.extra.title}</p>
            <div className="overflow-x-auto border border-[#1e1e1e] rounded-[8px]">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-[#111111]">
                  <tr>
                    {gateway.extra.columns.map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[#888] uppercase tracking-wide border-b border-[#1e1e1e]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gateway.extra.rows.map((r) => (
                    <tr key={r[0]} className="even:bg-[#0d0d0d]">
                      {r.map((cell, j) => (
                        <td key={j} className={`px-3 py-1.5 border-b border-[#161616] ${j === 0 ? "font-mono text-[#c9a3f5]" : "text-[#999999]"}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-[#666666] leading-relaxed">
          Copied from each provider&apos;s testing docs on 31 October 2026. These numbers only work in that provider&apos;s test mode or sandbox — they&apos;re not real cards and
          are declined everywhere else. Need random, Luhn-valid numbers to test your own form validation instead? Use the{" "}
          <Link href="/tools/credit-card-test-generator" className="text-[#a855f7] hover:underline">
            Credit Card Test Generator
          </Link>{" "}
          — but don&apos;t send those to a payment provider: test mode only accepts its own listed numbers.
        </p>
      </div>
    </ToolLayout>
  );
}
