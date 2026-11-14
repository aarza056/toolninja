"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { cliCommands, parseJsonInput, runJmes, JMES_EXAMPLES, JMES_FUNCTIONS, JSONPATH_EQUIVALENTS, SAMPLE_EC2, SAMPLE_PEOPLE } from "@/lib/jmespath-tool";

const STORAGE_KEY = "toolninja:jmespath-tester";
const field = "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

const DEFAULT_QUERY = JMES_EXAMPLES[2].query;
const pretty = (v: unknown) => JSON.stringify(v, null, 2);

/** "double quotes" in a comparison name a field, which is almost never what was meant */
function quoteHint(query: string): string | null {
  return /(==|!=|<|>)\s*"[^"]*"|"[^"]*"\s*(==|!=)/.test(query) ? "In JMESPath, \"double quotes\" are a field name, not a string. Compare with 'single quotes' (a raw string) or `\"backticks\"` (a JSON literal)." : null;
}

export default function JmespathTesterClient() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [data, setData] = useState(pretty(SAMPLE_EC2));
  const [loaded, setLoaded] = useState(false);
  const [cli, setCli] = useState(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (typeof saved?.query === "string") setQuery(saved.query);
      if (typeof saved?.data === "string" && saved.data.length < 500_000) setData(saved.data);
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ query, data: data.length < 500_000 ? data : "" }));
    } catch {}
  }, [query, data, loaded]);

  const parsed = useMemo(() => parseJsonInput(data), [data]);
  const result = useMemo(() => (parsed.ok ? runJmes(query, parsed.value) : null), [parsed, query]);
  const output = result?.ok ? pretty(result.value ?? null) : "";
  const hint = quoteHint(query);
  const commands = cliCommands(query);

  const loadExample = (i: number) => {
    const ex = JMES_EXAMPLES[i];
    setQuery(ex.query);
    setData(pretty(ex.data === "ec2" ? SAMPLE_EC2 : SAMPLE_PEOPLE));
  };

  return (
    <ToolLayout title="JMESPath Tester" description="Test JMESPath queries against your JSON live, the query language of the AWS CLI and Azure CLI --query, with examples and ready-to-run commands">
      <div className="space-y-6 max-w-6xl">
        <div>
          <label htmlFor="jmes-query" className="text-xs text-[#888888] font-medium block mb-1">
            JMESPath query
          </label>
          <div className="flex gap-2">
            <input id="jmes-query" value={query} onChange={(e) => setQuery(e.target.value)} spellCheck={false} autoComplete="off" className={`${field} flex-1 min-w-0 font-mono`} placeholder="Reservations[].Instances[].InstanceId" />
            <CopyButton text={query} size="sm" />
          </div>
          {hint && result?.ok && (
            <p className="flex items-start gap-2 text-xs text-[#fbbf24] mt-2">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {hint}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {JMES_EXAMPLES.map((ex, i) => (
              <button key={ex.label} type="button" onClick={() => loadExample(i)} className={`px-2 py-1 text-xs rounded border ${query === ex.query ? "border-[#a855f7] text-[#f5f5f5]" : "border-[#2a2a2a] text-[#bbbbbb] hover:border-[#a855f7]"}`}>
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="jmes-data" className="text-xs text-[#888888] font-medium">
                JSON data
              </label>
              <div className="flex gap-3 text-xs">
                <button type="button" onClick={() => setData(pretty(SAMPLE_EC2))} className="text-[#a855f7] hover:underline">
                  AWS EC2 sample
                </button>
                <button type="button" onClick={() => setData(pretty(SAMPLE_PEOPLE))} className="text-[#a855f7] hover:underline">
                  Simple sample
                </button>
              </div>
            </div>
            <textarea id="jmes-data" value={data} onChange={(e) => setData(e.target.value)} rows={22} spellCheck={false} className={`${field} w-full font-mono !text-xs`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#888888] font-medium">Result</span>
              {output && <CopyButton text={output} size="sm" />}
            </div>
            {!parsed.ok ? (
              <p className="p-3 text-sm text-[#f87171] bg-[#111111] border border-[#222222] rounded-[8px]">{parsed.error}</p>
            ) : result && !result.ok ? (
              <p className="p-3 text-sm text-[#f87171] bg-[#111111] border border-[#222222] rounded-[8px] font-mono break-words">{result.error}</p>
            ) : (
              <pre aria-live="polite" className="p-3 h-[calc(22*1.25rem+1rem)] overflow-auto font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#d4d4d4] whitespace-pre-wrap break-all">
                {output}
              </pre>
            )}
            {result?.ok && result.value === null && <p className="text-xs text-[#888888] mt-1">null means the path didn&apos;t match anything. Field names are case-sensitive.</p>}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {commands.map((c, i) => (
              <button key={c.label} type="button" onClick={() => setCli(i)} className={`px-2 py-1 text-xs rounded border ${cli === i ? "border-[#a855f7] text-[#f5f5f5]" : "border-[#2a2a2a] text-[#888888] hover:text-[#f5f5f5]"}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-start gap-2">
            <pre className="flex-1 min-w-0 p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#bbbbbb] whitespace-pre-wrap break-all">{commands[cli].code}</pre>
            <CopyButton text={commands[cli].code} size="sm" />
          </div>
          {cli < 2 && <p className="text-xs text-[#777777] mt-1">The query is single-quoted for bash and zsh. In PowerShell, use the same single quotes; in cmd.exe, use double quotes and change any inner double quotes.</p>}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-[#d4d4d4] mb-2">Functions</h2>
            <dl className="grid gap-x-3 gap-y-1 text-xs grid-cols-[auto_1fr]">
              {JMES_FUNCTIONS.map((f) => (
                <div key={f.name} className="contents">
                  <dt className="font-mono text-[#c084fc] whitespace-nowrap">{f.signature}</dt>
                  <dd className="text-[#999999]">{f.description}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#d4d4d4] mb-2">JMESPath vs JSONPath</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[#777777]">
                    <th className="py-1 pr-3 font-medium">Task</th>
                    <th className="py-1 pr-3 font-medium">JMESPath</th>
                    <th className="py-1 font-medium">JSONPath</th>
                  </tr>
                </thead>
                <tbody>
                  {JSONPATH_EQUIVALENTS.map((r) => (
                    <tr key={r.task} className="border-t border-[#1f1f1f]">
                      <td className="py-1 pr-3 text-[#999999]">{r.task}</td>
                      <td className="py-1 pr-3 font-mono text-[#d4d4d4]">{r.jmespath}</td>
                      <td className="py-1 font-mono text-[#d4d4d4]">{r.jsonpath}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#666666]">
          Runs in your browser with the reference jmespath.js implementation; nothing is sent anywhere. Working with JSONPath instead (Kubernetes, Postman, many APIs)? Use the <Link href="/tools/jsonpath-tester" className="text-[#a855f7] hover:underline">JSONPath Tester</Link>.
        </p>
      </div>
    </ToolLayout>
  );
}
