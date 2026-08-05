"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { RefreshCw, AlertTriangle, Download } from "lucide-react";
import { generateSshKeyPair, type SshKeyType, type SshKeyPairResult } from "@/lib/ssh-keygen";

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

export default function SshKeyGeneratorClient() {
  const [type, setType] = useState<SshKeyType>("ed25519");
  const [modulusLength, setModulusLength] = useState(2048);
  const [comment, setComment] = useState("");
  const [result, setResult] = useState<SshKeyPairResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await generateSshKeyPair(type, { rsaModulusLength: modulusLength, comment });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Key generation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout
      title="SSH Key Generator"
      description="Generate Ed25519 or RSA SSH key pairs in OpenSSH format — entirely in your browser"
    >
      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Key type</label>
          <div className="flex">
            {(["ed25519", "rsa"] as SshKeyType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-2 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                  type === t ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                {t === "ed25519" ? "Ed25519" : "RSA"}
              </button>
            ))}
          </div>
        </div>
        {type === "rsa" && (
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
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Comment (optional)</label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="you@hostname"
            className="px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] min-w-[200px]"
          />
        </div>
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
              The private key grants access to anything it&apos;s authorized on — treat it exactly like a password. Never commit it to a
              repository or share it. Only the public key should ever be placed in a server&apos;s authorized_keys file.
            </span>
          </div>

          <div className="mb-4 flex flex-wrap gap-4 text-xs text-[#888888]">
            <span>Format: <span className="text-[#f5f5f5] font-mono">{result.privateKeyFormat}</span></span>
            <span>Fingerprint: <span className="text-[#f5f5f5] font-mono">{result.fingerprint}</span></span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <KeyBlock title="Public Key" content={result.publicKey} filename={`id_${result.type}.pub`} />
            <KeyBlock title="Private Key" content={result.privateKey} filename={`id_${result.type}`} />
          </div>

          {result.type === "rsa" && (
            <p className="text-xs text-[#555555] mt-3">
              This private key is in PKCS8 PEM format, which OpenSSH (7.6+) reads directly. If you need the older OPENSSH PRIVATE KEY
              format for an older client, convert it locally with <code className="text-[#888888]">ssh-keygen -p -m RFC4716 -f keyfile</code>.
            </p>
          )}
        </>
      )}

      {!result && !busy && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Choose a key type and click Generate Key Pair
        </div>
      )}
    </ToolLayout>
  );
}
