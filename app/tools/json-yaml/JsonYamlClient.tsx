"use client";

import { useState, useEffect, useCallback } from "react";
import yaml from "js-yaml";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";

const STORAGE_KEY = "toolninja:json-yaml";

function isLikelyYaml(text: string): boolean {
  const trimmed = text.trimStart();
  // JSON starts with { or [ or a primitive quote/digit/t/f/n
  if (/^[{[\"]/.test(trimmed)) return false;
  if (/^-?[0-9]/.test(trimmed)) return false;
  if (/^(true|false|null)\s*$/.test(trimmed)) return false;
  // YAML typically has lines with colon-space or leading dashes
  return /:\s|^-\s/m.test(text);
}

export default function JsonYamlClient() {
  const [jsonText, setJsonText] = useState("");
  const [yamlText, setYamlText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [yamlError, setYamlError] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setJsonText(saved);
        convertJsonToYaml(saved);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist JSON content
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, jsonText);
    } catch {}
  }, [jsonText]);

  const convertJsonToYaml = useCallback((text: string) => {
    if (!text.trim()) {
      setYamlText("");
      setJsonError("");
      return;
    }
    try {
      const parsed = JSON.parse(text);
      setYamlText(yaml.dump(parsed, { indent: 2, lineWidth: -1 }));
      setJsonError("");
    } catch (e: unknown) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }, []);

  const convertYamlToJson = useCallback((text: string) => {
    if (!text.trim()) {
      setJsonText("");
      setYamlError("");
      return;
    }
    try {
      const parsed = yaml.load(text);
      setJsonText(JSON.stringify(parsed, null, 2));
      setYamlError("");
    } catch (e: unknown) {
      setYamlError(e instanceof Error ? e.message : "Invalid YAML");
    }
  }, []);

  // Auto-detect format on paste into JSON panel
  const handleJsonPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    if (isLikelyYaml(text)) {
      e.preventDefault();
      setYamlText(text);
      setYamlError("");
      convertYamlToJson(text);
    } else {
      // Let the default paste happen, then convert
      setTimeout(() => {
        convertJsonToYaml(text);
      }, 0);
    }
  };

  // Auto-detect format on paste into YAML panel
  const handleYamlPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    if (!isLikelyYaml(text)) {
      // Pasted JSON into YAML panel — convert it
      e.preventDefault();
      try {
        const parsed = JSON.parse(text);
        const converted = yaml.dump(parsed, { indent: 2, lineWidth: -1 });
        setYamlText(converted);
        setJsonText(JSON.stringify(parsed, null, 2));
        setJsonError("");
        setYamlError("");
      } catch (err: unknown) {
        setYamlError(err instanceof Error ? err.message : "Invalid JSON");
      }
    } else {
      setTimeout(() => {
        convertYamlToJson(text);
      }, 0);
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    setJsonError("");
    setYamlError("");
  };

  const handleYamlChange = (value: string) => {
    setYamlText(value);
    setJsonError("");
    setYamlError("");
  };

  const clear = () => {
    setJsonText("");
    setYamlText("");
    setJsonError("");
    setYamlError("");
  };

  return (
    <ToolLayout
      title="JSON ↔ YAML Converter"
      description="Convert between JSON and YAML instantly — paste either format"
    >
      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => convertJsonToYaml(jsonText)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
        >
          JSON <ArrowRight size={14} /> YAML
        </button>
        <button
          onClick={() => convertYamlToJson(yamlText)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
        >
          <ArrowLeft size={14} /> YAML → JSON
        </button>
        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors"
        >
          <Trash2 size={14} />
          Clear
        </button>
      </div>

      {/* Side-by-side panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-280px)] min-h-[440px]">
        {/* JSON panel */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">JSON</label>
            {jsonText && <CopyButton text={jsonText} size="sm" />}
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            onPaste={handleJsonPaste}
            placeholder={'{\n  "name": "Alice",\n  "age": 30\n}'}
            className={`flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${
              jsonError ? "border-[#ef4444]" : "border-[#222222]"
            }`}
            spellCheck={false}
          />
          {jsonError && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} />
              {jsonError}
            </div>
          )}
        </div>

        {/* YAML panel */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">YAML</label>
            {yamlText && <CopyButton text={yamlText} size="sm" />}
          </div>
          <textarea
            value={yamlText}
            onChange={(e) => handleYamlChange(e.target.value)}
            onPaste={handleYamlPaste}
            placeholder={"name: Alice\nage: 30"}
            className={`flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${
              yamlError ? "border-[#ef4444]" : "border-[#222222]"
            }`}
            spellCheck={false}
          />
          {yamlError && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} />
              {yamlError}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
