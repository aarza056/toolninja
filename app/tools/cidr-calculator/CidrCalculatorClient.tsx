"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import { AlertCircle } from "lucide-react";
import CopyButton from "@/components/CopyButton";

// ─── IP math ──────────────────────────────────────────────────────────────────

function ipToNum(ip: string): number {
  const parts = ip.split(".");
  return (
    ((parseInt(parts[0], 10) << 24) |
      (parseInt(parts[1], 10) << 16) |
      (parseInt(parts[2], 10) << 8) |
      parseInt(parts[3], 10)) >>>
    0
  );
}

function numToIp(n: number): string {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join(".");
}

function ipToBinary(ip: string): string {
  return ip
    .split(".")
    .map((octet) => parseInt(octet, 10).toString(2).padStart(8, "0"))
    .join(".");
}

function isValidIp(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = parseInt(p, 10);
    return /^\d+$/.test(p) && n >= 0 && n <= 255;
  });
}

interface CidrResult {
  network: string;
  broadcast: string;
  mask: string;
  wildcard: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  prefix: number;
  binaryNetwork: string;
  binaryMask: string;
}

function calculateCidr(cidr: string): CidrResult | null {
  const trimmed = cidr.trim();
  const slashIdx = trimmed.indexOf("/");
  if (slashIdx === -1) return null;

  const ipPart = trimmed.slice(0, slashIdx);
  const prefixStr = trimmed.slice(slashIdx + 1);

  if (!isValidIp(ipPart)) return null;

  const prefix = parseInt(prefixStr, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;

  // Mask: prefix 1-bits, then 0-bits
  const maskNum = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcardNum = (~maskNum) >>> 0;

  const ipNum = ipToNum(ipPart);
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | wildcardNum) >>> 0;

  const totalHosts = Math.pow(2, 32 - prefix);
  const usableHosts = prefix >= 31 ? totalHosts : Math.max(0, totalHosts - 2);

  const firstHostNum = prefix >= 31 ? networkNum : (networkNum + 1) >>> 0;
  const lastHostNum = prefix >= 31 ? broadcastNum : Math.max(networkNum, (broadcastNum - 1) >>> 0);

  return {
    network: numToIp(networkNum),
    broadcast: numToIp(broadcastNum),
    mask: numToIp(maskNum),
    wildcard: numToIp(wildcardNum),
    firstHost: numToIp(firstHostNum),
    lastHost: numToIp(lastHostNum),
    totalHosts,
    usableHosts,
    prefix,
    binaryNetwork: ipToBinary(numToIp(networkNum)),
    binaryMask: ipToBinary(numToIp(maskNum)),
  };
}

function getIpClass(ip: string): string {
  const first = parseInt(ip.split(".")[0], 10);
  if (first >= 1 && first <= 126) return "A";
  if (first === 127) return "Loopback";
  if (first >= 128 && first <= 191) return "B";
  if (first >= 192 && first <= 223) return "C";
  if (first >= 224 && first <= 239) return "D (Multicast)";
  if (first >= 240 && first <= 255) return "E (Reserved)";
  return "—";
}

function formatHostCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M (${n.toLocaleString()})`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K (${n.toLocaleString()})`;
  return n.toLocaleString();
}

// ─── Binary display ───────────────────────────────────────────────────────────

function BinaryRow({ label, binary, prefix }: { label: string; binary: string; prefix: number }) {
  // binary is dot-separated octets, e.g. "11000000.10101000.00000001.00000000"
  const octets = binary.split(".");
  let bitIndex = 0;

  return (
    <div className="space-y-1">
      <p className="text-xs text-[#555555] font-medium">{label}</p>
      <div className="font-mono text-sm flex flex-wrap items-center gap-1">
        {octets.map((octet, oi) => (
          <span key={oi} className="flex items-center gap-0.5">
            {octet.split("").map((bit) => {
              const isNetwork = bitIndex < prefix;
              bitIndex++;
              return (
                <span
                  key={bitIndex}
                  className={isNetwork ? "text-[#a855f7]" : "text-[#333333]"}
                >
                  {bit}
                </span>
              );
            })}
            {oi < 3 && <span className="text-[#444444] mx-0.5">.</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({
  label,
  value,
  mono = true,
  accent = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] space-y-1">
      <p className="text-xs text-[#555555] font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-sm break-all ${mono ? "font-mono" : ""} ${accent ? "text-[#a855f7]" : "text-[#f5f5f5]"}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CidrCalculatorClient() {
  const [input, setInput] = useState("192.168.1.0/24");
  const [result, setResult] = useState<CidrResult | null>(null);
  const [error, setError] = useState("");

  const calculate = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setResult(null);
      setError("");
      return;
    }
    const res = calculateCidr(trimmed);
    if (res) {
      setResult(res);
      setError("");
    } else {
      setResult(null);
      setError("Invalid CIDR notation. Example: 192.168.1.0/24");
    }
  }, []);

  // Auto-calculate on mount with default value
  useEffect(() => {
    calculate(input);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (value: string) => {
    setInput(value);
    calculate(value);
  };

  return (
    <ToolLayout
      title="CIDR Calculator"
      description="Calculate network address, broadcast, subnet mask, host range, and binary representation from any CIDR notation."
    >
      <div className="space-y-6">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs text-[#888888] font-medium block">CIDR Notation</label>
          <input
            type="text"
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="e.g. 192.168.1.0/24 or 10.0.0.0/8"
            spellCheck={false}
            className={`w-full max-w-lg px-4 py-3 text-base font-mono bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#444444] transition-colors ${
              error ? "border-[#ef4444]" : "border-[#222222]"
            }`}
          />
          {error && (
            <div className="flex items-center gap-2 text-sm text-[#ef4444]">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Main info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ResultCard label="Network Address" value={result.network} accent />
              <ResultCard label="Broadcast Address" value={result.broadcast} />
              <ResultCard label="Subnet Mask" value={result.mask} />
              <ResultCard label="Wildcard Mask" value={result.wildcard} />
              <ResultCard label="First Usable Host" value={result.firstHost} />
              <ResultCard label="Last Usable Host" value={result.lastHost} />
              <ResultCard
                label="Total Hosts"
                value={formatHostCount(result.totalHosts)}
                mono={false}
              />
              <ResultCard
                label="Usable Hosts"
                value={formatHostCount(result.usableHosts)}
                mono={false}
              />
              <ResultCard
                label="CIDR Prefix"
                value={`/${result.prefix}`}
                accent
              />
              <ResultCard
                label="IP Class"
                value={getIpClass(result.network)}
                mono={false}
              />
            </div>

            {/* Binary section */}
            <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs text-[#888888] font-medium uppercase tracking-wide">Binary Representation</h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#a855f7] inline-block" />
                    <span className="text-[#555555]">Network bits</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#333333] inline-block" />
                    <span className="text-[#555555]">Host bits</span>
                  </span>
                </div>
              </div>
              <div className="space-y-3 overflow-x-auto">
                <BinaryRow label="Network Address" binary={result.binaryNetwork} prefix={result.prefix} />
                <BinaryRow label="Subnet Mask" binary={result.binaryMask} prefix={result.prefix} />
              </div>
            </div>

            {/* Copy summary */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-[#888888] font-medium">Summary</label>
                <CopyButton
                  text={[
                    `CIDR: ${input.trim()}`,
                    `Network: ${result.network}`,
                    `Broadcast: ${result.broadcast}`,
                    `Mask: ${result.mask}`,
                    `Wildcard: ${result.wildcard}`,
                    `First Host: ${result.firstHost}`,
                    `Last Host: ${result.lastHost}`,
                    `Total Hosts: ${result.totalHosts.toLocaleString()}`,
                    `Usable Hosts: ${result.usableHosts.toLocaleString()}`,
                    `IP Class: ${getIpClass(result.network)}`,
                  ].join("\n")}
                  size="sm"
                />
              </div>
              <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] font-mono text-xs text-[#888888] space-y-0.5">
                <p><span className="text-[#555555]">Network:</span> {result.network}/{result.prefix}</p>
                <p><span className="text-[#555555]">Range:</span> {result.firstHost} – {result.lastHost}</p>
                <p><span className="text-[#555555]">Mask:</span> {result.mask} / Wildcard: {result.wildcard}</p>
                <p>
                  <span className="text-[#555555]">Usable Hosts:</span> {result.usableHosts.toLocaleString()} /{" "}
                  <span className="text-[#555555]">Class:</span> {getIpClass(result.network)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!result && !error && (
          <div className="flex items-center justify-center h-40 text-[#444444] text-sm">
            Enter a CIDR range above to calculate
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
