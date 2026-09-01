"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, CheckCircle, Clock, Terminal, ArrowRight, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

function generateCurlFromJwt(token: string, url: string): string {
  return `curl -X GET "${url}" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json"`;
}

function toBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const STORAGE_KEY = "toolninja:jwt-decoder";

function base64UrlToBytes(str: string): Uint8Array {
  const clean = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = clean + "=".repeat((4 - (clean.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

type VerifyResult = { status: "valid" | "invalid" | "error"; message: string };

/** Verifies a JWT's signature using WebCrypto. HMAC algorithms take a shared-secret string;
 * RSA and ECDSA algorithms take a PEM-encoded SPKI public key. WebCrypto's ECDSA and
 * RSASSA-PKCS1-v1_5 sign/verify already use the raw (non-DER) signature encoding JWT expects,
 * so no format conversion is needed beyond base64url-decoding the signature itself. */
async function verifyJwtSignature(token: string, alg: string, keyMaterial: string): Promise<VerifyResult> {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return { status: "error", message: "Malformed token." };
  const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlToBytes(parts[2]);

  try {
    if (alg === "none") {
      return { status: "error", message: "This token uses \"alg\": \"none\" — it has no signature to verify. Never accept a none-algorithm token from an untrusted source." };
    }

    if (alg.startsWith("HS")) {
      const hash = `SHA-${alg.slice(2)}`;
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(keyMaterial),
        { name: "HMAC", hash },
        false,
        ["verify"]
      );
      const ok = await crypto.subtle.verify("HMAC", key, signature as BufferSource, signingInput);
      return ok
        ? { status: "valid", message: "Signature is valid — computed with this secret, it matches the token's signature exactly." }
        : { status: "invalid", message: "Signature does not match. Either the secret is wrong, or the token (header/payload) was altered after signing." };
    }

    if (alg.startsWith("RS") || alg.startsWith("PS")) {
      const hash = `SHA-${alg.slice(2)}`;
      const keyData = pemToArrayBuffer(keyMaterial);
      if (alg.startsWith("PS")) {
        const key = await crypto.subtle.importKey("spki", keyData, { name: "RSA-PSS", hash }, false, ["verify"]);
        const ok = await crypto.subtle.verify({ name: "RSA-PSS", saltLength: parseInt(alg.slice(2), 10) / 8 }, key, signature as BufferSource, signingInput);
        return ok
          ? { status: "valid", message: "Signature is valid for this public key." }
          : { status: "invalid", message: "Signature does not match this public key. Either the key is wrong, or the token was altered after signing." };
      }
      const key = await crypto.subtle.importKey("spki", keyData, { name: "RSASSA-PKCS1-v1_5", hash }, false, ["verify"]);
      const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature as BufferSource, signingInput);
      return ok
        ? { status: "valid", message: "Signature is valid for this public key." }
        : { status: "invalid", message: "Signature does not match this public key. Either the key is wrong, or the token was altered after signing." };
    }

    if (alg.startsWith("ES")) {
      const curveMap: Record<string, string> = { ES256: "P-256", ES384: "P-384", ES512: "P-521" };
      const curve = curveMap[alg];
      if (!curve) return { status: "error", message: `Unsupported curve for ${alg}.` };
      const keyData = pemToArrayBuffer(keyMaterial);
      const key = await crypto.subtle.importKey("spki", keyData, { name: "ECDSA", namedCurve: curve }, false, ["verify"]);
      const ok = await crypto.subtle.verify({ name: "ECDSA", hash: `SHA-${alg.slice(2) === "512" ? "512" : alg.slice(2)}` }, key, signature as BufferSource, signingInput);
      return ok
        ? { status: "valid", message: "Signature is valid for this public key." }
        : { status: "invalid", message: "Signature does not match this public key. Either the key is wrong, or the token was altered after signing." };
    }

    return { status: "error", message: `Unsupported algorithm: ${alg}` };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? `Verification failed: ${e.message}` : "Verification failed — check the key format matches the algorithm." };
  }
}

function b64Decode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  try {
    return decodeURIComponent(
      atob(str)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
  } catch {
    return atob(str);
  }
}

function syntaxHighlight(obj: unknown): string {
  const json = JSON.stringify(obj, null, 2)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-string";
      } else if (/true|false/.test(match)) {
        cls = "json-bool";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export default function JwtDecoderClient() {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<{ header: unknown; payload: unknown; signature: string } | null>(null);
  const [error, setError] = useState("");
  const [curlPanelOpen, setCurlPanelOpen] = useState(false);
  const [curlUrl, setCurlUrl] = useState("");
  const [verifyPanelOpen, setVerifyPanelOpen] = useState(false);
  const [keyMaterial, setKeyMaterial] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setToken(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, token); } catch {}
    if (!token.trim()) { setDecoded(null); setError(""); return; }
    try {
      const parts = token.trim().split(".");
      if (parts.length !== 3) throw new Error("JWT must have 3 parts separated by dots");
      const header = JSON.parse(b64Decode(parts[0]));
      const payload = JSON.parse(b64Decode(parts[1]));
      setDecoded({ header, payload, signature: parts[2] });
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid JWT");
      setDecoded(null);
    }
    setVerifyResult(null);
  }, [token]);

  const payload = decoded?.payload as Record<string, unknown> | null;
  const exp = payload?.exp ? Number(payload.exp) : null;
  const now = Math.floor(Date.now() / 1000);
  const isExpired = exp !== null && exp < now;
  const expiryDate = exp ? new Date(exp * 1000) : null;
  const alg = (decoded?.header as Record<string, unknown> | undefined)?.alg as string | undefined;
  const isHmac = alg?.startsWith("HS") ?? false;

  const handleVerify = useCallback(async () => {
    if (!alg || !keyMaterial.trim()) return;
    setVerifying(true);
    setVerifyResult(await verifyJwtSignature(token, alg, keyMaterial.trim()));
    setVerifying(false);
  }, [alg, keyMaterial, token]);

  const sections = decoded ? [
    { label: "Header", color: "#a855f7", data: decoded.header },
    { label: "Payload", color: "#3b82f6", data: decoded.payload },
    { label: "Signature", color: "#ef4444", data: decoded.signature },
  ] : [];

  return (
    <ToolLayout title="JWT Decoder" description="Decode and inspect JWT tokens">
      <div className="mb-4">
        <label className="text-xs text-[#888888] font-medium block mb-1">JWT Token</label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your JWT token here..."
          rows={3}
          className={`w-full p-3 font-mono text-sm resize-none bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] ${error ? "border-[#ef4444]" : "border-[#222222]"}`}
          spellCheck={false}
        />
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
            <AlertCircle size={12} /> {error}
          </div>
        )}
      </div>

      {/* Expiry badge */}
      {expiryDate && (
        <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-[6px] text-sm ${isExpired ? "bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]" : "bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]"}`}>
          {isExpired ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          <span>{isExpired ? "Token is expired" : "Token is valid"}</span>
          <span className="text-[#888888] flex items-center gap-1">
            <Clock size={12} />
            Expires: {expiryDate.toLocaleString()}
          </span>
        </div>
      )}

      {/* Decoded sections */}
      {sections.map((s) => (
        <div key={s.label} className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</label>
            <CopyButton text={typeof s.data === "string" ? s.data : JSON.stringify(s.data, null, 2)} size="sm" />
          </div>
          <div
            className="p-3 font-mono text-sm bg-[#111111] border rounded-[8px] overflow-auto"
            style={{ borderColor: s.color + "33" }}
          >
            {typeof s.data === "string" ? (
              <span className="text-[#888888] break-all">{s.data}</span>
            ) : (
              <pre
                className="m-0 p-0 bg-transparent border-0 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(s.data) }}
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              />
            )}
          </div>
        </div>
      ))}

      {decoded && alg && (
        <div className="mb-4">
          <button
            onClick={() => setVerifyPanelOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
          >
            <ShieldCheck size={12} /> Verify signature ({alg}) →
          </button>

          {verifyPanelOpen && (
            <div className="mt-2 p-3 bg-[#111111] border border-[#222222] rounded-[8px] space-y-3">
              {alg === "none" ? (
                <div className="flex items-center gap-2 text-xs text-[#ef4444]">
                  <ShieldAlert size={14} className="shrink-0" />
                  This token declares &quot;alg&quot;: &quot;none&quot; — there is no signature to verify. Never trust a none-algorithm token from an untrusted source.
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-[#888888] font-medium block mb-1">
                      {isHmac ? "Secret key" : "Public key (PEM, SPKI format)"}
                    </label>
                    {isHmac ? (
                      <input
                        type="text"
                        value={keyMaterial}
                        onChange={(e) => { setKeyMaterial(e.target.value); setVerifyResult(null); }}
                        placeholder="your-256-bit-secret"
                        className="w-full px-3 py-2 font-mono text-sm bg-[#0d0d0d] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                        spellCheck={false}
                      />
                    ) : (
                      <textarea
                        value={keyMaterial}
                        onChange={(e) => { setKeyMaterial(e.target.value); setVerifyResult(null); }}
                        placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                        rows={4}
                        className="w-full px-3 py-2 font-mono text-xs bg-[#0d0d0d] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] resize-none"
                        spellCheck={false}
                      />
                    )}
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={!keyMaterial.trim() || verifying}
                    className="px-4 py-1.5 text-xs font-medium bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white rounded-[6px] transition-colors"
                  >
                    {verifying ? "Verifying…" : "Verify"}
                  </button>

                  {verifyResult && (
                    <div
                      className={`flex items-start gap-2 p-2.5 rounded-[6px] text-xs ${
                        verifyResult.status === "valid"
                          ? "bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]"
                          : verifyResult.status === "invalid"
                            ? "bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]"
                            : "bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b]"
                      }`}
                    >
                      {verifyResult.status === "valid" ? (
                        <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                      ) : verifyResult.status === "invalid" ? (
                        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                      ) : (
                        <ShieldQuestion size={14} className="shrink-0 mt-0.5" />
                      )}
                      {verifyResult.message}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {decoded && (
        <div className="mb-4">
          <button
            onClick={() => setCurlPanelOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
          >
            <Terminal size={12} /> Use in a cURL request →
          </button>

          {curlPanelOpen && (
            <div className="mt-2 p-3 bg-[#111111] border border-[#222222] rounded-[8px] space-y-3">
              <div>
                <label className="text-xs text-[#888888] font-medium block mb-1">Target URL</label>
                <input
                  type="text"
                  value={curlUrl}
                  onChange={(e) => setCurlUrl(e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  className="w-full px-3 py-2 font-mono text-sm bg-[#0d0d0d] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                  spellCheck={false}
                />
              </div>

              {curlUrl.trim() && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-[#888888] font-medium">Generated cURL command</label>
                      <CopyButton text={generateCurlFromJwt(token.trim(), curlUrl.trim())} size="sm" />
                    </div>
                    <pre className="p-3 font-mono text-xs bg-[#0d0d0d] border border-[#222222] rounded-[6px] text-[#f5f5f5] overflow-auto whitespace-pre-wrap break-all">
                      {generateCurlFromJwt(token.trim(), curlUrl.trim())}
                    </pre>
                  </div>
                  <Link
                    href={`/tools/curl-to-code?cmd=${toBase64Url(generateCurlFromJwt(token.trim(), curlUrl.trim()))}`}
                    className="inline-flex items-center gap-1 text-xs text-[#a855f7] hover:text-[#c084fc] transition-colors"
                  >
                    Convert this to Python/JS/PHP <ArrowRight size={12} />
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {!decoded && !error && !token && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Paste a JWT token above to decode it
        </div>
      )}

      <style>{`
        .json-key { color: #a855f7; }
        .json-string { color: #22c55e; }
        .json-number { color: #f97316; }
        .json-bool { color: #3b82f6; }
        .json-null { color: #888888; }
      `}</style>
    </ToolLayout>
  );
}
