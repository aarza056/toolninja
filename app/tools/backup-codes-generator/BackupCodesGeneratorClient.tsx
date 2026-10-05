"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { RefreshCw, Download, ShieldAlert, Hash } from "lucide-react";
import { generateBackupCodes, sha256Hex } from "@/lib/backup-codes";

const COUNT_OPTIONS = [8, 10, 16];

export default function BackupCodesGeneratorClient() {
  const [count, setCount] = useState(10);
  const [codes, setCodes] = useState<string[]>([]);
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [showHashes, setShowHashes] = useState(false);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    const newCodes = generateBackupCodes(count);
    setCodes(newCodes);
    const entries = await Promise.all(newCodes.map(async (c) => [c, await sha256Hex(c)] as const));
    setHashes(Object.fromEntries(entries));
    setBusy(false);
  };

  const downloadTxt = () => {
    const blob = new Blob([codes.join("\n") + "\n"], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "backup-codes.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <ToolLayout
      title="2FA Backup Codes Generator"
      description="Generate one-time recovery codes for account 2FA setup — plus their SHA-256 hashes, ready to store server-side"
    >
      <div className="flex items-start gap-2 p-3 mb-6 bg-[#a855f7]/5 border border-[#a855f7]/20 rounded-[8px] text-xs text-[#888888]">
        <ShieldAlert size={14} className="shrink-0 mt-0.5 text-[#a855f7]" />
        <span>
          Backup codes are a 2FA recovery mechanism — one-time-use codes a user can redeem if they
          lose their authenticator. Store only a <strong className="text-[#f5f5f5]">hash</strong> of
          each code server-side (never the plaintext), the same way you&apos;d store a password, and
          mark each one used after redemption so it can&apos;t be replayed.
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">How many codes</label>
          <div className="flex">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                  count === n ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={generate}
          disabled={busy}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-[6px] transition-colors"
        >
          <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Generate codes
        </button>
        {codes.length > 0 && (
          <>
            <button
              onClick={downloadTxt}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
            >
              <Download size={13} /> Download .txt
            </button>
            <CopyButton text={codes.join("\n")} label="Copy all" />
            <button
              onClick={() => setShowHashes((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors"
            >
              <Hash size={13} /> {showHashes ? "Hide" : "Show"} SHA-256 hashes
            </button>
          </>
        )}
      </div>

      {codes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {codes.map((code) => (
            <div key={code} className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono text-[#f5f5f5]">{code}</code>
                <CopyButton text={code} size="sm" />
              </div>
              {showHashes && (
                <p className="text-[10px] font-mono text-[#555555] mt-1.5 break-all">{hashes[code]}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Click Generate to create a set of one-time backup codes
        </div>
      )}

      <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        Codes use a 32-character alphabet that excludes <code className="text-[#e879f9]">0</code>/
        <code className="text-[#e879f9]">O</code> and <code className="text-[#e879f9]">1</code>/
        <code className="text-[#e879f9]">I</code> — characters people commonly mistype when copying
        a code by hand. Everything is generated with <code className="text-[#e879f9]">crypto.getRandomValues</code>{" "}
        and never leaves your browser.
      </div>
    </ToolLayout>
  );
}
