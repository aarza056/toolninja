"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { AlertCircle, PlusCircle, MinusCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { diffJson, formatValue, type DiffEntry } from "@/lib/json-diff";

const STORAGE_KEY_A = "toolninja:json-diff:a";
const STORAGE_KEY_B = "toolninja:json-diff:b";

const TYPE_META: Record<DiffEntry["type"], { label: string; color: string; bg: string; icon: typeof PlusCircle }> = {
  added: { label: "Added", color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: PlusCircle },
  removed: { label: "Removed", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: MinusCircle },
  changed: { label: "Changed", color: "#eab308", bg: "rgba(234,179,8,0.1)", icon: RefreshCw },
};

export default function JsonDiffClient() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  useEffect(() => {
    try {
      const savedA = localStorage.getItem(STORAGE_KEY_A);
      const savedB = localStorage.getItem(STORAGE_KEY_B);
      if (savedA) setA(savedA);
      if (savedB) setB(savedB);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_A, a); } catch {}
  }, [a]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_B, b); } catch {}
  }, [b]);

  const { entries, errorA, errorB, parsedA, parsedB } = useMemo(() => {
    let parsedA: unknown, parsedB: unknown;
    let errorA = "", errorB = "";
    try {
      if (a.trim()) parsedA = JSON.parse(a);
    } catch (e) {
      errorA = e instanceof Error ? e.message : "Invalid JSON";
    }
    try {
      if (b.trim()) parsedB = JSON.parse(b);
    } catch (e) {
      errorB = e instanceof Error ? e.message : "Invalid JSON";
    }
    if (errorA || errorB || !a.trim() || !b.trim()) {
      return { entries: [] as DiffEntry[], errorA, errorB, parsedA, parsedB };
    }
    return { entries: diffJson(parsedA, parsedB), errorA, errorB, parsedA, parsedB };
  }, [a, b]);

  const counts = useMemo(() => {
    const c = { added: 0, removed: 0, changed: 0 };
    entries.forEach((e) => c[e.type]++);
    return c;
  }, [entries]);

  const bothValid = !errorA && !errorB && a.trim() && b.trim() && parsedA !== undefined && parsedB !== undefined;
  const identical = bothValid && entries.length === 0;

  const textareaClass =
    "w-full h-64 p-3 font-mono text-xs resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout
      title="JSON Diff Checker"
      description="Compare two JSON objects and see exactly what changed, path by path"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">JSON A (Original)</label>
          <textarea
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder='{"name": "Jane", "age": 30}'
            spellCheck={false}
            className={`${textareaClass} ${errorA ? "border-[#ef4444]" : "border-[#222222]"}`}
          />
          {errorA && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {errorA}
            </div>
          )}
        </div>
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">JSON B (Modified)</label>
          <textarea
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder='{"name": "Jane", "age": 31, "city": "NYC"}'
            spellCheck={false}
            className={`${textareaClass} ${errorB ? "border-[#ef4444]" : "border-[#222222]"}`}
          />
          {errorB && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {errorB}
            </div>
          )}
        </div>
      </div>

      {bothValid && (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(["added", "removed", "changed"] as const).map((t) => {
              const meta = TYPE_META[t];
              const Icon = meta.icon;
              return (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  <Icon size={12} />
                  {counts[t]} {meta.label}
                </span>
              );
            })}
          </div>

          {identical ? (
            <div className="flex items-center gap-2 p-4 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-[8px] text-[#22c55e] text-sm">
              <CheckCircle2 size={16} />
              These JSON objects are structurally identical.
            </div>
          ) : (
            <div className="space-y-1.5">
              {entries.map((entry, i) => {
                const meta = TYPE_META[entry.type];
                return (
                  <div
                    key={`${entry.path}-${i}`}
                    className="p-3 rounded-[6px] border font-mono text-xs"
                    style={{ borderColor: meta.color + "33", background: "#111111" }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[#a855f7]">{entry.path}</span>
                    </div>
                    {entry.type === "added" && (
                      <div className="text-[#22c55e] break-all">+ {formatValue(entry.newValue)}</div>
                    )}
                    {entry.type === "removed" && (
                      <div className="text-[#ef4444] break-all">- {formatValue(entry.oldValue)}</div>
                    )}
                    {entry.type === "changed" && (
                      <div className="space-y-0.5">
                        <div className="text-[#ef4444] break-all">- {formatValue(entry.oldValue)}</div>
                        <div className="text-[#22c55e] break-all">+ {formatValue(entry.newValue)}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {(!a.trim() || !b.trim()) && !errorA && !errorB && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Paste JSON into both boxes to see a structural diff
        </div>
      )}
    </ToolLayout>
  );
}
