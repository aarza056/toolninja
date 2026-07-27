"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, ArrowRight, ArrowLeft, Download } from "lucide-react";
import { csvToJson, jsonToCsv } from "@/lib/csv-json";

const STORAGE_KEY = "toolninja:csv-json";
const DELIMITERS = [
  { label: "Comma ( , )", value: "," },
  { label: "Semicolon ( ; )", value: ";" },
  { label: "Tab", value: "\t" },
  { label: "Pipe ( | )", value: "|" },
];

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
  const [delimiter, setDelimiter] = useState(",");
  const [csvError, setCsvError] = useState("");
  const [jsonError, setJsonError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCsvText(saved);
        convertCsvToJson(saved, delimiter);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, csvText); } catch {}
  }, [csvText]);

  const convertCsvToJson = useCallback((text: string, delim: string) => {
    if (!text.trim()) {
      setJsonText("");
      setCsvError("");
      return;
    }
    try {
      const rows = csvToJson(text, delim);
      setJsonText(JSON.stringify(rows, null, 2));
      setCsvError("");
    } catch (e) {
      setCsvError(e instanceof Error ? e.message : "Failed to parse CSV");
    }
  }, []);

  const convertJsonToCsv = useCallback((text: string, delim: string) => {
    if (!text.trim()) {
      setCsvText("");
      setJsonError("");
      return;
    }
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("JSON must be an array of objects");
      setCsvText(jsonToCsv(parsed, delim));
      setJsonError("");
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }, []);

  const handleCsvChange = (text: string) => {
    setCsvText(text);
    convertCsvToJson(text, delimiter);
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    convertJsonToCsv(text, delimiter);
  };

  const handleCsvPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    if (isLikelyJson(text)) {
      e.preventDefault();
      setJsonText(text);
      convertJsonToCsv(text, delimiter);
    }
  };

  const handleDelimiterChange = (d: string) => {
    setDelimiter(d);
    if (csvText.trim()) convertCsvToJson(csvText, d);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsvText(text);
      convertCsvToJson(text, delimiter);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const textareaClass =
    "w-full h-80 p-3 font-mono text-xs resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout title="CSV ↔ JSON Converter" description="Convert between CSV and JSON instantly, in either direction">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#888888] font-medium">Delimiter</label>
          <select
            value={delimiter}
            onChange={(e) => handleDelimiterChange(e.target.value)}
            className="bg-[#111111] border border-[#222222] rounded-[6px] px-2 py-1.5 text-xs text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          >
            {DELIMITERS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors cursor-pointer">
          Upload CSV file
          <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        {/* CSV panel */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">CSV</label>
            <div className="flex items-center gap-2">
              {csvText && (
                <button
                  onClick={() => download("data.csv", csvText, "text/csv")}
                  className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
                >
                  <Download size={12} /> Download
                </button>
              )}
              <CopyButton text={csvText} size="sm" />
            </div>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => handleCsvChange(e.target.value)}
            onPaste={handleCsvPaste}
            placeholder={"name,age,city\nJane,30,NYC\nJohn,25,LA"}
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
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">JSON</label>
            <div className="flex items-center gap-2">
              {jsonText && (
                <button
                  onClick={() => download("data.json", jsonText, "application/json")}
                  className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
                >
                  <Download size={12} /> Download
                </button>
              )}
              <CopyButton text={jsonText} size="sm" />
            </div>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='[{"name": "Jane", "age": "30", "city": "NYC"}]'
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
    </ToolLayout>
  );
}
