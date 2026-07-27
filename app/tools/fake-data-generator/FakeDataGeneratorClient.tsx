"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Plus, Trash2, Download, Dices } from "lucide-react";
import { FIELD_TYPES, generateRows, type FieldSpec, type FieldType } from "@/lib/fake-data";
import { jsonToCsv } from "@/lib/csv-json";

type OutputFormat = "json" | "csv";

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

export default function FakeDataGeneratorClient() {
  const [fields, setFields] = useState<FieldSpec[]>(DEFAULT_FIELDS);
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState("");
  const [format, setFormat] = useState<OutputFormat>("json");
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);

  const addField = () => {
    fieldIdCounter += 1;
    setFields((prev) => [...prev, { id: fieldIdCounter, name: `field${prev.length + 1}`, type: "word" }]);
  };

  const removeField = (id: number) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateField = (id: number, patch: Partial<FieldSpec>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const generate = () => {
    const clean = fields.filter((f) => f.name.trim());
    if (clean.length === 0) return;
    setRows(generateRows(clean, Math.max(1, Math.min(500, count)), seed.trim() || undefined));
  };

  const output = useMemo(() => {
    if (!rows) return "";
    return format === "json" ? JSON.stringify(rows, null, 2) : jsonToCsv(rows);
  }, [rows, format]);

  const inputClass =
    "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout
      title="Fake Data Generator"
      description="Define a schema, generate realistic mock JSON or CSV data instantly"
    >
      {/* Field builder */}
      <div className="space-y-2 mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">Fields</label>
        {fields.map((f) => (
          <div key={f.id} className="flex gap-2 items-center">
            <input
              type="text"
              value={f.name}
              onChange={(e) => updateField(f.id, { name: e.target.value })}
              placeholder="field name"
              className={`${inputClass} flex-1 font-mono`}
              spellCheck={false}
            />
            <select
              value={f.type}
              onChange={(e) => updateField(f.id, { type: e.target.value as FieldType })}
              className={`${inputClass} flex-1`}
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

      {/* Options */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Rows</label>
          <input
            type="number"
            min={1}
            max={500}
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
            {(["json", "csv"] as OutputFormat[]).map((f) => (
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
                onClick={() => download(`mock-data.${format}`, output, format === "json" ? "application/json" : "text/csv")}
                className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
              >
                <Download size={12} /> Download
              </button>
              <CopyButton text={output} size="sm" />
            </div>
          </div>
          <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto max-h-96 whitespace-pre-wrap break-all">
            {output}
          </pre>
        </div>
      )}

      {!rows && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Define your fields above and hit Generate
        </div>
      )}
    </ToolLayout>
  );
}
