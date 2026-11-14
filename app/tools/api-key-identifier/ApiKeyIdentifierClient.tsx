"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Eye, EyeOff, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { base62, crc32, identifyKey, KNOWN_SERVICES, type KeyMatch } from "@/lib/api-key-id";

// Deliberately no localStorage here: a pasted key shouldn't outlive the tab.

const field = "px-3 py-2 text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]";

const KIND: Record<KeyMatch["kind"], { label: string; tone: string }> = {
  secret: { label: "Secret", tone: "text-[#f87171] border-[#f87171]/30" },
  token: { label: "Access token", tone: "text-[#fb923c] border-[#fb923c]/30" },
  public: { label: "Public by design", tone: "text-[#4ade80] border-[#4ade80]/30" },
  identifier: { label: "Identifier", tone: "text-[#60a5fa] border-[#60a5fa]/30" },
};

const CONFIDENCE: Record<KeyMatch["confidence"], string> = {
  certain: "Format match",
  likely: "Probable match",
  possible: "Possible match (shape only)",
};

// The token examples are assembled at runtime so the source never contains a string that secret
// scanners (including GitHub push protection) would flag. The GitHub one gets a real checksum, to
// show what a valid one looks like.
const GH_ENTROPY = "abcdefghijklmnopqrstuvwxyz0123";
const EXAMPLES: { label: string; value: string }[] = [
  { label: "AWS key ID", value: "AKIAIOSFODNN7EXAMPLE" },
  { label: "Stripe test key", value: ["sk", "test", "4eC39HqLyjWDarjtT1zdp7dc"].join("_") },
  { label: "GitHub token", value: `${["gh", "p"].join("")}_${GH_ENTROPY}${base62(crc32(GH_ENTROPY), 6)}` },
  { label: "JWT", value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" },
];

function mask(s: string): string {
  if (s.length <= 12) return "•".repeat(s.length);
  return `${s.slice(0, 8)}${"•".repeat(Math.min(24, s.length - 12))}${s.slice(-4)}`;
}

export default function ApiKeyIdentifierClient() {
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);

  const result = useMemo(() => (input.trim() ? identifyKey(input) : null), [input]);
  const multiline = /\n/.test(input.trim());

  return (
    <ToolLayout title="API Key Identifier" description="Paste an API key or token to see which service issued it, whether it's secret, live or test, and how to revoke it, without it leaving your browser">
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-start gap-2 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#999999]">
          <Lock size={14} className="text-[#4ade80] mt-0.5 shrink-0" />
          <span>
            Your key stays in this tab: it&apos;s identified by its format in your browser, never sent to us or to the service, and not saved. If it&apos;s a real secret that has been exposed somewhere, revoke it anyway; knowing what it is is the first step.
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="key-input" className="text-xs text-[#888888] font-medium">
              API key, token or credential
            </label>
            <button type="button" onClick={() => setShow(!show)} className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5]">
              {show ? <EyeOff size={13} /> : <Eye size={13} />} {show ? "Hide" : "Show"}
            </button>
          </div>
          {multiline || show ? (
            <textarea id="key-input" value={input} onChange={(e) => setInput(e.target.value)} rows={multiline ? 6 : 2} spellCheck={false} autoComplete="off" placeholder="sk_live_…, AKIA…, ghp_…, eyJ…" className={`${field} w-full font-mono !text-xs`} />
          ) : (
            <input id="key-input" type="password" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} autoComplete="off" placeholder="sk_live_…, AKIA…, ghp_…, eyJ…" className={`${field} w-full font-mono`} />
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <span className="text-[#666666]">Try:</span>
            {EXAMPLES.map((e) => (
              <button key={e.label} type="button" onClick={() => { setInput(e.value); setShow(true); }} className="px-2 py-1 rounded border border-[#2a2a2a] text-[#bbbbbb] hover:border-[#a855f7]">
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {result && (
          <div className="space-y-3">
            <p className="text-xs text-[#888888]">
              <span className="font-mono text-[#bbbbbb] break-all">{show ? result.input.slice(0, 120) + (result.input.length > 120 ? "…" : "") : mask(result.input)}</span> · {result.length} characters · {result.charset} · {result.entropy.toFixed(2)} bits of entropy per character
              {result.cleaned && " · quotes, variable names or “Bearer” removed before matching"}
            </p>

            {result.placeholder && (
              <p className="flex items-start gap-2 text-xs text-[#fbbf24]">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" /> This looks like a placeholder or example value, not a real key.
              </p>
            )}

            {result.matches.length === 0 ? (
              <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] text-sm text-[#bbbbbb]">
                <p className="text-[#f5f5f5] font-medium">No known format</p>
                <p className="text-xs text-[#888888] mt-1">
                  Many services (Cloudflare, Algolia, Twilio auth tokens, most internal APIs) issue keys without a prefix, so the format alone can&apos;t name them. Look at the variable name or config file it came from. {result.entropy > 3.5 && result.length >= 20 ? "Its randomness is typical of a real secret, so treat it as one." : ""}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {result.matches.map((m, i) => (
                  <li key={i} className="p-4 bg-[#111111] border border-[#222222] rounded-[8px] space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {m.kind === "public" ? <ShieldCheck size={18} className="text-[#4ade80]" /> : <ShieldAlert size={18} className={m.kind === "identifier" ? "text-[#60a5fa]" : "text-[#f87171]"} />}
                      <span className="text-base font-semibold text-[#f5f5f5]">{m.service}</span>
                      <span className="text-sm text-[#bbbbbb]">{m.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span className={`px-1.5 py-0.5 border rounded ${KIND[m.kind].tone}`}>{KIND[m.kind].label}</span>
                      {m.environment && <span className={`px-1.5 py-0.5 border rounded ${m.environment === "live" ? "text-[#f87171] border-[#f87171]/30" : "text-[#888888] border-[#444444]"}`}>{m.environment === "live" ? "Live / production" : m.environment === "test" ? "Test mode" : "Sandbox"}</span>}
                      <span className="px-1.5 py-0.5 border rounded text-[#888888] border-[#444444]">{CONFIDENCE[m.confidence]}</span>
                    </div>
                    {m.facts.length > 0 && (
                      <dl className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
                        {m.facts.map((f, j) => (
                          <div key={j} className="contents">
                            <dt className="text-[#777777]">{f.label}</dt>
                            <dd className={`font-mono break-all ${f.tone === "good" ? "text-[#4ade80]" : f.tone === "bad" ? "text-[#f87171]" : "text-[#d4d4d4]"}`}>{f.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <p className="text-xs text-[#bbbbbb]">
                      <span className="text-[#777777]">What it can do: </span>
                      {m.risk}
                    </p>
                    <p className="text-xs text-[#bbbbbb]">
                      <span className="text-[#777777]">To revoke or rotate: </span>
                      {m.revoke}{" "}
                      {m.revokeUrl && (
                        <a href={m.revokeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[#a855f7] hover:underline">
                          Open <ExternalLink size={11} />
                        </a>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <details className="text-xs text-[#888888]">
          <summary className="cursor-pointer text-[#bbbbbb]">Recognized services ({KNOWN_SERVICES.length})</summary>
          <p className="mt-2 leading-relaxed">{KNOWN_SERVICES.join(", ")}, plus PEM private keys, Google service account files and JWTs from any issuer.</p>
        </details>

        <p className="text-xs text-[#666666]">
          The identification is format-based: it can tell what a key is and whether its checksum is right, but not whether it still works. To find keys in a whole file or repository, use the <Link href="/tools/secret-scanner" className="text-[#a855f7] hover:underline">Secret Scanner</Link>; to read a JWT in full, the <Link href="/tools/jwt-decoder" className="text-[#a855f7] hover:underline">JWT Decoder</Link>. Leaked one? Read <Link href="/blog/find-hardcoded-api-keys" className="text-[#a855f7] hover:underline">how to find hardcoded API keys and what to do when one leaks</Link>.
        </p>
      </div>
    </ToolLayout>
  );
}
