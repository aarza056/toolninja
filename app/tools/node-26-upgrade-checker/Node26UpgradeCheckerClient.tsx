"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import FindingList from "@/components/FindingList";
import { checkCode, checkPackageJson, sortFindings, type Node26Finding } from "@/lib/node26-checker";

const STORAGE_KEY = "toolninja:node-26-upgrade-checker";

const EXAMPLE_PKG = `{
  "name": "my-api",
  "engines": { "node": "^20 || ^22" },
  "scripts": {
    "dev": "node --experimental-transform-types src/server.ts",
    "build": "tsc"
  },
  "dependencies": {
    "better-sqlite3": "^11.5.0",
    "express": "^5.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "node-sass": "^9.0.0"
  }
}`;

const EXAMPLE_CODE = `const { Transform } = require("_stream_transform");
const util = require("node:util");
const fs = require("node:fs");

http.createServer((req, res) => {
  res.writeHeader(200, { "Content-Type": "text/plain" });
  if (util.isString(req.url)) res.end(req.url);
});

fs.access(file, fs.F_OK, (err) => {});
fs.rmdirSync("dist", { recursive: true });
`;

const LEVEL = { error: "error", warning: "warning", info: "info" } as const;

function toItem(f: Node26Finding) {
  return {
    level: LEVEL[f.severity],
    meta: [f.line ? `line ${f.line}` : null, f.code, f.since ? `Node ${f.since}` : null].filter(Boolean).join(" · "),
    title: f.title,
    detail: f.fix,
  };
}

export default function Node26UpgradeCheckerClient() {
  const [pkg, setPkg] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      // Empty saved values count as nothing saved, so the examples come back
      setPkg(saved?.pkg || EXAMPLE_PKG);
      setCode(saved?.code || EXAMPLE_CODE);
    } catch {
      setPkg(EXAMPLE_PKG);
      setCode(EXAMPLE_CODE);
    }
  }, []);
  useEffect(() => {
    // Never save the empty initial state (React runs effects twice in development)
    if (!pkg && !code) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pkg, code }));
    } catch {}
  }, [pkg, code]);

  const pkgFindings = useMemo(() => (pkg.trim() ? sortFindings(checkPackageJson(pkg)) : []), [pkg]);
  const codeFindings = useMemo(() => (code.trim() ? sortFindings(checkCode(code)) : []), [code]);
  const all = [...pkgFindings, ...codeFindings];
  const count = (s: Node26Finding["severity"]) => all.filter((f) => f.severity === s).length;

  const area = "w-full p-3 font-mono text-xs resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout title="Node.js 26 Upgrade Checker" description="Paste your package.json and code to see what breaks on Node 26 LTS — removed APIs, deprecations, engines and native addons">
      <div className="max-w-5xl space-y-5">
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">package.json</label>
            <textarea value={pkg} onChange={(e) => setPkg(e.target.value)} rows={14} spellCheck={false} className={area} />
          </div>
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">JavaScript / TypeScript (any files — paste several at once)</label>
            <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={14} spellCheck={false} className={area} />
          </div>
        </div>

        {(pkg.trim() || code.trim()) && (
          <p className="text-sm text-[#f5f5f5]">
            <span className="text-[#f87171]">{count("error")} will break</span> · <span className="text-[#fbbf24]">{count("warning")} to check</span> ·{" "}
            <span className="text-[#a3a3a3]">{count("info")} notes</span>
          </p>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            {pkg.trim() && <h2 className="text-xs font-semibold text-[#888888] uppercase tracking-wide">package.json</h2>}
            <FindingList items={pkgFindings.map(toItem)} />
          </div>
          <div className="space-y-2">
            {code.trim() && <h2 className="text-xs font-semibold text-[#888888] uppercase tracking-wide">Code</h2>}
            <FindingList items={codeFindings.map(toItem)} empty={code.trim() ? "No removed or deprecated Node APIs found in this code." : undefined} />
          </div>
        </div>

        <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#777777] leading-relaxed">
          Node 26 becomes the Active LTS on 28 October 2026. This checker covers everything removed between Node 22 and 26 (so a jump from 20 or 22 is covered too),
          based on the official release notes and deprecation list. It matches patterns rather than parsing code, so treat findings as places to look. Also run your
          tests on Node 26, and see the <Link href="/blog/nodejs-26-lts-upgrade-breaking-changes" className="text-[#a855f7] hover:underline">Node 26 upgrade guide</Link> for the error messages each change produces.
          Using TypeScript directly? Check it with the <Link href="/tools/node-type-stripping-checker" className="text-[#a855f7] hover:underline">Type-Stripping Checker</Link>.
        </div>
      </div>
    </ToolLayout>
  );
}
