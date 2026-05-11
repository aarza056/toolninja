"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { RefreshCw } from "lucide-react";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const BULK_OPTIONS = [1, 5, 10, 25, 100];

export default function UuidGeneratorClient() {
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);

  const generate = () => {
    setUuids(Array.from({ length: count }, generateUUID));
  };

  return (
    <ToolLayout title="UUID Generator" description="Generate RFC 4122 v4 UUIDs in bulk">
      <div className="max-w-2xl">
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
          <button
            onClick={generate}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
          >
            <RefreshCw size={14} /> Generate
          </button>
          {uuids.length > 0 && (
            <CopyButton text={uuids.join("\n")} />
          )}
        </div>

        {uuids.length > 0 ? (
          <div className="space-y-1.5">
            {uuids.map((uuid) => (
              <div key={uuid} className="flex items-center gap-2 px-3 py-2 bg-[#111111] border border-[#222222] rounded-[8px] group hover:border-[#333333] transition-colors">
                <code className="flex-1 text-sm font-mono text-[#f5f5f5]">{uuid}</code>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={uuid} size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
            Click Generate to create UUIDs
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
