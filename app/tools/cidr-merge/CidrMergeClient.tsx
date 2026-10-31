"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { formatRange, mergeRanges, parseList, rangeSize, rangesToCidrs, subtractRanges } from "@/lib/cidr-tools";

const STORAGE_KEY = "toolninja:cidr-merge";

const EXAMPLE = `# Paste IPs, CIDR blocks or ranges — one per line, or separated by commas
10.0.0.0/25
10.0.0.128/25
10.0.1.0/24
10.0.0.42
192.168.1.10 - 192.168.1.20
172.16.0.0 255.255.255.0
172.16.1.0/24`;

type Format = "lines" | "comma" | "ranges";

const textarea = "w-full p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

export default function CidrMergeClient() {
  const [input, setInput] = useState("");
  const [exclude, setExclude] = useState("");
  const [format, setFormat] = useState<Format>("lines");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      setInput(saved?.input || EXAMPLE);
      setExclude(saved?.exclude || "");
    } catch {
      setInput(EXAMPLE);
    }
  }, []);
  useEffect(() => {
    if (!input) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ input, exclude }));
    } catch {}
  }, [input, exclude]);

  const result = useMemo(() => {
    const a = parseList(input);
    const b = parseList(exclude);
    const merged = mergeRanges(a.ranges);
    const ranges = b.ranges.length ? subtractRanges(merged, b.ranges) : merged;
    const cidrs = rangesToCidrs(ranges);
    return { a, b, ranges, cidrs, inSize: rangeSize(merged), outSize: rangeSize(ranges) };
  }, [input, exclude]);

  const output = format === "ranges" ? result.ranges.map(formatRange).join("\n") : format === "comma" ? result.cidrs.join(", ") : result.cidrs.join("\n");
  const errors = [...result.a.errors, ...result.b.errors.map((e) => `Exclude: ${e}`)];

  return (
    <ToolLayout title="CIDR Merge & IP Range to CIDR" description="Merge and deduplicate IP lists into the fewest CIDR blocks, subtract ranges, and convert IP ranges to CIDR">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4 min-w-0">
          <label className="block text-xs text-[#888888] font-medium">
            IPs, CIDR blocks and ranges
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={14} spellCheck={false} className={`${textarea} mt-1`} />
          </label>
          <label className="block text-xs text-[#888888] font-medium">
            Exclude (optional) — removed from the result
            <textarea value={exclude} onChange={(e) => setExclude(e.target.value)} rows={4} spellCheck={false} placeholder="e.g. 10.0.0.64/26" className={`${textarea} mt-1`} />
          </label>
          {errors.length > 0 && (
            <ul className="space-y-1">
              {errors.slice(0, 8).map((e, i) => (
                <li key={i} className="text-xs text-[#f87171]">
                  Skipped {e}
                </li>
              ))}
              {errors.length > 8 && <li className="text-xs text-[#f87171]">…and {errors.length - 8} more</li>}
            </ul>
          )}
        </div>

        <div className="space-y-4 min-w-0">
          <div className="grid grid-cols-3 gap-2">
            {[
              [result.a.count, "entries in"],
              [format === "ranges" ? result.ranges.length : result.cidrs.length, format === "ranges" ? "ranges out" : "CIDR blocks out"],
              [result.outSize.toLocaleString("en-US"), "addresses covered"],
            ].map(([v, l]) => (
              <div key={String(l)} className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                <div className="text-lg font-semibold font-mono text-[#f5f5f5]">{v}</div>
                <div className="text-[11px] text-[#888888]">{l}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {(
                [
                  ["lines", "One per line"],
                  ["comma", "Comma-separated"],
                  ["ranges", "Start–end ranges"],
                ] as [Format, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setFormat(id)}
                  className={`px-2.5 py-1 text-xs rounded-[6px] border ${format === id ? "border-[#a855f7]/60 bg-[#a855f7]/10 text-[#f5f5f5]" : "border-[#222222] text-[#888888] hover:text-[#f5f5f5]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <pre className="p-3 min-h-[220px] max-h-[420px] overflow-auto text-xs font-mono bg-[#0a0a0a] border border-[#222222] rounded-[8px] text-[#f5f5f5] whitespace-pre-wrap break-all">
            {output || <span className="text-[#555555]">The merged list appears here.</span>}
          </pre>
          {result.b.ranges.length > 0 && (
            <p className="text-xs text-[#888888]">
              Excluding removed {(result.inSize - result.outSize).toLocaleString("en-US")} addresses.
            </p>
          )}
          <p className="text-xs text-[#666666] leading-relaxed">
            Overlapping and touching blocks are joined, duplicates disappear, and every range becomes the smallest set of CIDR blocks that covers it exactly. IPv4 only. To
            inspect a single block, use the{" "}
            <Link href="/tools/cidr-calculator" className="text-[#a855f7] hover:underline">
              CIDR Calculator
            </Link>
            ; to split one into subnets by size, the{" "}
            <Link href="/tools/vlsm-subnet-planner" className="text-[#a855f7] hover:underline">
              VLSM Subnet Planner
            </Link>
            .
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}
