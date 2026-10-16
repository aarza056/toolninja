"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Eye, EyeOff, Plus, Trash2, AlertCircle } from "lucide-react";
import {
  parseConnectionString,
  buildConnectionString,
  EMPTY_CONNECTION,
  DEFAULT_PORTS,
  type ParsedConnection,
} from "@/lib/connection-string";

type Mode = "parse" | "build";

const SCHEME_PRESETS = ["postgres", "mysql", "mongodb", "mongodb+srv", "redis"];

const inputClass =
  "w-full px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

export default function ConnectionStringParserClient() {
  const [mode, setMode] = useState<Mode>("parse");
  const [raw, setRaw] = useState("");
  const [conn, setConn] = useState<ParsedConnection>(EMPTY_CONNECTION);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleParse = (value: string) => {
    setRaw(value);
    if (!value.trim()) {
      setError("");
      return;
    }
    try {
      setConn(parseConnectionString(value));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't parse that string");
    }
  };

  const update = (patch: Partial<ParsedConnection>) => setConn((prev) => ({ ...prev, ...patch }));

  const updateParam = (key: string, value: string) => update({ params: { ...conn.params, [key]: value } });
  const addParam = () => update({ params: { ...conn.params, "": "" } });
  const removeParam = (key: string) => {
    const next = { ...conn.params };
    delete next[key];
    update({ params: next });
  };
  const renameParam = (oldKey: string, newKey: string) => {
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(conn.params)) {
      next[k === oldKey ? newKey : k] = v;
    }
    update({ params: next });
  };

  const built = useMemo(() => buildConnectionString(conn), [conn]);
  const defaultPort = DEFAULT_PORTS[conn.scheme.replace("+srv", "")];

  return (
    <ToolLayout
      title="Database Connection String Parser & Builder"
      description="Parse a Postgres, MySQL, MongoDB, or Redis connection URI into its parts — or build one visually"
    >
      <div className="flex rounded-[6px] border border-[#222222] overflow-hidden mb-5 w-fit">
        <button
          onClick={() => setMode("parse")}
          className={`px-4 py-1.5 text-sm transition-colors ${mode === "parse" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
        >
          Parse
        </button>
        <button
          onClick={() => setMode("build")}
          className={`px-4 py-1.5 text-sm border-l border-[#222222] transition-colors ${mode === "build" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
        >
          Build
        </button>
      </div>

      {mode === "parse" && (
        <div className="mb-6">
          <label className="text-xs text-[#888888] font-medium block mb-1">Connection string</label>
          <input
            type="text"
            value={raw}
            onChange={(e) => handleParse(e.target.value)}
            placeholder="postgres://user:pass@db.example.com:5432/mydb?sslmode=require"
            spellCheck={false}
            className={`${inputClass} font-mono text-xs`}
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1.5">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>
      )}

      {(mode === "build" || (mode === "parse" && raw.trim() && !error)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Scheme</label>
              {mode === "build" ? (
                <div className="flex flex-wrap gap-1.5">
                  {SCHEME_PRESETS.map((s) => (
                    <button
                      key={s}
                      onClick={() => update({ scheme: s })}
                      className={`px-2.5 py-1.5 text-xs rounded-[6px] border transition-colors ${
                        conn.scheme === s ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <code className="text-sm text-[#f5f5f5]">{conn.scheme}</code>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">User</label>
                {mode === "build" ? (
                  <input type="text" value={conn.user} onChange={(e) => update({ user: e.target.value })} className={`${inputClass} font-mono`} spellCheck={false} />
                ) : (
                  <code className="block text-sm text-[#f5f5f5] font-mono break-all">{conn.user || "—"}</code>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[#888888] font-medium">Password</label>
                  {mode === "parse" && conn.password && (
                    <button onClick={() => setShowPassword((s) => !s)} className="text-[#555555] hover:text-[#888888]">
                      {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  )}
                </div>
                {mode === "build" ? (
                  <input type="text" value={conn.password} onChange={(e) => update({ password: e.target.value })} className={`${inputClass} font-mono`} spellCheck={false} />
                ) : (
                  <code className="block text-sm text-[#f5f5f5] font-mono break-all">
                    {conn.password ? (showPassword ? conn.password : "•".repeat(Math.min(conn.password.length, 16))) : "—"}
                  </code>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Host</label>
                {mode === "build" ? (
                  <input type="text" value={conn.host} onChange={(e) => update({ host: e.target.value })} placeholder="db.example.com" className={`${inputClass} font-mono`} spellCheck={false} />
                ) : (
                  <code className="block text-sm text-[#f5f5f5] font-mono break-all">{conn.host || "—"}</code>
                )}
              </div>
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">
                  Port {mode === "build" && defaultPort && <span className="text-[#555555]">(default {defaultPort})</span>}
                </label>
                {mode === "build" ? (
                  <input type="text" value={conn.port} onChange={(e) => update({ port: e.target.value })} placeholder={defaultPort ? String(defaultPort) : ""} className={`${inputClass} font-mono`} spellCheck={false} />
                ) : (
                  <code className="block text-sm text-[#f5f5f5] font-mono">{conn.port || "—"}</code>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Database</label>
              {mode === "build" ? (
                <input type="text" value={conn.database} onChange={(e) => update({ database: e.target.value })} className={`${inputClass} font-mono`} spellCheck={false} />
              ) : (
                <code className="block text-sm text-[#f5f5f5] font-mono break-all">{conn.database || "—"}</code>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-[#888888] font-medium">Query parameters</label>
                {mode === "build" && (
                  <button onClick={addParam} className="flex items-center gap-1 text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors">
                    <Plus size={11} /> Add
                  </button>
                )}
              </div>
              {Object.keys(conn.params).length === 0 ? (
                <p className="text-xs text-[#555555]">None</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(conn.params).map(([k, v], i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      {mode === "build" ? (
                        <>
                          <input type="text" value={k} onChange={(e) => renameParam(k, e.target.value)} placeholder="key" className={`${inputClass} font-mono text-xs`} spellCheck={false} />
                          <input type="text" value={v} onChange={(e) => updateParam(k, e.target.value)} placeholder="value" className={`${inputClass} font-mono text-xs`} spellCheck={false} />
                          <button onClick={() => removeParam(k)} className="p-2 text-[#555555] hover:text-[#ef4444] transition-colors shrink-0">
                            <Trash2 size={13} />
                          </button>
                        </>
                      ) : (
                        <code className="text-xs text-[#888888] font-mono">
                          {k}=<span className="text-[#f5f5f5]">{v}</span>
                        </code>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#888888] font-medium">{mode === "build" ? "Connection string" : "Normalized string"}</label>
              {built && <CopyButton text={built} size="sm" />}
            </div>
            <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#22c55e] overflow-auto whitespace-pre-wrap break-all min-h-[80px]">
              {built || "Fill in a host to see the connection string…"}
            </pre>
          </div>
        </div>
      )}

      {mode === "parse" && !raw.trim() && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Paste a connection string above to break it into its parts
        </div>
      )}
    </ToolLayout>
  );
}
