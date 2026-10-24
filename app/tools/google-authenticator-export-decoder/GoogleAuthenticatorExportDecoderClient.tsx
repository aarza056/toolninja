"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { decodeQrFromImage } from "@/lib/qr-decode";
import { generateTOTP, secondsRemaining, parseOtpauthUrl, type TotpAlgorithm } from "@/lib/totp";
import { decodeMigration, encodeMigration, accountToOtpauth, type MigrationAccount } from "@/lib/otpauth-migration";
import { AlertCircle, Eye, EyeOff, ShieldCheck, Upload, QrCode as QrIcon, Trash2 } from "lucide-react";

// Nothing here is saved to localStorage — these are 2FA secrets.

type Mode = "decode" | "build";

const key = (a: MigrationAccount) => `${a.issuer}|${a.account}|${a.secret}`;

// Dark-on-light QR codes: some authenticator scanners can't read inverted ones
const qr = (text: string) => QRCode.toDataURL(text, { width: 220, margin: 2, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } });

function AccountCard({ a, reveal }: { a: MigrationAccount; reveal: boolean }) {
  const url = accountToOtpauth(a);
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(30);
  const [img, setImg] = useState("");
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (a.type !== "totp" || a.algorithm === "MD5") return;
    let alive = true;
    const tick = async () => {
      // MD5 accounts were excluded above, so the algorithm is one WebCrypto can compute
      const c = await generateTOTP(a.secret, { algorithm: a.algorithm as TotpAlgorithm, digits: a.digits, period: 30 });
      if (alive) {
        setCode(c);
        setLeft(secondsRemaining(30));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [a]);

  useEffect(() => {
    if (showQr && !img) qr(url).then(setImg);
  }, [showQr, img, url]);

  return (
    <li className="p-4 bg-[#111111] border border-[#222222] rounded-[10px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#f5f5f5] truncate">{a.issuer || "(no issuer)"}</p>
          <p className="text-xs text-[#888888] truncate">{a.account || "(no account name)"}</p>
          <p className="mt-1 text-[11px] text-[#666666]">
            {a.type.toUpperCase()} · {a.algorithm} · {a.digits} digits{a.type === "hotp" ? ` · counter ${a.counter}` : ""}
          </p>
        </div>
        {code && (
          <div className="text-right">
            <p className="font-mono text-xl font-bold tracking-widest text-[#a855f7]">{code.replace(/(\d{3})(?=\d)/g, "$1 ")}</p>
            <p className="text-[10px] text-[#666666]">matches your app? · {left}s</p>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 min-w-0 px-2 py-1.5 text-xs font-mono truncate bg-[#0a0a0a] border border-[#222222] rounded-[6px] text-[#cccccc]">
          {reveal ? a.secret : "•".repeat(Math.min(a.secret.length, 32))}
        </code>
        <CopyButton text={a.secret} size="sm" label="Secret" />
        <CopyButton text={url} size="sm" label="Link" />
        <button onClick={() => setShowQr((v) => !v)} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-[6px] border border-[#222222] bg-[#1a1a1a] text-[#f5f5f5] hover:bg-[#222222]">
          <QrIcon size={13} /> QR
        </button>
      </div>
      {showQr && img && (
        <div className="mt-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={`QR code for ${a.issuer} ${a.account}`} width={160} height={160} className="rounded-[6px]" />
          <p className="text-xs text-[#888888] leading-relaxed">Scan this with the new app (Bitwarden, 1Password, Aegis, Authy…). Each account needs its own scan.</p>
        </div>
      )}
    </li>
  );
}

export default function GoogleAuthenticatorExportDecoderClient() {
  const [mode, setMode] = useState<Mode>("decode");
  const [input, setInput] = useState("");
  const [accounts, setAccounts] = useState<MigrationAccount[]>([]);
  const [batches, setBatches] = useState<{ index: number; size: number }[]>([]);
  const [error, setError] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [links, setLinks] = useState("");
  const [built, setBuilt] = useState<{ img: string; url: string }[]>([]);
  const [buildError, setBuildError] = useState("");

  const addExport = (text: string) => {
    setError("");
    try {
      const batch = decodeMigration(text);
      setAccounts((prev) => {
        const seen = new Set(prev.map(key));
        return [...prev, ...batch.accounts.filter((a) => !seen.has(key(a)))];
      });
      setBatches((prev) => (prev.some((b) => b.index === batch.batchIndex && b.size === batch.batchSize) ? prev : [...prev, { index: batch.batchIndex, size: batch.batchSize }]));
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that export.");
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    for (const file of Array.from(files)) {
      try {
        const r = await decodeQrFromImage(file);
        if (!r) setError(`No QR code found in ${file.name}. Crop the screenshot to the code and try again.`);
        else addExport(r.text);
      } catch {
        setError(`Couldn't read ${file.name}.`);
      }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const totalBatches = batches[0]?.size ?? 1;
  const missing = totalBatches > 1 ? Array.from({ length: totalBatches }, (_, i) => i).filter((i) => !batches.some((b) => b.index === i)) : [];

  const build = async () => {
    setBuildError("");
    const parsed: MigrationAccount[] = [];
    for (const line of links.split(/\s+/).filter(Boolean)) {
      const p = parseOtpauthUrl(line);
      if (!p || !/^otpauth:\/\/totp\//i.test(line)) {
        setBuildError(`Not a TOTP otpauth:// link: ${line.slice(0, 60)}…`);
        return;
      }
      parsed.push({ secret: p.secret.toUpperCase().replace(/[^A-Z2-7]/g, ""), account: p.label, issuer: p.issuer, algorithm: p.opts.algorithm, digits: p.opts.digits === 8 ? 8 : 6, type: "totp", counter: 0 });
    }
    if (!parsed.length) return setBuilt([]);
    // Google Authenticator puts at most 10 accounts in one transfer code
    const chunks = Array.from({ length: Math.ceil(parsed.length / 10) }, (_, i) => parsed.slice(i * 10, i * 10 + 10));
    const id = Math.floor(Math.random() * 2 ** 31);
    setBuilt(await Promise.all(chunks.map(async (c, i) => {
      const url = encodeMigration(c, { index: i, size: chunks.length, id });
      return { url, img: await qr(url) };
    })));
  };

  return (
    <ToolLayout title="Google Authenticator Export Decoder" description="Turn a Google Authenticator transfer QR code into standard 2FA codes you can import into any app">
      <div className="max-w-3xl space-y-6">
        <div className="flex items-start gap-2 p-3 text-xs leading-relaxed text-[#c4b5fd] bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-[8px]">
          <ShieldCheck size={15} className="shrink-0 mt-0.5" />
          <span>
            Decoding happens entirely in this tab — nothing is uploaded or saved, not even to your browser&apos;s storage. Still, these are the keys to your
            accounts: use your own device, and delete the screenshots afterwards.
          </span>
        </div>

        <div className="flex gap-1">
          {(["decode", "build"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === m ? "bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30" : "text-[#888888] hover:text-[#f5f5f5] border border-transparent"}`}
            >
              {m === "decode" ? "Decode an export" : "Build a transfer QR"}
            </button>
          ))}
        </div>

        {mode === "decode" ? (
          <>
            <div className="space-y-3">
              <p className="text-xs text-[#888888] leading-relaxed">
                In Google Authenticator: <b className="text-[#cccccc]">⋮ menu → Transfer accounts → Export accounts</b>, pick the accounts, and screenshot
                the QR code (or photograph it from another device — Android blocks screenshots there). Several QR codes? Add them all.
              </p>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onFiles(e.dataTransfer.files);
                }}
                className="flex flex-col items-center justify-center gap-2 p-6 text-center border border-dashed border-[#333333] rounded-[10px] bg-[#0d0d0d]"
              >
                <Upload size={20} className="text-[#a855f7]" />
                <p className="text-sm text-[#cccccc]">Drop QR screenshots here</p>
                <button onClick={() => fileRef.current?.click()} disabled={busy} className="px-3 py-1.5 text-xs rounded-[6px] bg-[#a855f7] hover:bg-[#9333ea] text-white disabled:opacity-50">
                  {busy ? "Reading…" : "Choose images"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
              </div>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && input.trim() && addExport(input)}
                  placeholder="…or paste otpauth-migration://offline?data=…"
                  spellCheck={false}
                  className="flex-1 min-w-0 px-3 py-2 text-sm font-mono bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
                />
                <button onClick={() => addExport(input)} disabled={!input.trim()} className="px-4 py-2 text-sm rounded-[6px] bg-[#1a1a1a] border border-[#222222] text-[#f5f5f5] hover:bg-[#222222] disabled:opacity-40">
                  Decode
                </button>
              </div>
              {error && (
                <p className="flex items-start gap-1.5 text-xs text-[#f87171]">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" /> {error}
                </p>
              )}
            </div>

            {accounts.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-[#f5f5f5]">
                    {accounts.length} account{accounts.length === 1 ? "" : "s"}
                    {totalBatches > 1 && <span className="text-[#888888]"> · QR {batches.length} of {totalBatches}</span>}
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setReveal((r) => !r)} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-[6px] border border-[#222222] bg-[#1a1a1a] text-[#f5f5f5] hover:bg-[#222222]">
                      {reveal ? <EyeOff size={13} /> : <Eye size={13} />} {reveal ? "Hide" : "Show"} secrets
                    </button>
                    <CopyButton text={accounts.map(accountToOtpauth).join("\n")} size="sm" label="Copy all links" />
                    <button
                      onClick={() => {
                        setAccounts([]);
                        setBatches([]);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-[6px] border border-[#222222] bg-[#1a1a1a] text-[#888888] hover:text-[#f5f5f5]"
                    >
                      <Trash2 size={13} /> Clear
                    </button>
                  </div>
                </div>
                {missing.length > 0 && (
                  <p className="text-xs text-[#fbbf24]">This export has {totalBatches} QR codes — add QR {missing.map((m) => m + 1).join(", ")} too, or some accounts will be missing.</p>
                )}
                <ul className="space-y-3">
                  {accounts.map((a) => (
                    <AccountCard key={key(a)} a={a} reveal={reveal} />
                  ))}
                </ul>
                <p className="text-xs text-[#666666] leading-relaxed">
                  Check that each code matches Google Authenticator before you delete anything there. &ldquo;Copy all links&rdquo; gives one otpauth:// link per line —
                  1Password, Aegis and the <Link href="/tools/totp-generator" className="text-[#a855f7] hover:underline">TOTP generator</Link> accept them directly.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#888888] leading-relaxed">
              Moving <i>to</i> Google Authenticator? Paste otpauth://totp links (one per line) and scan the result with <b className="text-[#cccccc]">Transfer accounts → Import accounts</b> — every
              account comes over in one scan.
            </p>
            <textarea
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              rows={6}
              spellCheck={false}
              placeholder={"otpauth://totp/GitHub:alice?secret=JBSWY3DPEHPK3PXP&issuer=GitHub\notpauth://totp/AWS:alice?secret=…"}
              className="w-full p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
            <button onClick={build} disabled={!links.trim()} className="px-4 py-2 text-sm rounded-[6px] bg-[#a855f7] hover:bg-[#9333ea] text-white disabled:opacity-40">
              Build transfer QR
            </button>
            {buildError && <p className="text-xs text-[#f87171]">{buildError}</p>}
            <div className="flex flex-wrap gap-4">
              {built.map((b, i) => (
                <div key={i} className="space-y-2 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.img} alt={`Transfer QR ${i + 1}`} width={220} height={220} className="rounded-[6px]" />
                  <p className="text-xs text-[#888888]">QR {i + 1} of {built.length}</p>
                  <CopyButton text={b.url} size="sm" label="Copy link" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
