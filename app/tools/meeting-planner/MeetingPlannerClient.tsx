"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import { X, Plus } from "lucide-react";
import {
  MEETING_CITIES,
  buildHourGrid,
  localMidnightAsUtc,
  getOffsetLabel,
  formatHour12,
  classifyHour,
  type HourKind,
} from "@/lib/meeting-planner";

const STORAGE_KEY = "toolninja:meeting-planner";

const KIND_COLOR: Record<HourKind, string> = {
  work: "bg-[#22c55e]/25 text-[#22c55e]",
  off: "bg-[#eab308]/20 text-[#eab308]",
  sleep: "bg-[#1a1a1a] text-[#444444]",
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function MeetingPlannerClient() {
  const [referenceTimeZone, setReferenceTimeZone] = useState("UTC");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [cities, setCities] = useState<string[]>([]);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [addCity, setAddCity] = useState("");

  useEffect(() => {
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setReferenceTimeZone(parsed.referenceTimeZone ?? browserTz);
        setCities(parsed.cities ?? ["America/New_York", "Europe/London", "Asia/Kolkata", "Asia/Tokyo"]);
      } else {
        setReferenceTimeZone(browserTz);
        setCities(["America/New_York", "Europe/London", "Asia/Kolkata", "Asia/Tokyo"]);
      }
    } catch {
      setCities(["America/New_York", "Europe/London", "Asia/Kolkata", "Asia/Tokyo"]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ referenceTimeZone, cities }));
    } catch {}
  }, [referenceTimeZone, cities]);

  const referenceUtcMidnight = useMemo(
    () => localMidnightAsUtc(selectedDate, referenceTimeZone),
    [selectedDate, referenceTimeZone]
  );

  const rows = useMemo(
    () =>
      cities.map((tz) => ({
        tz,
        label: MEETING_CITIES.find((c) => c.id === tz)?.label ?? tz,
        offset: getOffsetLabel(tz),
        cells: buildHourGrid(tz, referenceUtcMidnight, referenceTimeZone),
      })),
    [cities, referenceUtcMidnight, referenceTimeZone]
  );

  const availableToAdd = MEETING_CITIES.filter((c) => !cities.includes(c.id) && c.id !== referenceTimeZone);

  const addCityHandler = () => {
    if (addCity && !cities.includes(addCity)) {
      setCities((prev) => [...prev, addCity]);
      setAddCity("");
    }
  };

  return (
    <ToolLayout
      title="Meeting Planner"
      description="Compare working hours across time zones and find a meeting time that works for everyone"
    >
      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Reference time zone</label>
          <select
            value={referenceTimeZone}
            onChange={(e) => setReferenceTimeZone(e.target.value)}
            className="px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] min-w-[200px]"
          >
            {MEETING_CITIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </div>
        <div className="flex items-end gap-2">
          <select
            value={addCity}
            onChange={(e) => setAddCity(e.target.value)}
            className="px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] min-w-[180px]"
          >
            <option value="">Add a city…</option>
            {availableToAdd.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={addCityHandler}
            disabled={!addCity}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-40 text-white rounded-[6px] transition-colors"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header hour row (reference timezone) */}
          <div className="flex items-center gap-0.5 mb-1 pl-[160px]">
            {Array.from({ length: 24 }, (_, h) => (
              <button
                key={h}
                onClick={() => setSelectedHour(selectedHour === h ? null : h)}
                className={`flex-1 text-center text-[10px] py-1 rounded-[4px] transition-colors ${
                  selectedHour === h ? "bg-[#a855f7] text-white font-semibold" : "text-[#555555] hover:text-[#f5f5f5]"
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          {/* Reference zone row */}
          <div className="flex items-center gap-0.5 mb-2">
            <div className="w-[160px] shrink-0 text-xs text-[#f5f5f5] font-medium pr-2 truncate">
              {MEETING_CITIES.find((c) => c.id === referenceTimeZone)?.label ?? referenceTimeZone} <span className="text-[#555555]">(ref)</span>
            </div>
            {Array.from({ length: 24 }, (_, h) => {
              const kind = classifyHour(h);
              return (
                <div
                  key={h}
                  className={`flex-1 h-7 flex items-center justify-center text-[10px] rounded-[4px] ${KIND_COLOR[kind]} ${selectedHour === h ? "ring-2 ring-[#a855f7]" : ""}`}
                >
                  {h % 3 === 0 ? formatHour12(h) : ""}
                </div>
              );
            })}
          </div>

          {/* City rows */}
          <div className="space-y-1.5">
            {rows.map((row) => (
              <div key={row.tz} className="flex items-center gap-0.5 group">
                <div className="w-[160px] shrink-0 flex items-center justify-between pr-2">
                  <div className="min-w-0">
                    <p className="text-xs text-[#f5f5f5] truncate">{row.label}</p>
                    <p className="text-[10px] text-[#555555]">{row.offset}</p>
                  </div>
                  <button
                    onClick={() => setCities((prev) => prev.filter((c) => c !== row.tz))}
                    className="opacity-0 group-hover:opacity-100 text-[#555555] hover:text-[#ef4444] transition-opacity shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
                {row.cells.map((cell) => {
                  const kind = classifyHour(cell.localHour);
                  return (
                    <div
                      key={cell.refHour}
                      className={`flex-1 h-7 flex items-center justify-center text-[10px] rounded-[4px] relative ${KIND_COLOR[kind]} ${selectedHour === cell.refHour ? "ring-2 ring-[#a855f7]" : ""}`}
                    >
                      {cell.localHour % 3 === 0 ? cell.localHour : ""}
                      {cell.dayOffset !== 0 && (
                        <span className="absolute -top-1 -right-0.5 text-[8px] text-[#a855f7]">
                          {cell.dayOffset > 0 ? "+1" : "-1"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-5 text-xs text-[#888888]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] bg-[#22c55e]/25" /> Working hours (9–6)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] bg-[#eab308]/20" /> Awake, off-hours</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] bg-[#1a1a1a] border border-[#222222]" /> Likely asleep</span>
      </div>

      {selectedHour !== null && (
        <div className="mt-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
          <p className="text-xs text-[#888888]">
            At <span className="text-[#a855f7] font-mono">{formatHour12(selectedHour)}</span> in{" "}
            {MEETING_CITIES.find((c) => c.id === referenceTimeZone)?.label ?? referenceTimeZone}, it&apos;s:
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            {rows.map((row) => {
              const cell = row.cells.find((c) => c.refHour === selectedHour);
              if (!cell) return null;
              return (
                <span key={row.tz} className="text-xs text-[#f5f5f5]">
                  <span className="text-[#555555]">{row.label}:</span> {formatHour12(cell.localHour)}
                  {cell.dayOffset !== 0 && <span className="text-[#a855f7]"> ({cell.dayOffset > 0 ? "next day" : "previous day"})</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
