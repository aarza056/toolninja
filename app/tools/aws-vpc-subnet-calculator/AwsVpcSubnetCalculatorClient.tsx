"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AWS_RESERVED, MAX_AZS, azLabel, planVpc, vpcCloudFormation, vpcTerraform, type NatMode, type TierType, type VpcTier } from "@/lib/vpc-subnets";

const STORAGE_KEY = "toolninja:aws-vpc-subnet-calculator";

const DEFAULT = {
  name: "production",
  cidr: "10.0.0.0/16",
  azCount: 3,
  spareAzs: 1,
  nat: "none" as NatMode,
  tiers: [
    { name: "public", type: "public", prefix: 24 },
    { name: "private", type: "private", prefix: 20 },
    { name: "database", type: "database", prefix: 24 },
  ] as VpcTier[],
};

const field = "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";
const label = "block text-xs text-[#888888] font-medium";
const PREFIXES = Array.from({ length: 13 }, (_, i) => 16 + i);
const TYPE_TONE: Record<TierType, string> = { public: "text-[#4ade80]", private: "text-[#60a5fa]", database: "text-[#fbbf24]" };

export default function AwsVpcSubnetCalculatorClient() {
  const [state, setState] = useState(DEFAULT);
  const [code, setCode] = useState<"terraform" | "cloudformation">("terraform");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.cidr && Array.isArray(saved.tiers) && saved.tiers.length) setState({ ...DEFAULT, ...saved });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const set = (patch: Partial<typeof DEFAULT>) => setState((s) => ({ ...s, ...patch }));
  const setTier = (i: number, patch: Partial<VpcTier>) => set({ tiers: state.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) });

  const plan = useMemo(() => planVpc(state), [state]);
  const output = useMemo(() => (plan.ok ? (code === "terraform" ? vpcTerraform(plan) : vpcCloudFormation(plan)) : ""), [plan, code]);
  const tsv = plan.ok
    ? [["Tier", "Type", "AZ", "Subnet", "First usable", "Last usable", "Usable IPs"].join("\t"), ...plan.subnets.map((s) => [s.tier, s.type, azLabel(s.az), s.cidr, s.firstUsable, s.lastUsable, s.usable].join("\t"))].join("\n")
    : "";

  return (
    <ToolLayout title="AWS VPC Subnet Calculator" description="Lay out public, private and database subnets across Availability Zones, then copy the Terraform or CloudFormation">
      <div className="space-y-6 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-6">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                VPC name
                <input value={state.name} onChange={(e) => set({ name: e.target.value })} spellCheck={false} className={`${field} mt-1 w-full`} />
              </label>
              <label className={label}>
                VPC range (/16 to /28)
                <input value={state.cidr} onChange={(e) => set({ cidr: e.target.value })} spellCheck={false} className={`${field} mt-1 w-full font-mono`} />
              </label>
              <label className={label}>
                Availability Zones
                <select value={state.azCount} onChange={(e) => set({ azCount: Number(e.target.value) })} className={`${field} mt-1 w-full`}>
                  {Array.from({ length: MAX_AZS }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className={label}>
                Room for more AZs
                <select value={state.spareAzs} onChange={(e) => set({ spareAzs: Number(e.target.value) })} className={`${field} mt-1 w-full`}>
                  {[0, 1, 2, 3].map((n) => (
                    <option key={n} value={n}>{n === 0 ? "None" : `${n} more`}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className={label}>
              Outbound internet for private subnets
              <select value={state.nat} onChange={(e) => set({ nat: e.target.value as NatMode })} className={`${field} mt-1 w-full`}>
                <option value="none">None (no NAT gateway)</option>
                <option value="single">One NAT gateway (cheaper, one zone can cut off the rest)</option>
                <option value="per-az">One NAT gateway per zone (resilient, costs more)</option>
              </select>
            </label>
            {plan.ok && (
              <p className="text-xs text-[#888888]">
                Subnets use {plan.used.toLocaleString("en-US")} of {plan.total.toLocaleString("en-US")} addresses ({Math.round((plan.used / plan.total) * 100)}%). AWS reserves {AWS_RESERVED} in each subnet.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className={label}>Subnet tiers, each repeated in every zone</p>
            {state.tiers.map((t, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input aria-label="Tier name" value={t.name} onChange={(e) => setTier(i, { name: e.target.value })} spellCheck={false} className={`${field} flex-1 min-w-0`} />
                <select aria-label="Tier type" value={t.type} onChange={(e) => setTier(i, { type: e.target.value as TierType })} className={`${field} w-28`}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="database">Database</option>
                </select>
                <select aria-label="Subnet size" value={t.prefix} onChange={(e) => setTier(i, { prefix: Number(e.target.value) })} className={`${field} w-44 shrink-0 font-mono`}>
                  {PREFIXES.map((p) => (
                    <option key={p} value={p}>/{p} ({(2 ** (32 - p) - AWS_RESERVED).toLocaleString("en-US")} IPs)</option>
                  ))}
                </select>
                <button aria-label={`Remove ${t.name}`} onClick={() => set({ tiers: state.tiers.filter((_, j) => j !== i) })} className="p-2 text-[#555555] hover:text-[#ef4444] shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button onClick={() => set({ tiers: [...state.tiers, { name: `tier-${state.tiers.length + 1}`, type: "private", prefix: 24 }] })} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px]">
              <Plus size={14} /> Add tier
            </button>
          </div>
        </div>

        {!plan.ok && <p className="text-sm text-[#f87171]">{plan.error}</p>}

        {plan.ok && (
          <>
            {plan.warnings.length > 0 && (
              <ul className="space-y-1">
                {plan.warnings.map((w) => (
                  <li key={w} className="text-xs text-[#fbbf24]">{w}</li>
                ))}
              </ul>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className={label}>{plan.subnets.length} subnets in {plan.cidr}</p>
                <CopyButton text={tsv} size="sm" />
              </div>
              <div className="overflow-x-auto border border-[#222222] rounded-[8px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[#888888] bg-[#111111]">
                      <th className="px-3 py-2 font-medium">Tier</th>
                      <th className="px-3 py-2 font-medium">Zone</th>
                      <th className="px-3 py-2 font-medium">Subnet</th>
                      <th className="px-3 py-2 font-medium">First usable</th>
                      <th className="px-3 py-2 font-medium">Last usable</th>
                      <th className="px-3 py-2 font-medium text-right">Usable IPs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.subnets.map((s) => (
                      <tr key={s.cidr} className="border-t border-[#1a1a1a]">
                        <td className="px-3 py-1.5">
                          <span className="text-[#f5f5f5]">{s.tier}</span> <span className={`text-xs ${TYPE_TONE[s.type]}`}>{s.type === s.tier ? "" : s.type}</span>
                        </td>
                        <td className="px-3 py-1.5 font-mono text-[#bbbbbb]">{azLabel(s.az)}</td>
                        <td className="px-3 py-1.5 font-mono text-[#c084fc]">{s.cidr}</td>
                        <td className="px-3 py-1.5 font-mono text-[#bbbbbb]">{s.firstUsable}</td>
                        <td className="px-3 py-1.5 font-mono text-[#bbbbbb]">{s.lastUsable}</td>
                        <td className="px-3 py-1.5 font-mono text-[#bbbbbb] text-right">{s.usable.toLocaleString("en-US")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[#666666] mt-1">Zone a is the first zone AWS lists in your region, b the second, and so on. The code picks real zone names when it runs.</p>
              {plan.free.length > 0 && (
                <p className="text-xs text-[#888888] mt-2 break-words">
                  Still free: <span className="font-mono text-[#bbbbbb]">{plan.free.slice(0, 12).join(", ")}{plan.free.length > 12 ? ` and ${plan.free.length - 12} more` : ""}</span>
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
                  {(["terraform", "cloudformation"] as const).map((c) => (
                    <button key={c} onClick={() => setCode(c)} className={`px-3 py-1 text-xs ${code === c ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}>
                      {c === "terraform" ? "Terraform" : "CloudFormation"}
                    </button>
                  ))}
                </div>
                <CopyButton text={output} size="sm" />
              </div>
              <pre aria-label="Generated code" className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto max-h-[28rem]">{output}</pre>
            </div>
          </>
        )}

        <p className="text-xs text-[#666666]">
          Everything runs in your browser. For networks outside AWS, use the <Link href="/tools/vlsm-subnet-planner" className="text-[#a855f7] hover:underline">VLSM Subnet Planner</Link>.
        </p>
      </div>
    </ToolLayout>
  );
}
