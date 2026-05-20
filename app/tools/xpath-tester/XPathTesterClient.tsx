"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import { Play, Copy, Check, AlertTriangle, RotateCcw } from "lucide-react";

type DocMode = "xml" | "html";

interface XPathResult {
  type: string;
  value: string;
  index: number;
}

const DEFAULT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title lang="en">The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <price>12.99</price>
  </book>
  <book category="fiction">
    <title lang="en">To Kill a Mockingbird</title>
    <author>Harper Lee</author>
    <price>10.99</price>
  </book>
  <book category="reference">
    <title lang="en">Learning XML</title>
    <author>Erik T. Ray</author>
    <price>39.95</price>
  </book>
</bookstore>`;

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head><title>Example Page</title></head>
<body>
  <nav>
    <a href="/home">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>
  <main>
    <h1 class="title">Welcome</h1>
    <ul id="items">
      <li class="active">First item</li>
      <li>Second item</li>
      <li>Third item</li>
    </ul>
    <form action="/submit">
      <input type="text" name="query" placeholder="Search..." required />
      <button type="submit">Go</button>
    </form>
  </main>
</body>
</html>`;

const QUICK_EXPRESSIONS: Record<DocMode, { label: string; expr: string }[]> = {
  xml: [
    { label: "All books", expr: "//book" },
    { label: "Fiction books", expr: "//book[@category='fiction']" },
    { label: "All titles", expr: "//title/text()" },
    { label: "All prices", expr: "//price/text()" },
    { label: "First book", expr: "//book[1]" },
    { label: "Count books", expr: "count(//book)" },
  ],
  html: [
    { label: "All links", expr: "//a" },
    { label: "Link hrefs", expr: "//a/@href" },
    { label: "H1 text", expr: "//h1/text()" },
    { label: "List items", expr: "//li" },
    { label: "Active item", expr: "//li[@class='active']/text()" },
    { label: "Required inputs", expr: "//input[@required]" },
  ],
};

const LS_DOC_KEY = "toolninja_xpath_doc";
const LS_EXPR_KEY = "toolninja_xpath_expr";
const LS_MODE_KEY = "toolninja_xpath_mode";

function getNodeType(node: Node): string {
  switch (node.nodeType) {
    case Node.ELEMENT_NODE: return "element";
    case Node.ATTRIBUTE_NODE: return "attribute";
    case Node.TEXT_NODE: return "text";
    case Node.COMMENT_NODE: return "comment";
    default: return "node";
  }
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const attrs = Array.from(el.attributes)
      .map((a) => `${a.name}="${a.value}"`)
      .join(" ");
    const tag = el.tagName.toLowerCase();
    const inner = el.innerHTML;
    return attrs
      ? `<${tag} ${attrs}>${inner}</${tag}>`
      : `<${tag}>${inner}</${tag}>`;
  }
  if (node.nodeType === Node.ATTRIBUTE_NODE) {
    const attr = node as Attr;
    return `${attr.name}="${attr.value}"`;
  }
  return node.nodeValue ?? "";
}

function evaluateXPath(
  expression: string,
  docContent: string,
  mode: DocMode
): { results: XPathResult[]; error: string | null } {
  if (typeof window === "undefined") return { results: [], error: null };

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      docContent,
      mode === "xml" ? "application/xml" : "text/html"
    );

    if (mode === "xml") {
      const parseError = doc.querySelector("parsererror");
      if (parseError) {
        return { results: [], error: `XML parse error: ${parseError.textContent?.trim() ?? "invalid XML"}` };
      }
    }

    const xpathResult = doc.evaluate(
      expression,
      doc,
      null,
      XPathResult.ANY_TYPE,
      null
    );

    const results: XPathResult[] = [];

    switch (xpathResult.resultType) {
      case XPathResult.NUMBER_TYPE:
        results.push({ type: "number", value: String(xpathResult.numberValue), index: 0 });
        break;
      case XPathResult.STRING_TYPE:
        results.push({ type: "string", value: xpathResult.stringValue, index: 0 });
        break;
      case XPathResult.BOOLEAN_TYPE:
        results.push({ type: "boolean", value: String(xpathResult.booleanValue), index: 0 });
        break;
      default: {
        let node = xpathResult.iterateNext();
        let i = 0;
        while (node) {
          results.push({
            type: getNodeType(node),
            value: serializeNode(node),
            index: i++,
          });
          node = xpathResult.iterateNext();
        }
      }
    }

    return { results, error: null };
  } catch (err) {
    return {
      results: [],
      error: err instanceof Error ? err.message : "Invalid XPath expression",
    };
  }
}

const TYPE_COLORS: Record<string, string> = {
  element: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  attribute: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  text: "bg-green-500/10 text-green-400 border-green-500/20",
  number: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  string: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  boolean: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  comment: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  node: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function XPathTesterClient() {
  const [mode, setMode] = useState<DocMode>("xml");
  const [docContent, setDocContent] = useState(DEFAULT_XML);
  const [expression, setExpression] = useState("//book[@category='fiction']/title/text()");
  const [results, setResults] = useState<XPathResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedDoc = localStorage.getItem(LS_DOC_KEY);
      const savedExpr = localStorage.getItem(LS_EXPR_KEY);
      const savedMode = localStorage.getItem(LS_MODE_KEY) as DocMode | null;
      if (savedMode === "xml" || savedMode === "html") setMode(savedMode);
      if (savedDoc) setDocContent(savedDoc);
      if (savedExpr) setExpression(savedExpr);
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_DOC_KEY, docContent);
      localStorage.setItem(LS_EXPR_KEY, expression);
      localStorage.setItem(LS_MODE_KEY, mode);
    } catch {}
  }, [docContent, expression, mode]);

  const handleModeChange = (newMode: DocMode) => {
    setMode(newMode);
    setDocContent(newMode === "xml" ? DEFAULT_XML : DEFAULT_HTML);
    setExpression(newMode === "xml" ? "//book[@category='fiction']/title/text()" : "//a/@href");
    setResults([]);
    setError(null);
    setHasRun(false);
  };

  const runXPath = useCallback(() => {
    const { results: res, error: err } = evaluateXPath(expression, docContent, mode);
    setResults(res);
    setError(err);
    setHasRun(true);
  }, [expression, docContent, mode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runXPath();
    }
  };

  const copyResults = () => {
    const text = results.map((r) => r.value).join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetDoc = () => {
    setDocContent(mode === "xml" ? DEFAULT_XML : DEFAULT_HTML);
    setResults([]);
    setError(null);
    setHasRun(false);
  };

  return (
    <ToolLayout
      title="XPath Tester"
      description="Test XPath expressions against XML and HTML with live results"
    >
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-[#555555]">Document type:</span>
        {(["xml", "html"] as DocMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`px-3 py-1.5 text-xs rounded-[6px] border transition-colors ${
              mode === m
                ? "bg-[#a855f7] border-[#a855f7] text-white"
                : "bg-[#111111] border-[#222222] text-[#666666] hover:text-[#f5f5f5] hover:border-[#333333]"
            }`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Panel — Document */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#888888]">
              {mode === "xml" ? "XML" : "HTML"} Document
            </label>
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
            placeholder={`Paste your ${mode.toUpperCase()} here…`}
          />

          {/* XPath Expression */}
          <div>
            <label className="text-xs font-medium text-[#888888] mb-2 block">
              XPath Expression
            </label>
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
                placeholder="//element[@attr='value']"
              />
              <button
                onClick={runXPath}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#a855f7] hover:bg-[#9333ea] text-white text-sm font-medium rounded-[8px] transition-colors flex-shrink-0"
              >
                <Play size={14} />
                Run
              </button>
            </div>
            <p className="text-[10px] text-[#444444] mt-1.5">
              Ctrl+Enter to run
            </p>
          </div>

          {/* Quick Expressions */}
          <div>
            <p className="text-[10px] text-[#555555] mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EXPRESSIONS[mode].map((q) => (
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
              {hasRun
                ? error
                  ? "Error"
                  : `${results.length} result${results.length !== 1 ? "s" : ""}`
                : "Results"}
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
              <div className="h-full flex items-center justify-center text-[#555555] text-sm">
                No nodes matched
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {results.map((r, i) => (
                  <ResultItem key={i} result={r} />
                ))}
              </div>
            )}
          </div>

          {/* Summary bar */}
          {hasRun && !error && (
            <div className="flex items-center gap-4 px-3 py-2 bg-[#0d0d0d] border border-[#222222] rounded-[8px]">
              <span className="text-xs text-[#555555]">
                <span className="text-[#a855f7] font-medium">{results.length}</span> match{results.length !== 1 ? "es" : ""}
              </span>
              {results.length > 0 && (
                <span className="text-xs text-[#555555]">
                  Types:{" "}
                  {Array.from(new Set(results.map((r) => r.type)))
                    .map((t) => <span key={t} className="text-[#888888]">{t}</span>)
                    .reduce((acc, el, i) => (i === 0 ? [el] : [...acc, <span key={`sep-${i}`} className="text-[#333333]">, </span>, el]), [] as React.ReactNode[])}
                </span>
              )}
            </div>
          )}

          {/* XPath tips */}
          <div className="p-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-[8px]">
            <p className="text-[10px] font-semibold text-[#555555] uppercase tracking-wider mb-2">Tips</p>
            <ul className="space-y-1">
              {[
                "// searches anywhere · / selects direct children",
                "@attr for attributes · text() for text nodes",
                "[1] first · [last()] last · [position()<3] range",
                "contains(@class,'x') for partial class matching",
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

function ResultItem({ result }: { result: XPathResult }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(result.value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const colorClass = TYPE_COLORS[result.type] ?? TYPE_COLORS.node;

  return (
    <div className="group flex items-start gap-2 p-2.5 bg-[#111111] border border-[#1a1a1a] rounded-[6px] hover:border-[#2a2a2a] transition-colors">
      <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-[3px] border font-semibold tracking-wider mt-0.5 ${colorClass}`}>
        {result.type}
      </span>
      <pre className="flex-1 text-xs text-[#c9d1d9] font-mono whitespace-pre-wrap break-all leading-relaxed min-w-0">
        {result.value || <span className="text-[#444444] italic">(empty)</span>}
      </pre>
      <button
        onClick={copy}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-[#444444] hover:text-[#888888] transition-all mt-0.5"
        aria-label="Copy value"
      >
        {copied ? (
          <Check size={12} className="text-[#22c55e]" />
        ) : (
          <Copy size={12} />
        )}
      </button>
    </div>
  );
}
