"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Upload, FileIcon, AlertCircle, ScanLine, ArrowRight } from "lucide-react";
import { decodeQrFromImage } from "@/lib/qr-decode";
import { parseOtpauthUrl } from "@/lib/totp";

export default function QrCodeScannerClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setText("");
    setError("");
    setBusy(true);
    try {
      const result = await decodeQrFromImage(f);
      if (!result) setError("No QR code found in this image.");
      else setText(result.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to decode this image.");
    } finally {
      setBusy(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const otpauth = text.startsWith("otpauth://") ? parseOtpauthUrl(text) : null;
  const isUrl = /^https?:\/\//i.test(text);

  return (
    <ToolLayout
      title="QR Code Scanner / Decoder"
      description="Upload a QR code image and decode exactly what it contains — including 2FA otpauth:// secrets"
    >
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-[8px] cursor-pointer transition-colors mb-5 ${
          dragOver ? "border-[#a855f7] bg-[#a855f7]/5" : "border-[#222222] hover:border-[#333333]"
        }`}
      >
        {file ? (
          <>
            <FileIcon size={28} strokeWidth={1} className="text-[#a855f7]" />
            <p className="text-sm text-[#f5f5f5]">{file.name}</p>
            <p className="text-xs text-[#555555]">Click or drop to replace</p>
          </>
        ) : (
          <>
            <Upload size={28} strokeWidth={1} className="text-[#444444]" />
            <p className="text-sm text-[#888888]">Drag & drop a QR code image, or click to upload</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {busy && (
        <div className="flex items-center gap-2 text-sm text-[#888888] mb-4">
          <ScanLine size={14} className="animate-pulse" /> Decoding…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 mb-5 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px]">
          <AlertCircle size={14} className="text-[#ef4444] shrink-0" />
          <span className="text-sm text-[#ef4444]">{error}</span>
        </div>
      )}

      {preview && !busy && (
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Uploaded QR code" className="w-full max-w-[200px] rounded-[8px] border border-[#222222]" />

          {text && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[#888888] font-medium">Decoded content</label>
                  <CopyButton text={text} size="sm" />
                </div>
                <pre className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-sm font-mono text-[#f5f5f5] whitespace-pre-wrap break-all">
                  {text}
                </pre>
              </div>

              {otpauth && (
                <div className="p-3 bg-[#a855f7]/5 border border-[#a855f7]/20 rounded-[8px] text-sm">
                  <p className="text-[#f5f5f5] font-medium mb-2">This is a 2FA (otpauth://) QR code</p>
                  <div className="space-y-1 text-xs text-[#888888]">
                    <p>Issuer: <span className="text-[#f5f5f5]">{otpauth.issuer || "—"}</span></p>
                    <p>Account: <span className="text-[#f5f5f5]">{otpauth.label}</span></p>
                    <p>Algorithm: <span className="text-[#f5f5f5]">{otpauth.opts.algorithm}, {otpauth.opts.digits} digits, {otpauth.opts.period}s period</span></p>
                  </div>
                  <Link
                    href="/tools/totp-generator"
                    className="inline-flex items-center gap-1 mt-3 text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors"
                  >
                    Open in TOTP Generator <ArrowRight size={11} />
                  </Link>
                </div>
              )}

              {isUrl && !otpauth && (
                <a
                  href={text}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors"
                >
                  Open link <ArrowRight size={11} />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        Decoding happens entirely in your browser via canvas pixel data — the image is never
        uploaded anywhere. Useful for extracting a 2FA secret from a QR code before you lose access
        to it, or just checking what a QR code actually points to before scanning it with your phone.
      </div>
    </ToolLayout>
  );
}
