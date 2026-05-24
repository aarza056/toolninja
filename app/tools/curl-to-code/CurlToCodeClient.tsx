"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { parseCurl } from "@/lib/curl-parser";
import { generateCode, LANGUAGES } from "@/lib/curl-generators";
import {
  AlertTriangle,
  Download,
  Link2,
  RotateCcw,
  Terminal,
} from "lucide-react";

const STORAGE_KEY = "toolninja:curl-to-code";

const EXAMPLES = [
  {
    label: "GET request",
    command: `curl https://api.github.com/users/octocat`,
  },
  {
    label: "POST JSON",
    command: `curl -X POST https://api.example.com/users \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer token123" \\
  -d '{"name": "John Doe", "email": "john@example.com"}'`,
  },
  {
    label: "File upload",
    command: `curl -X POST https://api.example.com/upload \\
  -H "Authorization: Bearer token123" \\
  -F "file=@/path/to/file.pdf" \\
  -F "description=My document"`,
  },
  {
    label: "Basic auth",
    command: `curl -u username:password \\
  https://api.example.com/protected`,
  },
  {
    label: "With cookies",
    command: `curl https://api.example.com/profile \\
  -H "Cookie: session=abc123; token=xyz" \\
  -H "Accept: application/json"`,
  },
  {
    label: "DELETE",
    command: `curl -X DELETE https://api.example.com/users/123 \\
  -H "Authorization: Bearer token123"`,
  },
];

export default function CurlToCodeClient() {
  const [input, setInput] = useState("");
  const [activeLang, setActiveLang] = useState(LANGUAGES[0].id);
  const [shared, setShared] = useState(false);

  // Load persisted input and check share param on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) {
        const decoded = atob(q);
        setInput(decoded);
        return;
      }
    } catch {}
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return parseCurl(input);
    } catch {
      return null;
    }
  }, [input]);

  const output = useMemo(() => {
    if (!parsed || !parsed.url) return "";
    return generateCode(parsed, activeLang);
  }, [parsed, activeLang]);

  const loadExample = useCallback((cmd: string) => {
    setInput(cmd);
  }, []);

  const reset = useCallback(() => {
    setInput("");
  }, []);

  const handleShare = useCallback(() => {
    if (!input.trim()) return;
    const encoded = btoa(input);
    const url = `${window.location.origin}${window.location.pathname}?q=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    });
  }, [input]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const lang = LANGUAGES.find((l) => l.id === activeLang);
    const ext = lang?.ext ?? "txt";
    const blob = new Blob([output], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `curl-request.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [output, activeLang]);

  const activeLangInfo = LANGUAGES.find((l) => l.id === activeLang)!;

  const flagCount = parsed?.flagCount ?? 0;
  const notes = parsed?.notes ?? [];

  return (
    <ToolLayout
      title="cURL to Code"
      description="Convert cURL commands to Python, JavaScript, PHP, Go, Java, C# and Ruby"
    >
      {/* Language tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setActiveLang(lang.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors border ${
              activeLang === lang.id
                ? "border-[#a855f7] bg-[#a855f7]/10 text-white"
                : "border-white/10 bg-[#1a1a1a] text-gray-400 hover:text-white hover:border-white/20"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: lang.color }}
            />
            <span className="font-medium">{lang.label}</span>
            <span className="text-xs opacity-60">{lang.sublabel}</span>
          </button>
        ))}
      </div>

      {/* Examples */}
      <div className="mb-5">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Quick examples
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => loadExample(ex.command)}
              className="px-3 py-1.5 rounded-md text-xs bg-[#1a1a1a] border border-white/10 text-gray-300 hover:text-white hover:border-purple-500/50 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Two-panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <Terminal size={12} />
              cURL Command
            </label>
            <button
              onClick={reset}
              className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} />
              Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`curl -X POST https://api.example.com/users \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer token123" \\
  -d '{"name": "Alice"}'`}
            className="w-full h-72 bg-[#111] border border-white/10 rounded-lg p-4 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
            spellCheck={false}
          />
          <p className="text-xs text-gray-600">
            Multi-line commands with backslash continuation are supported.
          </p>
        </div>

        {/* Output */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: activeLangInfo.color }}
              />
              {activeLangInfo.label} ({activeLangInfo.sublabel})
            </label>
            <div className="flex items-center gap-2">
              {output && (
                <>
                  <CopyButton text={output} size="sm" />
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-[6px] border border-[#222222] text-[#888888] hover:border-[#a855f7] hover:text-[#a855f7] bg-[#111111] transition-colors"
                    title="Download file"
                  >
                    <Download size={12} />
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Generated code will appear here..."
            className="w-full h-72 bg-[#111] border border-white/10 rounded-lg p-4 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Stats / Share bar */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        {flagCount > 0 && (
          <span className="text-gray-400">
            <span className="text-purple-400 font-medium">{flagCount}</span> flag{flagCount !== 1 ? "s" : ""} parsed
          </span>
        )}
        {parsed?.url && (
          <span className="text-gray-400">
            <span className="text-gray-300 font-mono text-[11px]">{parsed.method}</span>{" "}
            <span className="text-gray-500 truncate max-w-[260px] inline-block align-bottom">{parsed.url}</span>
          </span>
        )}
        <button
          onClick={handleShare}
          className="ml-auto flex items-center gap-1.5 hover:text-gray-300 transition-colors"
        >
          <Link2 size={12} />
          {shared ? "Link copied!" : "Share"}
        </button>
      </div>

      {/* Notes / warnings */}
      {notes.length > 0 && (
        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2">
          {notes.map((note, i) => (
            <div key={i} className="flex items-start gap-3">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-300">{note}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty-state hint */}
      {!input.trim() && (
        <div className="mt-6 p-5 bg-[#111] border border-white/5 rounded-lg text-center">
          <p className="text-sm text-gray-500">
            Paste any <span className="text-gray-300 font-mono">curl</span> command above — from API docs, Postman exports, or your terminal history.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Supports{" "}
            {["-X", "-H", "-d", "-u", "-b", "-F", "-L", "-k", "--max-time"].join(" · ")}
          </p>
        </div>
      )}
    </ToolLayout>
  );
}
