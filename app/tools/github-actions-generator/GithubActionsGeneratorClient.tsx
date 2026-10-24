"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Download, ShieldCheck } from "lucide-react";
import {
  generateWorkflow,
  workflowFilename,
  dependabotConfig,
  DEFAULT_GHA_OPTIONS,
  type GhaOptions,
  type GhaStack,
  type GhaNodePm,
} from "@/lib/gha-gen";
import WorkflowAudit from "./WorkflowAudit";

const STORAGE_KEY = "toolninja:github-actions-generator";

const STACKS: { value: GhaStack; label: string }[] = [
  { value: "node", label: "Node.js" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "docker", label: "Docker → GHCR" },
];

const inputClass =
  "w-full px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-[#888888] cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-[#a855f7]" />
      {label}
    </label>
  );
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/yaml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function GithubActionsGeneratorClient() {
  const [opts, setOpts] = useState<GhaOptions>(DEFAULT_GHA_OPTIONS);
  const [tab, setTab] = useState<"generate" | "audit">("generate");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setOpts({ ...DEFAULT_GHA_OPTIONS, ...JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
    } catch {}
  }, [opts]);

  const update = (patch: Partial<GhaOptions>) => setOpts((prev) => ({ ...prev, ...patch }));
  const output = useMemo(() => generateWorkflow(opts), [opts]);
  const filename = workflowFilename(opts);

  return (
    <ToolLayout
      title="GitHub Actions Workflow Generator"
      description="Generate a hardened .github/workflows file — or audit an existing one for unpinned actions, risky triggers and script injection"
    >
      <div className="flex gap-1 mb-5">
        {(
          [
            ["generate", "Generate"],
            ["audit", "Audit a workflow"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${tab === id ? "bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/30" : "text-[#888888] hover:text-[#f5f5f5] border-transparent"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "audit" ? (
        <WorkflowAudit />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1.5">Stack</label>
            <div className="grid grid-cols-2 gap-1.5">
              {STACKS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => update({ stack: s.value })}
                  className={`px-2.5 py-1.5 text-xs rounded-[6px] border transition-colors ${
                    opts.stack === s.value ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Workflow name</label>
            <input type="text" value={opts.name} onChange={(e) => update({ name: e.target.value })} className={inputClass} />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#888888] font-medium block">Triggers</label>
            <Check label="Push" checked={opts.onPush} onChange={(v) => update({ onPush: v })} />
            <Check label="Pull request" checked={opts.onPullRequest} onChange={(v) => update({ onPullRequest: v })} />
            <Check label="Manual (workflow_dispatch)" checked={opts.onDispatch} onChange={(v) => update({ onDispatch: v })} />
            <input
              type="text"
              value={opts.branches}
              onChange={(e) => update({ branches: e.target.value })}
              placeholder="main, develop"
              className={`${inputClass} font-mono`}
              spellCheck={false}
            />
            <p className="text-[10px] text-[#555555]">Branches for push / pull request, comma-separated</p>
            <input
              type="text"
              value={opts.schedule}
              onChange={(e) => update({ schedule: e.target.value })}
              placeholder="Cron schedule, e.g. 0 3 * * 1 (optional)"
              className={`${inputClass} font-mono`}
              spellCheck={false}
            />
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Runner</label>
            <select value={opts.os} onChange={(e) => update({ os: e.target.value })} className={inputClass}>
              <option value="ubuntu-latest">ubuntu-latest</option>
              <option value="windows-latest">windows-latest</option>
              <option value="macos-latest">macos-latest</option>
            </select>
          </div>

          {opts.stack === "node" && (
            <>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Node versions (matrix)</label>
                <input type="text" value={opts.nodeVersions} onChange={(e) => update({ nodeVersions: e.target.value })} className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Package manager</label>
                <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
                  {(["npm", "yarn", "pnpm"] as GhaNodePm[]).map((pm) => (
                    <button
                      key={pm}
                      onClick={() => update({ nodePm: pm })}
                      className={`flex-1 px-2 py-1.5 text-xs transition-colors ${opts.nodePm === pm ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {opts.stack === "python" && (
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Python versions (matrix)</label>
              <input type="text" value={opts.pythonVersions} onChange={(e) => update({ pythonVersions: e.target.value })} className={`${inputClass} font-mono`} />
            </div>
          )}

          {opts.stack === "go" && (
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Go version</label>
              <input type="text" value={opts.goVersion} onChange={(e) => update({ goVersion: e.target.value })} className={`${inputClass} font-mono`} />
            </div>
          )}

          {opts.stack === "docker" ? (
            <div className="space-y-2">
              <label className="text-xs text-[#888888] font-medium block">Image</label>
              <input
                type="text"
                value={opts.imageName}
                onChange={(e) => update({ imageName: e.target.value })}
                placeholder="ghcr.io/${{ github.repository }}"
                className={`${inputClass} font-mono`}
                spellCheck={false}
              />
              <Check label="Push to registry (skipped on pull requests)" checked={opts.pushImage} onChange={(v) => update({ pushImage: v })} />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs text-[#888888] font-medium block">Steps</label>
              <Check label={opts.stack === "go" ? "go vet" : opts.stack === "python" ? "Lint (ruff)" : "Lint"} checked={opts.runLint} onChange={(v) => update({ runLint: v })} />
              <Check label={opts.stack === "python" ? "Test (pytest)" : "Test"} checked={opts.runTest} onChange={(v) => update({ runTest: v })} />
              {opts.stack !== "python" && <Check label="Build" checked={opts.runBuild} onChange={(v) => update({ runBuild: v })} />}
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs text-[#888888] font-medium">
              <ShieldCheck size={13} className="text-[#a855f7]" /> Security
            </label>
            <Check label="Pin actions to commit SHAs (recommended)" checked={opts.pinShas} onChange={(v) => update({ pinShas: v })} />
            <p className="text-[10px] text-[#555555] leading-relaxed">
              Always added: a read-only token by default and checkout without saving credentials.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center justify-between">
            <code className="text-xs text-[#888888]">.github/workflows/{filename}</code>
            <div className="flex items-center gap-2">
              <button onClick={() => download(filename, output)} className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors">
                <Download size={13} /> Download
              </button>
              <CopyButton text={output} size="sm" />
            </div>
          </div>
          <pre className="flex-1 p-4 font-mono text-xs leading-relaxed bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto whitespace-pre max-h-[calc(100vh-300px)] min-h-[450px]">
            {output}
          </pre>
          <p className="text-[11px] text-[#555555]">
            {opts.pinShas
              ? "Each action is pinned to the exact commit of its latest release (checked October 2026), with the version as a comment. A tag can be moved to different code — a commit can't."
              : "Action versions follow their current major release tag, which the action's owner can move."}{" "}
            Version numbers in matrices are quoted on purpose — unquoted, YAML reads <code className="text-[#888888]">3.10</code> as the number 3.1.
          </p>
          {opts.pinShas && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <code className="text-xs text-[#888888]">.github/dependabot.yml — keeps the pins up to date</code>
                <CopyButton text={dependabotConfig()} size="sm" />
              </div>
              <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto">{dependabotConfig()}</pre>
            </div>
          )}
        </div>
      </div>
      )}
    </ToolLayout>
  );
}
