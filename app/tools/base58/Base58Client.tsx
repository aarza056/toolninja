"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Trash2, AlertCircle } from "lucide-react";
import { base58EncodeText, base58DecodeToText, base58Encode, base58Decode, bytesToHex, hexToBytes } from "@/lib/base58";

const STORAGE_KEY = "toolninja:base58";

type Mode = "encode" | "decode";
type Format = "text" | "hex";

export default function Base58Client() {
  const [mode, setMode] = useState<Mode>("encode");
  const [format, setFormat] = useState<Format>("text");
  const [input, setInput] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      if (mode === "encode") {
        const result = format === "text" ? base58EncodeText(input) : base58Encode(hexToBytes(input));
        return { output: result, error: "" };
      }
      const result = format === "text" ? base58DecodeToText(input.trim()) : bytesToHex(base58Decode(input.trim()));
      return { output: result, error: "" };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Conversion failed" };
    }
  }, [input, mode, format]);

  const clear = () => setInput("");

  return (
    <ToolLayout
      title="Base58 Encoder / Decoder"
      description="Encode or decode Base58 strings — the Bitcoin-style alphabet that skips visually ambiguous characters"
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
          <button
            onClick={() => setMode("encode")}
            className={`px-3 py-1.5 text-sm transition-colors ${mode === "encode" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            Encode
          </button>
          <button
            onClick={() => setMode("decode")}
            className={`px-3 py-1.5 text-sm border-l border-[#222222] transition-colors ${mode === "decode" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            Decode
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#555555]">
            {mode === "encode" ? "Input is" : "Output as"}
          </span>
          <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
            <button
              onClick={() => setFormat("text")}
              className={`px-2.5 py-1 text-xs transition-colors ${format === "text" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
            >
              Text
            </button>
            <button
              onClick={() => setFormat("hex")}
              className={`px-2.5 py-1 text-xs border-l border-[#222222] transition-colors ${format === "hex" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
            >
              Hex
            </button>
          </div>
        </div>

        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors ml-auto"
        >
          <Trash2 size={13} /> Clear
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-320px)] min-h-[350px]">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">
            {mode === "encode" ? (format === "text" ? "Text" : "Hex bytes") : "Base58 string"}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "encode" ? (format === "text" ? "Hello World!" : "48656c6c6f") : "2NEpo7TZRRrLZSi2U"}
            spellCheck={false}
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">
              {mode === "encode" ? "Base58 string" : format === "text" ? "Text" : "Hex bytes"}
            </label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Result will appear here…"
            spellCheck={false}
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
