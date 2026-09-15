"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { pemToJwk, jwkToPem, detectKeyClass } from "@/lib/jwk-pem";
import { AlertCircle, ArrowRight } from "lucide-react";

const STORAGE_KEY = "toolninja:jwk-pem-converter";

type Direction = "jwk-to-pem" | "pem-to-jwk";

function detectDirection(input: string): Direction | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("-----BEGIN")) return "pem-to-jwk";
  if (trimmed.startsWith("{")) return "jwk-to-pem";
  return null;
}

export default function JwkPemConverterClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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

  const direction = detectDirection(input);
  const keyClass = detectKeyClass(input);

  const convert = useCallback(async () => {
    setError("");
    setOutput("");
    if (!direction) return;
    if (!keyClass) {
      setError("Couldn't tell if this is a public or private key. A PEM needs a BEGIN header; a JWK needs a 'kty' field.");
      return;
    }
    setBusy(true);
    try {
      if (direction === "pem-to-jwk") {
        const jwk = await pemToJwk(input.trim(), keyClass);
        setOutput(JSON.stringify(jwk, null, 2));
      } else {
        const jwk = JSON.parse(input.trim());
        const pem = await jwkToPem(jwk, keyClass);
        setOutput(pem);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed — check the key is valid and complete.");
    } finally {
      setBusy(false);
    }
  }, [input, direction, keyClass]);

  useEffect(() => {
    if (direction) convert();
    else { setOutput(""); setError(""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const textareaClass =
    "w-full h-80 p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

  return (
    <ToolLayout
      title="JWK ↔ PEM Converter"
      description="Convert cryptographic keys between JWK and PEM formats — entirely in your browser"
    >
      <div className="flex items-center gap-3 mb-3 text-xs">
        <span className="px-2 py-1 bg-[#1a1a1a] border border-[#222222] rounded-[6px] text-[#888888]">
          Paste either format — direction is auto-detected
        </span>
        {direction && (
          <span className="flex items-center gap-1.5 text-[#a855f7]">
            {direction === "pem-to-jwk" ? "PEM" : "JWK"} <ArrowRight size={11} /> {direction === "pem-to-jwk" ? "JWK" : "PEM"}
            {keyClass && <span className="text-[#555555]">({keyClass} key)</span>}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n\nor\n\n{"kty":"RSA","n":"...","e":"AQAB"}'}
            spellCheck={false}
            className={textareaClass}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">Output</label>
            <CopyButton text={output} size="sm" />
          </div>
          <pre className={`${textareaClass} overflow-auto whitespace-pre-wrap`}>
            {busy ? "Converting…" : output}
          </pre>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-1.5 text-xs text-[#ef4444] mt-3">
          <AlertCircle size={13} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="mt-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        Supports RSA and EC (P-256 / P-384 / P-521) keys, public and private. The key class
        (public vs. private) is detected from the PEM header or the presence of a JWK{" "}
        <code className="text-[#e879f9]">d</code> field. Nothing you paste here ever leaves your
        browser.
      </div>
    </ToolLayout>
  );
}
