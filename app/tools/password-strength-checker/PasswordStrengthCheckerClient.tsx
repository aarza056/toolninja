"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { checkPasswordStrength } from "@/lib/password-strength";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";

const SCORE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

export default function PasswordStrengthCheckerClient() {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(true);

  const result = useMemo(() => checkPasswordStrength(password), [password]);
  const color = password ? SCORE_COLORS[result.score] : "#333333";

  return (
    <ToolLayout
      title="Password Strength Checker"
      description="Check how strong a password actually is — entropy, common-password matches, and predictable patterns"
    >
      <div className="max-w-xl">
        <label className="text-xs text-[#888888] font-medium block mb-1">Password</label>
        <div className="relative">
          <input
            type={visible ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Type a password to check…"
            spellCheck={false}
            autoComplete="off"
            className="w-full p-3 pr-10 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
          <button
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#f5f5f5] transition-colors"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {password && (
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#888888]">Strength</span>
                <span className="text-xs font-semibold" style={{ color }}>{result.label}</span>
              </div>
              <div className="h-1.5 bg-[#222222] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${((result.score + 1) / 5) * 100}%`, backgroundColor: color }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#888888]">
              <span>~{result.entropyBits} bits of entropy</span>
              <span>{password.length} characters</span>
            </div>

            {result.warnings.length > 0 && (
              <div className="space-y-1.5">
                {result.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 p-2.5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-[6px] text-xs text-[#f59e0b]">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    {w}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
          Nothing you type here is sent anywhere — the check runs entirely in your browser. That said,
          avoid typing a password you actually use for something important into any strength checker,
          this one included — treat results as a general guide, not a guarantee.
        </div>
      </div>
    </ToolLayout>
  );
}
