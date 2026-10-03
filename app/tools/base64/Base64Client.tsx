"use client";

import { useState, useEffect, useRef } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Lock, Unlock, Trash2, AlertCircle, Upload, FileIcon, Download } from "lucide-react";

const STORAGE_KEY = "toolninja:base64";

type Variant = "standard" | "urlsafe";
type Mode = "text" | "file";

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(b64: string): string {
  const clean = b64.replace(/-/g, "+").replace(/_/g, "/");
  return clean + "=".repeat((4 - (clean.length % 4)) % 4);
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Base64Client() {
  const [mode, setMode] = useState<Mode>("text");
  const [variant, setVariant] = useState<Variant>("standard");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileResult, setFileResult] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    try {
      const standard = btoa(unescape(encodeURIComponent(input)));
      setOutput(variant === "urlsafe" ? toUrlSafe(standard) : standard);
    } catch {
      setError("Failed to encode. Check your input.");
    }
  };

  const decode = () => {
    setError("");
    try {
      const normalized = variant === "urlsafe" ? fromUrlSafe(input.trim()) : input.trim();
      setOutput(decodeURIComponent(escape(atob(normalized))));
    } catch {
      setError("Invalid Base64 string.");
    }
  };

  const clear = () => { setInput(""); setOutput(""); setError(""); setFile(null); setFileResult(""); };

  const handleFile = (f: File) => {
    setFile(f);
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const standard = dataUrl.slice(dataUrl.indexOf(",") + 1);
      setFileResult(variant === "urlsafe" ? toUrlSafe(standard) : standard);
    };
    reader.onerror = () => setError("Failed to read this file.");
    reader.readAsDataURL(f);
  };

  const downloadDecodedFile = () => {
    try {
      const normalized = variant === "urlsafe" ? fromUrlSafe(input.trim()) : input.trim();
      const binary = atob(normalized);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes]);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "decoded-file";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setError("Invalid Base64 string — can't decode to a file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <ToolLayout title="Base64 Encoder / Decoder" description="Encode or decode Base64 strings, or convert a file to and from Base64 — instantly, in your browser">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
          <button
            onClick={() => setMode("text")}
            className={`px-3 py-1.5 text-sm transition-colors ${mode === "text" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            Text
          </button>
          <button
            onClick={() => setMode("file")}
            className={`px-3 py-1.5 text-sm border-l border-[#222222] transition-colors ${mode === "file" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            File
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#555555]">Alphabet</span>
          <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
            <button
              onClick={() => setVariant("standard")}
              className={`px-2.5 py-1 text-xs transition-colors ${variant === "standard" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
            >
              Standard
            </button>
            <button
              onClick={() => setVariant("urlsafe")}
              className={`px-2.5 py-1 text-xs border-l border-[#222222] transition-colors ${variant === "urlsafe" ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}
            >
              URL-safe
            </button>
          </div>
        </div>

        {mode === "text" && (
          <>
            <button onClick={encode} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors">
              <Lock size={14} /> Encode
            </button>
            <button onClick={decode} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors">
              <Unlock size={14} /> Decode
            </button>
          </>
        )}
        <button onClick={clear} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors">
          <Trash2 size={14} /> Clear
        </button>
        {mode === "text" && output && <CopyButton text={output} />}
      </div>

      {mode === "file" ? (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-[8px] cursor-pointer transition-colors ${
              dragOver ? "border-[#a855f7] bg-[#a855f7]/5" : "border-[#222222] hover:border-[#333333]"
            }`}
          >
            {file ? (
              <>
                <FileIcon size={28} strokeWidth={1} className="text-[#a855f7]" />
                <p className="text-sm text-[#f5f5f5]">{file.name}</p>
                <p className="text-xs text-[#555555]">{formatBytes(file.size)} — click or drop to replace</p>
              </>
            ) : (
              <>
                <Upload size={28} strokeWidth={1} className="text-[#444444]" />
                <p className="text-sm text-[#888888]">Drag & drop a file, or click to upload</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>

          {fileResult && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#888888] font-medium">Base64 output</label>
                <CopyButton text={fileResult} size="sm" />
              </div>
              <textarea
                value={fileResult}
                readOnly
                spellCheck={false}
                className="w-full h-32 p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none"
              />
            </div>
          )}

          <div className="pt-2 border-t border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[#888888] font-medium">Or paste Base64 to decode into a downloadable file</label>
              {input.trim() && (
                <button onClick={downloadDecodedFile} className="flex items-center gap-1 text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors">
                  <Download size={12} /> Download as file
                </button>
              )}
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a Base64 string to decode and download..."
              spellCheck={false}
              className="w-full h-24 p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444]">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          <p className="text-xs text-[#555555]">The file never leaves your browser — conversion runs entirely client-side.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-280px)] min-h-[400px]">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#888888] font-medium">Input</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text or Base64 string..."
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
              className="flex-1 w-full p-3 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              spellCheck={false}
            />
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
                <AlertCircle size={12} /> {error}
              </div>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
