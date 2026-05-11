"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Eye, EyeOff, AlertCircle, CheckCircle, Clock, Key } from "lucide-react";

const STORAGE_KEY = "toolninja:jwt-generator";

function base64urlEncode(data: Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof data === "string") {
    bytes = new TextEncoder().encode(data);
  } else {
    bytes = data;
  }
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const keyData = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput)
  );
  const encodedSig = base64urlEncode(new Uint8Array(signature));
  return `${signingInput}.${encodedSig}`;
}

function syntaxHighlight(obj: unknown): string {
  const json = JSON.stringify(obj, null, 2)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-string";
      } else if (/true|false/.test(match)) {
        cls = "json-bool";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function formatExpiry(exp: number): { label: string; expired: boolean; date: Date } {
  const date = new Date(exp * 1000);
  const now = Date.now();
  const diff = exp * 1000 - now;
  const expired = diff < 0;
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let relative: string;
  if (days > 0) relative = `${days} day${days !== 1 ? "s" : ""}`;
  else if (hours > 0) relative = `${hours} hour${hours !== 1 ? "s" : ""}`;
  else if (minutes > 0) relative = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  else relative = `${seconds} second${seconds !== 1 ? "s" : ""}`;

  const label = expired ? `Expired ${relative} ago` : `Expires in ${relative}`;
  return { label, expired, date };
}

const defaultPayload = JSON.stringify(
  {
    sub: "1234567890",
    name: "John Doe",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  null,
  2
);

export default function JwtGeneratorClient() {
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [payloadStr, setPayloadStr] = useState(defaultPayload);
  const [jwt, setJwt] = useState("");
  const [error, setError] = useState("");
  const [payloadError, setPayloadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { secret: s, payloadStr: p } = JSON.parse(saved);
        if (s) setSecret(s);
        if (p) setPayloadStr(p);
      }
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ secret, payloadStr }));
    } catch {}
  }, [secret, payloadStr]);

  // Live JSON validation
  useEffect(() => {
    if (!payloadStr.trim()) {
      setPayloadError("");
      return;
    }
    try {
      JSON.parse(payloadStr);
      setPayloadError("");
    } catch {
      setPayloadError("Invalid JSON");
    }
  }, [payloadStr]);

  const handleGenerate = useCallback(async () => {
    if (payloadError) return;
    if (!secret.trim()) {
      setError("Secret key is required");
      return;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(payloadStr);
    } catch {
      setError("Payload must be valid JSON");
      return;
    }

    setLoading(true);
    setError("");
    setJwt("");
    try {
      const token = await signJwt(parsed, secret);
      setJwt(token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to sign JWT");
    } finally {
      setLoading(false);
    }
  }, [secret, payloadStr, payloadError]);

  // Parse JWT parts for colored display
  const jwtParts = jwt ? jwt.split(".") : [];

  // Decode header/payload for display
  let decodedHeader: unknown = null;
  let decodedPayload: unknown = null;
  if (jwt && jwtParts.length === 3) {
    try {
      const decodeB64url = (s: string) => {
        s = s.replace(/-/g, "+").replace(/_/g, "/");
        while (s.length % 4) s += "=";
        return JSON.parse(atob(s));
      };
      decodedHeader = decodeB64url(jwtParts[0]);
      decodedPayload = decodeB64url(jwtParts[1]);
    } catch {}
  }

  const expClaim =
    decodedPayload && typeof decodedPayload === "object" && "exp" in (decodedPayload as object)
      ? Number((decodedPayload as Record<string, unknown>).exp)
      : null;
  const expiryInfo = expClaim ? formatExpiry(expClaim) : null;

  const payloadIsValid = payloadStr.trim() !== "" && !payloadError;

  return (
    <ToolLayout
      title="JWT Generator"
      description="Create and sign JSON Web Tokens using HS256 (HMAC-SHA256)"
    >
      <div className="max-w-2xl space-y-5">
        {/* Secret Key */}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1.5">Secret Key</label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter your secret key..."
              className="w-full p-3 pr-10 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#444444]"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#f5f5f5] transition-colors"
              title={showSecret ? "Hide secret" : "Show secret"}
            >
              {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-xs text-[#555555] mt-1 flex items-center gap-1">
            <Key size={11} />
            Keep this secret in production — never expose it client-side
          </p>
        </div>

        {/* Payload */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-[#888888] font-medium">Payload (JSON)</label>
            {payloadStr.trim() && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  payloadError ? "text-[#ef4444]" : "text-[#22c55e]"
                }`}
              >
                {payloadError ? (
                  <>
                    <AlertCircle size={11} /> {payloadError}
                  </>
                ) : (
                  <>
                    <CheckCircle size={11} /> Valid JSON
                  </>
                )}
              </span>
            )}
          </div>
          <textarea
            value={payloadStr}
            onChange={(e) => setPayloadStr(e.target.value)}
            rows={8}
            spellCheck={false}
            className={`w-full p-3 font-mono text-sm resize-y bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#444444] ${
              payloadError ? "border-[#ef4444]" : "border-[#222222]"
            }`}
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !!payloadError || !secret.trim()}
          className="px-5 py-2.5 rounded-[8px] text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing..." : "Generate JWT"}
        </button>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px]">
            <AlertCircle size={14} className="text-[#ef4444] shrink-0" />
            <span className="text-sm text-[#ef4444]">{error}</span>
          </div>
        )}

        {/* JWT Output */}
        {jwt && (
          <div className="space-y-4">
            {/* Expiry badge */}
            {expiryInfo && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm ${
                  expiryInfo.expired
                    ? "bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]"
                    : "bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]"
                }`}
              >
                {expiryInfo.expired ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                <span>{expiryInfo.label}</span>
                <span className="text-[#888888] flex items-center gap-1 ml-auto">
                  <Clock size={12} />
                  {expiryInfo.date.toLocaleString()}
                </span>
              </div>
            )}

            {/* Colored JWT display */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-[#888888] font-medium">Signed JWT</label>
                <CopyButton text={jwt} size="sm" />
              </div>
              <div className="font-mono text-xs break-all p-4 bg-[#111111] border border-[#222222] rounded-[8px] leading-relaxed">
                {jwtParts.length === 3 && (
                  <>
                    <span className="text-[#ef4444]">{jwtParts[0]}</span>
                    <span className="text-[#555555]">.</span>
                    <span className="text-[#a855f7]">{jwtParts[1]}</span>
                    <span className="text-[#555555]">.</span>
                    <span className="text-[#22c55e]">{jwtParts[2]}</span>
                  </>
                )}
              </div>
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-[#ef4444] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block" />
                  Header
                </span>
                <span className="text-xs text-[#a855f7] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#a855f7] inline-block" />
                  Payload
                </span>
                <span className="text-xs text-[#22c55e] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" />
                  Signature
                </span>
              </div>
            </div>

            {/* Decoded sections */}
            {[
              { label: "Header", color: "#ef4444", borderColor: "#ef444433", data: decodedHeader },
              { label: "Payload", color: "#a855f7", borderColor: "#a855f733", data: decodedPayload },
            ].map((s) =>
              s.data ? (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold" style={{ color: s.color }}>
                      {s.label}
                    </label>
                    <CopyButton
                      text={JSON.stringify(s.data, null, 2)}
                      size="sm"
                    />
                  </div>
                  <div
                    className="p-3 bg-[#111111] border rounded-[8px] overflow-auto"
                    style={{ borderColor: s.borderColor }}
                  >
                    <pre
                      className="m-0 p-0 text-xs font-mono leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: syntaxHighlight(s.data) }}
                      style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                    />
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* Empty state */}
        {!jwt && !error && payloadIsValid && (
          <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
            Click &quot;Generate JWT&quot; to sign your token
          </div>
        )}
      </div>

      <style>{`
        .json-key { color: #a855f7; }
        .json-string { color: #22c55e; }
        .json-number { color: #f97316; }
        .json-bool { color: #3b82f6; }
        .json-null { color: #888888; }
      `}</style>
    </ToolLayout>
  );
}
