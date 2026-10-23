"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Fingerprint, AlertTriangle, CheckCircle2, XCircle, ShieldCheck, ShieldX } from "lucide-react";
import {
  isWebAuthnSupported,
  buildCreateOptions,
  buildGetOptions,
  summarizeCreatedCredential,
  summarizeAssertion,
  type CreateCredentialSummary,
  type GetCredentialSummary,
} from "@/lib/webauthn";

function FlagRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#1a1a1a] last:border-0">
      <span className="text-xs text-[#888888]">{label}</span>
      {value ? (
        <span className="flex items-center gap-1 text-xs text-[#22c55e]"><CheckCircle2 size={12} /> true</span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-[#555555]"><XCircle size={12} /> false</span>
      )}
    </div>
  );
}

export default function PasskeyTesterClient() {
  const [userName, setUserName] = useState("test@toolninja.io");
  const [busy, setBusy] = useState<"create" | "get" | null>(null);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreateCredentialSummary | null>(null);
  const [assertion, setAssertion] = useState<GetCredentialSummary | null>(null);

  const supported = typeof window !== "undefined" && isWebAuthnSupported();
  const secureContext = typeof window !== "undefined" && window.isSecureContext;

  const handleCreate = async () => {
    setBusy("create");
    setError("");
    setAssertion(null);
    try {
      const options = buildCreateOptions("ToolNinja Passkey Playground", userName || "test@toolninja.io");
      const cred = (await navigator.credentials.create({ publicKey: options })) as PublicKeyCredential;
      setCreated(summarizeCreatedCredential(cred));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Passkey creation failed or was cancelled.");
    } finally {
      setBusy(null);
    }
  };

  const handleGet = async () => {
    setBusy("get");
    setError("");
    try {
      const options = buildGetOptions(created ? [created.id] : []);
      const cred = (await navigator.credentials.get({ publicKey: options })) as PublicKeyCredential;
      setAssertion(summarizeAssertion(cred));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed or was cancelled.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <ToolLayout
      title="Passkey / WebAuthn Playground"
      description="Create a real passkey and run an authentication ceremony — entirely client-side, no relying-party server involved"
    >
      {!secureContext && (
        <div className="flex items-start gap-2 p-3 mb-5 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px] text-xs text-[#ef4444]">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>WebAuthn requires a secure context (HTTPS or localhost). This page isn&apos;t running in one right now.</span>
        </div>
      )}

      {secureContext && !supported && (
        <div className="flex items-start gap-2 p-3 mb-5 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px] text-xs text-[#ef4444]">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>This browser doesn&apos;t support the WebAuthn API (navigator.credentials / PublicKeyCredential).</span>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 mb-5 bg-[#a855f7]/5 border border-[#a855f7]/20 rounded-[8px] text-xs text-[#888888]">
        <ShieldCheck size={14} className="shrink-0 mt-0.5 text-[#a855f7]" />
        <span>
          There&apos;s no backend here — this page calls <code className="text-[#e879f9]">navigator.credentials.create()</code> /{" "}
          <code className="text-[#e879f9]">get()</code> directly against your device&apos;s authenticator (Touch ID, Windows Hello,
          a security key, or your phone) and decodes exactly what comes back. It&apos;s a sandbox for seeing the real
          WebAuthn ceremony and response shape — not a substitute for testing against your actual relying-party server.
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1">Account name (for display only)</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="test@toolninja.io"
            className="px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] min-w-[220px]"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={!supported || !secureContext || busy !== null}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-[6px] transition-colors"
        >
          <Fingerprint size={14} className={busy === "create" ? "animate-pulse" : ""} />
          {busy === "create" ? "Waiting for authenticator…" : "1. Create a passkey"}
        </button>
        <button
          onClick={handleGet}
          disabled={!supported || !secureContext || busy !== null}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#1a1a1a] hover:bg-[#222222] disabled:opacity-50 text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
        >
          <Fingerprint size={14} className={busy === "get" ? "animate-pulse" : ""} />
          {busy === "get" ? "Waiting for authenticator…" : "2. Authenticate with it"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 mb-5 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px]">
          <ShieldX size={14} className="text-[#ef4444] shrink-0" />
          <span className="text-sm text-[#ef4444]">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {created && (
          <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#f5f5f5]">Credential created</h3>
              <CopyButton text={JSON.stringify(created, null, 2)} size="sm" />
            </div>
            <div className="space-y-0.5 mb-3">
              <FlagRow label="User present" value={created.authenticatorData.flags.userPresent} />
              <FlagRow label="User verified" value={created.authenticatorData.flags.userVerified} />
              <FlagRow label="Backup eligible (synced)" value={created.authenticatorData.flags.backupEligible} />
              <FlagRow label="Currently backed up" value={created.authenticatorData.flags.backupState} />
            </div>
            <div className="text-xs text-[#555555] space-y-1">
              <p>Credential ID: <span className="text-[#888888] font-mono break-all">{created.id}</span></p>
              {created.authenticatorAttachment && <p>Attachment: <span className="text-[#888888]">{created.authenticatorAttachment}</span></p>}
              {created.transports.length > 0 && <p>Transports: <span className="text-[#888888]">{created.transports.join(", ")}</span></p>}
              {created.authenticatorData.aaguid && <p>AAGUID: <span className="text-[#888888] font-mono">{created.authenticatorData.aaguid}</span></p>}
            </div>
          </div>
        )}

        {assertion && (
          <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#f5f5f5]">Authentication response</h3>
              <CopyButton text={JSON.stringify(assertion, null, 2)} size="sm" />
            </div>
            <div className="space-y-0.5 mb-3">
              <FlagRow label="User present" value={assertion.authenticatorData.flags.userPresent} />
              <FlagRow label="User verified" value={assertion.authenticatorData.flags.userVerified} />
            </div>
            <div className="text-xs text-[#555555] space-y-1">
              <p>Credential ID matches: <span className="text-[#888888]">{created && assertion.id === created.id ? "yes" : "different credential"}</span></p>
              <p>Sign count: <span className="text-[#888888] font-mono">{assertion.authenticatorData.signCount}</span></p>
              {assertion.userHandle && <p>User handle: <span className="text-[#888888] font-mono break-all">{assertion.userHandle}</span></p>}
            </div>
          </div>
        )}
      </div>

      {!created && !assertion && !error && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Click &quot;Create a passkey&quot; to start — your browser will prompt for Touch ID, Windows Hello, or a security key
        </div>
      )}

      <div className="mt-4 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        <strong className="text-[#888888]">Sign count</strong> increments on every authentication for a hardware
        security key, but stays at <code className="text-[#e879f9]">0</code> for most platform authenticators
        (Touch ID, Windows Hello, synced passkeys) — a real relying-party server uses it only to detect cloned
        hardware keys, not synced passkeys. <strong className="text-[#888888]">Backup eligible / backed up</strong> tell
        you whether this credential is a synced passkey (eligible for cloud backup) versus a device-bound one.
      </div>
    </ToolLayout>
  );
}
