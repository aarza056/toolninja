"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { RefreshCw, KeyRound, Plus } from "lucide-react";
import { generateRandomSecret, type TotpAlgorithm } from "@/lib/totp";
import { generateHOTP, buildHotpOtpauthUrl, parseHotpOtpauthUrl, DEFAULT_HOTP_OPTIONS, type HotpOptions } from "@/lib/hotp";

const STORAGE_KEY = "toolninja:hotp-generator";
const ALGORITHMS: TotpAlgorithm[] = ["SHA-1", "SHA-256", "SHA-512"];
const DIGIT_OPTIONS = [6, 8];

export default function HotpGeneratorClient() {
  const [secret, setSecret] = useState("");
  const [label, setLabel] = useState("");
  const [issuer, setIssuer] = useState("");
  const [counter, setCounter] = useState(0);
  const [opts, setOpts] = useState<HotpOptions>(DEFAULT_HOTP_OPTIONS);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSecret(parsed.secret ?? "");
        setLabel(parsed.label ?? "");
        setIssuer(parsed.issuer ?? "");
        setCounter(parsed.counter ?? 0);
        if (parsed.opts) setOpts(parsed.opts);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ secret, label, issuer, counter, opts }));
    } catch {}
  }, [secret, label, issuer, counter, opts]);

  const compute = useCallback(async () => {
    if (!secret.trim()) {
      setCode("");
      setError("");
      return;
    }
    try {
      setCode(await generateHOTP(secret, counter, opts));
      setError("");
    } catch {
      setError("Invalid secret — must be a valid Base32 string (A-Z, 2-7)");
      setCode("");
    }
  }, [secret, counter, opts]);

  useEffect(() => {
    compute();
  }, [compute]);

  const handleGenerate = () => setSecret(generateRandomSecret());

  const handleImport = (url: string) => {
    const parsed = parseHotpOtpauthUrl(url.trim());
    if (!parsed) {
      setError("Could not parse that otpauth://hotp/ URL");
      return;
    }
    setSecret(parsed.secret);
    setLabel(parsed.label);
    setIssuer(parsed.issuer);
    setCounter(parsed.counter);
    setOpts(parsed.opts);
  };

  const otpauthUrl = secret.trim() ? buildHotpOtpauthUrl(secret.trim(), label || "account", issuer, counter, opts) : "";

  return (
    <ToolLayout
      title="HOTP Generator"
      description="Generate RFC 4226 counter-based one-time passwords — TOTP's time-independent sibling"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888888] font-medium">Secret key (Base32)</label>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1 text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors"
              >
                <RefreshCw size={11} /> Generate random
              </button>
            </div>
            <textarea
              value={secret}
              onChange={(e) => setSecret(e.target.value.toUpperCase())}
              placeholder="JBSWY3DPEHPK3PXP"
              rows={2}
              className="w-full px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] resize-none"
            />
            {error && <p className="text-xs text-[#ef4444] mt-1">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Account label (optional)</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="alice@example.com"
                className="w-full px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Issuer (optional)</label>
              <input
                type="text"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="MyApp"
                className="w-full px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Algorithm</label>
              <select
                value={opts.algorithm}
                onChange={(e) => setOpts({ ...opts, algorithm: e.target.value as TotpAlgorithm })}
                className="w-full px-2 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              >
                {ALGORITHMS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Digits</label>
              <select
                value={opts.digits}
                onChange={(e) => setOpts({ ...opts, digits: Number(e.target.value) })}
                className="w-full px-2 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              >
                {DIGIT_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Import from otpauth://hotp/ URL</label>
            <input
              type="text"
              placeholder="otpauth://hotp/Issuer:account?secret=...&counter=0"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleImport((e.target as HTMLInputElement).value);
              }}
              onBlur={(e) => e.target.value && handleImport(e.target.value)}
              className="w-full px-3 py-2 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 p-6 bg-[#111111] border border-[#222222] rounded-[8px]">
          {code ? (
            <>
              <div className="flex items-center gap-3">
                <span className="font-mono text-4xl font-bold text-[#f5f5f5] tracking-widest">
                  {code.slice(0, code.length / 2)} {code.slice(code.length / 2)}
                </span>
                <CopyButton text={code} size="md" />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-[#888888]">Counter: <span className="text-[#f5f5f7] font-mono">{counter}</span></span>
                <button
                  onClick={() => setCounter((c) => c + 1)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
                >
                  <Plus size={11} /> Increment
                </button>
              </div>
              <p className="text-xs text-[#555555] text-center">
                Unlike TOTP, this code never expires on its own — a real server advances its
                stored counter after every successful verification, so each code is only valid once.
              </p>

              {otpauthUrl && (
                <div className="w-full pt-4 border-t border-[#222222]">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-[#888888] font-medium">otpauth://hotp/ URL</label>
                    <CopyButton text={otpauthUrl} size="sm" />
                  </div>
                  <p className="text-[10px] font-mono text-[#555555] break-all">{otpauthUrl}</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-[#444444] py-8">
              <KeyRound size={40} strokeWidth={1} />
              <p className="text-sm text-center px-4">
                Enter or generate a Base32 secret key to compute an HOTP code
              </p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
