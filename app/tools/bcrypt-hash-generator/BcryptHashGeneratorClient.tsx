"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { bcryptHash, bcryptCompare, isBcryptHash, bcryptCost } from "@/lib/bcrypt-tool";

export default function BcryptHashGeneratorClient() {
  const [password, setPassword] = useState("");
  const [rounds, setRounds] = useState(10);
  const [hash, setHash] = useState("");
  const [hashing, setHashing] = useState(false);

  const [verifyPassword, setVerifyPassword] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const generate = async () => {
    if (!password) return;
    setHashing(true);
    try {
      setHash(await bcryptHash(password, rounds));
    } finally {
      setHashing(false);
    }
  };

  const runVerify = async () => {
    setVerifyError("");
    setVerifyResult(null);
    if (!verifyPassword || !verifyHash.trim()) return;
    if (!isBcryptHash(verifyHash)) {
      setVerifyError("That doesn't look like a bcrypt hash — expected a $2a$, $2b$, or $2y$ prefixed string.");
      return;
    }
    setVerifying(true);
    try {
      setVerifyResult(await bcryptCompare(verifyPassword, verifyHash.trim()));
    } finally {
      setVerifying(false);
    }
  };

  const cost = verifyHash.trim() ? bcryptCost(verifyHash) : null;

  return (
    <ToolLayout
      title="Bcrypt Hash Generator & Verifier"
      description="Hash a password with bcrypt, or verify a password against an existing hash — entirely in your browser"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generate */}
        <div>
          <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3">Generate a hash</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="correct horse battery staple"
                spellCheck={false}
                className="w-full px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[#888888] font-medium">Cost factor (rounds): {rounds}</label>
              </div>
              <input
                type="range"
                min={4}
                max={14}
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="w-full accent-[#a855f7]"
              />
              <p className="text-[10px] text-[#555555] mt-1">
                Each +1 doubles the work. 10–12 is the common production default; higher values take noticeably longer to hash.
              </p>
            </div>
            <button
              onClick={generate}
              disabled={!password || hashing}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-[6px] transition-colors"
            >
              {hashing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              {hashing ? "Hashing…" : "Generate Hash"}
            </button>

            {hash && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[#888888] font-medium">Bcrypt hash</label>
                  <CopyButton text={hash} size="sm" />
                </div>
                <code className="block p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#22c55e] break-all">
                  {hash}
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Verify */}
        <div>
          <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3">Verify a password against a hash</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Password to check</label>
              <input
                type="text"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                placeholder="correct horse battery staple"
                spellCheck={false}
                className="w-full px-3 py-2 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
            </div>
            <div>
              <label className="text-xs text-[#888888] font-medium block mb-1">Bcrypt hash</label>
              <input
                type="text"
                value={verifyHash}
                onChange={(e) => setVerifyHash(e.target.value)}
                placeholder="$2b$10$N9qo8uLOickgx2ZMRZoMy..."
                spellCheck={false}
                className="w-full px-3 py-2 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
              />
              {cost !== null && <p className="text-[10px] text-[#555555] mt-1">Cost factor: {cost}</p>}
            </div>
            <button
              onClick={runVerify}
              disabled={!verifyPassword || !verifyHash.trim() || verifying}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#1a1a1a] hover:bg-[#222222] disabled:opacity-50 text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
            >
              {verifying ? <Loader2 size={14} className="animate-spin" /> : null}
              {verifying ? "Checking…" : "Verify"}
            </button>

            {verifyError && (
              <div className="flex items-center gap-1.5 text-xs text-[#ef4444]">
                <AlertCircle size={12} /> {verifyError}
              </div>
            )}

            {verifyResult !== null && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm ${
                  verifyResult ? "bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]" : "bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]"
                }`}
              >
                {verifyResult ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {verifyResult ? "Password matches the hash" : "Password does not match the hash"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        Bcrypt automatically generates and embeds a random salt in every hash — that&apos;s why hashing the same password twice
        produces a different result each time, and why verification works by re-deriving the hash with the embedded salt, not by
        comparing a stored salt separately. Everything here runs locally via a pure-JavaScript bcrypt implementation; nothing you
        type is ever sent anywhere.
      </div>
    </ToolLayout>
  );
}
