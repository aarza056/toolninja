"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { cidrRows, convertMask, listAddresses, rowsToCsv } from "@/lib/cidr-tools";

const STORAGE_KEY = "toolninja:cidr-to-ip-range";
const EXAMPLE = `10.0.0.0/24
192.168.1.0/29
172.16.0.0/12
203.0.113.10/32
10.1.0.0 255.255.255.0
192.0.2.10-192.0.2.40`;

const MAX_LISTED = 65536;
const MAX_SHOWN_ROWS = 500;
const PREVIEW_LINES = 2000;

const field = "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

function download(name: string, text: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function CidrToIpRangeClient() {
  const [input, setInput] = useState("");
  const [mask, setMask] = useState("255.255.255.0");
  const [listing, setListing] = useState(false);

  useEffect(() => {
    try {
      setInput(localStorage.getItem(STORAGE_KEY) || EXAMPLE);
    } catch {
      setInput(EXAMPLE);
    }
  }, []);
  useEffect(() => {
    if (!input) return;
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const { rows, errors } = useMemo(() => cidrRows(input), [input]);
  const csv = useMemo(() => rowsToCsv(rows), [rows]);
  const totalAddresses = rows.reduce((n, r) => n + r.total, 0);
  const listed = useMemo(() => (listing ? listAddresses(rows, MAX_LISTED) : null), [listing, rows]);
  const listedText = useMemo(() => listed?.addresses.join("\n") ?? "", [listed]);
  const conversion = useMemo(() => convertMask(mask), [mask]);

  return (
    <ToolLayout title="CIDR to IP Range Converter" description="Turn CIDR blocks into first and last IP, usable hosts and address count, in bulk, with CSV export and subnet mask conversion">
      <div className="space-y-6 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6">
          <div>
            <label htmlFor="cidr-input" className="text-xs text-[#888888] font-medium block mb-1">
              CIDR blocks, one per line. An IP with a mask or a range also works
            </label>
            <textarea id="cidr-input" value={input} onChange={(e) => setInput(e.target.value)} rows={8} spellCheck={false} className={`${field} w-full font-mono`} />
            {errors.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {errors.slice(0, 8).map((e) => (
                  <li key={e} className="text-xs text-[#f87171]">{e}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] h-fit">
            <label htmlFor="mask-input" className="text-xs text-[#888888] font-medium block mb-1">
              Subnet mask ↔ prefix
            </label>
            <input id="mask-input" value={mask} onChange={(e) => setMask(e.target.value)} spellCheck={false} placeholder="/24 or 255.255.255.0" className={`${field} w-full font-mono !bg-[#0a0a0a]`} />
            {"error" in conversion ? (
              <p className="text-xs text-[#f87171] mt-2">{conversion.error}</p>
            ) : (
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="text-[#888888]">Prefix</dt>
                <dd className="font-mono text-[#f5f5f5]">/{conversion.prefix}</dd>
                <dt className="text-[#888888]">Subnet mask</dt>
                <dd className="font-mono text-[#f5f5f5]">{conversion.mask}</dd>
                <dt className="text-[#888888]">Wildcard mask</dt>
                <dd className="font-mono text-[#f5f5f5]">{conversion.wildcard}</dd>
                <dt className="text-[#888888]">Addresses</dt>
                <dd className="font-mono text-[#f5f5f5]">{conversion.total.toLocaleString("en-US")}</dd>
                <dt className="text-[#888888]">Usable hosts</dt>
                <dd className="font-mono text-[#f5f5f5]">{conversion.hosts.toLocaleString("en-US")}</dd>
              </dl>
            )}
          </div>
        </div>

        {rows.length > 0 && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <p className="text-xs text-[#888888] font-medium">
                {rows.length} {rows.length === 1 ? "entry" : "entries"} · {totalAddresses.toLocaleString("en-US")} addresses
              </p>
              <div className="flex items-center gap-3">
                <button onClick={() => download("cidr-ranges.csv", csv, "text/csv")} className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5]">
                  <Download size={12} /> CSV
                </button>
                <CopyButton text={csv} size="sm" />
              </div>
            </div>
            <div className="overflow-x-auto border border-[#222222] rounded-[8px]">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-left text-xs text-[#888888] bg-[#111111]">
                    <th className="px-3 py-2 font-medium">CIDR</th>
                    <th className="px-3 py-2 font-medium">First IP</th>
                    <th className="px-3 py-2 font-medium">Last IP</th>
                    <th className="px-3 py-2 font-medium text-right">Addresses</th>
                    <th className="px-3 py-2 font-medium">Usable hosts</th>
                    <th className="px-3 py-2 font-medium">Subnet mask</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, MAX_SHOWN_ROWS).map((r, i) => (
                    <tr key={i} className="border-t border-[#1a1a1a] font-mono text-xs">
                      <td className="px-3 py-1.5 text-[#c084fc]">{r.cidr ?? `${r.cidrs.length} blocks`}</td>
                      <td className="px-3 py-1.5 text-[#f5f5f5]">{r.first}</td>
                      <td className="px-3 py-1.5 text-[#f5f5f5]">{r.last}</td>
                      <td className="px-3 py-1.5 text-[#bbbbbb] text-right">{r.total.toLocaleString("en-US")}</td>
                      <td className="px-3 py-1.5 text-[#bbbbbb]">{r.cidr ? `${r.firstHost} – ${r.lastHost}` : "—"}</td>
                      <td className="px-3 py-1.5 text-[#bbbbbb]">{r.mask ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > MAX_SHOWN_ROWS && <p className="text-xs text-[#666666] mt-1">Showing the first {MAX_SHOWN_ROWS}; the CSV has all {rows.length}.</p>}
            {rows.some((r) => !r.cidr) && <p className="text-xs text-[#666666] mt-1">A range that isn&apos;t one exact block has no single mask. The CSV lists the blocks that cover it.</p>}
            <p className="text-xs text-[#666666] mt-1">
              These rows are kept as you entered them. To join or deduplicate them, use <Link href="/tools/cidr-merge" className="text-[#a855f7] hover:underline">CIDR Merge</Link>.
            </p>
          </div>
        )}

        {rows.length > 0 && (
          <div>
            <label className="flex items-center gap-2 text-sm text-[#bbbbbb]">
              <input type="checkbox" checked={listing} onChange={(e) => setListing(e.target.checked)} className="accent-[#a855f7]" />
              List every IP address
            </label>
            {listed && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-[#888888]">{listed.truncated ? `The first ${MAX_LISTED.toLocaleString("en-US")} of ${totalAddresses.toLocaleString("en-US")} addresses` : `${listed.addresses.length.toLocaleString("en-US")} addresses`}</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => download("ip-addresses.txt", listedText, "text/plain")} className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5]">
                      <Download size={12} /> Download
                    </button>
                    <CopyButton text={listedText} size="sm" />
                  </div>
                </div>
                <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto max-h-64">
                  {listed.addresses.slice(0, PREVIEW_LINES).join("\n")}
                  {listed.addresses.length > PREVIEW_LINES ? "\n…" : ""}
                </pre>
                {listed.addresses.length > PREVIEW_LINES && <p className="text-xs text-[#666666] mt-1">Showing the first {PREVIEW_LINES.toLocaleString("en-US")} here; Download and Copy include them all.</p>}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-[#666666]">
          IPv4 only. Everything runs in your browser. Need details on one block? Try the <Link href="/tools/cidr-calculator" className="text-[#a855f7] hover:underline">CIDR Calculator</Link>.
        </p>
      </div>
    </ToolLayout>
  );
}
