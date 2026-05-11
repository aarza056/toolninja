"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Trash2, AlertCircle } from "lucide-react";

const STORAGE_KEY = "toolninja:number-base-converter";

type BaseField = "binary" | "octal" | "decimal" | "hex";

interface FieldValues {
  binary: string;
  octal: string;
  decimal: string;
  hex: string;
}

interface FieldConfig {
  key: BaseField;
  label: string;
  placeholder: string;
  base: number;
}

const FIELDS: FieldConfig[] = [
  { key: "binary", label: "Binary", placeholder: "e.g. 1010", base: 2 },
  { key: "octal", label: "Octal", placeholder: "e.g. 12", base: 8 },
  { key: "decimal", label: "Decimal", placeholder: "e.g. 10", base: 10 },
  { key: "hex", label: "Hexadecimal", placeholder: "e.g. A", base: 16 },
];

function groupBinary(bin: string): string {
  // Pad to a multiple of 4, then insert spaces every 4 chars
  const padded = bin.length % 4 !== 0 ? bin.padStart(bin.length + (4 - (bin.length % 4)), "0") : bin;
  return padded.match(/.{1,4}/g)?.join(" ") ?? bin;
}

function deriveAllValues(source: BaseField, rawValue: string): { values: FieldValues; error: string } {
  const empty: FieldValues = { binary: "", octal: "", decimal: "", hex: "" };

  if (!rawValue.trim()) {
    return { values: empty, error: "" };
  }

  const cfg = FIELDS.find((f) => f.key === source)!;

  let bigVal: bigint;
  try {
    // BigInt() doesn't accept an explicit base; use parseInt-like approach via Number() for base parsing
    // but we need BigInt accuracy — parse manually
    const cleaned = rawValue.trim().replace(/\s/g, "");
    if (cleaned === "") return { values: empty, error: "" };

    // Validate characters for the given base
    const validChars: Record<number, RegExp> = {
      2: /^[01]+$/,
      8: /^[0-7]+$/,
      10: /^[0-9]+$/,
      16: /^[0-9a-fA-F]+$/,
    };
    if (!validChars[cfg.base].test(cleaned)) {
      return { values: empty, error: `"${rawValue.trim()}" is not a valid base-${cfg.base} number.` };
    }

    // BigInt doesn't accept a radix argument, so we parse digit by digit
    // for arbitrary-precision support across all bases.
    bigVal = BigInt(0);
    const digits = cleaned.toLowerCase();
    const digitMap = "0123456789abcdef";
    for (let i = 0; i < digits.length; i++) {
      const d = BigInt(digitMap.indexOf(digits[i]));
      bigVal = bigVal * BigInt(cfg.base) + d;
    }
  } catch {
    return { values: empty, error: `Invalid number for base ${cfg.base}.` };
  }

  const binRaw = bigVal.toString(2);
  const derived: FieldValues = {
    binary: bigVal === BigInt(0) ? "0" : groupBinary(binRaw),
    octal: bigVal.toString(8),
    decimal: bigVal.toString(10),
    hex: bigVal.toString(16).toUpperCase(),
  };

  return { values: derived, error: "" };
}

export default function NumberBaseConverterClient() {
  const [values, setValues] = useState<FieldValues>({ binary: "", octal: "", decimal: "", hex: "" });
  const [error, setError] = useState("");
  const [activeField, setActiveField] = useState<BaseField | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { values: derived, error: err } = deriveAllValues("decimal", saved);
        if (!err) {
          setValues(derived);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (values.decimal) {
        localStorage.setItem(STORAGE_KEY, values.decimal);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, [values.decimal]);

  const handleChange = useCallback((field: BaseField, raw: string) => {
    setActiveField(field);

    // Strip spaces for parsing (binary input commonly uses spaces for readability)
    const { values: derived, error: err } = deriveAllValues(field, raw.replace(/\s/g, ""));
    setError(err);

    if (err) {
      // Keep the invalid raw input in the active field so the user can correct it
      setValues((prev) => ({ ...prev, [field]: raw }));
    } else {
      if (!raw.trim()) {
        setValues({ binary: "", octal: "", decimal: "", hex: "" });
      } else {
        // Preserve the user's typed value in the active field; reformat others
        setValues({ ...derived, [field]: raw });
      }
    }
  }, []);

  const clearAll = () => {
    setValues({ binary: "", octal: "", decimal: "", hex: "" });
    setError("");
    setActiveField(null);
  };

  return (
    <ToolLayout title="Number Base Converter" description="Convert numbers between binary, octal, decimal, and hexadecimal">
      <div className="max-w-lg space-y-5">
        {/* Clear button */}
        <div className="flex items-center gap-3">
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors"
          >
            <Trash2 size={14} /> Clear All
          </button>
        </div>

        {/* Base fields */}
        <div className="space-y-3">
          {FIELDS.map(({ key, label, placeholder, base }) => (
            <div key={key} className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#f5f5f5]">{label}</span>
                  <span className="px-1.5 py-0.5 text-xs font-mono bg-[#1a1a1a] text-[#888888] border border-[#222222] rounded-[4px]">
                    base {base}
                  </span>
                </div>
                {values[key] && <CopyButton text={values[key]} size="sm" />}
              </div>
              <input
                type="text"
                value={values[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                spellCheck={false}
                className={`w-full px-3 py-2 text-sm font-mono bg-[#0a0a0a] border rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#333333] transition-colors ${
                  activeField === key && error
                    ? "border-[#ef4444]"
                    : "border-[#222222]"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#111111] border border-[#ef4444] rounded-[8px]">
            <AlertCircle size={14} className="text-[#ef4444] shrink-0" />
            <span className="text-sm text-[#ef4444]">{error}</span>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
