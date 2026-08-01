"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { RefreshCw } from "lucide-react";
import { generateUuidV4, generateUuidV7, generateNanoId } from "@/lib/id-formats";

const BULK_OPTIONS = [1, 5, 10, 25, 100];
type Mode = "v4" | "v7" | "nanoid";

const MODES: { id: Mode; label: string }[] = [
  { id: "v4", label: "UUID v4" },
  { id: "v7", label: "UUID v7" },
  { id: "nanoid", label: "NanoID" },
];

export default function UuidGeneratorClient() {
  const [mode, setMode] = useState<Mode>("v4");
  const [count, setCount] = useState(5);
  const [nanoSize, setNanoSize] = useState(21);
  const [ids, setIds] = useState<string[]>([]);

  const generateOne = () => {
    if (mode === "v4") return generateUuidV4();
    if (mode === "v7") return generateUuidV7();
    return generateNanoId(nanoSize);
  };

  const generate = () => {
    setIds(Array.from({ length: count }, generateOne));
  };

  return (
    <ToolLayout title="UUID Generator" description="Generate UUID v4, UUID v7, or NanoID identifiers in bulk">
      <div className="max-w-2xl">
        {/* Mode tabs */}
        <div className="flex mb-4">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-4 py-2 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                mode === m.id
                  ? "bg-[#a855f7] border-[#a855f7] text-white"
                  : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#555555] mb-4">
          {mode === "v4" && "Fully random 122-bit identifier — the classic default, no ordering."}
          {mode === "v7" && "Time-ordered: starts with a millisecond timestamp, so IDs sort chronologically — the 2026 default for database primary keys."}
          {mode === "nanoid" && "Short, URL-safe random ID — best for public-facing identifiers like share links and invite codes."}
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#888888]">Count:</label>
            <div className="flex">
              {BULK_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                    count === n
                      ? "bg-[#a855f7] border-[#a855f7] text-white"
                      : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {mode === "nanoid" && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-[#888888]">Length:</label>
              <input
                type="number"
                min={4}
                max={64}
                value={nanoSize}
                onChange={(e) => setNanoSize(Number(e.target.value) || 21)}
                className="w-16 px-2 py-1.5 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
            </div>
          )}

          <button
            onClick={generate}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
          >
            <RefreshCw size={14} /> Generate
          </button>
          {ids.length > 0 && (
            <CopyButton text={ids.join("\n")} />
          )}
        </div>

        {ids.length > 0 ? (
          <div className="space-y-1.5">
            {ids.map((id, i) => (
              <div key={`${id}-${i}`} className="flex items-center gap-2 px-3 py-2 bg-[#111111] border border-[#222222] rounded-[8px] group hover:border-[#333333] transition-colors">
                <code className="flex-1 text-sm font-mono text-[#f5f5f5]">{id}</code>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={id} size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
            Click Generate to create IDs
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
