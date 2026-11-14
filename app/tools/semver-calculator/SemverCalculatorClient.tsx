"use client";

import { useState, useMemo, useEffect } from "react";
import semver from "semver";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { CheckCircle2, XCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { checkVersion, sortVersions, splitVersions } from "@/lib/semver-validate";

type Tab = "range" | "validate" | "compare" | "bump";

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

const VALIDATE_EXAMPLE = "1.10.0\n1.2.3\nv2.0.0\n2.0.0-rc.1\n2.0.0-beta.2\n1.2\n1.2.3.4\n01.4.0\n1.0.0+build.5\n2.0.0-rc.01\n1.2.3";

function ValidateTab() {
  const [text, setText] = useState(VALIDATE_EXAMPLE);
  const [desc, setDesc] = useState(false);
  const [dedupe, setDedupe] = useState(true);
  const list = useMemo(() => splitVersions(text).slice(0, 1000), [text]);
  const checks = useMemo(() => list.map(checkVersion), [list]);
  const sorted = useMemo(() => sortVersions(list, desc, dedupe), [list, desc, dedupe]);
  const strictCount = checks.filter((c) => c.strict).length;
  const npmOnly = checks.filter((c) => !c.strict && c.npm).length;
  const invalid = checks.filter((c) => !c.npm).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3 min-w-0">
        <div>
          <label htmlFor="semver-validate" className="text-xs text-[#888888] font-medium block mb-1">Versions (one per line, or separated by commas or spaces)</label>
          <textarea id="semver-validate" value={text} onChange={(e) => setText(e.target.value)} rows={12} spellCheck={false} className={`${inputClass} resize-y`} />
        </div>
        <p className="text-xs text-[#888888]">
          <span className="text-[#22c55e]">{strictCount} valid</span>
          {npmOnly > 0 && <span className="text-[#f59e0b]"> · {npmOnly} npm-only</span>}
          {invalid > 0 && <span className="text-[#ef4444]"> · {invalid} invalid</span>}
        </p>
        <div className="space-y-1.5">
          {checks.map((c, i) => (
            <div key={i} className="px-3 py-2 bg-[#111111] border border-[#1a1a1a] rounded-[6px] text-sm">
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-[#f5f5f5] break-all">{c.input}</code>
                {c.strict ? (
                  <span className="flex items-center gap-1 text-xs text-[#22c55e] shrink-0"><CheckCircle2 size={13} /> valid SemVer</span>
                ) : c.npm ? (
                  <span className="flex items-center gap-1 text-xs text-[#f59e0b] shrink-0"><AlertTriangle size={13} /> npm accepts it</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-[#ef4444] shrink-0"><XCircle size={13} /> invalid</span>
                )}
              </div>
              {c.parts && c.strict && (c.parts.prerelease || c.parts.build) && (
                <p className="text-[11px] text-[#666666] mt-1 font-mono">
                  {c.parts.major}.{c.parts.minor}.{c.parts.patch}
                  {c.parts.prerelease && <> · prerelease {c.parts.prerelease}</>}
                  {c.parts.build && <> · build {c.parts.build} (ignored when comparing)</>}
                </p>
              )}
              {c.problem && (
                <p className="text-xs text-[#999999] mt-1">
                  {c.problem}
                  {c.suggestion && (
                    <>
                      {" "}Use <code className="text-[#a855f7]">{c.suggestion}</code>.
                    </>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <label className="text-xs text-[#888888] font-medium">Sorted by SemVer precedence</label>
          <div className="flex items-center gap-3 text-xs text-[#888888]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={desc} onChange={(e) => setDesc(e.target.checked)} className="accent-[#a855f7]" /> Newest first
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} className="accent-[#a855f7]" /> Remove duplicates
            </label>
            <CopyButton text={sorted.sorted.join("\n")} size="sm" />
          </div>
        </div>
        <pre className="p-3 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] whitespace-pre-wrap break-all">{sorted.sorted.join("\n") || " "}</pre>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#888888]">
          <span>Latest: <code className="text-[#f5f5f5]">{sorted.latest ?? "none"}</code></span>
          <span>Latest stable: <code className="text-[#f5f5f5]">{sorted.latestStable ?? "none"}</code></span>
          {sorted.duplicates > 0 && <span>{sorted.duplicates} duplicate{sorted.duplicates === 1 ? "" : "s"} removed</span>}
          {sorted.invalid.length > 0 && <span>{sorted.invalid.length} invalid left out</span>}
        </div>
        <p className="text-xs text-[#555555] mt-3">
          Numbers compare as numbers (1.10.0 is newer than 1.9.0), a prerelease comes before its release (2.0.0-rc.1 &lt; 2.0.0), prerelease parts compare one at a time (beta.2 &lt; beta.11 &lt; rc.1), and build metadata after + is ignored. Versions with a leading v are normalized, as npm does.
        </p>
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
    { id: "validate", label: "Validate & sort" },
    { id: "compare", label: "Compare" },
    { id: "bump", label: "Bump" },
  ];
  // /tools/semver-calculator#validate opens a tab directly
  useEffect(() => {
    const h = window.location.hash.slice(1) as Tab;
    if (["range", "validate", "compare", "bump"].includes(h)) setTab(h);
  }, []);

  return (
    <ToolLayout
      title="SemVer Calculator, Validator & Range Checker"
      description="Test versions against npm ranges like ^1.2.3 or ~2.0, validate and sort version lists, compare versions, and preview version bumps"
    >
      <div className="flex flex-wrap rounded-[6px] border border-[#222222] overflow-hidden mb-6 w-fit max-w-full">
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
      {tab === "validate" && <ValidateTab />}
      {tab === "compare" && <CompareTab />}
      {tab === "bump" && <BumpTab />}
    </ToolLayout>
  );
}
