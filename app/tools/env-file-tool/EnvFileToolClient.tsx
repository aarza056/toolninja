"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertTriangle, Download, KeyRound } from "lucide-react";
import { parseEnv, envToJson, generateExample } from "@/lib/env-file";

const STORAGE_KEY = "toolninja:env-file-tool";

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

type OutputTab = "json" | "example";

export default function EnvFileToolClient() {
  const [envText, setEnvText] = useState("");
  const [tab, setTab] = useState<OutputTab>("json");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setEnvText(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, envText); } catch {}
  }, [envText]);

  const { entries, duplicates } = useMemo(() => parseEnv(envText), [envText]);
  const jsonOutput = useMemo(() => (envText.trim() ? envToJson(envText) : ""), [envText]);
  const exampleOutput = useMemo(() => (envText.trim() ? generateExample(envText) : ""), [envText]);
  const output = tab === "json" ? jsonOutput : exampleOutput;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEnvText(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  };

  const textareaClass =
    "w-full h-80 p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout
      title="Env File Tool"
      description="Parse, convert, and generate .env.example files from your .env — catch duplicate keys before they cause bugs"
    >
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-[#888888] font-medium">.env file</label>
        <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors cursor-pointer">
          Upload .env file
          <input type="file" accept=".env,text/plain" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div>
          <textarea
            value={envText}
            onChange={(e) => setEnvText(e.target.value)}
            placeholder={"DATABASE_URL=postgres://localhost:5432/app\nAPI_KEY=\"sk-example-123\"\nDEBUG=true\n# comments are ignored"}
            spellCheck={false}
            className={textareaClass}
          />

          {entries.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-[#666666]">
              <KeyRound size={12} />
              {entries.length} key{entries.length !== 1 ? "s" : ""} found
            </div>
          )}

          {duplicates.length > 0 && (
            <div className="mt-2 flex items-start gap-1.5 p-2.5 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[6px] text-xs text-[#ef4444]">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>
                Duplicate key{duplicates.length !== 1 ? "s" : ""}: {duplicates.join(", ")} — the last occurrence
                wins, which is easy to miss when debugging.
              </span>
            </div>
          )}
        </div>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
              <button
                onClick={() => setTab("json")}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  tab === "json" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                As JSON
              </button>
              <button
                onClick={() => setTab("example")}
                className={`px-3 py-1.5 text-xs border-l border-[#222222] transition-colors ${
                  tab === "example" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                .env.example
              </button>
            </div>
            <div className="flex items-center gap-2">
              {output && (
                <button
                  onClick={() => download(tab === "json" ? "env.json" : ".env.example", output)}
                  className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
                >
                  <Download size={12} /> Download
                </button>
              )}
              <CopyButton text={output} size="sm" />
            </div>
          </div>
          <pre className={`${textareaClass} overflow-auto`}>{output}</pre>
          {tab === "example" && output && (
            <p className="mt-2 text-xs text-[#555555]">
              Values are stripped — safe to commit. Keys are preserved so teammates know what to fill in.
            </p>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
