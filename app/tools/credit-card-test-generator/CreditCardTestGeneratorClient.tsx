"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { CARD_NETWORKS, generateTestCardNumber, formatCardNumber, luhnIsValid } from "@/lib/card-test-numbers";

export default function CreditCardTestGeneratorClient() {
  const [generated, setGenerated] = useState<{ network: string; number: string }[]>([]);
  const [validateInput, setValidateInput] = useState("");

  const generate = () => {
    setGenerated(CARD_NETWORKS.map((n) => ({ network: n.name, number: generateTestCardNumber(n) })));
  };

  const cleanInput = validateInput.replace(/\D/g, "");
  const isValid = cleanInput.length >= 2 ? luhnIsValid(cleanInput) : null;

  return (
    <ToolLayout
      title="Credit Card Test Number Generator"
      description="Generate Luhn-valid fake card numbers for testing payment forms — or check whether a number passes the Luhn checksum"
    >
      <div className="flex items-start gap-2 p-3 mb-6 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px] text-xs text-[#ef4444]">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <span>
          These numbers pass the Luhn checksum and look structurally valid, but are <strong>not real,
          working card numbers</strong> — they have no issuing bank behind them. They exist purely to test
          form validation and checksum logic. Use them only with test/sandbox payment endpoints
          (Stripe, PayPal, etc. all publish their own official test numbers for actual charge simulation).
        </span>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#f5f5f5]">Generate test numbers</h3>
          <button
            onClick={generate}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
          >
            <RefreshCw size={14} /> Generate
          </button>
        </div>

        {generated.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {generated.map((g) => (
              <div key={g.network} className="flex items-center justify-between gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                <div className="min-w-0">
                  <div className="text-[10px] text-[#888888] uppercase tracking-wide mb-0.5">{g.network}</div>
                  <code className="text-sm font-mono text-[#f5f5f5]">{formatCardNumber(g.number)}</code>
                </div>
                <CopyButton text={g.number} size="sm" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
            Click Generate to create one test number per network
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3">Validate a Luhn checksum</h3>
        <input
          type="text"
          value={validateInput}
          onChange={(e) => setValidateInput(e.target.value)}
          placeholder="4242 4242 4242 4242"
          spellCheck={false}
          className="w-full max-w-sm px-3 py-2.5 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
        {isValid !== null && (
          <div
            className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm max-w-sm ${
              isValid ? "bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]" : "bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]"
            }`}
          >
            {isValid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {isValid ? "Passes the Luhn checksum" : "Fails the Luhn checksum"}
          </div>
        )}
      </div>

      <div className="mt-8 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        The Luhn algorithm (mod 10) is a simple checksum used by most card networks to catch
        typos and transcription errors — it confirms a number is <em>structurally</em> well-formed,
        nothing more. It can&apos;t tell you whether a card exists, is active, or has funds; only the
        issuing bank&apos;s payment network can determine that.
      </div>
    </ToolLayout>
  );
}
