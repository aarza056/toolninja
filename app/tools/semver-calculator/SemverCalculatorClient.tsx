"use client";

import { useState, useMemo } from "react";
import semver from "semver";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type Tab = "range" | "compare" | "bump";

const BUMPS: semver.ReleaseType[] = ["major", "minor", "patch", "premajor", "preminor", "prepatch", "prerelease"];

const inputClass =
  "w-full px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

function RangeTab() {
  const [range, setRange] = useState("^1.2.3");
  const [versions, setVersions] = useState("1.2.2\n1.2.3\n1.9.0\n2.0.0\n2.0.0-beta.1\n1.10.0-rc.1");
  const [includePre, setIncludePre] = useState(false);

  const result = useMemo(() => {
    const valid = semver.validRange(range);
    if (!valid) return { error: `"${range}" isn't a valid npm range`, rows: [], normalized: "", max: null, min: null };
    const list = versions.split("\n").map((v) => v.trim()).filter(Boolean);
    const opts = { includePrerelease: includePre };
    const rows = list.map((v) => {
      const clean = semver.valid(v);
      if (!clean) return { version: v, valid: false, satisfies: false };
      return { version: v, valid: true, satisfies: semver.satisfies(clean, range, opts) };
    });
    const validList = rows.filter((r) => r.valid).map((r) => r.version);
    return {
      error: "",
      rows,
      normalized: valid,
      max: semver.maxSatisfying(validList, range, opts),
      min: semver.minSatisfying(validList, range, opts),
    };
  }, [range, versions, includePre]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Range</label>
          <input type="text" value={range} onChange={(e) => setRange(e.target.value)} spellCheck={false} className={inputClass} />
          {result.normalized && (
            <p className="text-xs text-[#555555] mt-1.5">
              Means: <code className="text-[#a855f7]">{result.normalized}</code>
            </p>
          )}
          {result.error && (
            <p className="flex items-center gap-1 text-xs text-[#ef4444] mt-1.5">
              <AlertCircle size={11} /> {result.error}
            </p>
          )}
        </div>
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Versions to test (one per line)</label>
          <textarea value={versions} onChange={(e) => setVersions(e.target.value)} rows={8} spellCheck={false} className={`${inputClass} resize-none`} />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-[#888888] cursor-pointer">
          <input type="checkbox" checked={includePre} onChange={(e) => setIncludePre(e.target.checked)} className="accent-[#a855f7]" />
          Include prereleases (npm&apos;s <code>--include-prerelease</code>)
        </label>
      </div>

      <div>
        <label className="text-xs text-[#888888] font-medium block mb-2">Results</label>
        <div className="space-y-1.5">
          {result.rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#111111] border border-[#1a1a1a] rounded-[6px] text-sm">
              <code className="font-mono text-[#f5f5f5]">{r.version}</code>
              {!r.valid ? (
                <span className="text-xs text-[#f97316]">not a valid version</span>
              ) : r.satisfies ? (
                <span className="flex items-center gap-1 text-xs text-[#22c55e]"><CheckCircle2 size={13} /> satisfies</span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-[#ef4444]"><XCircle size={13} /> outside range</span>
              )}
            </div>
          ))}
        </div>
        {!result.error && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#888888]">
            <span>Highest match: <code className="text-[#f5f5f5]">{result.max ?? "none"}</code></span>
            <span>Lowest match: <code className="text-[#f5f5f5]">{result.min ?? "none"}</code></span>
          </div>
        )}
      </div>
    </div>
  );
}

function CompareTab() {
  const [a, setA] = useState("1.4.2");
  const [b, setB] = useState("1.10.0");

  const va = semver.valid(a.trim());
  const vb = semver.valid(b.trim());
  const cmp = va && vb ? semver.compare(va, vb) : null;
  const diff = va && vb ? semver.diff(va, vb) : null;

  return (
    <div className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Version A</label>
          <input type="text" value={a} onChange={(e) => setA(e.target.value)} spellCheck={false} className={inputClass} />
          {a.trim() && !va && <p className="text-xs text-[#ef4444] mt-1">Not a valid semver version</p>}
        </div>
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Version B</label>
          <input type="text" value={b} onChange={(e) => setB(e.target.value)} spellCheck={false} className={inputClass} />
          {b.trim() && !vb && <p className="text-xs text-[#ef4444] mt-1">Not a valid semver version</p>}
        </div>
      </div>
      {cmp !== null && (
        <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] space-y-2">
          <p className="text-lg font-mono text-[#f5f5f5]">
            {va} <span className="text-[#a855f7]">{cmp === 0 ? "=" : cmp > 0 ? ">" : "<"}</span> {vb}
          </p>
          <p className="text-xs text-[#888888]">
            {diff ? (
              <>Difference: <code className="text-[#f5f5f5]">{diff}</code> change</>
            ) : (
              "Identical versions"
            )}
          </p>
          <p className="text-xs text-[#555555]">
            Semver compares numerically per segment — that&apos;s why 1.10.0 is newer than 1.4.2, even though &quot;1.10&quot; sorts before
            &quot;1.4&quot; as plain text.
          </p>
        </div>
      )}
    </div>
  );
}

function BumpTab() {
  const [version, setVersion] = useState("1.4.2");
  const [preid, setPreid] = useState("beta");
  const valid = semver.valid(version.trim());

  return (
    <div className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Current version</label>
          <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} spellCheck={false} className={inputClass} />
          {version.trim() && !valid && <p className="text-xs text-[#ef4444] mt-1">Not a valid semver version</p>}
        </div>
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Prerelease id</label>
          <input type="text" value={preid} onChange={(e) => setPreid(e.target.value)} spellCheck={false} className={inputClass} />
        </div>
      </div>
      {valid && (
        <div className="space-y-1.5">
          {BUMPS.map((type) => {
            const next = semver.inc(valid, type, {}, preid.trim() || undefined);
            return (
              <div key={type} className="flex items-center justify-between px-3 py-2 bg-[#111111] border border-[#1a1a1a] rounded-[6px]">
                <span className="text-xs text-[#888888] w-24">{type}</span>
                <code className="flex-1 font-mono text-sm text-[#f5f5f5]">{next ?? "—"}</code>
                {next && <CopyButton text={next} size="sm" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SemverCalculatorClient() {
  const [tab, setTab] = useState<Tab>("range");
  const tabs: { id: Tab; label: string }[] = [
    { id: "range", label: "Range checker" },
    { id: "compare", label: "Compare" },
    { id: "bump", label: "Bump" },
  ];

  return (
    <ToolLayout
      title="SemVer Calculator & Range Checker"
      description="Test versions against npm ranges like ^1.2.3 or ~2.0, compare versions, and preview version bumps"
    >
      <div className="flex rounded-[6px] border border-[#222222] overflow-hidden mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 text-sm border-r last:border-0 border-[#222222] transition-colors ${tab === t.id ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "range" && <RangeTab />}
      {tab === "compare" && <CompareTab />}
      {tab === "bump" && <BumpTab />}
    </ToolLayout>
  );
}
