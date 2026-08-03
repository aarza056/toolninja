"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Trash2 } from "lucide-react";
import { formatGraphQL, minifyGraphQL } from "@/lib/graphql-formatter";

const STORAGE_KEY = "toolninja:graphql-formatter";

const EXAMPLE = `query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    ... on Admin {
      permissions
    }
    posts(first: 10, after: $cursor) {
      title
      author {
        name
      }
    }
  }
}`;

export default function GraphqlFormatterClient() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"format" | "minify">("format");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, input); } catch {}
  }, [input]);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    try {
      return mode === "format" ? formatGraphQL(input) : minifyGraphQL(input);
    } catch {
      return "";
    }
  }, [input, mode]);

  const textareaClass =
    "w-full h-[calc(100vh-320px)] min-h-[350px] p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout title="GraphQL Query Formatter" description="Pretty-print or minify GraphQL queries, mutations, and fragments">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
          <button
            onClick={() => setMode("format")}
            className={`px-4 py-2 text-sm transition-colors ${mode === "format" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            Format
          </button>
          <button
            onClick={() => setMode("minify")}
            className={`px-4 py-2 text-sm border-l border-[#222222] transition-colors ${mode === "minify" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            Minify
          </button>
        </div>
        {!input && (
          <button onClick={() => setInput(EXAMPLE)} className="text-xs text-[#a855f7] hover:text-[#c084fc] transition-colors">
            Load example
          </button>
        )}
        {input && (
          <button onClick={() => setInput("")} className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#ef4444] transition-colors ml-auto">
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">GraphQL Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'query {\n  user(id: "1") {\n    id\n    name\n  }\n}'}
            spellCheck={false}
            className={textareaClass}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">Output</label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <pre className={`${textareaClass} overflow-auto`}>
            {output || <span className="text-[#444444] italic">Paste a GraphQL query, mutation, or fragment to format it…</span>}
          </pre>
        </div>
      </div>
    </ToolLayout>
  );
}
