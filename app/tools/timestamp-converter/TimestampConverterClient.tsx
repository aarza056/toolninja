"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Clock, RefreshCw } from "lucide-react";

function getRelative(ts: number): string {
  const diff = Math.floor((Date.now() / 1000) - ts);
  const abs = Math.abs(diff);
  const future = diff < 0;
  const units = [
    [60, "second"], [3600, "minute"], [86400, "hour"], [604800, "day"],
    [2592000, "week"], [31536000, "month"],
  ] as [number, string][];
  
  for (let i = units.length - 1; i >= 0; i--) {
    if (abs >= units[i][0]) {
      const unit = units[i > 0 ? i - 1 : 0][1];
      const count = Math.floor(abs / (units[i > 0 ? i - 1 : 0][0]));
      const label = count === 1 ? unit : unit + "s";
      return future ? `in ${count} ${label}` : `${count} ${label} ago`;
    }
  }
  return "just now";
}

export default function TimestampConverterClient() {
  const [tsInput, setTsInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [tsResult, setTsResult] = useState<{ utc: string; local: string; relative: string; ts: number } | null>(null);
  const [dateResult, setDateResult] = useState<string>("");
  const [tsError, setTsError] = useState("");

  const convertTimestamp = (val: string) => {
    setTsError("");
    const num = Number(val.trim());
    if (isNaN(num)) { setTsResult(null); setTsError("Invalid timestamp"); return; }
    const ms = val.trim().length >= 13 ? num : num * 1000;
    const d = new Date(ms);
    if (isNaN(d.getTime())) { setTsResult(null); setTsError("Invalid timestamp"); return; }
    const ts = Math.floor(ms / 1000);
    setTsResult({
      utc: d.toUTCString(),
      local: d.toLocaleString(),
      relative: getRelative(ts),
      ts,
    });
  };

  const useNow = () => {
    const now = Math.floor(Date.now() / 1000).toString();
    setTsInput(now);
    convertTimestamp(now);
  };

  const convertDate = () => {
    if (!dateInput) return;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) { setDateResult("Invalid date"); return; }
    setDateResult(Math.floor(d.getTime() / 1000).toString());
  };

  return (
    <ToolLayout title="Timestamp Converter" description="Convert Unix timestamps to human-readable dates">
      <div className="max-w-lg space-y-8">
        {/* Timestamp → Date */}
        <div>
          <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3 flex items-center gap-2">
            <Clock size={14} className="text-[#a855f7]" />
            Timestamp → Date
          </h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tsInput}
              onChange={(e) => { setTsInput(e.target.value); convertTimestamp(e.target.value); }}
              placeholder="Unix timestamp (e.g. 1700000000)"
              className={`flex-1 px-3 py-2 text-sm font-mono bg-[#111111] border rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${tsError ? "border-[#ef4444]" : "border-[#222222]"}`}
            />
            <button
              onClick={useNow}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors whitespace-nowrap"
            >
              <RefreshCw size={12} /> Now
            </button>
          </div>
          {tsError && <p className="text-xs text-[#ef4444] mb-2">{tsError}</p>}
          {tsResult && (
            <div className="space-y-2">
              {[
                { label: "UTC", value: tsResult.utc },
                { label: "Local", value: tsResult.local },
                { label: "Relative", value: tsResult.relative },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                  <span className="w-14 text-xs text-[#888888] font-medium">{row.label}</span>
                  <span className="flex-1 text-sm text-[#f5f5f5] font-mono">{row.value}</span>
                  <CopyButton text={row.value} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Date → Timestamp */}
        <div>
          <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3 flex items-center gap-2">
            <Clock size={14} className="text-[#a855f7]" />
            Date → Timestamp
          </h3>
          <div className="flex gap-2 mb-3">
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
            <button
              onClick={convertDate}
              className="px-4 py-2 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
            >
              Convert
            </button>
          </div>
          {dateResult && (
            <div className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <span className="text-xs text-[#888888] font-medium">Unix</span>
              <span className="flex-1 text-sm text-[#f5f5f5] font-mono">{dateResult}</span>
              <CopyButton text={dateResult} size="sm" />
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
