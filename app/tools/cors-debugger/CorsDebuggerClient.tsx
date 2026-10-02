"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { checkCors } from "@/lib/cors-debugger";
import { parseHeaders } from "@/lib/http-headers-reference";
import { CheckCircle, XCircle, Info } from "lucide-react";

const STORAGE_KEY = "toolninja:cors-debugger";
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];

interface State {
  origin: string;
  method: string;
  requestHeaders: string;
  contentType: string;
  withCredentials: boolean;
  responseHeadersRaw: string;
}

const DEFAULT_STATE: State = {
  origin: "https://myapp.com",
  method: "PUT",
  requestHeaders: "X-Custom-Header",
  contentType: "application/json",
  withCredentials: false,
  responseHeadersRaw: "access-control-allow-origin: https://myapp.com\naccess-control-allow-methods: GET, POST, PUT",
};

export default function CorsDebuggerClient() {
  const [state, setState] = useState<State>(DEFAULT_STATE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...DEFAULT_STATE, ...JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const update = <K extends keyof State>(key: K, value: State[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const result = useMemo(() => {
    const requestHeaders = state.requestHeaders.split(",").map((h) => h.trim()).filter(Boolean);
    const responseHeaders: Record<string, string> = {};
    for (const h of parseHeaders(state.responseHeadersRaw)) responseHeaders[h.name] = h.value;
    return checkCors({
      origin: state.origin.trim(),
      method: state.method,
      requestHeaders,
      contentType: state.contentType.trim(),
      withCredentials: state.withCredentials,
      responseHeaders,
    });
  }, [state]);

  const inputClass =
    "w-full px-3 py-1.5 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout
      title="CORS Error Debugger"
      description="Walk through exactly why a cross-origin request would be blocked — or confirm it wouldn't be"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Request origin</label>
            <input
              type="text"
              value={state.origin}
              onChange={(e) => update("origin", e.target.value)}
              spellCheck={false}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Method</label>
              <select
                value={state.method}
                onChange={(e) => update("method", e.target.value)}
                className={inputClass}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Content-Type</label>
              <input
                type="text"
                value={state.contentType}
                onChange={(e) => update("contentType", e.target.value)}
                spellCheck={false}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Custom request headers (comma-separated)</label>
            <input
              type="text"
              value={state.requestHeaders}
              onChange={(e) => update("requestHeaders", e.target.value)}
              placeholder="Authorization, X-Custom-Header"
              spellCheck={false}
              className={inputClass}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#cccccc] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={state.withCredentials}
              onChange={(e) => update("withCredentials", e.target.checked)}
              className="w-3.5 h-3.5 accent-[#a855f7]"
            />
            Request includes credentials (cookies / Authorization header, fetch credentials: &quot;include&quot;)
          </label>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">
              Response headers you actually received
            </label>
            <textarea
              value={state.responseHeadersRaw}
              onChange={(e) => update("responseHeadersRaw", e.target.value)}
              rows={6}
              spellCheck={false}
              className="w-full p-3 font-mono text-xs resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div
            className={`flex items-center gap-2 p-3 rounded-[8px] border text-sm font-medium ${
              result.verdict === "allowed"
                ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]"
                : "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
            }`}
          >
            {result.verdict === "allowed" ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {result.verdict === "allowed" ? "Allowed — this request would succeed" : "Blocked by CORS"}
          </div>

          {result.needsPreflight && (
            <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <p className="flex items-center gap-1.5 text-xs text-[#a855f7] font-medium mb-1.5">
                <Info size={12} /> This request needs a preflight (OPTIONS) first
              </p>
              <ul className="space-y-1">
                {result.preflightReasons.map((r, i) => (
                  <li key={i} className="text-xs text-[#888888]">• {r}</li>
                ))}
              </ul>
              <p className="text-[10px] text-[#555555] mt-1.5">
                Make sure the headers pasted on the left are the preflight (OPTIONS) response, not the actual request&apos;s response.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {result.checks.map((c, i) => (
              <div
                key={i}
                className={`p-3 rounded-[8px] border ${
                  c.pass ? "bg-[#22c55e]/5 border-[#22c55e]/20" : "bg-[#ef4444]/10 border-[#ef4444]/30"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {c.pass ? (
                    <CheckCircle size={13} className="text-[#22c55e] shrink-0" />
                  ) : (
                    <XCircle size={13} className="text-[#ef4444] shrink-0" />
                  )}
                  <span className={`text-xs font-semibold ${c.pass ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{c.label}</span>
                </div>
                <p className="text-xs text-[#cccccc] leading-relaxed">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        CORS is enforced entirely by the browser based on what the server&apos;s response headers say —
        there is no fix on the client side. Every fix for a CORS failure happens in the server&apos;s
        configuration (adding or correcting Access-Control-* headers), never in the requesting code.
      </div>
    </ToolLayout>
  );
}
