"use client";

import { useMemo, useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Terminal } from "lucide-react";
import { applySymbolic, parseLsLine, shortOctal, umaskFor, umaskInfo, type LsEntry } from "@/lib/chmod-modes";

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

interface SpecialBits {
  setuid: boolean;
  setgid: boolean;
  sticky: boolean;
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

// The special-bit letter replaces the execute character: lowercase when the underlying
// execute bit is also set, uppercase when it isn't (e.g. rws vs. rwS).
function specialExecChar(ps: PermSet, specialSet: boolean, letter: "s" | "t"): string {
  if (!specialSet) return ps.execute ? "x" : "-";
  return ps.execute ? letter : letter.toUpperCase();
}

function specialDigit(special: SpecialBits): number {
  return (special.setuid ? 4 : 0) + (special.setgid ? 2 : 0) + (special.sticky ? 1 : 0);
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

// Directories need execute (traverse) permission to be usable, but that bit doesn't belong
// on regular files — stripping it is the standard convention when splitting dir vs file perms.
function stripExecute(octal: string): string {
  return octal
    .split("")
    .map((d) => (Number(d) & 6).toString())
    .join("");
}

export default function ChmodCalculatorClient({ initialOctal, heading, intro }: { initialOctal?: string; heading?: string; intro?: string } = {}) {
  // A 3-digit mode, or 4 digits with the setuid/setgid/sticky digit in front
  const start = initialOctal && /^[0-7]?[0-7]{3}$/.test(initialOctal) ? initialOctal : "755";
  const startSpecial = start.length === 4 ? Number(start[0]) : 0;
  const [perms, setPerms] = useState<Permissions>(() => octalToPermissions(start.slice(-3)) ?? INITIAL_PERMS);
  const [special, setSpecial] = useState<SpecialBits>({ setuid: (startSpecial & 4) !== 0, setgid: (startSpecial & 2) !== 0, sticky: (startSpecial & 1) !== 0 });
  const [octalInput, setOctalInput] = useState(start);
  const [octalError, setOctalError] = useState("");
  const [recursivePath, setRecursivePath] = useState("/path/to/dir");
  const [splitFileDir, setSplitFileDir] = useState(false);
  const [fileOctal, setFileOctal] = useState("644");
  const [pasted, setPasted] = useState("");
  const [umask, setUmask] = useState("022");
  const [chownUser, setChownUser] = useState("www-data");
  const [chownGroup, setChownGroup] = useState("www-data");
  const [chownPath, setChownPath] = useState("/var/www/html");
  const [chownRecursive, setChownRecursive] = useState(true);

  const ownerDigit = permSetToDigit(perms.owner);
  const groupDigit = permSetToDigit(perms.group);
  const othersDigit = permSetToDigit(perms.others);
  const baseOctal = `${ownerDigit}${groupDigit}${othersDigit}`;
  const specialD = specialDigit(special);
  const octal = specialD > 0 ? `${specialD}${baseOctal}` : baseOctal;
  const symbolic =
    permSetToSymbol(perms.owner).slice(0, 2) + specialExecChar(perms.owner, special.setuid, "s") +
    permSetToSymbol(perms.group).slice(0, 2) + specialExecChar(perms.group, special.setgid, "s") +
    permSetToSymbol(perms.others).slice(0, 2) + specialExecChar(perms.others, special.sticky, "t");
  const chmodCommand = `chmod ${octal} filename`;
  const description = buildDescription(perms);

  const toggleBit = (section: keyof Permissions, bit: keyof PermSet) => {
    setPerms((prev) => {
      const updated = {
        ...prev,
        [section]: { ...prev[section], [bit]: !prev[section][bit] },
      };
      const base = permSetToDigit(updated.owner).toString() +
        permSetToDigit(updated.group).toString() +
        permSetToDigit(updated.others).toString();
      const sd = specialDigit(special);
      setOctalInput(sd > 0 ? `${sd}${base}` : base);
      setOctalError("");
      return updated;
    });
  };

  const toggleSpecial = (bit: keyof SpecialBits) => {
    setSpecial((prev) => {
      const updated = { ...prev, [bit]: !prev[bit] };
      const sd = specialDigit(updated);
      setOctalInput(sd > 0 ? `${sd}${baseOctal}` : baseOctal);
      setOctalError("");
      return updated;
    });
  };

  const handleOctalInput = (value: string) => {
    setOctalInput(value);
    if (value.length === 3 || value.length === 4) {
      const base = value.length === 4 ? value.slice(1) : value;
      const specialD = value.length === 4 ? Number(value[0]) : 0;
      const parsed = octalToPermissions(base);
      if (parsed && specialD <= 7) {
        setPerms(parsed);
        setSpecial({ setuid: (specialD & 4) !== 0, setgid: (specialD & 2) !== 0, sticky: (specialD & 1) !== 0 });
        setOctalError("");
      } else {
        setOctalError("Each digit must be 0–7");
      }
    } else if (value.length > 4) {
      setOctalError("Must be 3 digits (e.g. 755) or 4 with a special-bits prefix (e.g. 4755)");
    } else {
      setOctalError("");
    }
  };

  const setFromMode = (mode: number) => {
    const o = shortOctal(mode);
    const sd = o.length === 4 ? Number(o[0]) : 0;
    const parsed = octalToPermissions(o.slice(-3));
    if (!parsed) return;
    setPerms(parsed);
    setSpecial({ setuid: (sd & 4) !== 0, setgid: (sd & 2) !== 0, sticky: (sd & 1) !== 0 });
    setOctalInput(o);
    setOctalError("");
  };

  // What was pasted: ls -l lines, an rwx string, or a symbolic chmod expression applied to the current mode
  const pasteResult = useMemo(() => {
    const lines = pasted
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/^total \d+$/.test(l));
    if (!lines.length) return null;
    const entries = lines.map(parseLsLine);
    if (entries.every((e) => e)) return { kind: "ls" as const, entries: entries as LsEntry[] };
    if (lines.length === 1) {
      const applied = applySymbolic(parseInt(octal, 8), lines[0]);
      if (applied !== null) return { kind: "symbolic" as const, from: octal, mode: applied };
    }
    return { kind: "error" as const };
  }, [pasted, octal]);

  const um = umaskInfo(umask);
  const chownWho = chownUser && chownGroup ? `${chownUser}:${chownGroup}` : chownUser || (chownGroup ? `:${chownGroup}` : "user:group");
  const chownCmds = `sudo chown ${chownRecursive ? "-R " : ""}${chownWho} ${chownPath || "/path"}\nsudo chmod ${chownRecursive ? "-R " : ""}${octal} ${chownPath || "/path"}`;

  const applyPreset = (presetOctal: string) => {
    const parsed = octalToPermissions(presetOctal);
    if (parsed) {
      setPerms(parsed);
      setSpecial({ setuid: false, setgid: false, sticky: false });
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
      title={heading ?? "Chmod Calculator"}
      description={intro ?? "Calculate Unix file permissions visually. Toggle checkboxes or type an octal value."}
    >
      <div className="max-w-2xl space-y-6">
        {/* Paste ls -l output, an rwx string or a symbolic expression */}
        <div>
          <label htmlFor="chmod-paste" className="text-xs text-[#888888] font-medium block mb-1">
            Paste <code className="font-mono">ls -l</code> output, a permission string (rwxr-xr-x) or a change like u+x or go-w
          </label>
          <textarea
            id="chmod-paste"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={pasted.includes("\n") ? 4 : 1}
            spellCheck={false}
            placeholder="-rwxr-xr-x 1 deploy www-data 4096 Nov 14 09:12 deploy.sh"
            className="w-full px-3 py-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] resize-y"
          />
          {pasteResult?.kind === "error" && <p className="text-xs text-[#ef4444] mt-1">Couldn&apos;t read that. Use a line from ls -l, a string like drwxr-xr-x, or an expression like u+x,go-w.</p>}
          {pasteResult?.kind === "symbolic" && (
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="text-[#888888]">
                {pasteResult.from} with <code className="font-mono text-[#f5f5f5]">{pasted.trim()}</code> becomes <code className="font-mono text-[#a855f7]">{shortOctal(pasteResult.mode)}</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  setFromMode(pasteResult.mode);
                  setPasted("");
                }}
                className="px-2 py-1 rounded border border-[#2a2a2a] text-[#d4d4d4] hover:border-[#a855f7]"
              >
                Apply
              </button>
            </div>
          )}
          {pasteResult?.kind === "ls" && (
            <ul className="mt-2 space-y-1">
              {pasteResult.entries.map((e, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <code className="font-mono text-[#a855f7] w-10">{e.short}</code>
                  <span className="text-[#888888]">{e.typeLabel}</span>
                  {e.name && <span className="font-mono text-[#d4d4d4] break-all">{e.name}</span>}
                  {e.owner && (
                    <span className="text-[#666666]">
                      {e.owner}:{e.group}
                    </span>
                  )}
                  <button type="button" onClick={() => setFromMode(parseInt(e.octal, 8))} className="text-[#a855f7] hover:underline">
                    Load
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Octal display + input row */}
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-2">Octal Code</label>
            <div className="flex items-center gap-3">
              <span className="text-5xl font-mono font-bold text-[#a855f7] leading-none">{octal}</span>
              <input
                type="text"
                value={octalInput}
                onChange={(e) => handleOctalInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
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

        {/* Special permission bits */}
        <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[#f5f5f5]">Special bits</span>
            {specialD > 0 && (
              <span className="text-lg font-mono font-bold text-[#a855f7]">{specialD}</span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={special.setuid}
                onChange={() => toggleSpecial("setuid")}
                className="accent-[#a855f7] w-4 h-4 mt-0.5"
              />
              <span>
                <span className="block text-sm text-[#888888] group-hover:text-[#f5f5f5] transition-colors">setuid (4)</span>
                <span className="block text-[10px] text-[#555555]">Runs as the file&apos;s owner, not the invoking user</span>
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={special.setgid}
                onChange={() => toggleSpecial("setgid")}
                className="accent-[#a855f7] w-4 h-4 mt-0.5"
              />
              <span>
                <span className="block text-sm text-[#888888] group-hover:text-[#f5f5f5] transition-colors">setgid (2)</span>
                <span className="block text-[10px] text-[#555555]">On a directory: new files inherit its group</span>
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={special.sticky}
                onChange={() => toggleSpecial("sticky")}
                className="accent-[#a855f7] w-4 h-4 mt-0.5"
              />
              <span>
                <span className="block text-sm text-[#888888] group-hover:text-[#f5f5f5] transition-colors">sticky (1)</span>
                <span className="block text-[10px] text-[#555555]">In a shared dir: only the owner can delete their own files</span>
              </span>
            </label>
          </div>
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

        {/* Recursive / directory command builder */}
        <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium flex items-center gap-1.5">
              <Terminal size={12} />
              Apply recursively to a directory
            </label>
            <label className="flex items-center gap-2 text-xs text-[#888888] cursor-pointer">
              <input
                type="checkbox"
                checked={splitFileDir}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSplitFileDir(checked);
                  if (checked) setFileOctal(stripExecute(octal));
                }}
                className="accent-[#a855f7] w-3.5 h-3.5"
              />
              Different permissions for files vs. directories
            </label>
          </div>

          <input
            type="text"
            value={recursivePath}
            onChange={(e) => setRecursivePath(e.target.value || "/path/to/dir")}
            placeholder="/path/to/dir"
            className="w-full px-3 py-1.5 text-sm font-mono bg-[#0a0a0a] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />

          {!splitFileDir ? (
            <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#222222] rounded-[8px]">
              <code className="flex-1 text-sm font-mono text-[#f5f5f5]">
                chmod -R {octal} {recursivePath}
              </code>
              <CopyButton text={`chmod -R ${octal} ${recursivePath}`} size="sm" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#555555] w-20 shrink-0">Directories</span>
                <code className="text-xs font-mono text-[#a855f7]">{octal}</code>
                <span className="text-xs text-[#555555]">(from the calculator above)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#555555] w-20 shrink-0">Files</span>
                <input
                  type="text"
                  value={fileOctal}
                  onChange={(e) => setFileOctal(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  maxLength={3}
                  className="w-16 px-2 py-1 text-xs font-mono bg-[#0a0a0a] border border-[#222222] rounded-[4px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                />
                <span className="text-xs text-[#555555]">(execute stripped by default — directories need it to be traversed, files usually don&apos;t)</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#222222] rounded-[8px]">
                <code className="flex-1 text-xs font-mono text-[#f5f5f5] whitespace-pre-wrap break-all">
                  {`find ${recursivePath} -type d -exec chmod ${octal} {} \\;\nfind ${recursivePath} -type f -exec chmod ${/^[0-7]{3}$/.test(fileOctal) ? fileOctal : "644"} {} \\;`}
                </code>
                <CopyButton
                  text={`find ${recursivePath} -type d -exec chmod ${octal} {} \\;\nfind ${recursivePath} -type f -exec chmod ${/^[0-7]{3}$/.test(fileOctal) ? fileOctal : "644"} {} \\;`}
                  size="sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* umask */}
        <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="umask" className="text-xs text-[#888888] font-medium flex items-center gap-1.5">
              <Terminal size={12} /> umask calculator
            </label>
            <input
              id="umask"
              value={umask}
              onChange={(e) => setUmask(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              className="w-20 px-2 py-1 text-sm font-mono bg-[#0a0a0a] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
            {["022", "002", "027", "077"].map((u) => (
              <button key={u} type="button" onClick={() => setUmask(u)} className={`px-2 py-0.5 text-xs font-mono rounded border ${umask === u ? "border-[#a855f7] text-[#f5f5f5]" : "border-[#2a2a2a] text-[#888888]"}`}>
                {u}
              </button>
            ))}
          </div>
          {um ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-[#555555]">New files</p>
                <p className="font-mono text-lg text-[#f5f5f5]">{um.files}</p>
              </div>
              <div>
                <p className="text-[#555555]">New directories</p>
                <p className="font-mono text-lg text-[#f5f5f5]">{um.dirs}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[#555555]">umask -S</p>
                <p className="font-mono text-[#bbbbbb] break-all">{um.symbolic}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#ef4444]">A umask is 3 or 4 octal digits, like 022.</p>
          )}
          <p className="text-xs text-[#555555]">
            New files start from 666 and directories from 777; the umask removes bits from both. For new directories to get {baseOctal}, set <code className="font-mono text-[#888888]">umask {umaskFor(baseOctal)}</code>.
          </p>
        </div>

        {/* chown */}
        <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] space-y-3">
          <p className="text-xs text-[#888888] font-medium flex items-center gap-1.5">
            <Terminal size={12} /> Owner and group (chown)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_2fr] gap-2">
            <input aria-label="Owner" value={chownUser} onChange={(e) => setChownUser(e.target.value.replace(/[^\w.$-]/g, ""))} placeholder="user" className="min-w-0 px-2 py-1.5 text-sm font-mono bg-[#0a0a0a] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]" />
            <input aria-label="Group" value={chownGroup} onChange={(e) => setChownGroup(e.target.value.replace(/[^\w.$-]/g, ""))} placeholder="group" className="min-w-0 px-2 py-1.5 text-sm font-mono bg-[#0a0a0a] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]" />
            <input aria-label="Path" value={chownPath} onChange={(e) => setChownPath(e.target.value)} placeholder="/path" className="col-span-2 sm:col-span-1 min-w-0 px-2 py-1.5 text-sm font-mono bg-[#0a0a0a] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]" />
          </div>
          <label className="flex items-center gap-2 text-xs text-[#888888] cursor-pointer">
            <input type="checkbox" checked={chownRecursive} onChange={(e) => setChownRecursive(e.target.checked)} className="accent-[#a855f7] w-3.5 h-3.5" />
            Recursive (-R)
          </label>
          <div className="flex items-start gap-3 p-3 bg-[#0a0a0a] border border-[#222222] rounded-[8px]">
            <code className="flex-1 text-xs font-mono text-[#f5f5f5] whitespace-pre-wrap break-all">{chownCmds}</code>
            <CopyButton text={chownCmds} size="sm" />
          </div>
          <p className="text-xs text-[#555555]">
            Check what a file has now with <code className="font-mono text-[#888888]">stat -c &apos;%a %U:%G %n&apos; {chownPath || "/path"}</code> (on macOS, <code className="font-mono text-[#888888]">stat -f &apos;%Lp %Su:%Sg %N&apos;</code>). Changing the owner needs root; a user can only change a file&apos;s group to one they belong to.
          </p>
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
