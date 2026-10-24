"use client";

import { useMemo, useState } from "react";
import CopyButton from "@/components/CopyButton";
import FindingList from "@/components/FindingList";
import { auditWorkflow, pinWorkflow } from "@/lib/gha-audit";
import { Loader2, Pin } from "lucide-react";

const EXAMPLE = `name: PR checks
on:
  pull_request_target:
    types: [opened, synchronize]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.event.pull_request.head.sha }}
      - uses: actions/setup-node@v4
      - run: npm ci && npm test
      - name: Comment
        run: echo "Testing \${{ github.event.pull_request.title }}"
      - uses: tj-actions/changed-files@v45
`;

const LEVEL = { high: "error", medium: "warning", low: "info" } as const;

export default function WorkflowAudit() {
  const [text, setText] = useState(EXAMPLE);
  const [pinned, setPinned] = useState("");
  const [pinning, setPinning] = useState(false);
  const [pinError, setPinError] = useState("");
  const result = useMemo(() => auditWorkflow(text), [text]);
  const unpinned = result.uses.filter((u) => !u.pinned);

  const pinAll = async () => {
    setPinning(true);
    setPinError("");
    const resolved = new Map<string, string>();
    const failed: string[] = [];
    // One request per action — GitHub allows 60 unauthenticated requests an hour per IP
    for (const u of Array.from(new Map(unpinned.map((x) => [x.value, x])).values())) {
      try {
        const res = await fetch(`https://api.github.com/repos/${u.repo}/commits/${encodeURIComponent(u.ref)}`, { headers: { Accept: "application/vnd.github+json" } });
        if (res.status === 403 || res.status === 429) {
          failed.push(`${u.value} (GitHub rate limit — try again in an hour)`);
          break;
        }
        if (!res.ok) {
          failed.push(`${u.value} (${res.status === 404 || res.status === 422 ? "tag not found" : `HTTP ${res.status}`})`);
          continue;
        }
        const body = (await res.json()) as { sha?: string };
        if (body.sha && /^[0-9a-f]{40}$/.test(body.sha)) resolved.set(u.value, body.sha);
      } catch {
        failed.push(`${u.value} (network error)`);
      }
    }
    setPinned(pinWorkflow(text, resolved));
    if (failed.length) setPinError(`Couldn't resolve: ${failed.join(", ")}`);
    setPinning(false);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-2 min-w-0">
        <label className="text-xs text-[#888888] font-medium block">Paste a workflow (.github/workflows/*.yml)</label>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPinned("");
          }}
          rows={24}
          spellCheck={false}
          className="w-full p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
      </div>
      <div className="space-y-3 min-w-0">
        {result.error ? (
          <FindingList items={[{ level: "error", title: result.error }]} />
        ) : (
          <>
            <p className="text-xs text-[#888888]">
              {result.findings.filter((f) => f.severity === "high").length} high · {result.findings.filter((f) => f.severity === "medium").length} medium ·{" "}
              {result.findings.filter((f) => f.severity === "low").length} low
            </p>
            <FindingList
              items={result.findings.map((f) => ({ level: LEVEL[f.severity], title: f.title, detail: f.detail, meta: f.line ? `line ${f.line}` : undefined }))}
              empty="No problems found — actions are pinned, permissions are set and no untrusted input reaches a script."
            />
            {unpinned.length > 0 && (
              <div className="space-y-2">
                <button onClick={pinAll} disabled={pinning} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-[6px] bg-[#a855f7] hover:bg-[#9333ea] text-white disabled:opacity-60">
                  {pinning ? <Loader2 size={13} className="animate-spin" /> : <Pin size={13} />} Pin {unpinned.length} action{unpinned.length === 1 ? "" : "s"} to commit SHAs
                </button>
                <p className="text-[11px] text-[#666666]">Looks up each tag&apos;s commit with GitHub&apos;s public API (only the action names are sent). Your workflow itself stays in the browser.</p>
              </div>
            )}
            {pinError && <p className="text-xs text-[#fbbf24]">{pinError}</p>}
            {pinned && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#f5f5f5]">Pinned workflow</p>
                  <CopyButton text={pinned} size="sm" />
                </div>
                <pre className="p-3 text-xs font-mono overflow-auto max-h-80 bg-[#0a0a0a] border border-[#222222] rounded-[8px] text-[#f5f5f5]">{pinned}</pre>
                <p className="text-[11px] text-[#666666]">Pins don&apos;t update themselves — add the Dependabot file from the Generate tab so you get a PR when an action releases.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
