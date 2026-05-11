"use client";

import { useState, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Link2, Unlink2, Trash2, AlertCircle } from "lucide-react";

const STORAGE_KEY = "toolninja:url-encoder";

export default function UrlEncoderClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, input); } catch {}
  }, [input]);

  const encode = () => {
    setError("");
    try { setOutput(encodeURIComponent(input)); }
    catch { setError("Failed to encode."); }
  };

  const decode = () => {
    setError("");
    try { setOutput(decodeURIComponent(input)); }
    catch { setError("Invalid URL-encoded string."); }
  };

  const clear = () => { setInput(""); setOutput(""); setError(""); };

  return (
    <ToolLayout title="URL Encoder / Decoder" description="Encode and decode URLs and query parameters">
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={encode} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors">
          <Link2 size={14} /> Encode
        </button>
        <button onClick={decode} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors">
          <Unlink2 size={14} /> Decode
        </button>
        <button onClick={clear} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors">
          <Trash2 size={14} /> Clear
        </button>
        {output && <CopyButton text={output} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-280px)] min-h-[400px]">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter URL or encoded string..."
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#888888] font-medium">Output</label>
          <textarea
            value={output}
            readOnly
            placeholder="Result will appear here..."
            className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none"
            spellCheck={false}
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
