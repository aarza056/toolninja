"use client";

import { useState, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Eye, EyeOff, AlertCircle, Info, RefreshCw } from "lucide-react";

type Mode = "encrypt" | "decrypt";
type Algorithm = "aes" | "rsa";

// ─── AES-GCM helpers ───────────────────────────────────────────────────────

async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function aesEncrypt(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  const combined = new Uint8Array(16 + 12 + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(new Uint8Array(ciphertext), 28);
  return btoa(Array.from(combined, (b) => String.fromCharCode(b)).join(""));
}

async function aesDecrypt(encoded: string, password: string): Promise<string> {
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);
  const key = await deriveAesKey(password, salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}

// ─── RSA-OAEP helpers ──────────────────────────────────────────────────────

function u8ToB64(buf: ArrayBuffer): string {
  return btoa(Array.from(new Uint8Array(buf), (b) => String.fromCharCode(b)).join(""));
}

function arrayBufferToPem(buffer: ArrayBuffer, label: string): string {
  const b64 = u8ToB64(buffer);
  const lines = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function generateRsaKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  return {
    publicKey: arrayBufferToPem(publicKeyBuffer, "PUBLIC KEY"),
    privateKey: arrayBufferToPem(privateKeyBuffer, "PRIVATE KEY"),
  };
}

async function rsaEncrypt(plaintext: string, publicKeyPem: string): Promise<string> {
  const keyBuffer = pemToArrayBuffer(publicKeyPem);
  const publicKey = await crypto.subtle.importKey(
    "spki",
    keyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    new TextEncoder().encode(plaintext)
  );
  return u8ToB64(ciphertext);
}

async function rsaDecrypt(ciphertextB64: string, privateKeyPem: string): Promise<string> {
  const keyBuffer = pemToArrayBuffer(privateKeyPem);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );
  const ciphertext = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <div className="flex">
      {(["encrypt", "decrypt"] as Mode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-4 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors capitalize ${
            mode === m
              ? "bg-[#a855f7] border-[#a855f7] text-white"
              : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder = "Enter password...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 pr-10 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#444444]"
        spellCheck={false}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#f5f5f5] transition-colors"
        title={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function OutputBox({
  value,
  label = "Output",
}: {
  value: string;
  label?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-[#888888] font-medium">{label}</label>
        <CopyButton text={value} size="sm" />
      </div>
      <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] min-h-[52px]">
        <code className="text-xs font-mono text-[#f5f5f5] break-all whitespace-pre-wrap">
          {value}
        </code>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px]">
      <AlertCircle size={14} className="text-[#ef4444] mt-0.5 shrink-0" />
      <span className="text-sm text-[#ef4444]">{message}</span>
    </div>
  );
}

// ─── AES Tab ───────────────────────────────────────────────────────────────

function AesTab() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [password, setPassword] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = useCallback(async () => {
    if (!password) { setError("Password is required"); return; }
    if (!input.trim()) { setError("Input is required"); return; }
    setError("");
    setOutput("");
    setLoading(true);
    try {
      if (mode === "encrypt") {
        const result = await aesEncrypt(input, password);
        setOutput(result);
      } else {
        const result = await aesDecrypt(input.trim(), password);
        setOutput(result);
      }
    } catch (e: unknown) {
      if (mode === "decrypt") {
        setError("Decryption failed. Check your password and ciphertext.");
      } else {
        setError(e instanceof Error ? e.message : "Encryption failed");
      }
    } finally {
      setLoading(false);
    }
  }, [mode, password, input]);

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="text-xs text-[#888888] font-medium block mb-1.5">Mode</label>
          <ModeToggle mode={mode} onChange={handleModeChange} />
        </div>
      </div>

      <div>
        <label className="text-xs text-[#888888] font-medium block mb-1.5">Password</label>
        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder="Enter encryption password..."
        />
        <p className="text-xs text-[#555555] mt-1">
          Uses PBKDF2 (100,000 iterations) to derive a 256-bit AES-GCM key
        </p>
      </div>

      <div>
        <label className="text-xs text-[#888888] font-medium block mb-1.5">
          {mode === "encrypt" ? "Plaintext" : "Ciphertext (Base64)"}
        </label>
        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); }}
          placeholder={
            mode === "encrypt"
              ? "Enter text to encrypt..."
              : "Paste encrypted Base64 ciphertext here..."
          }
          rows={5}
          spellCheck={false}
          className="w-full p-3 font-mono text-sm resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#444444]"
        />
      </div>

      <button
        onClick={handleAction}
        disabled={loading || !password || !input.trim()}
        className="px-5 py-2.5 rounded-[8px] text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? mode === "encrypt"
            ? "Encrypting..."
            : "Decrypting..."
          : mode === "encrypt"
          ? "Encrypt"
          : "Decrypt"}
      </button>

      {error && <ErrorBox message={error} />}
      {output && (
        <OutputBox
          value={output}
          label={mode === "encrypt" ? "Ciphertext (Base64)" : "Decrypted Plaintext"}
        />
      )}
    </div>
  );
}

// ─── RSA Tab ───────────────────────────────────────────────────────────────

function RsaTab() {
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [mode, setMode] = useState<Mode>("encrypt");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [generatingKeys, setGeneratingKeys] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateKeys = useCallback(async () => {
    setGeneratingKeys(true);
    setError("");
    setPublicKey("");
    setPrivateKey("");
    setOutput("");
    try {
      const kp = await generateRsaKeyPair();
      setPublicKey(kp.publicKey);
      setPrivateKey(kp.privateKey);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Key generation failed");
    } finally {
      setGeneratingKeys(false);
    }
  }, []);

  const handleAction = useCallback(async () => {
    if (!input.trim()) { setError("Input is required"); return; }
    setError("");
    setOutput("");
    setLoading(true);
    try {
      if (mode === "encrypt") {
        if (!publicKey) { setError("Generate or paste a public key first"); setLoading(false); return; }
        const result = await rsaEncrypt(input, publicKey);
        setOutput(result);
      } else {
        if (!privateKey) { setError("Generate or paste a private key first"); setLoading(false); return; }
        const result = await rsaDecrypt(input.trim(), privateKey);
        setOutput(result);
      }
    } catch (e: unknown) {
      if (mode === "decrypt") {
        setError("Decryption failed. Ensure you use the matching private key and valid ciphertext.");
      } else {
        setError(e instanceof Error ? e.message : "Encryption failed");
      }
    } finally {
      setLoading(false);
    }
  }, [mode, input, publicKey, privateKey]);

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <div className="space-y-4">
      {/* Info note */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-[#a855f7]/10 border border-[#a855f7]/20 rounded-[8px]">
        <Info size={14} className="text-[#a855f7] mt-0.5 shrink-0" />
        <span className="text-xs text-[#888888]">
          RSA can only encrypt small data (max ~190 bytes for 2048-bit keys). For files or large text, use AES-GCM.
        </span>
      </div>

      {/* Generate key pair */}
      <button
        onClick={handleGenerateKeys}
        disabled={generatingKeys}
        className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw size={14} className={generatingKeys ? "animate-spin" : ""} />
        {generatingKeys ? "Generating..." : "Generate Key Pair"}
      </button>

      {/* Public key */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-[#888888] font-medium">Public Key (SPKI)</label>
          {publicKey && <CopyButton text={publicKey} size="sm" />}
        </div>
        <textarea
          value={publicKey}
          onChange={(e) => { setPublicKey(e.target.value); setOutput(""); setError(""); }}
          placeholder="Public key will appear here after generation, or paste one..."
          rows={5}
          spellCheck={false}
          className="w-full p-3 font-mono text-xs resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#444444]"
        />
      </div>

      {/* Private key */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-[#888888] font-medium">Private Key (PKCS8)</label>
          {privateKey && <CopyButton text={privateKey} size="sm" />}
        </div>
        <textarea
          value={privateKey}
          onChange={(e) => { setPrivateKey(e.target.value); setOutput(""); setError(""); }}
          placeholder="Private key will appear here after generation, or paste one..."
          rows={5}
          spellCheck={false}
          className="w-full p-3 font-mono text-xs resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#444444]"
        />
      </div>

      {/* Mode + action */}
      <div>
        <label className="text-xs text-[#888888] font-medium block mb-1.5">Mode</label>
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </div>

      <div>
        <label className="text-xs text-[#888888] font-medium block mb-1.5">
          {mode === "encrypt" ? "Plaintext (uses Public Key)" : "Ciphertext Base64 (uses Private Key)"}
        </label>
        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); }}
          placeholder={
            mode === "encrypt"
              ? "Enter text to encrypt (max ~190 bytes)..."
              : "Paste RSA-encrypted Base64 ciphertext..."
          }
          rows={4}
          spellCheck={false}
          className="w-full p-3 font-mono text-sm resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#444444]"
        />
      </div>

      <button
        onClick={handleAction}
        disabled={loading || !input.trim() || (mode === "encrypt" ? !publicKey : !privateKey)}
        className="px-5 py-2.5 rounded-[8px] text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? mode === "encrypt"
            ? "Encrypting..."
            : "Decrypting..."
          : mode === "encrypt"
          ? "Encrypt"
          : "Decrypt"}
      </button>

      {error && <ErrorBox message={error} />}
      {output && (
        <OutputBox
          value={output}
          label={mode === "encrypt" ? "Ciphertext (Base64)" : "Decrypted Plaintext"}
        />
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function CryptoToolsClient() {
  const [activeTab, setActiveTab] = useState<Algorithm>("aes");

  const tabs: { id: Algorithm; label: string }[] = [
    { id: "aes", label: "AES-GCM" },
    { id: "rsa", label: "RSA-OAEP" },
  ];

  return (
    <ToolLayout
      title="Crypto Tools"
      description="AES-GCM and RSA-OAEP encryption and decryption using the WebCrypto API"
    >
      <div className="max-w-2xl">
        {/* Tab bar */}
        <div className="flex border-b border-[#222222] mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-[#a855f7] text-[#a855f7]"
                  : "border-transparent text-[#888888] hover:text-[#f5f5f5]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "aes" ? <AesTab /> : <RsaTab />}
      </div>
    </ToolLayout>
  );
}
