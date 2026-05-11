"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Braces, Minimize2, Trash2, AlertCircle, ChevronRight, ChevronDown } from "lucide-react";

const STORAGE_KEY = "toolninja:json-formatter";

// ─── Syntax highlighter ───────────────────────────────────────────────────
function syntaxHighlight(json: string): string {
  json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return json.replace(
    /(\s*"(\\.|[^"\\])*"\s*):|("(\\.|[^"\\])*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match, _p1, _p2, p3) {
      if (_p1 !== undefined) return `<span class="json-key">${match}</span>`;
      if (p3 !== undefined) {
        let cls = "json-string";
        if (p3 === "true" || p3 === "false") cls = "json-bool";
        else if (p3 === "null") cls = "json-null";
        else if (/^-?\d/.test(p3)) cls = "json-number";
        return `<span class="${cls}">${p3}</span>`;
      }
      return match;
    }
  );
}

// ─── Tree view ────────────────────────────────────────────────────────────
function TreeNode({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);

  if (value === null) return <span className="json-null">null</span>;
  if (typeof value === "boolean") return <span className="json-bool">{String(value)}</span>;
  if (typeof value === "number") return <span className="json-number">{value}</span>;
  if (typeof value === "string") return <span className="json-string">{'"'}{value}{'"'}</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-[#888888]">[]</span>;
    return (
      <span>
        <button onClick={() => setOpen((o) => !o)} className="text-[#555555] hover:text-[#888888] mr-1 align-middle">
          {open ? <ChevronDown size={11} className="inline" /> : <ChevronRight size={11} className="inline" />}
        </button>
        <span className="text-[#888888]">[</span>
        {open ? (
          <div className="ml-4 border-l border-[#1e1e1e] pl-3">
            {value.map((v, i) => (
              <div key={i} className="leading-relaxed">
                <span className="text-[#444444] mr-1">{i}</span>
                <TreeNode value={v} depth={depth + 1} />
                {i < value.length - 1 && <span className="text-[#555555]">,</span>}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[#555555]"> {value.length} items </span>
        )}
        <span className="text-[#888888]">]</span>
      </span>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-[#888888]">{"{}"}</span>;
    return (
      <span>
        <button onClick={() => setOpen((o) => !o)} className="text-[#555555] hover:text-[#888888] mr-1 align-middle">
          {open ? <ChevronDown size={11} className="inline" /> : <ChevronRight size={11} className="inline" />}
        </button>
        <span className="text-[#888888]">{"{"}</span>
        {open ? (
          <div className="ml-4 border-l border-[#1e1e1e] pl-3">
            {entries.map(([k, v], i) => (
              <div key={k} className="leading-relaxed">
                <span className="json-key">{'"'}{k}{'"'}</span>
                <span className="text-[#888888]">: </span>
                <TreeNode value={v} depth={depth + 1} />
                {i < entries.length - 1 && <span className="text-[#555555]">,</span>}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[#555555]"> {entries.length} keys </span>
        )}
        <span className="text-[#888888]">{"}"}</span>
      </span>
    );
  }

  return <span className="text-[#f5f5f5]">{String(value)}</span>;
}

// ─── JSONPath evaluator ───────────────────────────────────────────────────
function evalJsonPath(root: unknown, path: string): unknown {
  if (path === "$") return root;
  if (!path.startsWith("$")) throw new Error("Path must start with $");
  let cur: unknown = root;
  let i = 1;
  while (i < path.length) {
    if (path[i] === ".") {
      i++;
      let key = "";
      while (i < path.length && path[i] !== "." && path[i] !== "[") key += path[i++];
      if (!key) throw new Error("Empty key after '.'");
      if (cur === null || typeof cur !== "object" || Array.isArray(cur))
        throw new Error(`Cannot access "${key}" on non-object`);
      cur = (cur as Record<string, unknown>)[key];
    } else if (path[i] === "[") {
      i++;
      let idx = "";
      while (i < path.length && path[i] !== "]") idx += path[i++];
      i++; // skip ]
      const n = parseInt(idx, 10);
      if (isNaN(n)) throw new Error(`Invalid array index: ${idx}`);
      if (!Array.isArray(cur)) throw new Error("Not an array");
      cur = (cur as unknown[])[n];
    } else {
      throw new Error(`Unexpected character: ${path[i]}`);
    }
  }
  return cur;
}

// ─── Main component ───────────────────────────────────────────────────────
type Tab = "formatted" | "tree" | "jsonpath";

export default function JsonFormatterClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("formatted");
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [jsonPath, setJsonPath] = useState("$");
  const [pathResult, setPathResult] = useState<{ value: unknown; error: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const format = useCallback((text: string) => {
    if (!text.trim()) {
      setOutput("");
      setError("");
      setParsedJson(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      setOutput(JSON.stringify(parsed, null, 2));
      setParsedJson(parsed);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
      setParsedJson(null);
    }
  }, []);

  const minify = () => {
    if (!input.trim()) return;
    try {
      setOutput(JSON.stringify(JSON.parse(input)));
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
    }
  };

  const clear = () => {
    setInput("");
    setOutput("");
    setError("");
    setParsedJson(null);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    setTimeout(() => format(text), 0);
  };

  useEffect(() => {
    if (parsedJson === null || !jsonPath) {
      setPathResult(null);
      return;
    }
    try {
      const value = evalJsonPath(parsedJson, jsonPath);
      setPathResult({ value, error: "" });
    } catch (e: unknown) {
      setPathResult({ value: null, error: e instanceof Error ? e.message : "Invalid path" });
    }
  }, [parsedJson, jsonPath]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "formatted", label: "Formatted" },
    { id: "tree", label: "Tree" },
    { id: "jsonpath", label: "JSONPath" },
  ];

  return (
    <ToolLayout title="JSON Formatter" description="Format, validate, explore and query JSON">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => format(input)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
        >
          <Braces size={14} /> Format
        </button>
        <button
          onClick={minify}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
        >
          <Minimize2 size={14} /> Minify
        </button>
        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors"
        >
          <Trash2 size={14} /> Clear
        </button>
        {output && <CopyButton text={output} />}
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-280px)] min-h-[400px]">
        {/* Input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Input</label>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              format(e.target.value);
            }}
            onPaste={handlePaste}
            placeholder="Paste or type JSON here..."
            className={`flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${error ? "border-[#ef4444]" : "border-[#222222]"}`}
            spellCheck={false}
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>

        {/* Right panel with tabs */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Tab bar */}
          <div className="flex rounded-[6px] border border-[#222222] overflow-hidden self-start">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 text-xs border-r last:border-0 border-[#222222] transition-colors ${t.id === tab ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Formatted tab */}
          {tab === "formatted" && (
            <div
              className="flex-1 p-3 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] overflow-auto"
              style={{ minHeight: 0 }}
            >
              {output ? (
                <pre
                  className="text-sm leading-relaxed m-0 p-0 bg-transparent"
                  dangerouslySetInnerHTML={{ __html: syntaxHighlight(output) }}
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                />
              ) : (
                <p className="text-[#444444] text-sm italic">
                  {error ? "Fix the JSON error to see output" : "Formatted JSON will appear here..."}
                </p>
              )}
            </div>
          )}

          {/* Tree tab */}
          {tab === "tree" && (
            <div
              className="flex-1 p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] overflow-auto leading-relaxed"
              style={{ minHeight: 0 }}
            >
              {parsedJson !== null ? (
                <TreeNode key={output} value={parsedJson} depth={0} />
              ) : (
                <p className="text-[#444444] italic">
                  {error ? "Fix JSON error to view tree" : "Tree view will appear here..."}
                </p>
              )}
            </div>
          )}

          {/* JSONPath tab */}
          {tab === "jsonpath" && (
            <div className="flex flex-col gap-2 flex-1" style={{ minHeight: 0 }}>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">
                  Path{" "}
                  <span className="text-[#555555]">$.key, $.arr[0], $.a.b.c</span>
                </label>
                <input
                  type="text"
                  value={jsonPath}
                  onChange={(e) => setJsonPath(e.target.value)}
                  placeholder="$.key.array[0].value"
                  className="w-full px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                  spellCheck={false}
                />
              </div>
              <div
                className="flex-1 p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] overflow-auto"
                style={{ minHeight: 0 }}
              >
                {pathResult ? (
                  pathResult.error ? (
                    <span className="text-[#ef4444]">{pathResult.error}</span>
                  ) : (
                    <pre
                      className="m-0 p-0 bg-transparent text-[#22c55e] whitespace-pre-wrap break-all"
                    >
                      {JSON.stringify(pathResult.value, null, 2)}
                    </pre>
                  )
                ) : (
                  <p className="text-[#444444] italic">
                    {error
                      ? "Fix JSON error to query"
                      : parsedJson === null
                      ? "Format JSON first, then query with $"
                      : "Enter a JSONPath expression above"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
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
