"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, Terminal } from "lucide-react";
import { parseCurl } from "@/lib/curl-parser";
import { LANGUAGES } from "@/lib/curl-generators";

const STORAGE_KEY = "toolninja:curl-to-code";

function fromBase64Url(b64url: string): string {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return decodeURIComponent(escape(atob(b64)));
}

const EXAMPLE = `curl -X POST "https://api.example.com/users" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"name": "Jane", "email": "jane@example.com"}'`;

export default function CurlToCodeClient() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState(LANGUAGES[0].id);

  useEffect(() => {
    const fromQuery = searchParams.get("cmd");
    if (fromQuery) {
      try {
        setInput(fromBase64Url(fromQuery));
        return;
      } catch {}
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, input); } catch {}
  }, [input]);

  const parsed = useMemo(() => parseCurl(input), [input]);
  const activeLang = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];
  const output = parsed.error ? "" : activeLang.generator(parsed);

  return (
    <ToolLayout
      title="cURL to Code"
      description="Paste a curl command, get working code in JavaScript, Python, PHP, or Go"
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-[#888888] font-medium">curl command</label>
          {!input && (
            <button
              onClick={() => setInput(EXAMPLE)}
              className="text-xs text-[#a855f7] hover:text-[#c084fc] transition-colors"
            >
              Load example
            </button>
          )}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'curl -X GET "https://api.example.com/data" -H "Authorization: Bearer TOKEN"'}
          rows={5}
          spellCheck={false}
          className={`w-full p-3 font-mono text-xs resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${
            parsed.error && input ? "border-[#ef4444]" : "border-[#222222]"
          }`}
        />
        {parsed.error && input && (
          <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
            <AlertCircle size={12} /> {parsed.error}
          </div>
        )}
      </div>

      {!parsed.error && input && (
        <>
          {/* Parsed summary */}
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
            <span className="px-2 py-1 rounded-[6px] bg-[#a855f7]/10 text-[#a855f7] font-mono font-semibold">
              {parsed.method}
            </span>
            <span className="text-[#888888] font-mono break-all">{parsed.url}</span>
            {Object.keys(parsed.headers).length > 0 && (
              <span className="text-[#555555]">
                · {Object.keys(parsed.headers).length} header{Object.keys(parsed.headers).length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Language tabs */}
          <div className="flex flex-wrap gap-1 mb-3">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                onClick={() => setLanguage(l.id)}
                className={`px-3 py-1.5 text-xs rounded-[6px] border transition-colors ${
                  l.id === language
                    ? "bg-[#a855f7] border-[#a855f7] text-white"
                    : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Output */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888888] font-medium">{activeLang.label}</label>
              <CopyButton text={output} size="sm" />
            </div>
            <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto max-h-[500px]">
              {output}
            </pre>
          </div>
        </>
      )}

      {!input && (
        <div className="flex items-center gap-2 p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px] justify-center">
          <Terminal size={16} />
          Paste a curl command above to generate code
        </div>
      )}
    </ToolLayout>
  );
}
