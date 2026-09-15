"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { parseId } from "@/lib/uuid-parser";
import { AlertCircle, Clock, ScanSearch } from "lucide-react";

const STORAGE_KEY = "toolninja:uuid-parser";

const EXAMPLES = [
  { label: "v7 (time-ordered)", value: "018f4d2e-7b3a-7c21-8a4f-1e2d3c4b5a69" },
  { label: "v4 (random)", value: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" },
  { label: "v1 (legacy time-based)", value: "a8fa1f10-b8ea-11e9-9cb5-2a2ae2dbcce4" },
  { label: "ULID", value: "01ARZ3NDEKTSV4RRFFQ69G5FAV" },
];

function GroupDisplay({ groups }: { groups: [string, string, string, string, string] }) {
  const colors = ["#3b82f6", "#3b82f6", "#a855f7", "#22c55e", "#3b82f6"];
  const labels = ["time_low", "time_mid", "time_hi + version", "clock_seq + variant", "node"];
  return (
    <div className="flex flex-wrap gap-x-1 gap-y-2 font-mono text-lg">
      {groups.map((g, i) => (
        <span key={i} className="flex flex-col items-center">
          <span style={{ color: colors[i] }}>{g}</span>
          <span className="text-[9px] text-[#555555] font-sans">{labels[i]}</span>
        </span>
      ))}
    </div>
  );
}

export default function UuidParserClient() {
  const [input, setInput] = useState("");

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

  const result = useMemo(() => parseId(input), [input]);
  const invalid = input.trim().length > 0 && !result;

  return (
    <ToolLayout
      title="UUID Parser"
      description="Decode any UUID or ULID into its version, variant, and embedded timestamp"
    >
      <div className="mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">UUID or ULID</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 018f4d2e-7b3a-7c21-8a4f-1e2d3c4b5a69"
          spellCheck={false}
          className={`w-full p-3 font-mono text-sm bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${invalid ? "border-[#ef4444]" : "border-[#222222]"}`}
        />
        {invalid && (
          <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
            <AlertCircle size={12} /> Not a recognized UUID (8-4-4-4-12 hex) or ULID (26-character Crockford Base32) format.
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => setInput(ex.value)}
            className="px-2.5 py-1 text-[11px] bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {result && result.kind === "uuid" && (
        <div className="space-y-4">
          <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px]">
            <GroupDisplay groups={result.groups} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <p className="text-xs text-[#555555] font-medium uppercase tracking-wide mb-1">Version</p>
              <p className="text-sm text-[#a855f7] font-mono">v{result.version}</p>
              <p className="text-xs text-[#888888] mt-0.5">{result.versionLabel}</p>
            </div>
            <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <p className="text-xs text-[#555555] font-medium uppercase tracking-wide mb-1">Variant</p>
              <p className="text-sm text-[#f5f5f5]">{result.variant}</p>
            </div>
          </div>

          {result.timestamp ? (
            <div className="p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-[8px]">
              <div className="flex items-center gap-1.5 text-xs text-[#22c55e] font-medium mb-1">
                <Clock size={12} /> Embedded Timestamp
              </div>
              <p className="text-sm text-[#f5f5f5] font-mono">{result.timestamp.toISOString()}</p>
              <p className="text-xs text-[#888888] mt-0.5">{result.timestamp.toLocaleString()} (local)</p>
              {result.timestampNote && (
                <p className="text-xs text-[#555555] mt-1.5">{result.timestampNote}</p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666]">
              Version {result.version} UUIDs don&apos;t encode a timestamp — only v1, v6, and v7 do.
            </div>
          )}

          <div className="flex justify-end">
            <CopyButton text={result.raw} size="sm" />
          </div>
        </div>
      )}

      {result && result.kind === "ulid" && (
        <div className="space-y-4">
          <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] font-mono text-lg">
            <span className="text-[#3b82f6]">{result.raw.slice(0, 10)}</span>
            <span className="text-[#a855f7]">{result.randomPart}</span>
          </div>
          <div className="flex gap-4 text-[10px] text-[#555555] font-sans -mt-2">
            <span className="text-[#3b82f6]">■ timestamp (10 chars, 48-bit ms)</span>
            <span className="text-[#a855f7]">■ randomness (16 chars, 80-bit)</span>
          </div>

          <div className="p-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-[8px]">
            <div className="flex items-center gap-1.5 text-xs text-[#22c55e] font-medium mb-1">
              <Clock size={12} /> Embedded Timestamp
            </div>
            <p className="text-sm text-[#f5f5f5] font-mono">{result.timestamp.toISOString()}</p>
            <p className="text-xs text-[#888888] mt-0.5">{result.timestamp.toLocaleString()} (local)</p>
          </div>

          <div className="flex justify-end">
            <CopyButton text={result.raw} size="sm" />
          </div>
        </div>
      )}

      {!result && !invalid && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px] flex flex-col items-center gap-2">
          <ScanSearch size={20} />
          Paste a UUID or ULID above to inspect it
        </div>
      )}
    </ToolLayout>
  );
}
