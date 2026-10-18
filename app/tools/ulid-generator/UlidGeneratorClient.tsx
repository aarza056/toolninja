"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { RefreshCw, Clock, ArrowDownWideNarrow, Shuffle } from "lucide-react";
import { generateULID, generateMonotonicULIDs, ulidToDate } from "@/lib/ulid";

const BULK_OPTIONS = [1, 5, 10, 25, 100];

export default function UlidGeneratorClient() {
  const [count, setCount] = useState(5);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const [monotonic, setMonotonic] = useState(true);
  const [ids, setIds] = useState<string[]>([]);

  const generate = () => {
    const timestamp = useCustomTime && customTime ? new Date(customTime).getTime() : Date.now();
    setIds(monotonic ? generateMonotonicULIDs(count, timestamp) : Array.from({ length: count }, () => generateULID(timestamp)));
  };

  const inOrder = ids.every((id, i) => i === 0 || ids[i - 1] < id);

  return (
    <ToolLayout title="ULID Generator" description="Generate sortable, URL-safe ULIDs in bulk — a 48-bit timestamp plus 80 bits of randomness">
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="text-sm text-[#888888] block mb-1.5">Count</label>
            <div className="flex">
              {BULK_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                    count === n ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-[#888888] mb-1.5 cursor-pointer">
              <input type="checkbox" checked={useCustomTime} onChange={(e) => setUseCustomTime(e.target.checked)} className="accent-[#a855f7]" />
              Custom timestamp
            </label>
            {useCustomTime && (
              <input
                type="datetime-local"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="px-3 py-1.5 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-[#888888] mb-1.5 cursor-pointer" title="Within the same millisecond, each ULID's random part is the previous one + 1, so the batch sorts in generation order">
            <input type="checkbox" checked={monotonic} onChange={(e) => setMonotonic(e.target.checked)} className="accent-[#a855f7]" />
            Monotonic
          </label>

          <button
            onClick={generate}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
          >
            <RefreshCw size={14} /> Generate
          </button>
          {ids.length > 0 && <CopyButton text={ids.join("\n")} />}
        </div>

        {ids.length > 1 && (
          <p className={`flex items-center gap-1.5 mb-3 text-xs ${inOrder ? "text-[#22c55e]" : "text-[#f97316]"}`}>
            {inOrder ? <ArrowDownWideNarrow size={13} /> : <Shuffle size={13} />}
            {inOrder
              ? "Sorts in generation order — string sort matches insert order"
              : "Not in generation order — same millisecond, random tails. Turn on Monotonic to fix."}
          </p>
        )}

        {ids.length > 0 ? (
          <div className="space-y-1.5">
            {ids.map((id, i) => {
              const date = ulidToDate(id);
              return (
                <div key={`${id}-${i}`} className="flex items-center gap-2 px-3 py-2 bg-[#111111] border border-[#222222] rounded-[8px] group hover:border-[#333333] transition-colors">
                  <code className="flex-1 text-sm font-mono text-[#f5f5f5]">
                    <span className="text-[#a855f7]">{id.slice(0, 10)}</span>{id.slice(10)}
                  </code>
                  {date && (
                    <span className="hidden sm:flex items-center gap-1 text-[10px] text-[#555555] shrink-0">
                      <Clock size={10} /> {date.toISOString()}
                    </span>
                  )}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <CopyButton text={id} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
            Click Generate to create ULIDs
          </div>
        )}

        <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
          The first <span className="text-[#a855f7]">10 characters</span> (highlighted) encode a
          millisecond-precision timestamp, making ULIDs sort chronologically as plain strings — the
          same database-primary-key benefit as UUID v7, in Crockford Base32 instead of hex. The
          remaining 16 characters are random — or, in monotonic mode, random for the first ID and then
          incremented by one for each ID created in the same millisecond, per the ULID spec. Everything is generated with{" "}
          <code className="text-[#e879f9]">crypto.getRandomValues</code> and never leaves your browser.
        </div>
      </div>
    </ToolLayout>
  );
}
