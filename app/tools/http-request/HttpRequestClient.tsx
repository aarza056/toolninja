"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import { Loader2, Plus, Trash2, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

interface Header {
  id: number;
  key: string;
  value: string;
}

interface Response {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

type ActiveTab = "headers" | "body" | "response";

const METHOD_COLORS: Record<Method, string> = {
  GET: "#22c55e",
  POST: "#3b82f6",
  PUT: "#eab308",
  PATCH: "#f97316",
  DELETE: "#ef4444",
  HEAD: "#888888",
  OPTIONS: "#888888",
};

const METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return "#22c55e";
  if (status >= 300 && status < 400) return "#f97316";
  return "#ef4444";
}

function statusBg(status: number): string {
  if (status >= 200 && status < 300) return "rgba(34,197,94,0.1)";
  if (status >= 300 && status < 400) return "rgba(249,115,22,0.1)";
  return "rgba(239,68,68,0.1)";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function tryPrettyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function isJsonContentType(headers: Record<string, string>): boolean {
  const ct = headers["content-type"] || headers["Content-Type"] || "";
  return ct.includes("application/json");
}

let headerIdCounter = 2;

export default function HttpRequestClient() {
  const [method, setMethod] = useState<Method>("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts/1");
  const [headers, setHeaders] = useState<Header[]>([
    { id: 1, key: "Content-Type", value: "application/json" },
  ]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("headers");
  const [responseHeadersOpen, setResponseHeadersOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const sendRequest = async () => {
    setLoading(true);
    setError("");
    const start = Date.now();
    try {
      const hdrs = Object.fromEntries(
        headers.filter((h) => h.key && h.value).map((h) => [h.key, h.value])
      );
      const opts: RequestInit = { method, headers: hdrs };
      if (body && !["GET", "HEAD"].includes(method)) opts.body = body;
      const res = await fetch(url, opts);
      const text = await res.text();
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        responseHeaders[k] = v;
      });
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: text,
        time: Date.now() - start,
        size: new TextEncoder().encode(text).length,
      });
      setActiveTab("response");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const addHeader = () => {
    setHeaders((prev) => [
      ...prev,
      { id: headerIdCounter++, key: "", value: "" },
    ]);
  };

  const removeHeader = (id: number) => {
    setHeaders((prev) => prev.filter((h) => h.id !== id));
  };

  const updateHeader = (id: number, field: "key" | "value", val: string) => {
    setHeaders((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: val } : h))
    );
  };

  const copyBody = () => {
    if (!response) return;
    const text = isJsonContentType(response.headers)
      ? tryPrettyJson(response.body)
      : response.body;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const inputClass =
    "flex-1 px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: "headers", label: "Headers" },
    { id: "body", label: "Body" },
    { id: "response", label: "Response" },
  ];

  const bodyDisabled = ["GET", "HEAD"].includes(method);

  return (
    <ToolLayout
      title="HTTP Request Builder"
      description="Send HTTP requests directly from the browser and inspect responses"
    >
      {/* Request line */}
      <div className="flex gap-2 mb-4 flex-wrap sm:flex-nowrap">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as Method)}
          className="bg-[#111111] border border-[#222222] rounded-[6px] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#a855f7] shrink-0"
          style={{ color: METHOD_COLORS[method] }}
        >
          {METHODS.map((m) => (
            <option key={m} value={m} style={{ color: METHOD_COLORS[m] }}>
              {m}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && sendRequest()}
          placeholder="https://api.example.com/endpoint"
          className={`${inputClass} flex-1 min-w-0`}
          spellCheck={false}
        />

        <button
          onClick={sendRequest}
          disabled={loading || !url.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[6px] transition-colors shrink-0"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : null}
          {loading ? "Sending…" : "Send"}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px] text-[#ef4444] text-xs font-mono break-all">
          {error}
        </div>
      )}

      {/* CORS warning */}
      <div className="mb-4 p-3 bg-[#f97316]/10 border border-[#f97316]/30 rounded-[8px] text-[#f97316] text-xs">
        ⚠ Browser requests are subject to CORS. Cross-origin APIs without proper CORS headers will
        fail. For unrestricted requests, use curl or a backend proxy.
      </div>

      {/* Tab bar */}
      <div className="flex rounded-[6px] border border-[#222222] overflow-hidden mb-3 self-start w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 text-xs border-r last:border-0 border-[#222222] transition-colors relative ${
              t.id === activeTab
                ? "bg-[#a855f7] text-white"
                : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"
            }`}
          >
            {t.label}
            {t.id === "response" && response && (
              <span
                className="ml-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-bold px-1 min-w-[18px] h-[18px]"
                style={{
                  background: statusBg(response.status),
                  color: statusColor(response.status),
                }}
              >
                {response.status}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Headers tab */}
      {activeTab === "headers" && (
        <div className="space-y-2">
          {headers.map((h) => (
            <div key={h.id} className="flex gap-2 items-center">
              <input
                type="text"
                value={h.key}
                onChange={(e) => updateHeader(h.id, "key", e.target.value)}
                placeholder="Header name"
                className={`${inputClass} flex-1`}
                spellCheck={false}
              />
              <input
                type="text"
                value={h.value}
                onChange={(e) => updateHeader(h.id, "value", e.target.value)}
                placeholder="Value"
                className={`${inputClass} flex-1`}
                spellCheck={false}
              />
              <button
                onClick={() => removeHeader(h.id)}
                className="p-2 text-[#555555] hover:text-[#ef4444] transition-colors shrink-0"
                title="Remove header"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={addHeader}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors mt-2"
          >
            <Plus size={14} /> Add Header
          </button>
        </div>
      )}

      {/* Body tab */}
      {activeTab === "body" && (
        <div className="relative">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder={
              bodyDisabled
                ? `${method} requests do not have a body`
                : '{"key": "value"}'
            }
            disabled={bodyDisabled}
            className={`w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] transition-colors ${
              bodyDisabled ? "opacity-40 cursor-not-allowed" : ""
            }`}
            spellCheck={false}
          />
          {bodyDisabled && (
            <p className="mt-1.5 text-xs text-[#555555]">
              {method} requests cannot include a body.
            </p>
          )}
        </div>
      )}

      {/* Response tab */}
      {activeTab === "response" && (
        <div className="space-y-4">
          {response ? (
            <>
              {/* Status bar */}
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-sm font-mono font-semibold"
                  style={{
                    background: statusBg(response.status),
                    color: statusColor(response.status),
                  }}
                >
                  {response.status} {response.statusText}
                </span>
                <span className="text-xs text-[#888888]">
                  <span className="text-[#f5f5f5] font-mono">{response.time}</span> ms
                </span>
                <span className="text-xs text-[#888888]">
                  <span className="text-[#f5f5f5] font-mono">{formatSize(response.size)}</span>
                </span>
              </div>

              {/* Response headers collapsible */}
              <div className="border border-[#222222] rounded-[8px] overflow-hidden">
                <button
                  onClick={() => setResponseHeadersOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-[#111111] text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
                >
                  <span className="font-medium">Response Headers</span>
                  {responseHeadersOpen ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
                {responseHeadersOpen && (
                  <div className="border-t border-[#222222] bg-[#0d0d0d] p-3 space-y-1 max-h-48 overflow-y-auto">
                    {Object.entries(response.headers).map(([k, v]) => (
                      <div key={k} className="flex gap-2 font-mono text-xs">
                        <span className="text-[#a855f7] shrink-0">{k}:</span>
                        <span className="text-[#f5f5f5] break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Response body */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#888888] font-medium">Response Body</span>
                  <button
                    onClick={copyBody}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
                  >
                    {copied ? (
                      <><Check size={12} className="text-[#22c55e]" /> Copied</>
                    ) : (
                      <><Copy size={12} /> Copy</>
                    )}
                  </button>
                </div>
                <pre
                  className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto max-h-96"
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                >
                  {isJsonContentType(response.headers)
                    ? tryPrettyJson(response.body)
                    : response.body}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-[#444444] text-sm">
              Send a request to see the response here
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
