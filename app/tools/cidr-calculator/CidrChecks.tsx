"use client";

import { useState } from "react";
import { containsIp, relation, numToIp } from "@/lib/cidr-info";
import { CheckCircle2, XCircle } from "lucide-react";

const field = "w-full min-w-0 px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

function Answer({ yes, text }: { yes: boolean; text: string }) {
  return (
    <p className={`flex items-start gap-1.5 text-sm ${yes ? "text-[#4ade80]" : "text-[#f87171]"}`}>
      {yes ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <XCircle size={15} className="shrink-0 mt-0.5" />} {text}
    </p>
  );
}

/** "Is this IP in that range?" and "Do these two ranges overlap?" — the two questions people search for most after the calculator itself. */
export default function CidrChecks() {
  const [range, setRange] = useState("10.0.0.0/16");
  const [ip, setIp] = useState("10.0.42.7");
  const [a, setA] = useState("10.0.0.0/16");
  const [b, setB] = useState("10.0.128.0/20");

  const inRange = containsIp(range, ip);
  const rel = relation(a, b);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <section className="p-4 bg-[#0f0f10] border border-[#222222] rounded-[10px] space-y-3">
        <h3 className="text-sm font-semibold text-[#f5f5f5]">Is an IP inside a CIDR block?</h3>
        <div className="grid grid-cols-2 gap-2">
          <input value={range} onChange={(e) => setRange(e.target.value)} placeholder="10.0.0.0/16" aria-label="CIDR block" spellCheck={false} className={field} />
          <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="10.0.42.7" aria-label="IP address" spellCheck={false} className={field} />
        </div>
        {inRange === null ? (
          <p className="text-xs text-[#888888]">Enter a block like 10.0.0.0/16 and an IPv4 address.</p>
        ) : (
          <Answer yes={inRange} text={inRange ? `Yes — ${ip.trim()} is inside ${range.trim()}.` : `No — ${ip.trim()} is outside ${range.trim()}.`} />
        )}
      </section>

      <section className="p-4 bg-[#0f0f10] border border-[#222222] rounded-[10px] space-y-3">
        <h3 className="text-sm font-semibold text-[#f5f5f5]">Do two CIDR blocks overlap?</h3>
        <div className="grid grid-cols-2 gap-2">
          <input value={a} onChange={(e) => setA(e.target.value)} placeholder="10.0.0.0/16" aria-label="First CIDR block" spellCheck={false} className={field} />
          <input value={b} onChange={(e) => setB(e.target.value)} placeholder="10.1.0.0/16" aria-label="Second CIDR block" spellCheck={false} className={field} />
        </div>
        {!rel ? (
          <p className="text-xs text-[#888888]">Enter two blocks, e.g. a VPC and a subnet, or two VPCs you want to peer.</p>
        ) : rel.relation === "separate" ? (
          <Answer yes text={`No overlap — ${rel.a.cidr} and ${rel.b.cidr} are separate, so they can be peered or routed together.`} />
        ) : (
          <Answer
            yes={false}
            text={
              rel.relation === "same"
                ? `They're the same block (${rel.a.cidr}).`
                : rel.relation === "first-contains-second"
                ? `Overlap — ${rel.b.cidr} sits inside ${rel.a.cidr} (${numToIp(rel.b.start)} – ${numToIp(rel.b.end)}).`
                : `Overlap — ${rel.a.cidr} sits inside ${rel.b.cidr} (${numToIp(rel.a.start)} – ${numToIp(rel.a.end)}).`
            }
          />
        )}
        <p className="text-[11px] text-[#666666]">CIDR blocks never partly overlap: one is inside the other, or they don&apos;t touch at all. Overlapping VPCs can&apos;t be peered.</p>
      </section>
    </div>
  );
}
