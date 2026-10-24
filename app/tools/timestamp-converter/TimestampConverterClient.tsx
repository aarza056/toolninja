"use client";

import { useEffect, useMemo, useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Clock, RefreshCw, Globe2, Code2 } from "lucide-react";
import { parseTimestamp, parseDateString, relativeTime, formats, snippets, wallTimeToEpoch, hasNativeTemporal, UNIT_LABEL } from "@/lib/timestamp";

const TIMEZONES = [
  { id: "UTC", label: "UTC" },
  { id: "America/Los_Angeles", label: "Los Angeles" },
  { id: "America/New_York", label: "New York" },
  { id: "America/Sao_Paulo", label: "São Paulo" },
  { id: "Europe/London", label: "London" },
  { id: "Europe/Paris", label: "Paris" },
  { id: "Europe/Moscow", label: "Moscow" },
  { id: "Asia/Yerevan", label: "Yerevan" },
  { id: "Asia/Dubai", label: "Dubai" },
  { id: "Asia/Kolkata", label: "Mumbai" },
  { id: "Asia/Shanghai", label: "Shanghai" },
  { id: "Asia/Tokyo", label: "Tokyo" },
  { id: "Australia/Sydney", label: "Sydney" },
];

function formatInZone(ms: number, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone, dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));
  } catch {
    return "—";
  }
}

export default function TimestampConverterClient() {
  const [tsInput, setTsInput] = useState("");
  const [localZone, setLocalZone] = useState("UTC");
  const [dateInput, setDateInput] = useState("");
  const [dateZone, setDateZone] = useState("UTC");
  const [dateText, setDateText] = useState("");
  const [lang, setLang] = useState(0);
  const [nativeTemporal, setNativeTemporal] = useState(false);

  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setLocalZone(zone);
    setDateZone(zone);
    setNativeTemporal(hasNativeTemporal());
  }, []);

  const parsed = useMemo(() => (tsInput.trim() ? parseTimestamp(tsInput) : null), [tsInput]);
  const tsError = tsInput.trim() && !parsed ? "Not a Unix timestamp — paste digits only (seconds, milliseconds, microseconds or nanoseconds)" : "";

  const dateMs = useMemo(() => {
    if (dateText.trim()) return parseDateString(dateText);
    if (dateInput) return wallTimeToEpoch(dateInput, dateZone);
    return null;
  }, [dateText, dateInput, dateZone]);

  const useNow = () => setTsInput(String(Math.floor(Date.now() / 1000)));
  const codeList = parsed ? snippets(parsed.ms, localZone) : [];

  return (
    <ToolLayout title="Timestamp Converter" description="Convert Unix timestamps to dates in any time zone, and get the same instant as ready-to-paste code (incl. the Temporal API)">
      <div className="max-w-3xl space-y-8">
        <div>
          <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3 flex items-center gap-2">
            <Clock size={14} className="text-[#a855f7]" />
            Timestamp → Date
          </h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tsInput}
              onChange={(e) => setTsInput(e.target.value)}
              placeholder="Unix timestamp, e.g. 1761300000 or 1761300000000"
              className={`flex-1 min-w-0 px-3 py-2 text-sm font-mono bg-[#111111] border rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${tsError ? "border-[#ef4444]" : "border-[#222222]"}`}
            />
            <button onClick={useNow} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] whitespace-nowrap">
              <RefreshCw size={12} /> Now
            </button>
          </div>
          {tsError && <p className="text-xs text-[#ef4444] mb-2">{tsError}</p>}
          {parsed && (
            <>
              <p className="text-xs text-[#888888] mb-2">
                Read as <span className="text-[#a855f7]">{UNIT_LABEL[parsed.unit]}</span> · {relativeTime(parsed.ms)}
              </p>
              <div className="space-y-2">
                {formats(parsed.ms, localZone).map((row) => (
                  <div key={row.label} className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                    <span className="w-40 shrink-0 text-xs text-[#888888] font-medium truncate">{row.label}</span>
                    <span className="flex-1 min-w-0 text-sm text-[#f5f5f5] font-mono truncate">{row.value}</span>
                    <CopyButton text={row.value} size="sm" />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-semibold text-[#888888] mb-2 flex items-center gap-1.5">
                  <Globe2 size={12} /> World clock
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIMEZONES.map((tz) => (
                    <div key={tz.id} className="p-2.5 bg-[#111111] border border-[#222222] rounded-[6px]">
                      <div className="text-[10px] text-[#555555] uppercase tracking-wide">{tz.label}</div>
                      <div className="text-xs font-mono text-[#f5f5f5] mt-0.5">{formatInZone(parsed.ms, tz.id)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <h4 className="text-xs font-semibold text-[#888888] mb-2 flex items-center gap-1.5">
                  <Code2 size={12} /> This instant in code
                </h4>
                <div className="flex flex-wrap gap-1 mb-2">
                  {codeList.map((s, i) => (
                    <button
                      key={s.lang}
                      onClick={() => setLang(i)}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${lang === i ? "bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/30" : "text-[#888888] hover:text-[#f5f5f5] border-transparent"}`}
                    >
                      {s.lang}
                    </button>
                  ))}
                </div>
                {codeList[lang] && (
                  <div className="space-y-1.5">
                    {[
                      ["To a date", codeList[lang].toDate],
                      ["Current timestamp", codeList[lang].now],
                    ].map(([label, code]) => (
                      <div key={label} className="flex items-center gap-2 p-2.5 bg-[#0a0a0a] border border-[#222222] rounded-[6px]">
                        <span className="w-32 shrink-0 text-[11px] text-[#666666]">{label}</span>
                        <code className="flex-1 min-w-0 text-xs font-mono text-[#f5f5f5] overflow-x-auto whitespace-nowrap">{code}</code>
                        <CopyButton text={code} size="sm" />
                      </div>
                    ))}
                    {lang === 0 && (
                      <p className="text-[11px] text-[#666666] leading-relaxed">
                        {nativeTemporal ? "Your browser has Temporal built in — paste it into the console to try it." : "Temporal is built into current Chrome, Edge and Firefox and into Node 26; where it's missing (check Safari), use @js-temporal/polyfill."} Unlike Date, a
                        Temporal.ZonedDateTime keeps its time zone, so adding a day across a DST change stays at the same local time.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3 flex items-center gap-2">
            <Clock size={14} className="text-[#a855f7]" />
            Date → Timestamp
          </h3>
          <div className="grid sm:grid-cols-[1fr_200px] gap-2 mb-2">
            <input
              type="datetime-local"
              step={1}
              value={dateInput}
              onChange={(e) => {
                setDateInput(e.target.value);
                setDateText("");
              }}
              className="px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
            <select value={dateZone} onChange={(e) => setDateZone(e.target.value)} className="px-2 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5]">
              {Array.from(new Set([dateZone, ...TIMEZONES.map((t) => t.id)])).map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={dateText}
            onChange={(e) => setDateText(e.target.value)}
            placeholder="…or paste a date: 2026-10-24T14:30:00+04:00, Sat, 24 Oct 2026 10:30:00 GMT"
            className="w-full px-3 py-2 mb-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
          {dateText.trim() && dateMs === null && <p className="text-xs text-[#ef4444] mb-2">Couldn&apos;t read that date — ISO 8601 or RFC 2822 formats work best.</p>}
          {dateMs !== null && (
            <div className="space-y-2">
              {[
                ["Unix seconds", String(Math.floor(dateMs / 1000))],
                ["Milliseconds", String(Math.floor(dateMs))],
                ["ISO 8601 (UTC)", new Date(dateMs).toISOString()],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                  <span className="w-32 shrink-0 text-xs text-[#888888] font-medium">{label}</span>
                  <span className="flex-1 min-w-0 text-sm text-[#f5f5f5] font-mono truncate">{value}</span>
                  <CopyButton text={value} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
