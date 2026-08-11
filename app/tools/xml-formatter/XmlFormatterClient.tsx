"use client";

import { useState, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Code2, Minimize2, Trash2, AlertCircle } from "lucide-react";
import { formatXml, minifyXml } from "@/lib/xml-formatter";

const STORAGE_KEY = "toolninja:xml-formatter";

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog><book id="bk101"><author>Gambardella, Matthew</author><title>XML Developer's Guide</title><genre>Computer</genre><price>44.95</price><description><![CDATA[An in-depth look at creating applications with XML.]]></description></book><book id="bk102"><author>Ralls, Kim</author><title>Midnight Rain</title><genre>Fantasy</genre><price>5.95</price></book></catalog>`;

type Mode = "prettify" | "minify";

export default function XmlFormatterClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("prettify");
  const [indentSize, setIndentSize] = useState<2 | 4>(2);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setInput(saved ?? SAMPLE_XML);
    } catch {
      setInput(SAMPLE_XML);
    }
  }, []);

  const run = useCallback((xml: string, m: Mode, indent: 2 | 4) => {
    if (!xml.trim()) {
      setOutput("");
      setError("");
      return;
    }
    const result = m === "prettify" ? formatXml(xml, indent) : minifyXml(xml);
    if (result.error) {
      setError(result.error);
      setOutput("");
    } else {
      setOutput(result.output);
      setError("");
    }
  }, []);

  useEffect(() => {
    run(input, mode, indentSize);
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const handleMode = (m: Mode) => {
    setMode(m);
    run(input, m, indentSize);
  };

  const handleIndent = (n: 2 | 4) => {
    setIndentSize(n);
    if (mode === "prettify") run(input, mode, n);
  };

  const clear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <ToolLayout title="XML Formatter" description="Prettify, minify, and validate XML with CDATA-safe formatting">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => handleMode("prettify")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-[6px] transition-colors ${
            mode === "prettify" ? "bg-[#a855f7] hover:bg-[#9333ea] text-white" : "bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222]"
          }`}
        >
          <Code2 size={14} /> Prettify
        </button>
        <button
          onClick={() => handleMode("minify")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-[6px] transition-colors ${
            mode === "minify" ? "bg-[#a855f7] hover:bg-[#9333ea] text-white" : "bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222]"
          }`}
        >
          <Minimize2 size={14} /> Minify
        </button>

        {mode === "prettify" && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-[#888888]">Indent:</span>
            <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
              {([2, 4] as (2 | 4)[]).map((n) => (
                <button
                  key={n}
                  onClick={() => handleIndent(n)}
                  className={`px-2.5 py-1 text-xs border-r last:border-0 border-[#222222] transition-colors ${
                    indentSize === n ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors ml-auto"
        >
          <Trash2 size={13} /> Clear
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-280px)] min-h-[400px]">
        <div className="flex flex-col gap-1 min-h-0">
          <label className="text-xs text-[#888888] font-medium">XML Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste or type your XML here…"
            spellCheck={false}
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} />
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 min-h-0">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">{mode === "prettify" ? "Prettified" : "Minified"}</label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <pre className="flex-1 w-full p-3 font-mono text-xs overflow-auto bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] whitespace-pre-wrap break-all">
            {output || <span className="text-[#444444] italic">Output will appear here…</span>}
          </pre>
        </div>
      </div>
    </ToolLayout>
  );
}
