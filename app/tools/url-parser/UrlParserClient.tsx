"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Plus, Trash2, Megaphone, AlertCircle } from "lucide-react";
import { parseUrl, buildUrlWithParams, UTM_PARAMS, type UrlParam } from "@/lib/url-parser";

const STORAGE_KEY = "toolninja:url-parser";
let rowIdCounter = 0;

interface Row extends UrlParam {
  id: number;
}

export default function UrlParserClient() {
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [syncedFromInput, setSyncedFromInput] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, input); } catch {}
  }, [input]);

  const parsed = useMemo(() => parseUrl(input), [input]);

  // Whenever the URL text changes and successfully parses, resync the editable rows from it
  useEffect(() => {
    if (parsed) {
      setRows(parsed.params.map((p) => ({ ...p, id: rowIdCounter++ })));
      setSyncedFromInput(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const baseUrl = useMemo(() => {
    if (!parsed) return "";
    const noQuery = input.split("?")[0].split("#")[0];
    return noQuery;
  }, [parsed, input]);

  const rebuiltUrl = useMemo(() => {
    if (!baseUrl) return "";
    const hash = parsed?.hash ?? "";
    const url = buildUrlWithParams(baseUrl, rows);
    return url ? url + hash : "";
  }, [baseUrl, rows, parsed]);

  const addRow = () => {
    setRows((prev) => [...prev, { id: rowIdCounter++, key: "", value: "" }]);
    setSyncedFromInput(false);
  };

  const removeRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setSyncedFromInput(false);
  };

  const updateRow = (id: number, field: "key" | "value", val: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
    setSyncedFromInput(false);
  };

  const addUtmParams = () => {
    const existing = new Set(rows.map((r) => r.key));
    const additions: Row[] = UTM_PARAMS.filter((p) => !existing.has(p)).map((p) => ({
      id: rowIdCounter++,
      key: p,
      value: "",
    }));
    setRows((prev) => [...prev, ...additions]);
    setSyncedFromInput(false);
  };

  const inputClass =
    "flex-1 px-3 py-1.5 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout title="URL Parser & Query String Builder" description="Break a URL into its parts, or build one from components and query parameters">
      <div className="mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">URL</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://example.com/path?key=value&foo=bar#section"
          spellCheck={false}
          className="w-full px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
        {input.trim() && !parsed && (
          <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
            <AlertCircle size={12} /> Not a valid absolute URL — include the scheme (https://…)
          </div>
        )}
      </div>

      {parsed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Parsed breakdown */}
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-2">Components</label>
            <div className="space-y-1">
              {[
                ["Protocol", parsed.protocol],
                ["Username", parsed.username],
                ["Password", parsed.password],
                ["Host", parsed.hostname],
                ["Port", parsed.port || "(default)"],
                ["Path", parsed.pathname],
                ["Hash", parsed.hash || "(none)"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2 text-xs font-mono px-3 py-1.5 bg-[#111111] border border-[#222222] rounded-[6px]">
                  <span className="text-[#a855f7] w-20 shrink-0">{label}</span>
                  <span className="text-[#888888] break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Query params editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#888888] font-medium">
                Query Parameters {syncedFromInput ? "" : "(edited)"}
              </label>
              <button
                onClick={addUtmParams}
                className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
              >
                <Megaphone size={12} /> Add UTM params
              </button>
            </div>
            <div className="space-y-2 mb-2">
              {rows.map((r) => (
                <div key={r.id} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={r.key}
                    onChange={(e) => updateRow(r.id, "key", e.target.value)}
                    placeholder="key"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={r.value}
                    onChange={(e) => updateRow(r.id, "value", e.target.value)}
                    placeholder="value"
                    className={inputClass}
                  />
                  <button onClick={() => removeRow(r.id)} className="p-1.5 text-[#555555] hover:text-[#ef4444] transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
            >
              <Plus size={14} /> Add Parameter
            </button>
          </div>
        </div>
      )}

      {rebuiltUrl && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">Resulting URL</label>
            <CopyButton text={rebuiltUrl} size="sm" />
          </div>
          <pre className="p-3 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#a855f7] overflow-auto whitespace-pre-wrap break-all">
            {rebuiltUrl}
          </pre>
        </div>
      )}

      {!input.trim() && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Paste a full URL above to break it down and edit its query parameters
        </div>
      )}
    </ToolLayout>
  );
}
