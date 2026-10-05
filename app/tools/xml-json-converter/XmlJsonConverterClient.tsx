"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { xmlToJson, jsonToXml } from "@/lib/xml-json";

const STORAGE_KEY = "toolninja:xml-json-converter";

const SAMPLE_XML = `<book id="bk101">
  <title>XML Developer's Guide</title>
  <author>Gambardella, Matthew</author>
  <price>44.95</price>
</book>`;

export default function XmlJsonConverterClient() {
  const [xmlText, setXmlText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [xmlError, setXmlError] = useState("");
  const [jsonError, setJsonError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const initial = saved ?? SAMPLE_XML;
      setXmlText(initial);
      convertXmlToJson(initial);
    } catch {
      setXmlText(SAMPLE_XML);
      convertXmlToJson(SAMPLE_XML);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, xmlText); } catch {}
  }, [xmlText]);

  const convertXmlToJson = useCallback((text: string) => {
    if (!text.trim()) { setJsonText(""); setXmlError(""); return; }
    try {
      const { json, error } = xmlToJson(text);
      if (error) { setXmlError(error); return; }
      setJsonText(JSON.stringify(json, null, 2));
      setXmlError("");
    } catch (e) {
      setXmlError(e instanceof Error ? e.message : "Failed to parse XML");
    }
  }, []);

  const convertJsonToXml = useCallback((text: string) => {
    if (!text.trim()) { setXmlText(""); setJsonError(""); return; }
    try {
      const parsed = JSON.parse(text);
      setXmlText(jsonToXml(parsed));
      setJsonError("");
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }, []);

  const handleXmlChange = (text: string) => {
    setXmlText(text);
    convertXmlToJson(text);
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    convertJsonToXml(text);
  };

  const textareaClass =
    "w-full h-80 p-3 font-mono text-xs resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout title="XML ↔ JSON Converter" description="Convert between XML and JSON instantly, in either direction">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">XML</label>
            <CopyButton text={xmlText} size="sm" />
          </div>
          <textarea
            value={xmlText}
            onChange={(e) => handleXmlChange(e.target.value)}
            placeholder="<root>...</root>"
            spellCheck={false}
            className={`${textareaClass} ${xmlError ? "border-[#ef4444]" : "border-[#222222]"}`}
          />
          {xmlError && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {xmlError}
            </div>
          )}
        </div>

        <div className="hidden lg:flex flex-col items-center gap-2 pt-8 text-[#333333]">
          <ArrowRight size={18} />
          <ArrowLeft size={18} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">JSON</label>
            <CopyButton text={jsonText} size="sm" />
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='{"root": {...}}'
            spellCheck={false}
            className={`${textareaClass} ${jsonError ? "border-[#ef4444]" : "border-[#222222]"}`}
          />
          {jsonError && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {jsonError}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        Follows the common xml-js convention: attributes become <code className="text-[#e879f9]">&quot;@name&quot;</code> keys,
        text content becomes <code className="text-[#e879f9]">&quot;#text&quot;</code> (or the bare string, for an element with
        no attributes or children), and repeated child tags become an array. The JSON&apos;s top-level
        object always has exactly one key — the root element&apos;s tag name — so converting back and
        forth round-trips cleanly.
      </div>
    </ToolLayout>
  );
}
