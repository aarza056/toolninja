"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, ShieldAlert, Copy, Check } from "lucide-react";
import { confirmTwoFactor, disableTwoFactorAction, newBackupCodes, startTwoFactor } from "@/app/admin/actions";

const input = "px-3 py-2 text-sm font-mono tracking-widest bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]/60";
const btn = "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40";

function BackupCodes({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 p-4 bg-[#0a0a0a] border border-[#f59e0b]/30 rounded-xl">
      <p className="text-sm font-semibold text-[#fbbf24] mb-1">Save your backup codes now</p>
      <p className="text-xs text-[#999999] mb-3">Each works once if you lose your phone. They won&apos;t be shown again — store them in a password manager.</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-sm text-[#f5f5f5]">
        {codes.map((c) => (
          <span key={c} className="px-2 py-1 bg-[#151515] rounded text-center">
            {c}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(codes.join("\n")).then(() => setCopied(true));
        }}
        className={`${btn} mt-3 flex items-center gap-1.5 text-[#dddddd] border-[#2e2e2e] bg-[#1a1a1a] hover:border-[#444]`}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy all"}
      </button>
    </div>
  );
}

export default function TwoFactorPanel({ enabled, backupsLeft, resetOverride }: { enabled: boolean; backupsLeft: number; resetOverride: boolean }) {
  const [pending, start] = useTransition();
  const [setup, setSetup] = useState<{ secret: string; qrSvg: string } | null>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"idle" | "disable" | "regen">("idle");

  if (codes)
    return (
      <div>
        <p className="flex items-center gap-2 text-sm text-[#4ade80]">
          <ShieldCheck size={16} /> Two-step sign-in is on.
        </p>
        <BackupCodes codes={codes} />
      </div>
    );

  if (!enabled) {
    return (
      <div className="space-y-4">
        {resetOverride && <p className="text-xs text-[#f87171]">ADMIN_2FA_RESET=true is set in the environment — remove it after setting up again.</p>}
        <p className="flex items-center gap-2 text-sm text-[#fbbf24]">
          <ShieldAlert size={16} /> Off — sign-in only needs your password.
        </p>
        {!setup ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => setSetup(await startTwoFactor()))}
            className={`${btn} text-white bg-[#a855f7] border-[#a855f7] hover:bg-[#9333ea]`}
          >
            Enable two-step sign-in
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="shrink-0 w-44 h-44 p-2 bg-white rounded-xl [&_svg]:w-full [&_svg]:h-full" dangerouslySetInnerHTML={{ __html: setup.qrSvg }} />
            <div className="space-y-3 text-sm text-[#cccccc]">
              <p>1. Scan this with Google Authenticator, Microsoft Authenticator, Authy or 1Password.</p>
              <p className="text-xs text-[#888888]">
                Can&apos;t scan? Enter this key manually: <code className="font-mono text-[#e9d5ff] break-all">{setup.secret.replace(/(.{4})/g, "$1 ").trim()}</code>
              </p>
              <p>2. Enter the 6-digit code it shows:</p>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setError("");
                  start(async () => {
                    const r = await confirmTwoFactor(code);
                    if (r.ok && r.codes) setCodes(r.codes);
                    else setError("That code didn't match — check your phone's clock and try the next code.");
                  });
                }}
              >
                <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="123456" className={`${input} w-32`} autoFocus />
                <button disabled={pending || code.length !== 6} className={`${btn} text-white bg-[#a855f7] border-[#a855f7] hover:bg-[#9333ea]`}>
                  Confirm & enable
                </button>
              </form>
              {error && <p className="text-xs text-[#f87171]">{error}</p>}
              <p className="text-xs text-[#666666]">The setup expires in 10 minutes.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sm text-[#4ade80]">
        <ShieldCheck size={16} /> On — sign-in asks for a code from your authenticator app.
        <span className={`text-xs ${backupsLeft <= 2 ? "text-[#fbbf24]" : "text-[#888888]"}`}>{backupsLeft} backup codes left</span>
      </p>
      {mode === "idle" ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMode("regen")} className={`${btn} text-[#dddddd] border-[#2e2e2e] bg-[#1a1a1a] hover:border-[#444]`}>
            New backup codes
          </button>
          <button type="button" onClick={() => setMode("disable")} className={`${btn} text-[#f87171] border-[#ef4444]/30 bg-[#ef4444]/10 hover:bg-[#ef4444]/20`}>
            Turn off
          </button>
        </div>
      ) : (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            start(async () => {
              if (mode === "disable") {
                const r = await disableTwoFactorAction(code);
                if (!r.ok) setError("That code didn't work.");
              } else {
                const r = await newBackupCodes(code);
                if (r.ok && r.codes) setCodes(r.codes);
                else setError("That code didn't work.");
              }
            });
          }}
        >
          <span className="text-xs text-[#aaaaaa]">{mode === "disable" ? "Confirm with a current code to turn it off:" : "Confirm with a current code:"}</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={16} placeholder="123456" className={`${input} w-36`} autoFocus />
          <button disabled={pending || code.length < 6} className={`${btn} ${mode === "disable" ? "text-[#f87171] border-[#ef4444]/30 bg-[#ef4444]/10" : "text-white bg-[#a855f7] border-[#a855f7]"}`}>
            {mode === "disable" ? "Turn off" : "Generate"}
          </button>
          <button type="button" onClick={() => (setMode("idle"), setError(""))} className="text-xs text-[#888888] hover:text-[#f5f5f5]">
            Cancel
          </button>
          {error && <p className="w-full text-xs text-[#f87171]">{error}</p>}
        </form>
      )}
    </div>
  );
}
