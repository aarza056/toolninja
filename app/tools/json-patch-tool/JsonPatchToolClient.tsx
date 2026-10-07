"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { generateJsonPatch, applyJsonPatch, type PatchOp } from "@/lib/json-patch";

const STORAGE_KEY = "toolninja:json-patch-tool";

type Mode = "generate" | "apply";

const SAMPLE_A = `{
  "name": "Jane Doe",
  "role": "engineer",
  "tags": ["backend", "go"]
}`;
const SAMPLE_B = `{
  "name": "Jane Doe",
  "role": "senior engineer",
  "tags": ["backend", "go", "rust"],
  "active": true
}`;

export default function JsonPatchToolClient() {
  const [mode, setMode] = useState<Mode>("generate");
  const [docA, setDocA] = useState("");
  const [docB, setDocB] = useState("");
  const [applyDoc, setApplyDoc] = useState("");
  const [applyPatch, setApplyPatch] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setDocA(parsed.docA ?? SAMPLE_A);
        setDocB(parsed.docB ?? SAMPLE_B);
        setApplyDoc(parsed.applyDoc ?? "");
        setApplyPatch(parsed.applyPatch ?? "");
        if (parsed.mode) setMode(parsed.mode);
      } else {
        setDocA(SAMPLE_A);
        setDocB(SAMPLE_B);
      }
    } catch {
      setDocA(SAMPLE_A);
      setDocB(SAMPLE_B);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ docA, docB, applyDoc, applyPatch, mode }));
    } catch {}
  }, [docA, docB, applyDoc, applyPatch, mode]);

  const generateResult = useMemo(() => {
    if (!docA.trim() || !docB.trim()) return { patch: "", error: "" };
    try {
      const a = JSON.parse(docA);
      const b = JSON.parse(docB);
      const ops: PatchOp[] = generateJsonPatch(a, b);
      return { patch: JSON.stringify(ops, null, 2), error: "" };
    } catch (e) {
      return { patch: "", error: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [docA, docB]);

  const applyResult = useMemo(() => {
    if (!applyDoc.trim() || !applyPatch.trim()) return { output: "", error: "" };
    try {
      const doc = JSON.parse(applyDoc);
      const patch = JSON.parse(applyPatch) as PatchOp[];
      if (!Array.isArray(patch)) throw new Error("The patch must be a JSON array of operations.");
      const result = applyJsonPatch(doc, patch);
      return { output: JSON.stringify(result, null, 2), error: "" };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Failed to apply patch" };
    }
  }, [applyDoc, applyPatch]);

  const textareaClass =
    "w-full h-64 p-3 font-mono text-xs resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout title="JSON Patch (RFC 6902) Generator & Applier" description="Diff two JSON documents into an applyable patch, or apply an existing patch to a document">
      <div className="flex rounded-[6px] border border-[#222222] overflow-hidden w-fit mb-4">
        <button
          onClick={() => setMode("generate")}
          className={`px-4 py-1.5 text-sm transition-colors ${mode === "generate" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
        >
          Generate
        </button>
        <button
          onClick={() => setMode("apply")}
          className={`px-4 py-1.5 text-sm border-l border-[#222222] transition-colors ${mode === "apply" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
        >
          Apply
        </button>
      </div>

      {mode === "generate" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Original document (A)</label>
              <textarea value={docA} onChange={(e) => setDocA(e.target.value)} spellCheck={false} className={`${textareaClass} border-[#222222]`} />
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Modified document (B)</label>
              <textarea value={docB} onChange={(e) => setDocB(e.target.value)} spellCheck={false} className={`${textareaClass} border-[#222222]`} />
            </div>
          </div>

          {generateResult.error && (
            <div className="flex items-center gap-2 p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px] text-sm text-[#ef4444]">
              <AlertCircle size={14} /> {generateResult.error}
            </div>
          )}

          {generateResult.patch && !generateResult.error && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#888888] font-medium">RFC 6902 Patch (A → B)</label>
                <CopyButton text={generateResult.patch} size="sm" />
              </div>
              <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] overflow-auto max-h-[320px]">
                {generateResult.patch}
              </pre>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Document to patch</label>
              <textarea
                value={applyDoc}
                onChange={(e) => setApplyDoc(e.target.value)}
                placeholder='{"name": "Jane Doe", "role": "engineer"}'
                spellCheck={false}
                className={`${textareaClass} border-[#222222]`}
              />
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Patch (array of operations)</label>
              <textarea
                value={applyPatch}
                onChange={(e) => setApplyPatch(e.target.value)}
                placeholder='[{"op": "replace", "path": "/role", "value": "senior engineer"}]'
                spellCheck={false}
                className={`${textareaClass} border-[#222222]`}
              />
            </div>
          </div>

          {applyResult.error && (
            <div className="flex items-center gap-2 p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px] text-sm text-[#ef4444]">
              <AlertCircle size={14} /> {applyResult.error}
            </div>
          )}

          {applyResult.output && !applyResult.error && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1.5 text-xs text-[#22c55e] font-medium">
                  <CheckCircle2 size={12} /> Patch applied — resulting document
                </label>
                <CopyButton text={applyResult.output} size="sm" />
              </div>
              <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] overflow-auto max-h-[320px]">
                {applyResult.output}
              </pre>
            </div>
          )}
        </>
      )}

      <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        A JSON Patch (<a href="https://www.rfc-editor.org/rfc/rfc6902" target="_blank" rel="noopener noreferrer" className="text-[#a855f7] hover:underline">RFC 6902</a>) is
        a list of operations (<code className="text-[#e879f9]">add</code>, <code className="text-[#e879f9]">remove</code>, <code className="text-[#e879f9]">replace</code>, <code className="text-[#e879f9]">move</code>, <code className="text-[#e879f9]">copy</code>, <code className="text-[#e879f9]">test</code>)
        that transforms one JSON document into another — the standard format behind HTTP{" "}
        <code className="text-[#e879f9]">PATCH</code> requests with a <code className="text-[#e879f9]">Content-Type: application/json-patch+json</code> body.
        Array diffs here are positional, not LCS-aligned — an insertion in the middle of a long array
        may show as several replaces rather than one clean insert, though the resulting patch is
        still fully correct when applied.
      </div>
    </ToolLayout>
  );
}
