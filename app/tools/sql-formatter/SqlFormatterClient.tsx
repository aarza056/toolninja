"use client";

import { useState, useEffect, useCallback } from "react";
import { format, type SqlLanguage } from "sql-formatter";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Database, Trash2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Dialect = "sql" | "mysql" | "postgresql" | "sqlite" | "bigquery" | "trino";
type KeywordCase = "upper" | "lower" | "preserve";

const DIALECTS: { id: Dialect; label: string }[] = [
  { id: "sql", label: "Standard SQL" },
  { id: "mysql", label: "MySQL" },
  { id: "postgresql", label: "PostgreSQL" },
  { id: "sqlite", label: "SQLite" },
  { id: "bigquery", label: "BigQuery" },
  { id: "trino", label: "Trino" },
];

const SAMPLE_SQL = `SELECT u.id, u.name, u.email, o.total, o.created_at FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE u.active = 1 AND o.total > 100 ORDER BY o.created_at DESC LIMIT 50;`;

// ─── Syntax highlighter ──────────────────────────────────────────────────────

const SQL_KEYWORDS = [
  "SELECT","FROM","WHERE","JOIN","INNER","LEFT","RIGHT","FULL","OUTER","ON",
  "AND","OR","NOT","IN","IS","NULL","AS","ORDER","BY","GROUP","HAVING","LIMIT",
  "OFFSET","UNION","ALL","DISTINCT","INSERT","INTO","VALUES","UPDATE","SET",
  "DELETE","CREATE","TABLE","DROP","ALTER","INDEX","VIEW","WITH","CASE","WHEN",
  "THEN","ELSE","END","EXISTS","BETWEEN","LIKE","ILIKE","ASC","DESC","PRIMARY",
  "KEY","FOREIGN","REFERENCES","DEFAULT","CONSTRAINT","UNIQUE","CHECK","COUNT",
  "SUM","AVG","MIN","MAX","COALESCE","NULLIF","CAST","OVER","PARTITION","ROW",
  "ROWS","RANK","DENSE_RANK","ROW_NUMBER","LAG","LEAD","FIRST_VALUE","LAST_VALUE",
  "CROSS","NATURAL","USING","RETURNING","TRUNCATE","EXPLAIN","ANALYZE","VACUUM",
];

const KW_RE = new RegExp(
  `\\b(${SQL_KEYWORDS.join("|")})\\b`,
  "gi"
);

function highlightSql(sql: string): string {
  // Escape HTML first
  const escaped = sql
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // We process in passes, using placeholder tokens to protect already-replaced spans.
  // Pass order: comments → strings → numbers → keywords
  const chunks: string[] = [];
  const remaining = escaped;

  // Tokenise into: comment, string, number, keyword, other — in one regex
  const TOKEN_RE =
    /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:''|[^'])*'|"(?:""|[^"])*")|(\b\d+(?:\.\d+)?\b)/g;

  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(remaining)) !== null) {
    // Text before this token — apply keyword highlighting
    const before = remaining.slice(last, m.index);
    chunks.push(before.replace(KW_RE, '<span class="sql-kw">$1</span>'));

    if (m[1] !== undefined) {
      chunks.push(`<span class="sql-cmt">${m[1]}</span>`);
    } else if (m[2] !== undefined) {
      chunks.push(`<span class="sql-str">${m[2]}</span>`);
    } else if (m[3] !== undefined) {
      chunks.push(`<span class="sql-num">${m[3]}</span>`);
    }

    last = m.index + m[0].length;
  }
  // Remaining text after last token
  const tail = remaining.slice(last);
  chunks.push(tail.replace(KW_RE, '<span class="sql-kw">$1</span>'));

  return chunks.join("");
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function SqlFormatterClient() {
  const [input, setInput] = useState(SAMPLE_SQL);
  const [output, setOutput] = useState("");
  const [highlighted, setHighlighted] = useState("");
  const [error, setError] = useState("");
  const [dialect, setDialect] = useState<Dialect>("sql");
  const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper");
  const [tabWidth, setTabWidth] = useState<2 | 4>(2);

  const runFormat = useCallback(
    (sql: string, d: Dialect, kc: KeywordCase, tw: 2 | 4) => {
      if (!sql.trim()) {
        setOutput("");
        setHighlighted("");
        setError("");
        return;
      }
      try {
        const result = format(sql, {
          language: d as SqlLanguage,
          tabWidth: tw,
          keywordCase: kc,
        });
        setOutput(result);
        setHighlighted(highlightSql(result));
        setError("");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to format SQL");
        setOutput("");
        setHighlighted("");
      }
    },
    []
  );

  // Auto-format whenever any option changes
  useEffect(() => {
    runFormat(input, dialect, keywordCase, tabWidth);
  }, [input, dialect, keywordCase, tabWidth, runFormat]);

  const clear = () => {
    setInput("");
    setOutput("");
    setHighlighted("");
    setError("");
  };

  return (
    <ToolLayout title="SQL Formatter" description="Format and highlight SQL queries across multiple dialects">
      {/* Toolbar row 1: dialect */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Database size={14} className="text-[#888888]" />
        <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
          {DIALECTS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDialect(d.id)}
              className={`px-3 py-1.5 text-xs border-r last:border-0 border-[#222222] transition-colors ${
                dialect === d.id
                  ? "bg-[#a855f7] text-white"
                  : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar row 2: keyword case + indent + clear */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Keyword case */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#888888]">Keywords:</span>
          <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
            {(["upper", "lower", "preserve"] as KeywordCase[]).map((kc) => (
              <button
                key={kc}
                onClick={() => setKeywordCase(kc)}
                className={`px-2.5 py-1 text-xs border-r last:border-0 border-[#222222] transition-colors ${
                  keywordCase === kc
                    ? "bg-[#a855f7] text-white"
                    : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                {kc === "upper" ? "UPPER" : kc === "lower" ? "lower" : "Preserve"}
              </button>
            ))}
          </div>
        </div>

        {/* Indent */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#888888]">Indent:</span>
          <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
            {([2, 4] as (2 | 4)[]).map((n) => (
              <button
                key={n}
                onClick={() => setTabWidth(n)}
                className={`px-2.5 py-1 text-xs border-r last:border-0 border-[#222222] transition-colors ${
                  tabWidth === n
                    ? "bg-[#a855f7] text-white"
                    : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors ml-auto"
        >
          <Trash2 size={13} /> Clear
        </button>
      </div>

      {/* Split pane */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-320px)] min-h-[400px]">
        {/* Input */}
        <div className="flex flex-col gap-1 min-h-0">
          <label className="text-xs text-[#888888] font-medium">SQL Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste or type your SQL here..."
            spellCheck={false}
            className={`flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${
              error ? "border-[#ef4444]" : "border-[#222222]"
            }`}
          />
          {error && (
            <div className="text-xs text-[#ef4444] mt-1 break-words">{error}</div>
          )}
        </div>

        {/* Output */}
        <div className="flex flex-col gap-1 min-h-0">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">Formatted</label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <div className="flex-1 overflow-auto bg-[#111111] border border-[#222222] rounded-[8px] p-3 min-h-0">
            {highlighted ? (
              <pre
                className="font-mono text-sm leading-relaxed m-0 p-0 bg-transparent whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            ) : (
              <p className="text-[#444444] text-sm italic">
                {error
                  ? "Fix the SQL error to see output"
                  : "Formatted SQL will appear here..."}
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .sql-kw  { color: #a855f7; }
        .sql-str { color: #22c55e; }
        .sql-num { color: #f97316; }
        .sql-cmt { color: #555555; font-style: italic; }
      `}</style>
    </ToolLayout>
  );
}
