"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { parseHeaders, type HeaderCategory } from "@/lib/http-headers-reference";
import { HelpCircle } from "lucide-react";

const STORAGE_KEY = "toolninja:http-header-inspector";

const CATEGORY_STYLES: Record<HeaderCategory, string> = {
  Security: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30",
  Caching: "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30",
  CORS: "bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30",
  General: "bg-[#555555]/10 text-[#888888] border-[#555555]/30",
};

const CATEGORIES: HeaderCategory[] = ["Security", "Caching", "CORS", "General"];

const EXAMPLE = `HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
cache-control: public, max-age=3600
etag: "a1b2c3d4"
vary: Accept-Encoding
access-control-allow-origin: *
x-powered-by: Express
server: nginx/1.25.3`;

export default function HttpHeaderInspectorClient() {
  const [input, setInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<HeaderCategory | "All">("All");

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

  const headers = useMemo(() => parseHeaders(input), [input]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { Security: 0, Caching: 0, CORS: 0, General: 0 };
    for (const h of headers) c[h.category]++;
    return c;
  }, [headers]);
  const visibleHeaders = activeCategory === "All" ? headers : headers.filter((h) => h.category === activeCategory);

  return (
    <ToolLayout
      title="HTTP Header Inspector"
      description="Paste raw response headers and get a plain-English explanation of every one"
    >
      <div className="mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">
          Raw headers (from curl -v, DevTools, or a Response object)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"content-type: application/json\ncache-control: no-store"}
          rows={10}
          spellCheck={false}
          className="w-full p-3 font-mono text-xs resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
      </div>

      {headers.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-2.5 py-1 text-xs rounded-[6px] border transition-colors ${
                activeCategory === "All" ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
              }`}
            >
              All ({headers.length})
            </button>
            {CATEGORIES.filter((c) => counts[c] > 0).map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-2.5 py-1 text-xs rounded-[6px] border transition-colors ${
                  activeCategory === c ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                {c} ({counts[c]})
              </button>
            ))}
          </div>
        <div className="space-y-2">
          {visibleHeaders.map((h, i) => (
            <div key={i} className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-sm">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-[3px] border font-sans font-semibold tracking-wider not-italic ${CATEGORY_STYLES[h.category]}`}>
                  {h.category}
                </span>
                <span className="text-[#a855f7] font-semibold">{h.name}</span>
                <span className="text-[#f5f5f5] break-all">{h.value}</span>
              </div>
              {h.description ? (
                <p className="text-xs text-[#888888] leading-relaxed mt-1.5">{h.description}</p>
              ) : (
                <p className="text-xs text-[#555555] leading-relaxed mt-1.5 flex items-center gap-1">
                  <HelpCircle size={11} /> Not a header this tool has a description for — likely a custom or less common one.
                </p>
              )}
            </div>
          ))}
        </div>
        </>
      ) : (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Paste headers above — one per line, as &quot;Name: value&quot;
        </div>
      )}
    </ToolLayout>
  );
}
