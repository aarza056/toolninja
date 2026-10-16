"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Download, FileCheck2 } from "lucide-react";
import { LICENSES, fillLicense } from "@/lib/licenses";

const STORAGE_KEY = "toolninja:license-generator";

const BLURBS: Record<string, string> = {
  mit: "Short and permissive. Anyone can do almost anything with the code, as long as your copyright notice stays attached.",
  "apache-2.0": "Permissive like MIT, plus an explicit patent grant from contributors — common for larger projects worried about patent claims.",
  "bsd-3-clause": "Permissive, similar to MIT, with an added clause barring use of the project's name to promote derived products without permission.",
  isc: "Functionally equivalent to MIT, with simpler wording — the default for many npm packages.",
  "mpl-2.0": "File-level copyleft: modified files must stay open source, but you can combine the code with proprietary code in a larger project.",
  "gpl-3.0": "Strong copyleft. Anything that distributes or links your code must also be released under the GPL, source included.",
  unlicense: "A public domain dedication — no copyright asserted at all, no conditions, no attribution required.",
};

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function LicenseGeneratorClient() {
  const [selectedKey, setSelectedKey] = useState("mit");
  const [fullname, setFullname] = useState("");
  const [year, setYear] = useState(() => String(new Date().getFullYear()));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedKey) setSelectedKey(parsed.selectedKey);
        if (parsed.fullname) setFullname(parsed.fullname);
        if (parsed.year) setYear(parsed.year);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedKey, fullname, year }));
    } catch {}
  }, [selectedKey, fullname, year]);

  const license = LICENSES.find((l) => l.key === selectedKey) ?? LICENSES[0];

  const output = useMemo(() => {
    if (!license.needsFields) return license.body;
    return fillLicense(license.body, fullname.trim() || "[fullname]", year.trim() || "[year]");
  }, [license, fullname, year]);

  return (
    <ToolLayout
      title="Open Source License Generator"
      description="Pick a license, fill in your name, get a ready-to-commit LICENSE file — canonical text from GitHub's Licenses API"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left: picker */}
        <div className="space-y-3">
          {LICENSES.map((l) => (
            <button
              key={l.key}
              onClick={() => setSelectedKey(l.key)}
              className={`w-full text-left p-3 rounded-[8px] border transition-colors ${
                selectedKey === l.key
                  ? "bg-[#a855f7]/10 border-[#a855f7]/40"
                  : "bg-[#111111] border-[#222222] hover:border-[#333333]"
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${selectedKey === l.key ? "text-[#a855f7]" : "text-[#f5f5f5]"}`}>
                {l.name}
              </div>
              <p className="text-xs text-[#666666] leading-relaxed">{BLURBS[l.key]}</p>
            </button>
          ))}
        </div>

        {/* Right: output */}
        <div className="flex flex-col gap-4">
          {license.needsFields && (
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Copyright holder</label>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Jane Doe"
                  className="px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] min-w-[220px]"
                />
              </div>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Year</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2026"
                  className="px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] w-28"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[#555555]">
              <FileCheck2 size={13} /> {license.name}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => download("LICENSE", output)}
                className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
              >
                <Download size={13} /> Download LICENSE
              </button>
              <CopyButton text={output} size="sm" />
            </div>
          </div>

          <pre className="flex-1 p-4 font-mono text-xs leading-relaxed bg-[#111111] border border-[#222222] rounded-[8px] text-[#aaaaaa] overflow-auto whitespace-pre-wrap max-h-[calc(100vh-380px)] min-h-[400px]">
            {output}
          </pre>
        </div>
      </div>

      <p className="mt-6 text-xs text-[#555555] leading-relaxed">
        This isn&apos;t legal advice — if a license choice materially affects your business, talk to a lawyer. The text above is
        the unmodified, canonical license body sourced from GitHub&apos;s public Licenses API.
      </p>
    </ToolLayout>
  );
}
