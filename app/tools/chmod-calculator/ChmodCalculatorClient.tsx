"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Terminal } from "lucide-react";

interface PermSet {
  read: boolean;
  write: boolean;
  execute: boolean;
}

interface Permissions {
  owner: PermSet;
  group: PermSet;
  others: PermSet;
}

const PRESETS: { label: string; octal: string; description: string }[] = [
  { label: "644", octal: "644", description: "Default file" },
  { label: "755", octal: "755", description: "Executable / dir" },
  { label: "777", octal: "777", description: "Full access" },
  { label: "600", octal: "600", description: "Private file" },
  { label: "400", octal: "400", description: "Read-only" },
  { label: "700", octal: "700", description: "Private exec" },
  { label: "664", octal: "664", description: "Group writable" },
  { label: "775", octal: "775", description: "Group executable" },
];

function digitToPermSet(digit: number): PermSet {
  return {
    read: (digit & 4) !== 0,
    write: (digit & 2) !== 0,
    execute: (digit & 1) !== 0,
  };
}

function permSetToDigit(ps: PermSet): number {
  return (ps.read ? 4 : 0) + (ps.write ? 2 : 0) + (ps.execute ? 1 : 0);
}

function permSetToSymbol(ps: PermSet): string {
  return (ps.read ? "r" : "-") + (ps.write ? "w" : "-") + (ps.execute ? "x" : "-");
}

function octalToPermissions(octal: string): Permissions | null {
  if (!/^[0-7]{3}$/.test(octal)) return null;
  const digits = octal.split("").map(Number);
  return {
    owner: digitToPermSet(digits[0]),
    group: digitToPermSet(digits[1]),
    others: digitToPermSet(digits[2]),
  };
}

function buildDescription(perms: Permissions): string {
  const parts: string[] = [];

  function describeSet(label: string, ps: PermSet): string {
    const abilities: string[] = [];
    if (ps.read) abilities.push("read");
    if (ps.write) abilities.push("write");
    if (ps.execute) abilities.push("execute");
    if (abilities.length === 0) return `${label} has no permissions.`;
    return `${label} can ${abilities.join(", ")}.`;
  }

  parts.push(describeSet("Owner", perms.owner));
  parts.push(describeSet("Group", perms.group));
  parts.push(describeSet("Others", perms.others));
  return parts.join(" ");
}

const INITIAL_PERMS: Permissions = {
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: true },
  others: { read: true, write: false, execute: true },
};

export default function ChmodCalculatorClient() {
  const [perms, setPerms] = useState<Permissions>(INITIAL_PERMS);
  const [octalInput, setOctalInput] = useState("755");
  const [octalError, setOctalError] = useState("");

  const ownerDigit = permSetToDigit(perms.owner);
  const groupDigit = permSetToDigit(perms.group);
  const othersDigit = permSetToDigit(perms.others);
  const octal = `${ownerDigit}${groupDigit}${othersDigit}`;
  const symbolic = permSetToSymbol(perms.owner) + permSetToSymbol(perms.group) + permSetToSymbol(perms.others);
  const chmodCommand = `chmod ${octal} filename`;
  const description = buildDescription(perms);

  const toggleBit = (section: keyof Permissions, bit: keyof PermSet) => {
    setPerms((prev) => {
      const updated = {
        ...prev,
        [section]: { ...prev[section], [bit]: !prev[section][bit] },
      };
      const d = permSetToDigit(updated.owner).toString() +
        permSetToDigit(updated.group).toString() +
        permSetToDigit(updated.others).toString();
      setOctalInput(d);
      setOctalError("");
      return updated;
    });
  };

  const handleOctalInput = (value: string) => {
    setOctalInput(value);
    if (value.length === 3) {
      const parsed = octalToPermissions(value);
      if (parsed) {
        setPerms(parsed);
        setOctalError("");
      } else {
        setOctalError("Each digit must be 0–7");
      }
    } else if (value.length > 3) {
      setOctalError("Must be exactly 3 digits (e.g. 755)");
    } else {
      setOctalError("");
    }
  };

  const applyPreset = (presetOctal: string) => {
    const parsed = octalToPermissions(presetOctal);
    if (parsed) {
      setPerms(parsed);
      setOctalInput(presetOctal);
      setOctalError("");
    }
  };

  const sections: { key: keyof Permissions; label: string }[] = [
    { key: "owner", label: "Owner" },
    { key: "group", label: "Group" },
    { key: "others", label: "Others" },
  ];

  const bits: { key: keyof PermSet; label: string; char: string; value: number }[] = [
    { key: "read", label: "Read", char: "r", value: 4 },
    { key: "write", label: "Write", char: "w", value: 2 },
    { key: "execute", label: "Execute", char: "x", value: 1 },
  ];

  return (
    <ToolLayout
      title="Chmod Calculator"
      description="Calculate Unix file permissions visually. Toggle checkboxes or type an octal value."
    >
      <div className="max-w-2xl space-y-6">
        {/* Octal display + input row */}
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-2">Octal Code</label>
            <div className="flex items-center gap-3">
              <span className="text-5xl font-mono font-bold text-[#a855f7] leading-none">{octal}</span>
              <input
                type="text"
                value={octalInput}
                onChange={(e) => handleOctalInput(e.target.value.replace(/\D/g, "").slice(0, 3))}
                maxLength={3}
                placeholder="755"
                className={`w-20 px-3 py-2 text-sm font-mono bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${
                  octalError ? "border-[#ef4444]" : "border-[#222222]"
                }`}
              />
            </div>
            {octalError && <p className="text-xs text-[#ef4444] mt-1">{octalError}</p>}
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-2">Symbolic</label>
            <code className="text-2xl font-mono text-[#f5f5f5] tracking-widest">{symbolic}</code>
          </div>
        </div>

        {/* Permission checkboxes */}
        <div className="grid grid-cols-3 gap-4">
          {sections.map(({ key, label }) => (
            <div key={key} className="bg-[#111111] border border-[#222222] rounded-[8px] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#f5f5f5]">{label}</span>
                <span className="text-lg font-mono font-bold text-[#a855f7]">
                  {permSetToDigit(perms[key])}
                </span>
              </div>
              <div className="space-y-2">
                {bits.map(({ key: bitKey, label: bitLabel, char, value }) => (
                  <label
                    key={bitKey}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={perms[key][bitKey]}
                      onChange={() => toggleBit(key, bitKey)}
                      className="accent-[#a855f7] w-4 h-4"
                    />
                    <span className="flex-1 text-sm text-[#888888] group-hover:text-[#f5f5f5] transition-colors">
                      {bitLabel}
                    </span>
                    <span className="text-xs font-mono text-[#555555]">
                      {char} ({value})
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#222222]">
                <code className="text-sm font-mono text-[#888888]">
                  {permSetToSymbol(perms[key])}
                </code>
              </div>
            </div>
          ))}
        </div>

        {/* Chmod command output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-[#888888] font-medium flex items-center gap-1.5">
              <Terminal size={12} />
              Command
            </label>
            <CopyButton text={chmodCommand} size="sm" />
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
            <code className="flex-1 text-sm font-mono text-[#f5f5f5]">{chmodCommand}</code>
          </div>
        </div>

        {/* Description */}
        <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
          <p className="text-xs text-[#888888] font-medium mb-1">What this means</p>
          <p className="text-sm text-[#f5f5f5]">{description}</p>
        </div>

        {/* Presets */}
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-2">Common Presets</label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.octal}
                onClick={() => applyPreset(preset.octal)}
                className={`flex flex-col items-center px-3 py-2 rounded-[6px] border text-sm transition-colors ${
                  octal === preset.octal
                    ? "bg-[#a855f7] border-[#a855f7] text-white"
                    : "bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222]"
                }`}
              >
                <span className="font-mono font-semibold">{preset.label}</span>
                <span className={`text-[10px] mt-0.5 ${octal === preset.octal ? "text-white/70" : "text-[#555555]"}`}>
                  {preset.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
