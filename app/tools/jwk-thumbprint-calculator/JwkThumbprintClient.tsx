"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, Dices } from "lucide-react";
import { computeJwkThumbprint, type ThumbprintHash } from "@/lib/jwk-thumbprint";

const STORAGE_KEY = "toolninja:jwk-thumbprint-calculator";
const HASHES: ThumbprintHash[] = ["SHA-256", "SHA-384", "SHA-512"];

const SAMPLE_RSA_JWK = JSON.stringify(
  {
    kty: "RSA",
    n: "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
    e: "AQAB",
  },
  null,
  2
);

export default function JwkThumbprintClient() {
  const [input, setInput] = useState("");
  const [hash, setHash] = useState<ThumbprintHash>("SHA-256");
  const [canonical, setCanonical] = useState("");
  const [thumbprint, setThumbprint] = useState("");
  const [hex, setHex] = useState("");
  const [error, setError] = useState("");

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

  const compute = useCallback(async () => {
    setError("");
    setCanonical("");
    setThumbprint("");
    setHex("");
    if (!input.trim()) return;

    let jwk: JsonWebKey;
    try {
      jwk = JSON.parse(input);
    } catch {
      setError("Invalid JSON.");
      return;
    }

    try {
      const result = await computeJwkThumbprint(jwk, hash);
      setCanonical(result.canonical);
      setThumbprint(result.thumbprint);
      setHex(result.hex);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't compute a thumbprint for this JWK.");
    }
  }, [input, hash]);

  useEffect(() => {
    compute();
  }, [compute]);

  const loadSample = () => setInput(SAMPLE_RSA_JWK);

  return (
    <ToolLayout
      title="JWK Thumbprint Calculator"
      description="Compute an RFC 7638 thumbprint for a JSON Web Key — the canonical fingerprint used as a stable kid value"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">JWK (JSON)</label>
            <button
              onClick={loadSample}
              className="flex items-center gap-1 text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors"
            >
              <Dices size={11} /> Load sample RSA key
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'{"kty":"RSA","n":"...","e":"AQAB"}'}
            spellCheck={false}
            className="w-full h-72 p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444]">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1.5">Hash algorithm</label>
            <div className="flex">
              {HASHES.map((h) => (
                <button
                  key={h}
                  onClick={() => setHash(h)}
                  className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                    hash === h ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#888888] font-medium">Thumbprint (base64url)</label>
              {thumbprint && <CopyButton text={thumbprint} size="sm" />}
            </div>
            <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] min-h-[48px] flex items-center">
              {thumbprint ? (
                <code className="text-sm font-mono text-[#f5f5f5] break-all">{thumbprint}</code>
              ) : (
                <span className="text-sm text-[#444444]">Paste a JWK to compute its thumbprint</span>
              )}
            </div>
          </div>

          {hex && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#888888] font-medium">Thumbprint (hex)</label>
                <CopyButton text={hex} size="sm" />
              </div>
              <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                <code className="text-sm font-mono text-[#f5f5f5] break-all">{hex}</code>
              </div>
            </div>
          )}

          {canonical && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#888888] font-medium">Canonical JSON that was hashed</label>
              <div className="p-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-[8px]">
                <code className="text-xs font-mono text-[#888888] break-all">{canonical}</code>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        Per <a href="https://www.rfc-editor.org/rfc/rfc7638" target="_blank" rel="noopener noreferrer" className="text-[#a855f7] hover:underline">RFC 7638</a>, the thumbprint hashes only the <em>required</em> members for the key type —
        for RSA that&apos;s exactly <code className="text-[#e879f9]">e</code>, <code className="text-[#e879f9]">kty</code>, and <code className="text-[#e879f9]">n</code>, in that
        lexicographic order, with no whitespace. That makes the thumbprint stable regardless of what optional
        fields (<code className="text-[#e879f9]">kid</code>, <code className="text-[#e879f9]">use</code>, <code className="text-[#e879f9]">alg</code>) the
        same key happens to carry — which is exactly why it&apos;s commonly used <em>as</em> the <code className="text-[#e879f9]">kid</code>.
      </div>
    </ToolLayout>
  );
}
