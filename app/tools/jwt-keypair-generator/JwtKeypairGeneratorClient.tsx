"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { RefreshCw, AlertTriangle, Download } from "lucide-react";
import { generateJwtKeyPair, JWT_ALGORITHMS, type JwtAlgorithm, type JwtKeyPairResult } from "@/lib/jwt-keygen";

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function KeyBlock({ title, content, filename }: { title: string; content: string; filename: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-[#888888] font-medium">{title}</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => download(filename, content)}
            className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
          >
            <Download size={12} /> Download
          </button>
          <CopyButton text={content} size="sm" />
        </div>
      </div>
      <pre className="p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto max-h-56 whitespace-pre-wrap break-all">
        {content}
      </pre>
    </div>
  );
}

export default function JwtKeypairGeneratorClient() {
  const [algorithm, setAlgorithm] = useState<JwtAlgorithm>("RS256");
  const [modulusLength, setModulusLength] = useState(2048);
  const [result, setResult] = useState<JwtKeyPairResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const algoMeta = JWT_ALGORITHMS.find((a) => a.id === algorithm)!;

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await generateJwtKeyPair(algorithm, modulusLength);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Key generation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout title="JWT Key Pair Generator" description="Generate RSA or EC key pairs for signing JWTs with RS256, PS256, or ES256">
      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Algorithm</label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as JwtAlgorithm)}
            className="px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] min-w-[280px]"
          >
            {JWT_ALGORITHMS.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </div>
        {algoMeta.family === "RSA" && (
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Key size</label>
            <div className="flex">
              {[2048, 4096].map((size) => (
                <button
                  key={size}
                  onClick={() => setModulusLength(size)}
                  className={`px-3 py-2 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                    modulusLength === size ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {size}-bit
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={generate}
          disabled={busy}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-[6px] transition-colors"
        >
          <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> {busy ? "Generating…" : "Generate Key Pair"}
        </button>
      </div>

      {error && <p className="text-sm text-[#ef4444] mb-4">{error}</p>}

      {result && (
        <>
          <div className="flex items-start gap-2 p-3 mb-5 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px] text-xs text-[#ef4444]">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>
              The private key signs tokens on your server&apos;s behalf — treat it exactly like a password. Never commit it to a
              repository, send it to a client, or embed it in frontend code. Only the public key should ever leave your server.
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <KeyBlock title="Public Key (PEM)" content={result.publicKeyPem} filename="public.pem" />
            <KeyBlock title="Private Key (PEM)" content={result.privateKeyPem} filename="private.pem" />
            <KeyBlock title="Public Key (JWK)" content={JSON.stringify(result.publicKeyJwk, null, 2)} filename="public.jwk.json" />
            <KeyBlock title="Private Key (JWK)" content={JSON.stringify(result.privateKeyJwk, null, 2)} filename="private.jwk.json" />
          </div>
        </>
      )}

      {!result && !busy && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Choose an algorithm and click Generate Key Pair
        </div>
      )}
    </ToolLayout>
  );
}
