"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Download } from "lucide-react";
import {
  generateDockerfile,
  generateDockerignore,
  DEFAULT_DOCKERFILE_OPTIONS,
  type DockerfileOptions,
  type Stack,
  type NodePm,
  type BaseVariant,
} from "@/lib/dockerfile-gen";

const STORAGE_KEY = "toolninja:dockerfile-generator";

const STACKS: { value: Stack; label: string }[] = [
  { value: "node", label: "Node.js" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "static", label: "Static Site (Nginx)" },
];

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const inputClass =
  "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

export default function DockerfileGeneratorClient() {
  const [opts, setOpts] = useState<DockerfileOptions>(DEFAULT_DOCKERFILE_OPTIONS);
  const [tab, setTab] = useState<"dockerfile" | "dockerignore">("dockerfile");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setOpts({ ...DEFAULT_DOCKERFILE_OPTIONS, ...JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
    } catch {}
  }, [opts]);

  const update = (patch: Partial<DockerfileOptions>) => setOpts((prev) => ({ ...prev, ...patch }));

  const dockerfile = useMemo(() => generateDockerfile(opts), [opts]);
  const dockerignore = useMemo(() => generateDockerignore(opts.stack), [opts.stack]);
  const output = tab === "dockerfile" ? dockerfile : dockerignore;

  return (
    <ToolLayout
      title="Dockerfile Generator"
      description="Pick a stack and get a sensible, multi-stage-aware Dockerfile — plus a matching .dockerignore"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Options */}
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

          {opts.stack === "node" && (
            <>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Node version</label>
                <input type="text" value={opts.nodeVersion} onChange={(e) => update({ nodeVersion: e.target.value })} className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Package manager</label>
                <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
                  {(["npm", "yarn", "pnpm"] as NodePm[]).map((pm) => (
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
              <label className="flex items-center gap-1.5 text-xs text-[#888888] cursor-pointer">
                <input type="checkbox" checked={opts.multiStage} onChange={(e) => update({ multiStage: e.target.checked })} className="accent-[#a855f7]" />
                Multi-stage build (smaller production image)
              </label>
              {opts.multiStage && (
                <div>
                  <label className="text-xs text-[#888888] font-medium block mb-1">Build command</label>
                  <input type="text" value={opts.buildCommand} onChange={(e) => update({ buildCommand: e.target.value })} className={`${inputClass} w-full font-mono`} spellCheck={false} />
                </div>
              )}
              {opts.multiStage && (
                <div>
                  <label className="text-xs text-[#888888] font-medium block mb-1">Build output dir</label>
                  <input type="text" value={opts.buildOutputDir} onChange={(e) => update({ buildOutputDir: e.target.value })} className={`${inputClass} w-full font-mono`} spellCheck={false} />
                </div>
              )}
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Start command</label>
                <input type="text" value={opts.startCommand} onChange={(e) => update({ startCommand: e.target.value })} className={`${inputClass} w-full font-mono`} spellCheck={false} />
              </div>
            </>
          )}

          {opts.stack === "python" && (
            <>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Python version</label>
                <input type="text" value={opts.pythonVersion} onChange={(e) => update({ pythonVersion: e.target.value })} className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Start command</label>
                <input type="text" value={opts.pythonStartCommand} onChange={(e) => update({ pythonStartCommand: e.target.value })} className={`${inputClass} w-full font-mono`} spellCheck={false} />
              </div>
            </>
          )}

          {opts.stack === "go" && (
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Go version</label>
              <input type="text" value={opts.goVersion} onChange={(e) => update({ goVersion: e.target.value })} className={`${inputClass} w-full`} />
            </div>
          )}

          {opts.stack === "static" && (
            <>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Build command</label>
                <input type="text" value={opts.buildCommand} onChange={(e) => update({ buildCommand: e.target.value })} className={`${inputClass} w-full font-mono`} spellCheck={false} />
              </div>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Build output dir</label>
                <input type="text" value={opts.buildOutputDir} onChange={(e) => update({ buildOutputDir: e.target.value })} className={`${inputClass} w-full font-mono`} spellCheck={false} />
              </div>
            </>
          )}

          {opts.stack !== "static" && opts.stack !== "go" && (
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Base image variant</label>
              <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
                {(["alpine", "slim", "full"] as BaseVariant[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => update({ baseVariant: v })}
                    className={`flex-1 px-2 py-1.5 text-xs transition-colors ${opts.baseVariant === v ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {opts.stack !== "static" && (
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Exposed port</label>
              <input type="number" value={opts.port} onChange={(e) => update({ port: Number(e.target.value) })} className={`${inputClass} w-full`} />
            </div>
          )}
        </div>

        {/* Output */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
              <button
                onClick={() => setTab("dockerfile")}
                className={`px-3 py-1.5 text-xs transition-colors ${tab === "dockerfile" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
              >
                Dockerfile
              </button>
              <button
                onClick={() => setTab("dockerignore")}
                className={`px-3 py-1.5 text-xs border-l border-[#222222] transition-colors ${tab === "dockerignore" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
              >
                .dockerignore
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => download(tab === "dockerfile" ? "Dockerfile" : ".dockerignore", output)}
                className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
              >
                <Download size={13} /> Download
              </button>
              <CopyButton text={output} size="sm" />
            </div>
          </div>
          <pre className="flex-1 p-4 font-mono text-xs leading-relaxed bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto whitespace-pre max-h-[calc(100vh-320px)] min-h-[450px]">
            {output}
          </pre>
        </div>
      </div>
    </ToolLayout>
  );
}
