"use client";

import { useState, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

const STORAGE_KEY = "toolninja:jwt-decoder";

function b64Decode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  try {
    return decodeURIComponent(
      atob(str)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
  } catch {
    return atob(str);
  }
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

export default function JwtDecoderClient() {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<{ header: unknown; payload: unknown; signature: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setToken(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, token); } catch {}
    if (!token.trim()) { setDecoded(null); setError(""); return; }
    try {
      const parts = token.trim().split(".");
      if (parts.length !== 3) throw new Error("JWT must have 3 parts separated by dots");
      const header = JSON.parse(b64Decode(parts[0]));
      const payload = JSON.parse(b64Decode(parts[1]));
      setDecoded({ header, payload, signature: parts[2] });
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid JWT");
      setDecoded(null);
    }
  }, [token]);

  const payload = decoded?.payload as Record<string, unknown> | null;
  const exp = payload?.exp ? Number(payload.exp) : null;
  const now = Math.floor(Date.now() / 1000);
  const isExpired = exp !== null && exp < now;
  const expiryDate = exp ? new Date(exp * 1000) : null;

  const sections = decoded ? [
    { label: "Header", color: "#a855f7", data: decoded.header },
    { label: "Payload", color: "#3b82f6", data: decoded.payload },
    { label: "Signature", color: "#ef4444", data: decoded.signature },
  ] : [];

  return (
    <ToolLayout title="JWT Decoder" description="Decode and inspect JWT tokens">
      <div className="mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">JWT Token</label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your JWT token here..."
          rows={3}
          className={`w-full p-3 font-mono text-sm resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${error ? "border-[#ef4444]" : "border-[#222222]"}`}
          spellCheck={false}
        />
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
            <AlertCircle size={12} /> {error}
          </div>
        )}
      </div>

      {/* Expiry badge */}
      {expiryDate && (
        <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-[6px] text-sm ${isExpired ? "bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]" : "bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]"}`}>
          {isExpired ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          <span>{isExpired ? "Token is expired" : "Token is valid"}</span>
          <span className="text-[#888888] flex items-center gap-1">
            <Clock size={12} />
            Expires: {expiryDate.toLocaleString()}
          </span>
        </div>
      )}

      {/* Decoded sections */}
      {sections.map((s) => (
        <div key={s.label} className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</label>
            <CopyButton text={typeof s.data === "string" ? s.data : JSON.stringify(s.data, null, 2)} size="sm" />
          </div>
          <div
            className="p-3 font-mono text-sm bg-[#111111] border rounded-[8px] overflow-auto"
            style={{ borderColor: s.color + "33" }}
          >
            {typeof s.data === "string" ? (
              <span className="text-[#888888] break-all">{s.data}</span>
            ) : (
              <pre
                className="m-0 p-0 bg-transparent border-0 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(s.data) }}
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              />
            )}
          </div>
        </div>
      ))}

      {!decoded && !error && !token && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Paste a JWT token above to decode it
        </div>
      )}

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
