"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Plus, Trash2, Download, Dices } from "lucide-react";
import { FIELD_TYPES, buildSql, generateFromSchema, generateRows, type FieldSpec, type FieldType, type SqlDialect } from "@/lib/fake-data";
import { jsonToCsv } from "@/lib/csv-json";
import { FAKE_DATA_PAGES } from "@/lib/fake-data-pages";

type OutputFormat = "json" | "ndjson" | "csv" | "sql";

interface Props {
  /** The /tools/fake-data-generator/<format> pages open the generator set up for one output */
  initialFormat?: OutputFormat;
  initialDialect?: SqlDialect;
  initialTable?: string;
  initialFields?: FieldSpec[];
  heading?: string;
  intro?: string;
  /** The page's own slug, left out of the links to the other formats */
  pageSlug?: string;
}

const MAX_ROWS = 10000;
// Longer output is downloaded or copied whole, but only the start is drawn on the page
const PREVIEW_CHARS = 60000;

const EXAMPLE_SCHEMA = `{
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "email": { "type": "string", "format": "email" },
    "plan": { "enum": ["free", "pro", "team"] },
    "seats": { "type": "integer", "minimum": 1, "maximum": 50 },
    "address": {
      "type": "object",
      "properties": { "city": { "type": "string" }, "country": { "type": "string" } },
      "required": ["city"]
    },
    "tags": { "type": "array", "items": { "type": "string" }, "maxItems": 3 },
    "created_at": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "email", "plan", "created_at"]
}`;

const isRecord = (r: unknown) => typeof r === "object" && r !== null && !Array.isArray(r);

/** CSV has no nesting, so nested values go in the cell as JSON */
const flatRows = (rows: unknown[]) =>
  (rows.filter(isRecord) as Record<string, unknown>[]).map((r) => {
    const out: Record<string, unknown> = {};
    Object.keys(r).forEach((k) => {
      out[k] = typeof r[k] === "object" && r[k] !== null ? JSON.stringify(r[k]) : r[k];
    });
    return out;
  });

let fieldIdCounter = 3;

const DEFAULT_FIELDS: FieldSpec[] = [
  { id: 1, name: "id", type: "uuid" },
  { id: 2, name: "name", type: "fullName" },
  { id: 3, name: "email", type: "email" },
];

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function FakeDataGeneratorClient({ initialFormat, initialDialect, initialTable, initialFields, heading, intro, pageSlug }: Props = {}) {
  const [fields, setFields] = useState<FieldSpec[]>(initialFields ?? DEFAULT_FIELDS);
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState("");
  const [format, setFormat] = useState<OutputFormat>(initialFormat ?? "json");
  const [rows, setRows] = useState<unknown[] | null>(null);
  const [tableName, setTableName] = useState(initialTable ?? "users");
  const [source, setSource] = useState<"fields" | "schema">("fields");
  const [schemaText, setSchemaText] = useState(EXAMPLE_SCHEMA);
  const [schemaError, setSchemaError] = useState("");
  const [patternWarning, setPatternWarning] = useState(false);
  const [dialect, setDialect] = useState<SqlDialect>(initialDialect ?? "postgres");
  const [createTable, setCreateTable] = useState(true);

  const addField = () => {
    fieldIdCounter = Math.max(fieldIdCounter, ...fields.map((f) => f.id)) + 1;
    setFields((prev) => [...prev, { id: fieldIdCounter, name: `field${prev.length + 1}`, type: "word" }]);
  };

  const removeField = (id: number) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateField = (id: number, patch: Partial<FieldSpec>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const generate = () => {
    const n = Math.max(1, Math.min(MAX_ROWS, count));
    setSchemaError("");
    setPatternWarning(false);
    if (source === "schema") {
      try {
        const r = generateFromSchema(schemaText, n, seed.trim() || undefined);
        setRows(r.rows);
        setPatternWarning(r.unsupported.includes("pattern"));
      } catch (e) {
        setSchemaError(e instanceof Error ? e.message : "That schema couldn't be read.");
        setRows(null);
      }
      return;
    }
    const clean = fields.filter((f) => f.name.trim());
    if (clean.length === 0) return;
    setRows(generateRows(clean, n, seed.trim() || undefined));
  };

  const output = useMemo(() => {
    if (!rows) return "";
    if (format === "json") return JSON.stringify(rows, null, 2);
    if (format === "ndjson") return rows.map((r) => JSON.stringify(r)).join("\n");
    if (format === "sql") return buildSql(rows, tableName, dialect, { createTable });
    return jsonToCsv(flatRows(rows));
  }, [rows, format, tableName, dialect, createTable]);
  // CSV and SQL need rows with named columns; a schema can describe anything
  const needsObjects = !!rows && (format === "csv" || format === "sql") && !rows.some(isRecord);

  const inputClass =
    "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout
      title={heading ?? "Fake Data Generator"}
      description={intro ?? "Generate realistic mock data from a field list or a JSON Schema — as JSON, CSV or SQL for Postgres, MySQL and SQLite"}
    >
      <div className="flex rounded-[6px] border border-[#222222] overflow-hidden w-fit mb-4">
        {(["fields", "schema"] as const).map((m) => (
          <button key={m} onClick={() => setSource(m)} className={`px-4 py-1.5 text-sm transition-colors ${source === m ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}>
            {m === "fields" ? "Pick fields" : "From JSON Schema"}
          </button>
        ))}
      </div>

      {source === "schema" ? (
        <div className="mb-4">
          <label htmlFor="fake-schema" className="text-xs text-[#888888] font-medium block mb-1">JSON Schema</label>
          <textarea
            id="fake-schema"
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
            rows={14}
            spellCheck={false}
            className="w-full p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
          {schemaError && <p className="text-xs text-[#f87171] mt-1">{schemaError}</p>}
          <p className="text-xs text-[#555555] mt-1">Follows type, format, enum, const, minimum/maximum, min/maxLength, min/maxItems, required, oneOf/anyOf/allOf and local $refs. Property names like “email” or “city” get matching values.</p>
          {patternWarning && <p className="text-xs text-[#fbbf24] mt-1">“pattern” isn&apos;t applied: values won&apos;t necessarily match those regular expressions.</p>}
        </div>
      ) : (
      <div className="space-y-2 mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">Fields</label>
        {fields.map((f) => (
          <div key={f.id} className="flex gap-2 items-center">
            <input
              type="text"
              value={f.name}
              onChange={(e) => updateField(f.id, { name: e.target.value })}
              placeholder="field name"
              className={`${inputClass} flex-1 min-w-0 font-mono`}
              spellCheck={false}
            />
            <select
              value={f.type}
              onChange={(e) => updateField(f.id, { type: e.target.value as FieldType })}
              className={`${inputClass} flex-1 min-w-0`}
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <button
              onClick={() => removeField(f.id)}
              className="p-2 text-[#555555] hover:text-[#ef4444] transition-colors shrink-0"
              title="Remove field"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={addField}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
        >
          <Plus size={14} /> Add Field
        </button>
      </div>
      )}

      {/* Options */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Rows</label>
          <input
            type="number"
            min={1}
            max={MAX_ROWS}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className={`${inputClass} w-24`}
          />
        </div>
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Seed (optional)</label>
          <input
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="for reproducible output"
            className={`${inputClass} w-48`}
          />
        </div>
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Format</label>
          <div className="flex">
            {(["json", "ndjson", "csv", "sql"] as OutputFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-2 text-sm border transition-colors first:rounded-l-[6px] last:rounded-r-[6px] uppercase ${
                  f === format
                    ? "bg-[#a855f7] border-[#a855f7] text-white"
                    : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {format === "sql" && (
          <>
            <div>
              <label htmlFor="fake-dialect" className="text-xs text-[#888888] font-medium block mb-1">Database</label>
              <select id="fake-dialect" value={dialect} onChange={(e) => setDialect(e.target.value as SqlDialect)} className={inputClass}>
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL / MariaDB</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Table name</label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="users"
                className={`${inputClass} w-32 font-mono`}
                spellCheck={false}
              />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm text-[#888888]">
              <input type="checkbox" checked={createTable} onChange={(e) => setCreateTable(e.target.checked)} className="accent-[#a855f7]" />
              CREATE TABLE
            </label>
          </>
        )}
        <button
          onClick={generate}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
        >
          <Dices size={14} /> Generate
        </button>
      </div>

      {/* Output */}
      {rows && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">
              {rows.length} rows generated
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => download(`mock-data.${format}`, output, format === "json" ? "application/json" : format === "sql" ? "application/sql" : format === "ndjson" ? "application/x-ndjson" : "text/csv")}
                className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
              >
                <Download size={12} /> Download
              </button>
              <CopyButton text={output} size="sm" />
            </div>
          </div>
          <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto max-h-96 whitespace-pre-wrap break-all">
            {output.length > PREVIEW_CHARS ? `${output.slice(0, PREVIEW_CHARS)}\n…` : output}
          </pre>
          {output.length > PREVIEW_CHARS && <p className="text-xs text-[#666666] mt-1">Showing the start here; Download and Copy include all {rows.length.toLocaleString("en-US")} rows.</p>}
          {needsObjects && <p className="text-xs text-[#fbbf24] mt-1">CSV and SQL need the schema&apos;s top level to be an object, so each row has named columns.</p>}
        </div>
      )}

      {!rows && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Define your fields above and hit Generate
        </div>
      )}

      <nav aria-label="Fake data by format" className="mt-6 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[#666666]">Set up for:</span>
        {FAKE_DATA_PAGES.filter((p) => p.slug !== pageSlug).map((p) => (
          <Link key={p.slug} href={`/tools/fake-data-generator/${p.slug}`} className="px-2.5 py-1 bg-[#111111] border border-[#222222] rounded-[6px] text-[#888888] hover:text-[#a855f7]">
            {p.name}
          </Link>
        ))}
        {pageSlug && (
          <Link href="/tools/fake-data-generator" className="px-2.5 py-1 text-[#a855f7] hover:underline">
            All formats
          </Link>
        )}
      </nav>
    </ToolLayout>
  );
}
