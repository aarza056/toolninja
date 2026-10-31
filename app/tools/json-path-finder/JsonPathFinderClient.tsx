"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { PATH_STYLES, formatPath, getAt, previewValue, searchJson, type Segment } from "@/lib/json-paths";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

const STORAGE_KEY = "toolninja:json-path-finder";
const PAGE = 200; // children shown per object/array before "show more"

const EXAMPLE = `{
  "order": {
    "id": "ord_7f3a",
    "customer": { "name": "Ada Lovelace", "email": "ada@example.com" },
    "items": [
      { "sku": "BOOK-001", "title": "Notes on the Analytical Engine", "qty": 1, "price": 24.5 },
      { "sku": "PEN-042", "title": "Fountain pen", "qty": 2, "price": 12 }
    ],
    "shipping": { "address": { "city": "London", "post-code": "SW1A 1AA" }, "express": true },
    "tags": ["gift", "priority"]
  }
}`;

const keyOf = (p: Segment[]) => JSON.stringify(p);

function scalarClass(v: unknown) {
  if (typeof v === "string") return "text-[#86efac]";
  if (typeof v === "number") return "text-[#fbbf24]";
  if (typeof v === "boolean") return "text-[#60a5fa]";
  return "text-[#888888]";
}

interface TreeProps {
  name: Segment | null;
  value: unknown;
  path: Segment[];
  expanded: Set<string>;
  limits: Record<string, number>;
  selected: string;
  onToggle: (k: string) => void;
  onSelect: (p: Segment[]) => void;
  onMore: (k: string) => void;
}

function TreeNode({ name, value, path, expanded, limits, selected, onToggle, onSelect, onMore }: TreeProps) {
  const k = keyOf(path);
  const isArr = Array.isArray(value);
  const isObj = !isArr && value !== null && typeof value === "object";
  const open = expanded.has(k);
  const entries: [Segment, unknown][] = isArr ? (value as unknown[]).map((v, i) => [i, v]) : isObj ? Object.entries(value as Record<string, unknown>) : [];
  const limit = limits[k] ?? PAGE;

  return (
    <li>
      <div className={`flex items-start gap-1 rounded-[4px] px-1 ${selected === k ? "bg-[#a855f7]/20" : "hover:bg-[#1a1a1a]"}`}>
        {isArr || isObj ? (
          <button onClick={() => onToggle(k)} aria-label={open ? "Collapse" : "Expand"} className="mt-0.5 text-[#666666] hover:text-[#f5f5f5]">
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : (
          <span className="w-[13px] shrink-0" />
        )}
        <button onClick={() => onSelect(path)} className="min-w-0 text-left font-mono text-xs leading-5 break-all">
          {name !== null && <span className={typeof name === "number" ? "text-[#888888]" : "text-[#c4b5fd]"}>{typeof name === "number" ? name : JSON.stringify(name)}</span>}
          {name !== null && <span className="text-[#555555]">: </span>}
          {isArr || isObj ? <span className="text-[#777777]">{previewValue(value)}</span> : <span className={scalarClass(value)}>{previewValue(value, 120)}</span>}
        </button>
      </div>
      {open && entries.length > 0 && (
        <ul className="ml-4 border-l border-[#1f1f1f] pl-1">
          {entries.slice(0, limit).map(([n, v]) => (
            <TreeNode key={String(n)} name={n} value={v} path={[...path, n]} expanded={expanded} limits={limits} selected={selected} onToggle={onToggle} onSelect={onSelect} onMore={onMore} />
          ))}
          {entries.length > limit && (
            <li>
              <button onClick={() => onMore(k)} className="ml-5 text-xs text-[#a855f7] hover:underline">
                Show {Math.min(PAGE, entries.length - limit)} more of {entries.length - limit}
              </button>
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

/** Paths of every object/array down to `depth`, to open the first levels by default */
function openTo(v: unknown, depth: number, path: Segment[] = [], out = new Set<string>()): Set<string> {
  if (depth < 0 || v === null || typeof v !== "object") return out;
  out.add(keyOf(path));
  const entries: [Segment, unknown][] = Array.isArray(v) ? v.slice(0, 50).map((x, i) => [i, x]) : Object.entries(v as Record<string, unknown>).slice(0, 50);
  for (const [k, x] of entries) openTo(x, depth - 1, [...path, k], out);
  return out;
}

export default function JsonPathFinderClient() {
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<Segment[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [wildcard, setWildcard] = useState(false);

  useEffect(() => {
    try {
      setInput(localStorage.getItem(STORAGE_KEY) || EXAMPLE);
    } catch {
      setInput(EXAMPLE);
    }
  }, []);
  useEffect(() => {
    if (!input) return;
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { value: JSON.parse(input) as unknown, error: "" };
    } catch (e) {
      return { value: undefined, error: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [input]);

  // A new document: open the first two levels and select the first leaf-ish path
  useEffect(() => {
    if (!parsed || parsed.error) return;
    setExpanded(openTo(parsed.value, 2));
    setLimits({});
    setSelected([]);
  }, [parsed]);

  const matches = useMemo(() => (parsed && !parsed.error && query.trim() ? searchJson(parsed.value, query) : []), [parsed, query]);

  const select = (p: Segment[]) => {
    setSelected(p);
    // Open every ancestor so the node is visible in the tree
    setExpanded((prev) => {
      const next = new Set(prev);
      for (let i = 0; i < p.length; i++) next.add(keyOf(p.slice(0, i)));
      return next;
    });
  };
  const toggle = (k: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const hasIndex = selected.some((s) => typeof s === "number");
  const useWild = wildcard && hasIndex;
  const selectedValue = parsed && !parsed.error ? getAt(parsed.value, selected) : undefined;

  return (
    <ToolLayout title="JSON Path Finder" description="Click any value in your JSON to get its path — as JSONPath, JavaScript, jq or Python">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2 min-w-0">
          <label className="text-xs text-[#888888] font-medium block">JSON</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={24}
            spellCheck={false}
            className="w-full p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
          {parsed?.error && <p className="text-xs text-[#f87171]">Invalid JSON: {parsed.error}</p>}
          <p className="text-xs text-[#666666] leading-relaxed">
            Got a path and want to test it? Run it in the{" "}
            <Link href="/tools/jsonpath-tester" className="text-[#a855f7] hover:underline">
              JSONPath Tester
            </Link>
            .
          </p>
        </div>

        <div className="space-y-4 min-w-0">
          <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[#888888]">
                Path to <span className="font-mono text-[#dddddd]">{selected.length ? previewValue(selectedValue, 40) : "the root"}</span>
              </p>
              {hasIndex && (
                <label className="flex items-center gap-1.5 text-xs text-[#bbbbbb]">
                  <input type="checkbox" checked={wildcard} onChange={(e) => setWildcard(e.target.checked)} className="accent-[#a855f7]" />
                  All array items
                </label>
              )}
            </div>
            {PATH_STYLES.map((s) => {
              const text = formatPath(selected, s.id, { wildcard: useWild });
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-[11px] text-[#666666]">{s.label}</span>
                  <code className="flex-1 min-w-0 px-2 py-1 font-mono text-xs bg-[#0a0a0a] border border-[#1f1f1f] rounded text-[#f5f5f5] break-all">{text}</code>
                  <CopyButton text={text} size="sm" />
                </div>
              );
            })}
          </div>

          <label className="flex items-center gap-2 px-3 py-2 bg-[#111111] border border-[#222222] rounded-[8px] focus-within:border-[#a855f7]">
            <Search size={14} className="text-[#666666]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a key or value…" aria-label="Find a key or value" className="flex-1 bg-transparent text-sm text-[#f5f5f5] focus:outline-none" />
          </label>
          {query.trim() && (
            <ul className="max-h-44 overflow-auto border border-[#1e1e1e] rounded-[8px] divide-y divide-[#161616]">
              {matches.map((m, i) => (
                <li key={i}>
                  <button onClick={() => select(m.path)} className="w-full text-left px-3 py-1.5 hover:bg-[#1a1a1a]">
                    <span className="font-mono text-xs text-[#f5f5f5] break-all">{formatPath(m.path, "jsonpath")}</span>
                    <span className="ml-2 text-[11px] text-[#777777]">
                      {m.on === "key" ? "key" : "value"} · {m.preview}
                    </span>
                  </button>
                </li>
              ))}
              {matches.length === 0 && <li className="px-3 py-2 text-xs text-[#888888]">No key or value contains “{query.trim()}”.</li>}
            </ul>
          )}

          {parsed && !parsed.error && (
            <ul className="max-h-[480px] overflow-auto p-2 bg-[#0a0a0a] border border-[#222222] rounded-[8px]">
              <TreeNode
                name={null}
                value={parsed.value}
                path={[]}
                expanded={expanded}
                limits={limits}
                selected={keyOf(selected)}
                onToggle={toggle}
                onSelect={select}
                onMore={(k) => setLimits((l) => ({ ...l, [k]: (l[k] ?? PAGE) + PAGE }))}
              />
            </ul>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
