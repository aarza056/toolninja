"use client";

import { useState, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Hash, Trash2, AlertCircle } from "lucide-react";

const STORAGE_KEY = "toolninja:hash-generator";

type Algorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
type OutputFormat = "hex" | "base64";
type CaseFormat = "lower" | "upper";

const ALGORITHMS: Algorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

const BIT_LENGTHS: Record<Algorithm, number> = {
  "SHA-1": 160,
  "SHA-256": 256,
  "SHA-384": 384,
  "SHA-512": 512,
};

function bufferToHex(buffer: ArrayBuffer, upper: boolean): string {
  const hex = Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return upper ? hex.toUpperCase() : hex;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default function HashGeneratorClient() {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("SHA-256");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("hex");
  const [caseFormat, setCaseFormat] = useState<CaseFormat>("lower");
  const [hash, setHash] = useState("");
  const [error, setError] = useState("");
  const [computing, setComputing] = useState(false);

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

  useEffect(() => {
    if (!input) {
      setHash("");
      setError("");
      return;
    }

    async function computeHash() {
      setError("");
      setComputing(true);
      try {
        if (typeof window === "undefined" || !window.crypto?.subtle) {
          setError("Web Crypto API is not available in this browser.");
          setHash("");
          return;
        }
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await window.crypto.subtle.digest(algorithm, data);
        if (outputFormat === "hex") {
          setHash(bufferToHex(hashBuffer, caseFormat === "upper"));
        } else {
          setHash(bufferToBase64(hashBuffer));
        }
      } catch {
        setError("Failed to compute hash. Please try again.");
        setHash("");
      } finally {
        setComputing(false);
      }
    }

    computeHash();
  }, [input, algorithm, outputFormat, caseFormat]);

  const clear = () => {
    setInput("");
    setHash("");
    setError("");
  };

  return (
    <ToolLayout title="Hash Generator" description="Generate cryptographic hashes using SHA-1, SHA-256, SHA-384, and SHA-512">
      <div className="max-w-2xl space-y-5">
        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Algorithm tabs */}
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1.5">Algorithm</label>
            <div className="flex">
              {ALGORITHMS.map((alg) => (
                <button
                  key={alg}
                  onClick={() => setAlgorithm(alg)}
                  className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                    algorithm === alg
                      ? "bg-[#a855f7] border-[#a855f7] text-white"
                      : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {alg}
                </button>
              ))}
            </div>
          </div>

          {/* Output format */}
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1.5">Format</label>
            <div className="flex">
              {(["hex", "base64"] as OutputFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                    outputFormat === fmt
                      ? "bg-[#a855f7] border-[#a855f7] text-white"
                      : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {fmt === "hex" ? "Hex" : "Base64"}
                </button>
              ))}
            </div>
          </div>

          {/* Case toggle — only relevant for hex */}
          {outputFormat === "hex" && (
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1.5">Case</label>
              <div className="flex">
                {(["lower", "upper"] as CaseFormat[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCaseFormat(c)}
                    className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                      caseFormat === c
                        ? "bg-[#a855f7] border-[#a855f7] text-white"
                        : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                    }`}
                  >
                    {c === "lower" ? "Lowercase" : "Uppercase"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear button */}
          <div className="flex items-end pb-0">
            <button
              onClick={clear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors mt-[22px]"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        {/* Input textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#888888] font-medium">Input Text</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash..."
            rows={6}
            spellCheck={false}
            className="w-full p-3 font-mono text-sm resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#444444]"
          />
        </div>

        {/* Hash output */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#888888] font-medium">Hash Output</label>
              {hash && !error && (
                <span className="px-1.5 py-0.5 text-xs font-mono bg-[#a855f7]/15 text-[#a855f7] border border-[#a855f7]/30 rounded-[4px]">
                  {BIT_LENGTHS[algorithm]}-bit
                </span>
              )}
              {computing && (
                <span className="text-xs text-[#888888]">Computing...</span>
              )}
            </div>
            {hash && !error && <CopyButton text={hash} size="sm" />}
          </div>

          {error ? (
            <div className="flex items-center gap-2 p-3 bg-[#111111] border border-[#ef4444] rounded-[8px]">
              <AlertCircle size={14} className="text-[#ef4444] shrink-0" />
              <span className="text-sm text-[#ef4444]">{error}</span>
            </div>
          ) : (
            <div className={`p-3 bg-[#111111] border rounded-[8px] min-h-[52px] flex items-center ${hash ? "border-[#222222]" : "border-dashed border-[#222222]"}`}>
              {hash ? (
                <code className="text-sm font-mono text-[#f5f5f5] break-all">{hash}</code>
              ) : (
                <div className="flex items-center gap-2 text-[#444444]">
                  <Hash size={14} />
                  <span className="text-sm">Hash will appear here as you type</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
