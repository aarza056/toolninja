"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { planVlsm, type SubnetNeed } from "@/lib/cidr-tools";
import { Plus, Trash2 } from "lucide-react";

const STORAGE_KEY = "toolninja:vlsm-subnet-planner";

const DEFAULT = {
  base: "192.168.10.0/24",
  cloud: false,
  needs: [
    { name: "Engineering", hosts: 60 },
    { name: "Sales", hosts: 28 },
    { name: "Guest Wi-Fi", hosts: 25 },
    { name: "Servers", hosts: 12 },
    { name: "Router link", hosts: 2 },
  ] as SubnetNeed[],
};

const field = "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

export default function VlsmSubnetPlannerClient() {
  const [base, setBase] = useState(DEFAULT.base);
  const [cloud, setCloud] = useState(DEFAULT.cloud);
  const [needs, setNeeds] = useState<SubnetNeed[]>(DEFAULT.needs);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.base && Array.isArray(saved.needs) && saved.needs.length) {
        setBase(saved.base);
        setCloud(Boolean(saved.cloud));
        setNeeds(saved.needs);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ base, cloud, needs }));
    } catch {}
  }, [base, cloud, needs]);

  const plan = useMemo(() => planVlsm(base, needs, cloud), [base, needs, cloud]);
  const update = (i: number, patch: Partial<SubnetNeed>) => setNeeds((n) => n.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const tsv = plan.ok
    ? [
        ["Name", "Hosts needed", "Subnet", "Mask", "First host", "Last host", cloud ? "Last address (reserved)" : "Broadcast", "Usable"].join("\t"),
        ...plan.subnets.map((s) => [s.name, s.hosts, s.cidr, s.mask, s.firstHost, s.lastHost, s.broadcast, s.usable].join("\t")),
      ].join("\n")
    : "";

  return (
    <ToolLayout title="VLSM Subnet Planner" description="Split a network into subnets sized by how many hosts each one needs — the most efficient CIDR for each, with no overlaps">
      <div className="space-y-6 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-6">
          <div className="space-y-3">
            <label className="block text-xs text-[#888888] font-medium">
              Network to split
              <input value={base} onChange={(e) => setBase(e.target.value)} spellCheck={false} className={`${field} mt-1 w-full font-mono`} />
            </label>
            <label className="flex items-start gap-2 text-sm text-[#bbbbbb]">
              <input type="checkbox" checked={cloud} onChange={(e) => setCloud(e.target.checked)} className="mt-1 accent-[#a855f7]" />
              <span>
                AWS / Azure rules
                <span className="block text-xs text-[#666666]">5 addresses reserved in every subnet; subnets between /16 and /28.</span>
              </span>
            </label>
            {plan.ok && (
              <p className="text-xs text-[#888888]">
                Uses {plan.used.toLocaleString("en-US")} of {plan.total.toLocaleString("en-US")} addresses ({Math.round((plan.used / plan.total) * 100)}%).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-[#888888] font-medium">Subnets and the hosts each needs</p>
            {needs.map((n, i) => (
              <div key={i} className="flex gap-2">
                <input value={n.name} onChange={(e) => update(i, { name: e.target.value })} placeholder={`Subnet ${i + 1}`} aria-label="Subnet name" className={`${field} flex-1 min-w-0`} />
                <input
                  type="number"
                  min={1}
                  value={n.hosts || ""}
                  onChange={(e) => update(i, { hosts: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                  aria-label="Hosts needed"
                  className={`${field} w-28 font-mono`}
                />
                <button onClick={() => setNeeds((x) => x.filter((_, j) => j !== i))} disabled={needs.length === 1} aria-label="Remove subnet" className="px-2 text-[#666666] hover:text-[#f87171] disabled:opacity-30">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button onClick={() => setNeeds((x) => [...x, { name: "", hosts: 10 }])} className="inline-flex items-center gap-1 text-xs text-[#a855f7] hover:underline">
              <Plus size={13} /> Add subnet
            </button>
          </div>
        </div>

        {!plan.ok ? (
          <p className="p-3 text-sm text-[#f87171] bg-[#ef4444]/5 border border-[#ef4444]/30 rounded-[8px]">{plan.error}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide">Plan</p>
              <CopyButton text={tsv} size="sm" />
            </div>
            <div className="overflow-x-auto border border-[#1e1e1e] rounded-[8px]">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-[#111111]">
                  <tr>
                    {["Name", "Hosts", "Subnet", "Mask", "Usable range", cloud ? "Last (reserved)" : "Broadcast", "Usable", "Spare"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[#888] uppercase tracking-wide border-b border-[#1e1e1e] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.subnets.map((s) => (
                    <tr key={s.cidr} className="even:bg-[#0d0d0d]">
                      <td className="px-3 py-1.5 border-b border-[#161616] text-[#dddddd]">{s.name}</td>
                      <td className="px-3 py-1.5 border-b border-[#161616] font-mono text-[#999999]">{s.hosts}</td>
                      <td className="px-3 py-1.5 border-b border-[#161616] font-mono text-[#c4b5fd] whitespace-nowrap">
                        <Link href={`/tools/cidr-calculator/${s.prefix}`} className="hover:underline">
                          {s.cidr}
                        </Link>
                      </td>
                      <td className="px-3 py-1.5 border-b border-[#161616] font-mono text-[#999999]">{s.mask}</td>
                      <td className="px-3 py-1.5 border-b border-[#161616] font-mono text-[#bbbbbb] whitespace-nowrap">
                        {s.firstHost} – {s.lastHost}
                      </td>
                      <td className="px-3 py-1.5 border-b border-[#161616] font-mono text-[#999999]">{s.broadcast}</td>
                      <td className="px-3 py-1.5 border-b border-[#161616] font-mono text-[#bbbbbb]">{s.usable.toLocaleString("en-US")}</td>
                      <td className="px-3 py-1.5 border-b border-[#161616] font-mono text-[#666666]">{s.spare.toLocaleString("en-US")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {plan.free.length > 0 && (
              <p className="text-xs text-[#888888] leading-relaxed">
                Still free for later: <span className="font-mono text-[#bbbbbb]">{plan.free.join(", ")}</span>
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-[#666666] leading-relaxed">
          Each subnet gets the smallest block whose usable hosts cover what you asked for: block size minus the network and broadcast addresses (or minus 5 with AWS / Azure
          rules). Subnets are placed largest first, so every block starts on its own boundary and nothing overlaps. Need to combine or clean up a list of ranges instead? Try{" "}
          <Link href="/tools/cidr-merge" className="text-[#a855f7] hover:underline">
            CIDR Merge
          </Link>
          .
        </p>
      </div>
    </ToolLayout>
  );
}
