"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, ArrowRight, ArrowLeft, Download, Upload } from "lucide-react";
import { csvToJsonAdvanced, detectDelimiter, flattenRow, jsonToCsv, rowsFromJson } from "@/lib/csv-json";

const STORAGE_KEY = "toolninja:csv-json";
const OPTIONS_KEY = "toolninja:csv-json:options";
const DELIMITERS = [
  { label: "Auto-detect", value: "auto" },
  { label: "Comma ( , )", value: "," },
  { label: "Semicolon ( ; )", value: ";" },
  { label: "Tab", value: "\t" },
  { label: "Pipe ( | )", value: "|" },
];
const NAMES: Record<string, string> = { ",": "comma", ";": "semicolon", "\t": "tab", "|": "pipe" };

interface Options {
  delimiter: string;
  header: boolean;
  types: boolean;
  nested: boolean;
  flatten: boolean;
}

const DEFAULTS: Options = { delimiter: "auto", header: true, types: true, nested: true, flatten: true };

function isLikelyJson(text: string): boolean {
  return /^\s*[[{]/.test(text);
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function CsvJsonClient() {
  const [csvText, setCsvText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [opts, setOpts] = useState<Options>(DEFAULTS);
  const [csvError, setCsvError] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [info, setInfo] = useState("");
  const [dragging, setDragging] = useState(false);

  const delimFor = (text: string, o: Options) => (o.delimiter === "auto" ? detectDelimiter(text) : o.delimiter);

  const convertCsvToJson = useCallback((text: string, o: Options) => {
    if (!text.trim()) {
      setJsonText("");
      setCsvError("");
      setInfo("");
      return;
    }
    try {
      const d = o.delimiter === "auto" ? detectDelimiter(text) : o.delimiter;
      const rows = csvToJsonAdvanced(text, d, { header: o.header, types: o.types, nested: o.nested });
      setJsonText(JSON.stringify(rows, null, 2));
      setCsvError("");
      const cols = rows[0] && typeof rows[0] === "object" ? Object.keys(rows[0] as object).length : 0;
      setInfo(`${rows.length.toLocaleString("en-US")} row${rows.length === 1 ? "" : "s"} · ${cols} column${cols === 1 ? "" : "s"}${o.delimiter === "auto" ? ` · ${NAMES[d]}-separated (detected)` : ""}`);
    } catch (e) {
      setCsvError(e instanceof Error ? e.message : "Failed to parse CSV");
    }
  }, []);

  const convertJsonToCsv = useCallback((text: string, o: Options, csvForDelimiter: string) => {
    if (!text.trim()) {
      setCsvText("");
      setJsonError("");
      setInfo("");
      return;
    }
    try {
      const { rows, from } = rowsFromJson(text);
      const d = o.delimiter === "auto" ? (csvForDelimiter.trim() ? detectDelimiter(csvForDelimiter) : ",") : o.delimiter;
      const shaped = o.flatten ? rows.map((r) => (r && typeof r === "object" && !Array.isArray(r) ? flattenRow(r) : r)) : rows;
      setCsvText(jsonToCsv(shaped, d));
      setJsonError("");
      setInfo(`${rows.length.toLocaleString("en-US")} row${rows.length === 1 ? "" : "s"}${from ? ` · from ${from === "NDJSON lines" ? "NDJSON lines" : `the "${from}" array`}` : ""}`);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }, []);

  useEffect(() => {
    let o = DEFAULTS;
    try {
      const savedOpts = JSON.parse(localStorage.getItem(OPTIONS_KEY) || "null");
      if (savedOpts && typeof savedOpts === "object") o = { ...DEFAULTS, ...savedOpts };
      setOpts(o);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCsvText(saved);
        convertCsvToJson(saved, o);
      }
    } catch {}
  }, [convertCsvToJson]);

  useEffect(() => {
    try {
      if (csvText.length < 1_000_000) localStorage.setItem(STORAGE_KEY, csvText);
    } catch {}
  }, [csvText]);

  const updateOpts = (patch: Partial<Options>, direction: "csv" | "json" = "csv") => {
    const next = { ...opts, ...patch };
    setOpts(next);
    try {
      localStorage.setItem(OPTIONS_KEY, JSON.stringify(next));
    } catch {}
    if (direction === "json" && jsonText.trim()) convertJsonToCsv(jsonText, next, "");
    else if (csvText.trim()) convertCsvToJson(csvText, next);
  };

  const handleCsvChange = (text: string) => {
    setCsvText(text);
    convertCsvToJson(text, opts);
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    convertJsonToCsv(text, opts, csvText);
  };

  const handleCsvPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    if (isLikelyJson(text)) {
      e.preventDefault();
      setJsonText(text);
      convertJsonToCsv(text, opts, "");
    }
  };

  const openFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "").replace(/^﻿/, "");
      if (/\.(json|ndjson|jsonl)$/i.test(file.name) || isLikelyJson(text)) {
        setJsonText(text);
        convertJsonToCsv(text, opts, "");
      } else {
        setCsvText(text);
        convertCsvToJson(text, opts);
      }
    };
    reader.readAsText(file);
  };

  const textareaClass =
    "w-full h-80 p-3 font-mono text-xs resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";
  const check = "flex items-center gap-1.5 text-xs text-[#888888] cursor-pointer";
  const currentDelimiter = delimFor(csvText, opts);

  return (
    <ToolLayout title="CSV to JSON Converter" description="Convert CSV to JSON instantly — or JSON back to CSV — with the delimiter detected, real numbers and booleans, and nested objects from dotted headers">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="csv-delimiter" className="text-xs text-[#888888] font-medium">
            Delimiter
          </label>
          <select
            id="csv-delimiter"
            value={opts.delimiter}
            onChange={(e) => updateOpts({ delimiter: e.target.value })}
            className="bg-[#111111] border border-[#222222] rounded-[6px] px-2 py-1.5 text-xs text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          >
            {DELIMITERS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <label className={check}>
          <input type="checkbox" checked={opts.header} onChange={(e) => updateOpts({ header: e.target.checked })} className="accent-[#a855f7]" /> First row is the header
        </label>
        <label className={check} title="123 → number, true/false → boolean, empty → null. Leading zeros (007) stay text.">
          <input type="checkbox" checked={opts.types} onChange={(e) => updateOpts({ types: e.target.checked })} className="accent-[#a855f7]" /> Numbers &amp; booleans as JSON types
        </label>
        <label className={check} title="Headers like address.city become { address: { city } }, and tags.0 an array">
          <input type="checkbox" checked={opts.nested} onChange={(e) => updateOpts({ nested: e.target.checked })} className="accent-[#a855f7]" /> Nest dotted headers (a.b)
        </label>
        <label className={check} title="JSON → CSV: nested objects become address.city columns instead of JSON text in one cell">
          <input type="checkbox" checked={opts.flatten} onChange={(e) => updateOpts({ flatten: e.target.checked }, "json")} className="accent-[#a855f7]" /> Flatten nested JSON to columns
        </label>
        <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors cursor-pointer">
          <Upload size={12} /> Open file
          <input
            type="file"
            accept=".csv,.tsv,.txt,.json,.ndjson,.jsonl,text/csv,application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) openFile(f);
              e.target.value = "";
            }}
            className="hidden"
          />
        </label>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) openFile(f);
        }}
        className={`grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start rounded-[8px] ${dragging ? "outline outline-1 outline-dashed outline-[#a855f7]" : ""}`}
      >
        {/* CSV panel */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="csv-text" className="text-xs text-[#888888] font-medium">
              CSV
            </label>
            <div className="flex items-center gap-2">
              {csvText && (
                <button onClick={() => download(currentDelimiter === "\t" ? "data.tsv" : "data.csv", csvText, "text/csv")} className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors">
                  <Download size={12} /> Download
                </button>
              )}
              <CopyButton text={csvText} size="sm" />
            </div>
          </div>
          <textarea
            id="csv-text"
            value={csvText}
            onChange={(e) => handleCsvChange(e.target.value)}
            onPaste={handleCsvPaste}
            placeholder={"name,age,address.city\nJane,30,NYC\nJohn,25,LA"}
            spellCheck={false}
            className={`${textareaClass} ${csvError ? "border-[#ef4444]" : "border-[#222222]"}`}
          />
          {csvError && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {csvError}
            </div>
          )}
        </div>

        {/* Arrows */}
        <div className="hidden lg:flex flex-col items-center gap-2 pt-8 text-[#333333]">
          <ArrowRight size={18} />
          <ArrowLeft size={18} />
        </div>

        {/* JSON panel */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="json-text" className="text-xs text-[#888888] font-medium">
              JSON
            </label>
            <div className="flex items-center gap-2">
              {jsonText && (
                <button onClick={() => download("data.json", jsonText, "application/json")} className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors">
                  <Download size={12} /> Download
                </button>
              )}
              <CopyButton text={jsonText} size="sm" />
            </div>
          </div>
          <textarea
            id="json-text"
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='[{"name": "Jane", "age": 30, "address": {"city": "NYC"}}]'
            spellCheck={false}
            className={`${textareaClass} ${jsonError ? "border-[#ef4444]" : "border-[#222222]"}`}
          />
          {jsonError && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {jsonError}
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-[#666666] mt-3">
        {info ? `${info}. ` : ""}Drop a .csv, .tsv or .json file anywhere on the two boxes. Everything is converted in your browser.
      </p>
    </ToolLayout>
  );
}
