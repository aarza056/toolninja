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

function maskToPrefix(mask: string): number | null {
  if (!isValidIp(mask)) return null;
  const bits = ipToNum(mask).toString(2).padStart(32, "0");
  if (!/^1*0*$/.test(bits)) return null;
  const firstZero = bits.indexOf("0");
  return firstZero === -1 ? 32 : firstZero;
}

/** Smallest list of CIDR blocks that exactly covers start..end (inclusive). */
function rangeToCidrs(startIp: string, endIp: string): string[] {
  let cur = ipToNum(startIp);
  const end = ipToNum(endIp);
  const out: string[] = [];
  while (cur <= end && out.length < 64) {
    let size = 1;
    while (size < 0x100000000 && cur % (size * 2) === 0 && cur + size * 2 - 1 <= end) size *= 2;
    out.push(`${numToIp(cur)}/${32 - Math.log2(size)}`);
    cur += size;
  }
  return out;
}

type InputKind =
  | { kind: "cidr"; cidr: string; note?: string }
  | { kind: "range"; start: string; end: string; blocks: string[] }
  | { kind: "mask"; mask: string; prefix: number }
  | { kind: "error"; message: string };

const IPV4 = "(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})";

// Accepts the other ways people express an IPv4 network besides a.b.c.d/nn.
function interpretIpv4Input(raw: string): InputKind | null {
  const s = raw.trim();
  const range = s.match(new RegExp(`^${IPV4}\\s*(?:-|–|to)\\s*${IPV4}$`, "i"));
  if (range) {
    if (!isValidIp(range[1]) || !isValidIp(range[2])) return { kind: "error", message: "Invalid IP address in range" };
    if (ipToNum(range[1]) > ipToNum(range[2])) return { kind: "error", message: "Range start must come before range end" };
    return { kind: "range", start: range[1], end: range[2], blocks: rangeToCidrs(range[1], range[2]) };
  }
  const ipMask = s.match(new RegExp(`^${IPV4}(?:\\s+|\\s*/\\s*)${IPV4}$`));
  if (ipMask) {
    const prefix = maskToPrefix(ipMask[2]);
    if (!isValidIp(ipMask[1])) return { kind: "error", message: "Invalid IP address" };
    if (prefix === null) return { kind: "error", message: `${ipMask[2]} isn't a valid subnet mask (its 1-bits must be contiguous)` };
    return { kind: "cidr", cidr: `${ipMask[1]}/${prefix}`, note: `Subnet mask ${ipMask[2]} = /${prefix}` };
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(s) && isValidIp(s)) {
    const prefix = maskToPrefix(s);
    if (prefix !== null && s.startsWith("255.")) return { kind: "mask", mask: s, prefix };
    return { kind: "cidr", cidr: `${s}/32`, note: "No prefix given, so this is a single address (/32). Add /24, /16, or a subnet mask for a network." };
  }
  return null;
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

interface Subnet {
  cidr: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
}

function splitIntoSubnets(networkNum: number, newPrefix: number, count: number): Subnet[] {
  const subnetSize = Math.pow(2, 32 - newPrefix);
  const subnets: Subnet[] = [];
  for (let i = 0; i < count; i++) {
    const subNetworkNum = (networkNum + i * subnetSize) >>> 0;
    const subBroadcastNum = (subNetworkNum + subnetSize - 1) >>> 0;
    const firstHostNum = newPrefix >= 31 ? subNetworkNum : (subNetworkNum + 1) >>> 0;
    const lastHostNum = newPrefix >= 31 ? subBroadcastNum : (subBroadcastNum - 1) >>> 0;
    subnets.push({
      cidr: `${numToIp(subNetworkNum)}/${newPrefix}`,
      network: numToIp(subNetworkNum),
      broadcast: numToIp(subBroadcastNum),
      firstHost: numToIp(firstHostNum),
      lastHost: numToIp(lastHostNum),
    });
  }
  return subnets;
}

// ─── IPv6 math ────────────────────────────────────────────────────────────────

function expandIpv6(ip: string): string[] | null {
  let parts: string[];
  if (ip.includes("::")) {
    if ((ip.match(/::/g) || []).length > 1) return null;
    const [head, tail] = ip.split("::");
    const headParts = head ? head.split(":") : [];
    const tailParts = tail ? tail.split(":") : [];
    const missing = 8 - headParts.length - tailParts.length;
    if (missing < 0) return null;
    parts = [...headParts, ...Array(missing).fill("0"), ...tailParts];
  } else {
    parts = ip.split(":");
  }
  if (parts.length !== 8) return null;
  if (!parts.every((p) => /^[0-9a-fA-F]{1,4}$/.test(p))) return null;
  return parts.map((p) => p.padStart(4, "0").toLowerCase());
}

function ipv6ToBigInt(expandedParts: string[]): bigint {
  return expandedParts.reduce((acc, group) => (acc << BigInt(16)) | BigInt("0x" + group), BigInt(0));
}

function bigIntToIpv6Groups(n: bigint): string[] {
  const groups: string[] = [];
  for (let i = 7; i >= 0; i--) {
    groups.push(((n >> BigInt(i * 16)) & BigInt(0xffff)).toString(16));
  }
  return groups;
}

function compressIpv6(groups: string[]): string {
  let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
  for (let i = 0; i < 8; i++) {
    if (groups[i] === "0") {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
    } else {
      curStart = -1; curLen = 0;
    }
  }
  if (bestLen < 2) return groups.join(":");
  const before = groups.slice(0, bestStart).join(":");
  const after = groups.slice(bestStart + bestLen).join(":");
  return `${before}::${after}`;
}

function ipv6MaskFromPrefix(prefix: number): bigint {
  if (prefix === 0) return BigInt(0);
  return ((BigInt(1) << BigInt(128)) - BigInt(1)) ^ ((BigInt(1) << BigInt(128 - prefix)) - BigInt(1));
}

interface Ipv6Result {
  prefix: number;
  compressedNetwork: string;
  expandedNetwork: string;
  compressedLast: string;
  expandedLast: string;
  totalAddresses: string;
}

function calculateCidrV6(cidr: string): Ipv6Result | null {
  const trimmed = cidr.trim();
  const slashIdx = trimmed.indexOf("/");
  if (slashIdx === -1) return null;

  const ipPart = trimmed.slice(0, slashIdx);
  const prefix = parseInt(trimmed.slice(slashIdx + 1), 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 128) return null;

  const expanded = expandIpv6(ipPart);
  if (!expanded) return null;

  const addrBig = ipv6ToBigInt(expanded);
  const mask = ipv6MaskFromPrefix(prefix);
  const wildcard = ((BigInt(1) << BigInt(128)) - BigInt(1)) ^ mask;
  const network = addrBig & mask;
  const last = network | wildcard;

  return {
    prefix,
    compressedNetwork: compressIpv6(bigIntToIpv6Groups(network)),
    expandedNetwork: bigIntToIpv6Groups(network).join(":"),
    compressedLast: compressIpv6(bigIntToIpv6Groups(last)),
    expandedLast: bigIntToIpv6Groups(last).join(":"),
    totalAddresses: (BigInt(1) << BigInt(128 - prefix)).toString(),
  };
}

function formatBigAddressCount(n: string): string {
  const num = BigInt(n);
  if (num < BigInt(1_000_000)) return num.toLocaleString();
  // Scientific-ish notation for huge IPv6 ranges (can exceed 10^30)
  const digits = n.length;
  const mantissa = n.slice(0, 3).replace(/^(\d)(\d+)/, "$1.$2");
  return `${mantissa} × 10^${digits - 1}  (${n})`;
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
  const [v6Result, setV6Result] = useState<Ipv6Result | null>(null);
  const [error, setError] = useState("");
  const [splitCount, setSplitCount] = useState(4);
  const [note, setNote] = useState("");
  const [rangeResult, setRangeResult] = useState<{ start: string; end: string; blocks: string[] } | null>(null);
  const [maskResult, setMaskResult] = useState<{ mask: string; prefix: number } | null>(null);

  const calculate = useCallback((value: string) => {
    const trimmed = value.trim();
    setNote("");
    setRangeResult(null);
    setMaskResult(null);
    if (!trimmed) {
      setResult(null);
      setV6Result(null);
      setError("");
      return;
    }

    if (!trimmed.includes(":") && !trimmed.match(/\/\d{1,2}$/)) {
      const interpreted = interpretIpv4Input(trimmed);
      if (interpreted?.kind === "error") {
        setResult(null);
        setV6Result(null);
        setError(interpreted.message);
        return;
      }
      if (interpreted?.kind === "range") {
        setResult(null);
        setV6Result(null);
        setError("");
        setRangeResult(interpreted);
        return;
      }
      if (interpreted?.kind === "mask") {
        setResult(null);
        setV6Result(null);
        setError("");
        setMaskResult(interpreted);
        return;
      }
      if (interpreted?.kind === "cidr") {
        setNote(interpreted.note ?? "");
        setResult(calculateCidr(interpreted.cidr));
        setV6Result(null);
        setError("");
        return;
      }
    }

    if (trimmed.includes(":")) {
      const res6 = calculateCidrV6(trimmed);
      if (res6) {
        setV6Result(res6);
        setResult(null);
        setError("");
      } else {
        setV6Result(null);
        setResult(null);
        setError("Invalid IPv6 CIDR notation. Example: 2001:db8::/32");
      }
      return;
    }

    const res = calculateCidr(trimmed);
    if (res) {
      setResult(res);
      setV6Result(null);
      setError("");
    } else {
      setResult(null);
      setV6Result(null);
      setError("Couldn't read that. Try 192.168.1.0/24, 10.0.0.0 - 10.0.3.255, 192.168.1.10 255.255.255.0, or 2001:db8::/32");
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
      description="Turn CIDR notation into an IP range, subnet mask, and host count — or an IP range or subnet mask back into CIDR. IPv4 and IPv6."
    >
      <div className="space-y-6">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs text-[#888888] font-medium block">CIDR, IP range, or IP + subnet mask</label>
          <input
            type="text"
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="192.168.1.0/24 · 10.0.0.0 - 10.0.3.255 · 192.168.1.10 255.255.255.0"
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
          {note && <p className="text-xs text-[#a855f7]">{note}</p>}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["10.0.0.0/16", "172.16.0.0 - 172.16.5.255", "192.168.1.10 255.255.255.0", "255.255.240.0", "2001:db8::/48"].map((ex) => (
              <button
                key={ex}
                onClick={() => handleChange(ex)}
                className="px-2 py-1 text-[11px] font-mono bg-[#111111] border border-[#222222] rounded text-[#666] hover:text-[#a855f7] hover:border-[#a855f7]/40 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* IP range → CIDR blocks */}
        {rangeResult && (
          <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs text-[#888888] font-medium uppercase tracking-wide">
                {rangeResult.blocks.length === 1 ? "This range is exactly one CIDR block" : `This range needs ${rangeResult.blocks.length} CIDR blocks`}
              </h3>
              <CopyButton text={rangeResult.blocks.join("\n")} size="sm" />
            </div>
            <p className="text-xs text-[#555555] font-mono">
              {rangeResult.start} – {rangeResult.end} ·{" "}
              {formatHostCount(ipToNum(rangeResult.end) - ipToNum(rangeResult.start) + 1)} addresses
            </p>
            <div className="flex flex-wrap gap-2">
              {rangeResult.blocks.map((b) => (
                <button
                  key={b}
                  onClick={() => handleChange(b)}
                  title="Open this block in the calculator"
                  className="px-2.5 py-1 text-sm font-mono bg-[#0a0a0a] border border-[#333] rounded text-[#a855f7] hover:border-[#a855f7]/60 transition-colors"
                >
                  {b}
                </button>
              ))}
            </div>
            {rangeResult.blocks.length > 1 && (
              <p className="text-xs text-[#555555]">
                A single CIDR block must start on a boundary that&apos;s a multiple of its size, so an arbitrary range is covered by
                the smallest set of aligned blocks. Click a block to inspect it.
              </p>
            )}
          </div>
        )}

        {/* Subnet mask → prefix */}
        {maskResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ResultCard label="Subnet Mask" value={maskResult.mask} />
            <ResultCard label="CIDR Prefix" value={`/${maskResult.prefix}`} accent />
            <ResultCard label="Wildcard Mask" value={numToIp(~ipToNum(maskResult.mask) >>> 0)} />
            <ResultCard
              label="Addresses per Network"
              value={formatHostCount(Math.pow(2, 32 - maskResult.prefix))}
              mono={false}
            />
          </div>
        )}

        {/* IPv6 results */}
        {v6Result && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ResultCard label="Network Address" value={v6Result.compressedNetwork} accent />
              <ResultCard label="Last Address" value={v6Result.compressedLast} />
              <ResultCard label="CIDR Prefix" value={`/${v6Result.prefix}`} accent />
              <ResultCard label="Total Addresses" value={formatBigAddressCount(v6Result.totalAddresses)} mono={false} />
            </div>
            <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] space-y-2">
              <h3 className="text-xs text-[#888888] font-medium uppercase tracking-wide">Expanded Form</h3>
              <p className="font-mono text-xs text-[#888888] break-all">Network: <span className="text-[#f5f5f5]">{v6Result.expandedNetwork}</span></p>
              <p className="font-mono text-xs text-[#888888] break-all">Last: <span className="text-[#f5f5f5]">{v6Result.expandedLast}</span></p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-[#888888] font-medium">Summary</label>
                <CopyButton
                  text={[
                    `CIDR: ${input.trim()}`,
                    `Network: ${v6Result.compressedNetwork}/${v6Result.prefix}`,
                    `Last Address: ${v6Result.compressedLast}`,
                    `Total Addresses: ${v6Result.totalAddresses}`,
                  ].join("\n")}
                  size="sm"
                />
              </div>
            </div>
          </>
        )}

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

            {/* Subnet splitter */}
            {result.prefix < 30 && (
              <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs text-[#888888] font-medium uppercase tracking-wide">Split into Subnets</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#555555]">Split into</label>
                    <select
                      value={splitCount}
                      onChange={(e) => setSplitCount(Number(e.target.value))}
                      className="px-2 py-1 text-xs bg-[#0a0a0a] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                    >
                      {[2, 4, 8, 16, 32, 64, 128, 256]
                        .filter((n) => result.prefix + Math.log2(n) <= 30)
                        .map((n) => (
                          <option key={n} value={n}>{n} subnets</option>
                        ))}
                    </select>
                  </div>
                </div>
                {(() => {
                  const newPrefix = result.prefix + Math.log2(splitCount);
                  const subnets = splitIntoSubnets(ipToNum(result.network), newPrefix, splitCount);
                  const summary = subnets.map((s) => `${s.cidr}  (${s.firstHost} – ${s.lastHost})`).join("\n");
                  return (
                    <>
                      <div className="flex justify-end">
                        <CopyButton text={summary} size="sm" label="Copy all" />
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs font-mono">
                          <thead>
                            <tr className="text-[#555555] text-left">
                              <th className="pb-1.5 pr-3 font-medium">Subnet</th>
                              <th className="pb-1.5 pr-3 font-medium">Broadcast</th>
                              <th className="pb-1.5 font-medium">Usable Range</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subnets.map((s) => (
                              <tr key={s.cidr} className="border-t border-[#1e1e1e]">
                                <td className="py-1.5 pr-3 text-[#a855f7]">{s.cidr}</td>
                                <td className="py-1.5 pr-3 text-[#888888]">{s.broadcast}</td>
                                <td className="py-1.5 text-[#888888]">{s.firstHost} – {s.lastHost}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

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
        {!result && !v6Result && !error && (
          <div className="flex items-center justify-center h-40 text-[#444444] text-sm">
            Enter a CIDR range above to calculate
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
