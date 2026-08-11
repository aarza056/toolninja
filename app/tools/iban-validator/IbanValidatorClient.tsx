"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { validateIban, generateTestIban, formatIban, IBAN_COUNTRIES } from "@/lib/iban";

const STORAGE_KEY = "toolninja:iban-validator";

export default function IbanValidatorClient() {
  const [input, setInput] = useState("");
  const [genCountry, setGenCountry] = useState("DE");
  const [generated, setGenerated] = useState("");

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

  const result = useMemo(() => (input.trim() ? validateIban(input) : null), [input]);

  const generate = () => {
    setGenerated(formatIban(generateTestIban(genCountry)));
  };

  return (
    <ToolLayout
      title="IBAN Validator & Generator"
      description="Validate an IBAN's MOD-97 checksum, or generate a test IBAN for any supported country"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Validator */}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">IBAN to validate</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="GB82 WEST 1234 5698 7654 32"
            spellCheck={false}
            className="w-full px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] tracking-wider"
          />

          {result && (
            <div className={`mt-4 p-4 rounded-[8px] border ${result.valid ? "bg-[#22c55e]/10 border-[#22c55e]/30" : "bg-[#ef4444]/10 border-[#ef4444]/30"}`}>
              <div className="flex items-center gap-2 mb-3">
                {result.valid ? (
                  <CheckCircle2 size={16} className="text-[#22c55e]" />
                ) : (
                  <XCircle size={16} className="text-[#ef4444]" />
                )}
                <span className={`text-sm font-medium ${result.valid ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {result.valid ? "Valid IBAN" : "Invalid IBAN"}
                </span>
              </div>
              {result.error && <p className="text-xs text-[#ef4444] mb-3">{result.error}</p>}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#888888]">Country</span>
                  <span className="text-[#f5f5f5] font-mono">{result.countryName ?? result.countryCode ?? "—"} ({result.countryCode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Check digits</span>
                  <span className="text-[#f5f5f5] font-mono">{result.checkDigits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">BBAN</span>
                  <span className="text-[#f5f5f5] font-mono break-all">{result.bban}</span>
                </div>
                {result.lengthOk !== null && (
                  <div className="flex justify-between">
                    <span className="text-[#888888]">Length</span>
                    <span className={`font-mono ${result.lengthOk ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {result.lengthOk ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!result && (
            <div className="mt-4 p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px] text-sm">
              Paste an IBAN to check its checksum and structure
            </div>
          )}
        </div>

        {/* Generator */}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Generate a test IBAN</label>
          <div className="flex gap-2 mb-3">
            <select
              value={genCountry}
              onChange={(e) => setGenCountry(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            >
              {IBAN_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
            <button
              onClick={generate}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors shrink-0"
            >
              <RefreshCw size={14} /> Generate
            </button>
          </div>

          {generated ? (
            <div className="flex items-center gap-3 p-4 bg-[#111111] border border-[#222222] rounded-[8px]">
              <code className="flex-1 text-sm font-mono text-[#f5f5f5] tracking-wider break-all">{generated}</code>
              <CopyButton text={generated.replace(/\s/g, "")} size="sm" />
            </div>
          ) : (
            <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px] text-sm">
              Pick a country and click Generate
            </div>
          )}

          <p className="text-xs text-[#555555] mt-3">
            Generated IBANs pass the MOD-97 checksum and have the correct length for the selected country, but are randomly generated — they are not real, bank-issued account numbers. Use them for testing form validation and API integrations only.
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}
