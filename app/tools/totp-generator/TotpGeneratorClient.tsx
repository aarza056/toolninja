"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import QRCode from "qrcode";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { RefreshCw, KeyRound, ScanLine, AlertCircle } from "lucide-react";
import {
  generateTOTP,
  generateRandomSecret,
  secondsRemaining,
  buildOtpauthUrl,
  parseOtpauthUrl,
  DEFAULT_TOTP_OPTIONS,
  type TotpAlgorithm,
  type TotpOptions,
} from "@/lib/totp";
import { decodeQrFromImage } from "@/lib/qr-decode";

const STORAGE_KEY = "toolninja:totp-generator";
const ALGORITHMS: TotpAlgorithm[] = ["SHA-1", "SHA-256", "SHA-512"];
const DIGIT_OPTIONS = [6, 8];
const PERIOD_OPTIONS = [30, 60];

export default function TotpGeneratorClient() {
  const [secret, setSecret] = useState("");
  const [label, setLabel] = useState("");
  const [issuer, setIssuer] = useState("");
  const [opts, setOpts] = useState<TotpOptions>(DEFAULT_TOTP_OPTIONS);
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(30);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSecret(parsed.secret ?? "");
        setLabel(parsed.label ?? "");
        setIssuer(parsed.issuer ?? "");
        if (parsed.opts) setOpts(parsed.opts);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ secret, label, issuer, opts }));
    } catch {}
  }, [secret, label, issuer, opts]);

  const tick = useCallback(async () => {
    if (!secret.trim()) {
      setCode("");
      setError("");
      return;
    }
    try {
      const c = await generateTOTP(secret, opts);
      setCode(c);
      setError("");
    } catch {
      setError("Invalid secret — must be a valid Base32 string (A-Z, 2-7)");
      setCode("");
    }
    setRemaining(secondsRemaining(opts.period));
  }, [secret, opts]);

  useEffect(() => {
    tick();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tick]);

  const handleGenerate = () => setSecret(generateRandomSecret());

  const handleImport = (url: string) => {
    const parsed = parseOtpauthUrl(url.trim());
    if (!parsed) {
      setError("Could not parse that otpauth:// URL");
      return;
    }
    setSecret(parsed.secret);
    setLabel(parsed.label);
    setIssuer(parsed.issuer);
    setOpts(parsed.opts);
  };

  const handleScanQr = async (file: File) => {
    setScanError("");
    setScanning(true);
    try {
      const result = await decodeQrFromImage(file);
      if (!result) {
        setScanError("No QR code found in that image.");
        return;
      }
      if (!result.isOtpauth) {
        setScanError("That QR code doesn't look like a 2FA (otpauth://) code.");
        return;
      }
      handleImport(result.text);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : "Failed to decode this image.");
    } finally {
      setScanning(false);
    }
  };

  const otpauthUrl = secret.trim() ? buildOtpauthUrl(secret.trim(), label || "account", issuer, opts) : "";

  useEffect(() => {
    if (!otpauthUrl) {
      setQrDataUrl("");
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(otpauthUrl, { width: 180, margin: 1, color: { dark: "#f5f5f5", light: "#111111" } })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [otpauthUrl]);
  const progress = ((opts.period - remaining) / opts.period) * 100;

  return (
    <ToolLayout
      title="TOTP / 2FA Code Generator"
      description="Generate live TOTP authentication codes from a secret key — test 2FA integrations entirely in your browser"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: config */}
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

          <div className="grid grid-cols-3 gap-3">
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
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Period (s)</label>
              <select
                value={opts.period}
                onChange={(e) => setOpts({ ...opts, period: Number(e.target.value) })}
                className="w-full px-2 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              >
                {PERIOD_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888888] font-medium">Import from otpauth:// URL</label>
              <button
                onClick={() => scanInputRef.current?.click()}
                disabled={scanning}
                className="flex items-center gap-1 text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors disabled:opacity-50"
              >
                <ScanLine size={11} className={scanning ? "animate-pulse" : ""} /> {scanning ? "Scanning…" : "Scan QR image"}
              </button>
              <input
                ref={scanInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleScanQr(f);
                  e.target.value = "";
                }}
              />
            </div>
            <input
              type="text"
              placeholder="otpauth://totp/Issuer:account?secret=..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleImport((e.target as HTMLInputElement).value);
              }}
              onBlur={(e) => e.target.value && handleImport(e.target.value)}
              className="w-full px-3 py-2 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
            {scanError && (
              <p className="flex items-center gap-1 text-xs text-[#ef4444] mt-1">
                <AlertCircle size={11} /> {scanError}
              </p>
            )}
          </div>
        </div>

        {/* Right: live code display */}
        <div className="flex flex-col items-center justify-center gap-4 p-6 bg-[#111111] border border-[#222222] rounded-[8px]">
          {code ? (
            <>
              <div className="flex items-center gap-3">
                <span className="font-mono text-4xl font-bold text-[#f5f5f5] tracking-widest">
                  {code.slice(0, code.length / 2)} {code.slice(code.length / 2)}
                </span>
                <CopyButton text={code} size="md" />
              </div>
              <div className="w-full max-w-[200px] h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#a855f7] transition-all duration-1000 ease-linear"
                  style={{ width: `${100 - progress}%` }}
                />
              </div>
              <p className="text-xs text-[#555555]">Refreshes in {remaining}s</p>

              {otpauthUrl && (
                <div className="w-full pt-4 border-t border-[#222222] flex flex-col items-center gap-3">
                  {qrDataUrl && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrDataUrl} alt="Scannable QR code for this otpauth:// URL" width={140} height={140} className="rounded-[8px] border border-[#222222]" />
                      <p className="text-[10px] text-[#555555] -mt-1">Scan with an authenticator app to load this account</p>
                    </>
                  )}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-[#888888] font-medium">otpauth:// URL</label>
                      <CopyButton text={otpauthUrl} size="sm" />
                    </div>
                    <p className="text-[10px] font-mono text-[#555555] break-all">{otpauthUrl}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-[#444444] py-8">
              <KeyRound size={40} strokeWidth={1} />
              <p className="text-sm text-center px-4">
                Enter or generate a Base32 secret key to see a live TOTP code
              </p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
