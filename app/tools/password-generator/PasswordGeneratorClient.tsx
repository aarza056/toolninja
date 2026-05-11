"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { RefreshCw } from "lucide-react";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

function getStrength(pwd: string): { label: string; color: string; width: string } {
  let score = 0;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 20) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { label: "Weak", color: "#ef4444", width: "33%" };
  if (score <= 4) return { label: "Medium", color: "#f97316", width: "66%" };
  return { label: "Strong", color: "#22c55e", width: "100%" };
}

function generatePassword(length: number, opts: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean }): string {
  let charset = "";
  if (opts.upper) charset += UPPERCASE;
  if (opts.lower) charset += LOWERCASE;
  if (opts.numbers) charset += NUMBERS;
  if (opts.symbols) charset += SYMBOLS;
  if (!charset) return "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => charset[n % charset.length]).join("");
}

export default function PasswordGeneratorClient() {
  const [length, setLength] = useState(20);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [count, setCount] = useState(1);
  const [passwords, setPasswords] = useState<string[]>([]);

  const generate = () => {
    setPasswords(Array.from({ length: count }, () => generatePassword(length, opts)));
  };

  const toggleOpt = (key: keyof typeof opts) => {
    setOpts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const strength = passwords[0] ? getStrength(passwords[0]) : null;

  return (
    <ToolLayout title="Password Generator" description="Generate strong, random passwords">
      <div className="max-w-lg">
        {/* Length slider */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-[#888888] font-medium">Length</label>
            <span className="text-sm font-mono text-[#a855f7] font-semibold">{length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={128}
            value={length}
            onChange={(e) => setLength(+e.target.value)}
            className="w-full accent-[#a855f7]"
          />
          <div className="flex justify-between text-xs text-[#555555] mt-1">
            <span>8</span><span>128</span>
          </div>
        </div>

        {/* Character options */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[
            { key: "upper", label: "Uppercase (A-Z)" },
            { key: "lower", label: "Lowercase (a-z)" },
            { key: "numbers", label: "Numbers (0-9)" },
            { key: "symbols", label: "Symbols (!@#...)" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 p-3 bg-[#111111] border border-[#222222] rounded-[8px] cursor-pointer hover:border-[#333333] transition-colors">
              <input
                type="checkbox"
                checked={opts[key as keyof typeof opts]}
                onChange={() => toggleOpt(key as keyof typeof opts)}
                className="accent-[#a855f7]"
              />
              <span className="text-sm text-[#888888]">{label}</span>
            </label>
          ))}
        </div>

        {/* Count */}
        <div className="flex items-center gap-3 mb-5">
          <label className="text-sm text-[#888888]">Generate</label>
          <select
            value={count}
            onChange={(e) => setCount(+e.target.value)}
            className="px-3 py-1.5 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          >
            {[1, 5, 10].map((n) => (
              <option key={n} value={n}>{n} password{n > 1 ? "s" : ""}</option>
            ))}
          </select>
          <button
            onClick={generate}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
          >
            <RefreshCw size={14} /> Generate
          </button>
        </div>

        {/* Strength */}
        {strength && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#888888]">Strength</span>
              <span className="text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</span>
            </div>
            <div className="h-1.5 bg-[#222222] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: strength.width, backgroundColor: strength.color }}
              />
            </div>
          </div>
        )}

        {/* Output */}
        <div className="space-y-2">
          {passwords.map((pwd, i) => (
            <div key={i} className="flex items-center gap-2 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <code className="flex-1 text-sm font-mono text-[#f5f5f5] break-all">{pwd}</code>
              <CopyButton text={pwd} size="sm" />
            </div>
          ))}
          {passwords.length > 1 && (
            <CopyButton text={passwords.join("\n")} className="w-full justify-center" />
          )}
        </div>

        {passwords.length === 0 && (
          <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
            Click Generate to create passwords
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
