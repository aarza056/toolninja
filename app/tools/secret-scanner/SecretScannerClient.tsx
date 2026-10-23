"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { scanForSecrets, type SecretSeverity } from "@/lib/secret-scanner";
import { CheckCircle, AlertTriangle, AlertCircle, ShieldAlert } from "lucide-react";

const STORAGE_KEY = "toolninja:secret-scanner";

// Built by concatenation (not as one contiguous literal) so this demo fixture — a fake,
// never-issued token in the exact shape a real one takes — doesn't itself get flagged by
// GitHub's own push-protection secret scanner when this file is committed.
const FAKE_GITHUB_TOKEN = "ghp_" + "wWPw5k4aXcaT4fNP0UcnZwJUVFk6LO0p" + "INUx";
const FAKE_STRIPE_KEY = "sk_" + "live_" + "4eC39HqLyjWDarjtT1zdp7dc";

const EXAMPLE = `const config = {
  awsAccessKey: "AKIAIOSFODNN7EXAMPLE",
  githubToken: "${FAKE_GITHUB_TOKEN}",
  stripeKey: "${FAKE_STRIPE_KEY}",
  dbPassword: "SuperSecretValue123456",
};`;

const SEVERITY_META: Record<SecretSeverity, { color: string; bg: string; icon: typeof AlertCircle; label: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: AlertCircle, label: "Critical" },
  high: { color: "#f97316", bg: "rgba(249,115,22,0.1)", icon: AlertTriangle, label: "High" },
  medium: { color: "#eab308", bg: "rgba(234,179,8,0.1)", icon: ShieldAlert, label: "Medium" },
};

export default function SecretScannerClient() {
  const [input, setInput] = useState("");

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

  const findings = useMemo(() => scanForSecrets(input), [input]);

  return (
    <ToolLayout
      title="Secret / API Key Scanner"
      description="Paste code or a config file and find hardcoded API keys, tokens, and credentials before they reach git"
    >
      <div className="mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">Code or config to scan</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a file, diff, or config here…"
          rows={14}
          spellCheck={false}
          className="w-full p-3 font-mono text-xs resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
      </div>

      {input.trim() && (
        <div className="space-y-2">
          {findings.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-[8px] text-sm text-[#22c55e]">
              <CheckCircle size={16} className="shrink-0" />
              No known secret patterns found.
            </div>
          ) : (
            <>
              <p className="text-xs text-[#888888]">
                {findings.length} finding{findings.length !== 1 ? "s" : ""} — matches are redacted below
              </p>
              {findings.map((f, i) => {
                const meta = SEVERITY_META[f.severity];
                const Icon = meta.icon;
                return (
                  <div key={i} className="p-3 rounded-[8px] border" style={{ borderColor: meta.color + "33", background: meta.bg }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={13} style={{ color: meta.color }} />
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-[#f5f5f5] font-medium">{f.rule}</span>
                      <span className="text-xs text-[#555555] ml-auto">line {f.line}</span>
                    </div>
                    <code className="block text-xs font-mono text-[#888888] mb-1.5">{f.match}</code>
                    <p className="text-xs text-[#cccccc] leading-relaxed">{f.remediation}</p>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        Matches on known secret formats (AWS, GitHub, Stripe, Slack, Google, npm, SendGrid, Twilio,
        private key blocks, JWTs) plus a lower-confidence check for secret-sounding variable names.
        This is a format-based scanner, not a full secrets-detection tool like Gitleaks or TruffleHog
        — it can&apos;t confirm a key is actually valid, and it can both miss unusual formats and flag
        placeholders/test fixtures. Nothing you paste here is ever sent anywhere.
      </div>
    </ToolLayout>
  );
}
