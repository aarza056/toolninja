"use client";

import { useMemo, useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import FindingList from "@/components/FindingList";
import { CLIENTS, EMPTY_FORM, generateConfig, validateConfig, type KeyValue, type McpClient, type McpServerForm, type Transport } from "@/lib/mcp-config";
import { Plus, X } from "lucide-react";

// Nothing is saved to localStorage: env values and headers are usually API keys.

type Tab = "build" | "validate";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const input = "w-full px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";
const pill = (active: boolean) =>
  `px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${active ? "bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/30" : "text-[#888888] hover:text-[#f5f5f5] border-transparent"}`;

function Pairs({ label, rows, onChange, keyHint, valueHint }: { label: string; rows: KeyValue[]; onChange: (r: KeyValue[]) => void; keyHint: string; valueHint: string }) {
  return (
    <div>
      <label className="text-xs text-[#888888] font-medium block mb-1">{label}</label>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex gap-2">
            <input value={r.key} onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} placeholder={keyHint} spellCheck={false} className={`${input} font-mono`} />
            <input value={r.value} onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder={valueHint} spellCheck={false} className={`${input} font-mono`} />
            <button onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Remove" className="px-2 text-[#666666] hover:text-[#f87171]">
              <X size={14} />
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...rows, { key: "", value: "" }])} className="inline-flex items-center gap-1 text-xs text-[#a855f7] hover:underline">
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}

const SAMPLE_INVALID = `{
  "mcpServers": {
    "github": {
      "command": "npx -y @modelcontextprotocol/server-github",
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_1234567890abcdefghijklmnopqrstuvwxyz" }
    },
    "linear": {
      "url": "https://mcp.linear.app/mcp"
    }
  }
}`;

export default function McpConfigGeneratorClient() {
  const [tab, setTab] = useState<Tab>("build");
  const [form, setForm] = useState<McpServerForm>(EMPTY_FORM);
  const [client, setClient] = useState<McpClient>("claude-code");
  const [argsText, setArgsText] = useState(EMPTY_FORM.args.join("\n"));
  const [pasted, setPasted] = useState(SAMPLE_INVALID);
  const [validateFor, setValidateFor] = useState<McpClient>("claude-code");

  const set = <K extends keyof McpServerForm>(k: K, v: McpServerForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const out = generateConfig({ ...form, args: argsText.split("\n") }, client);
  const meta = CLIENTS.find((c) => c.id === client)!;
  const issues = useMemo(() => validateConfig(pasted, validateFor), [pasted, validateFor]);

  return (
    <ToolLayout title="MCP Config Generator & Validator" description="Build the MCP server entry for Claude Code, Claude Desktop, Cursor, VS Code or Devin Desktop — or find what's wrong with yours">
      <div className="max-w-5xl space-y-5">
        <div className="flex gap-1">
          <button onClick={() => setTab("build")} className={pill(tab === "build")}>Build a config</button>
          <button onClick={() => setTab("validate")} className={pill(tab === "validate")}>Validate a config</button>
        </div>

        {tab === "build" ? (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Server name</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} spellCheck={false} className={`${input} font-mono`} />
              </div>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Where does the server run?</label>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ["stdio", "On my machine (command)"],
                      ["http", "Remote (HTTP)"],
                      ["sse", "Remote (SSE, legacy)"],
                    ] as [Transport, string][]
                  ).map(([t, l]) => (
                    <button key={t} onClick={() => set("transport", t)} className={pill(form.transport === t)}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {form.transport === "stdio" ? (
                <>
                  <div>
                    <label className="text-xs text-[#888888] font-medium block mb-1">Command</label>
                    <input value={form.command} onChange={(e) => set("command", e.target.value)} placeholder="npx, uvx, node, docker…" spellCheck={false} className={`${input} font-mono`} />
                  </div>
                  <div>
                    <label className="text-xs text-[#888888] font-medium block mb-1">Arguments (one per line)</label>
                    <textarea value={argsText} onChange={(e) => setArgsText(e.target.value)} rows={3} spellCheck={false} className={`${input} font-mono text-xs`} />
                  </div>
                  <Pairs label="Environment variables" rows={form.env} onChange={(r) => set("env", r)} keyHint="NAME" valueHint="value" />
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-[#888888] font-medium block mb-1">Server URL</label>
                    <input value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://example.com/mcp" spellCheck={false} className={`${input} font-mono`} />
                  </div>
                  <Pairs label="Headers" rows={form.headers} onChange={(r) => set("headers", r)} keyHint="Authorization" valueHint="Bearer …" />
                </>
              )}
              <label className="flex items-start gap-2 text-xs text-[#cccccc] cursor-pointer">
                <input type="checkbox" checked={form.secretsAsVariables} onChange={(e) => set("secretsAsVariables", e.target.checked)} className="mt-0.5 accent-[#a855f7]" />
                <span>Keep tokens out of the file — replace anything that looks like a key with the client&apos;s variable syntax</span>
              </label>
            </div>

            <div className="space-y-3 min-w-0">
              <div className="flex flex-wrap gap-1">
                {CLIENTS.map((c) => (
                  <button key={c.id} onClick={() => setClient(c.id)} className={pill(client === c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#888888]">
                <code className="text-[#e879f9]">{meta.file}</code> — {meta.where}
              </p>
              <div className="relative">
                <pre className="p-4 text-xs font-mono leading-relaxed overflow-auto bg-[#0a0a0a] border border-[#222222] rounded-[8px] text-[#f5f5f5] max-h-[420px]">{out.json}</pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={out.json} size="sm" />
                </div>
              </div>
              {out.command && (
                <div>
                  <p className="text-xs text-[#888888] mb-1">Or add it from the terminal:</p>
                  <div className="flex items-start gap-2">
                    <pre className="flex-1 min-w-0 p-3 text-xs font-mono overflow-x-auto bg-[#0a0a0a] border border-[#222222] rounded-[8px] text-[#f5f5f5]">{out.command}</pre>
                    <CopyButton text={out.command} size="sm" />
                  </div>
                </div>
              )}
              <ul className="space-y-1.5">
                {[...out.notes, `Already have servers? Copy only the "${form.name || "my-server"}" entry into your existing ${client === "vscode" ? "servers" : "mcpServers"} object.`].map((n, i) => (
                  <li key={i} className="text-xs text-[#999999] leading-relaxed">• {n}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-xs text-[#888888] mr-1">Check for:</span>
                {CLIENTS.map((c) => (
                  <button key={c.id} onClick={() => setValidateFor(c.id)} className={pill(validateFor === c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>
              <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={18} spellCheck={false} className={`${input} font-mono text-xs`} />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-[#888888]">{pasted.trim() ? `${plural(issues.filter((i) => i.level === "error").length, "error")} · ${plural(issues.filter((i) => i.level === "warning").length, "warning")}` : "Paste a config to check it"}</p>
              {pasted.trim() && (
                <FindingList
                  items={issues.map((i) => ({ level: i.level, title: i.message, meta: i.server }))}
                  empty={`Looks good for ${CLIENTS.find((c) => c.id === validateFor)!.label}.`}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
