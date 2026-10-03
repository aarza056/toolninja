"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import { Play, Copy, Check, AlertTriangle, RotateCcw } from "lucide-react";
import { queryJsonPath, type JsonPathMatch } from "@/lib/jsonpath";

const DEFAULT_JSON = `{
  "store": {
    "book": [
      { "category": "fiction", "title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "price": 12.99 },
      { "category": "fiction", "title": "To Kill a Mockingbird", "author": "Harper Lee", "price": 10.99 },
      { "category": "reference", "title": "Learning XML", "author": "Erik T. Ray", "price": 39.95 }
    ],
    "bicycle": { "color": "red", "price": 199.95 }
  }
}`;

const QUICK_EXPRESSIONS = [
  { label: "All books", expr: "$.store.book[*]" },
  { label: "All titles", expr: "$.store.book[*].title" },
  { label: "First book", expr: "$.store.book[0]" },
  { label: "Last book (slice)", expr: "$.store.book[-1:]" },
  { label: "First two books", expr: "$.store.book[0:2]" },
  { label: "All prices (any depth)", expr: "$..price" },
  { label: "Fiction authors", expr: "$.store.book[0,1].author" },
];

const LS_DOC_KEY = "toolninja_jsonpath_doc";
const LS_EXPR_KEY = "toolninja_jsonpath_expr";

function formatValue(v: unknown): string {
  if (typeof v === "string") return v;
  return JSON.stringify(v, null, 2);
}

function valueType(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

const TYPE_COLORS: Record<string, string> = {
  object: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  array: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  string: "bg-green-500/10 text-green-400 border-green-500/20",
  number: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  boolean: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  null: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function JsonPathTesterClient() {
  const [docContent, setDocContent] = useState(DEFAULT_JSON);
  const [expression, setExpression] = useState("$.store.book[*].title");
  const [results, setResults] = useState<JsonPathMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const savedDoc = localStorage.getItem(LS_DOC_KEY);
      const savedExpr = localStorage.getItem(LS_EXPR_KEY);
      if (savedDoc) setDocContent(savedDoc);
      if (savedExpr) setExpression(savedExpr);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_DOC_KEY, docContent);
      localStorage.setItem(LS_EXPR_KEY, expression);
    } catch {}
  }, [docContent, expression]);

  const run = useCallback(() => {
    setHasRun(true);
    let data: unknown;
    try {
      data = JSON.parse(docContent);
    } catch {
      setResults([]);
      setError("Invalid JSON document — fix the syntax errors before querying.");
      return;
    }
    try {
      setResults(queryJsonPath(data, expression));
      setError(null);
    } catch (e) {
      setResults([]);
      setError(e instanceof Error ? e.message : "Invalid JSONPath expression");
    }
  }, [docContent, expression]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      run();
    }
  };

  const copyResults = () => {
    const text = results.map((r) => formatValue(r.value)).join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetDoc = () => {
    setDocContent(DEFAULT_JSON);
    setResults([]);
    setError(null);
    setHasRun(false);
  };

  return (
    <ToolLayout
      title="JSONPath Tester"
      description="Query JSON with JSONPath expressions and see matches live, with the exact path to each one"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Panel — Document */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#888888]">JSON Document</label>
            <button
              onClick={resetDoc}
              className="flex items-center gap-1 text-xs text-[#555555] hover:text-[#888888] transition-colors"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          </div>
          <textarea
            value={docContent}
            onChange={(e) => {
              setDocContent(e.target.value);
              setHasRun(false);
            }}
            spellCheck={false}
            className="w-full h-80 px-3 py-3 bg-[#0d0d0d] border border-[#222222] rounded-[8px] text-xs text-[#c9d1d9] font-mono focus:outline-none focus:border-[#a855f7] resize-none leading-relaxed"
            placeholder="Paste your JSON here…"
          />

          <div>
            <label className="text-xs font-medium text-[#888888] mb-2 block">JSONPath Expression</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={expression}
                onChange={(e) => {
                  setExpression(e.target.value);
                  setHasRun(false);
                }}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="flex-1 px-3 py-2.5 bg-[#0d0d0d] border border-[#222222] rounded-[8px] text-sm text-[#c9d1d9] font-mono focus:outline-none focus:border-[#a855f7]"
                placeholder="$.store.book[*].title"
              />
              <button
                onClick={run}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#a855f7] hover:bg-[#9333ea] text-white text-sm font-medium rounded-[8px] transition-colors flex-shrink-0"
              >
                <Play size={14} />
                Run
              </button>
            </div>
            <p className="text-[10px] text-[#444444] mt-1.5">Ctrl+Enter to run</p>
          </div>

          <div>
            <p className="text-[10px] text-[#555555] mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EXPRESSIONS.map((q) => (
                <button
                  key={q.expr}
                  onClick={() => {
                    setExpression(q.expr);
                    setHasRun(false);
                  }}
                  className="text-[11px] px-2 py-1 bg-[#111111] border border-[#222222] rounded-[4px] text-[#666666] hover:text-[#f5f5f5] hover:border-[#333333] transition-colors font-mono"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel — Results */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#888888]">
              {hasRun ? (error ? "Error" : `${results.length} match${results.length !== 1 ? "es" : ""}`) : "Results"}
            </label>
            {hasRun && !error && results.length > 0 && (
              <button
                onClick={copyResults}
                className="flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#888888] transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={11} className="text-[#22c55e]" />
                    <span className="text-[#22c55e]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    Copy all
                  </>
                )}
              </button>
            )}
          </div>

          <div className="h-80 bg-[#0d0d0d] border border-[#222222] rounded-[8px] overflow-auto">
            {!hasRun ? (
              <div className="h-full flex items-center justify-center text-[#333333] text-sm">
                Enter an expression and press Run
              </div>
            ) : error ? (
              <div className="p-4">
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-[6px]">
                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 font-mono break-all">{error}</p>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#555555] text-sm">No matches</div>
            ) : (
              <div className="p-3 space-y-2">
                {results.map((r, i) => (
                  <ResultItem key={i} result={r} />
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-[8px]">
            <p className="text-[10px] font-semibold text-[#555555] uppercase tracking-wider mb-2">Supported syntax</p>
            <ul className="space-y-1">
              {[
                "$ root · . child · .. recursive descent (any depth)",
                "[*] wildcard · [0] index · [-1] from the end",
                "[0,2] multiple indices · [0:2] slice (start:end:step)",
                "Filter expressions like [?(@.price<10)] aren't supported",
              ].map((tip) => (
                <li key={tip} className="text-[11px] text-[#444444] font-mono">{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

function ResultItem({ result }: { result: JsonPathMatch }) {
  const [copied, setCopied] = useState(false);
  const type = valueType(result.value);

  const copy = () => {
    navigator.clipboard.writeText(formatValue(result.value)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group flex items-start gap-2 p-2.5 bg-[#111111] border border-[#1a1a1a] rounded-[6px] hover:border-[#2a2a2a] transition-colors">
      <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-[3px] border font-semibold tracking-wider mt-0.5 ${TYPE_COLORS[type] ?? TYPE_COLORS.null}`}>
        {type}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[#555555] font-mono mb-1">{result.path}</p>
        <pre className="text-xs text-[#c9d1d9] font-mono whitespace-pre-wrap break-all leading-relaxed m-0">
          {formatValue(result.value)}
        </pre>
      </div>
      <button
        onClick={copy}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-[#444444] hover:text-[#888888] transition-all mt-0.5"
        aria-label="Copy value"
      >
        {copied ? <Check size={12} className="text-[#22c55e]" /> : <Copy size={12} />}
      </button>
    </div>
  );
}
