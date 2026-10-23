"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { decodeCertificates, formatDn, type DecodedCert } from "@/lib/x509";

function validity(cert: DecodedCert) {
  const now = Date.now();
  const days = Math.floor((cert.notAfter.getTime() - now) / 86_400_000);
  if (now < cert.notBefore.getTime()) return { label: "Not yet valid", tone: "warn" as const, days };
  if (now > cert.notAfter.getTime()) return { label: `Expired ${Math.abs(days)} days ago`, tone: "bad" as const, days };
  return { label: `Valid — expires in ${days} days`, tone: days < 30 ? ("warn" as const) : ("good" as const), days };
}

const TONE = {
  good: "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]",
  warn: "bg-[#f97316]/10 border-[#f97316]/30 text-[#f97316]",
  bad: "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]",
};

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-1.5 border-b border-[#1a1a1a] last:border-0">
      <span className="text-xs text-[#888888]">{label}</span>
      <span className={`text-xs text-[#f5f5f5] break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function CertCard({ cert, index, total }: { cert: DecodedCert; index: number; total: number }) {
  const v = validity(cert);
  const cn = cert.subject.find((p) => p.type === "CN")?.value ?? formatDn(cert.subject);
  const selfSigned = formatDn(cert.subject) === formatDn(cert.issuer);
  const role = total > 1 ? (index === 0 ? "Leaf" : cert.isCa && selfSigned ? "Root" : cert.isCa ? "Intermediate" : `#${index + 1}`) : null;

  return (
    <div className="p-5 bg-[#111111] border border-[#222222] rounded-[8px]">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {role && <span className="px-2 py-0.5 text-[10px] uppercase tracking-wide bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20 rounded-full">{role}</span>}
        <h3 className="text-base font-semibold text-[#f5f5f5] break-all">{cn}</h3>
        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs border rounded-full ${TONE[v.tone]}`}>
          {v.tone === "good" ? <ShieldCheck size={12} /> : v.tone === "warn" ? <Clock size={12} /> : <ShieldAlert size={12} />}
          {v.label}
        </span>
      </div>

      <Row label="Subject" value={formatDn(cert.subject)} />
      <Row label="Issuer" value={selfSigned ? `${formatDn(cert.issuer)} (self-signed)` : formatDn(cert.issuer)} />
      <Row label="Not before" value={cert.notBefore.toUTCString()} />
      <Row label="Not after" value={cert.notAfter.toUTCString()} />
      <Row label="Public key" value={cert.publicKey} />
      <Row label="Signature" value={cert.signatureAlgorithm} />
      <Row label="Serial" value={cert.serial} mono />
      <Row label="Version" value={`v${cert.version}`} />
      <Row label="CA certificate" value={cert.isCa ? "Yes" : "No"} />

      {cert.subjectAltNames.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-[#888888] mb-2">Subject Alternative Names ({cert.subjectAltNames.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {cert.subjectAltNames.map((s) => (
              <code key={s} className="px-2 py-0.5 text-xs font-mono bg-[#0a0a0a] border border-[#222222] rounded text-[#f5f5f5]">{s}</code>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {(["sha256", "sha1"] as const).map((k) => (
          <div key={k}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#888888]">{k === "sha256" ? "SHA-256" : "SHA-1"} fingerprint</span>
              <CopyButton text={cert[k]} size="sm" />
            </div>
            <code className="block text-[11px] font-mono text-[#aaaaaa] break-all">{cert[k]}</code>
          </div>
        ))}
      </div>

      {cert.extensions.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-[#888888] cursor-pointer hover:text-[#f5f5f5]">Extensions ({cert.extensions.length})</summary>
          <div className="mt-2 space-y-2">
            {cert.extensions.map((e, i) => (
              <div key={i} className="pl-3 border-l-2 border-[#222222]">
                <p className="text-xs text-[#f5f5f5]">
                  {e.name} {e.critical && <span className="text-[#f97316]">(critical)</span>}
                </p>
                {e.values.length > 0 ? (
                  <p className="text-xs text-[#888888] font-mono break-all">{e.values.join(", ")}</p>
                ) : (
                  <p className="text-[10px] text-[#555555]">{e.oid}</p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default function CertificateDecoderClient() {
  const [input, setInput] = useState("");
  const [certs, setCerts] = useState<DecodedCert[]>([]);
  const [error, setError] = useState("");

  const run = async (value: string) => {
    setInput(value);
    if (!value.trim()) {
      setCerts([]);
      setError("");
      return;
    }
    try {
      setCerts(await decodeCertificates(value));
      setError("");
    } catch (e) {
      setCerts([]);
      setError(e instanceof Error ? e.message : "Couldn't decode this certificate");
    }
  };

  return (
    <ToolLayout
      title="X.509 / PEM Certificate Decoder"
      description="Paste a PEM certificate or full chain to see subject, issuer, expiry, SANs, key details, and fingerprints"
    >
      <div className="mb-5">
        <label className="text-xs text-[#888888] font-medium block mb-1">PEM certificate(s)</label>
        <textarea
          value={input}
          onChange={(e) => run(e.target.value)}
          placeholder={"-----BEGIN CERTIFICATE-----\nMIIF...\n-----END CERTIFICATE-----"}
          rows={8}
          spellCheck={false}
          className={`w-full p-3 font-mono text-xs bg-[#111111] border rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] resize-y ${error ? "border-[#ef4444]" : "border-[#222222]"}`}
        />
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
            <AlertCircle size={12} /> {error}
          </div>
        )}
        <p className="text-[11px] text-[#555555] mt-1.5">
          Grab a site&apos;s chain with{" "}
          <code className="text-[#888888]">openssl s_client -connect example.com:443 -showcerts &lt;/dev/null</code> and paste the
          output — everything outside the BEGIN/END blocks is ignored.
        </p>
      </div>

      {certs.length > 0 ? (
        <div className="space-y-4">
          {certs.map((c, i) => (
            <CertCard key={c.sha256} cert={c} index={i} total={certs.length} />
          ))}
        </div>
      ) : (
        !error && (
          <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
            Paste a certificate to decode it — nothing is uploaded, parsing happens in your browser
          </div>
        )
      )}
    </ToolLayout>
  );
}
