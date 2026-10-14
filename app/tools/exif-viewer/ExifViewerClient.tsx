"use client";

import { useState, useRef } from "react";
import ToolLayout from "@/components/ToolLayout";
import { Upload, FileIcon, MapPin, ShieldCheck, AlertCircle } from "lucide-react";
import { parseExif, stripExif, type ExifData } from "@/lib/exif";

export default function ExifViewerClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [exif, setExif] = useState<ExifData | null | "none">(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
    setExif(null);
    try {
      const buf = await f.arrayBuffer();
      setBuffer(buf);
      const data = parseExif(buf);
      setExif(data && (data.tags.length > 0 || data.gps) ? data : "none");
    } catch {
      setError("Couldn't read this file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const downloadStripped = () => {
    if (!buffer || !file) return;
    const stripped = stripExif(buffer);
    const blob = new Blob([stripped], { type: file.type || "image/jpeg" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name.replace(/(\.[^.]+)?$/, "-stripped$1");
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <ToolLayout title="Image EXIF Viewer & Remover" description="See exactly what metadata is embedded in a photo — camera info, timestamp, GPS location — and strip it before sharing">
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
            <p className="text-sm text-[#888888]">Drag & drop a JPEG photo, or click to upload</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 mb-5 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px]">
          <AlertCircle size={14} className="text-[#ef4444] shrink-0" />
          <span className="text-sm text-[#ef4444]">{error}</span>
        </div>
      )}

      {preview && (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Uploaded photo" className="w-full rounded-[8px] border border-[#222222]" />
            {buffer && (
              <button
                onClick={downloadStripped}
                className="flex items-center justify-center gap-1.5 w-full px-4 py-2 text-sm font-medium bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors"
              >
                <ShieldCheck size={14} /> Download with metadata removed
              </button>
            )}
          </div>

          <div>
            {exif === "none" && (
              <div className="flex items-center gap-2 p-4 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-[8px] text-sm text-[#22c55e]">
                <ShieldCheck size={16} /> No EXIF metadata found in this file — it&apos;s already clean, or isn&apos;t a JPEG with embedded metadata.
              </div>
            )}

            {exif && exif !== "none" && (
              <div className="space-y-4">
                {exif.gps && (
                  <div className="p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-[8px]">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-[#ef4444] mb-1">
                      <MapPin size={14} /> GPS location embedded
                    </div>
                    <p className="text-xs text-[#888888] font-mono">
                      {exif.gps.lat.toFixed(6)}, {exif.gps.lon.toFixed(6)}
                    </p>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${exif.gps.lat}&mlon=${exif.gps.lon}#map=15/${exif.gps.lat}/${exif.gps.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#a855f7] hover:underline"
                    >
                      View on map →
                    </a>
                  </div>
                )}

                {exif.tags.length > 0 && (
                  <div className="space-y-1.5">
                    {exif.tags.map((t) => (
                      <div key={t.tag} className="flex items-center justify-between gap-2 px-3 py-2 bg-[#111111] border border-[#1a1a1a] rounded-[6px] text-sm">
                        <span className="text-[#888888]">{t.name}</span>
                        <code className="text-[#f5f5f5] font-mono text-xs truncate max-w-[60%]">{t.value}</code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!preview && (
        <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
          Upload a JPEG to see its embedded metadata
        </div>
      )}

      <div className="mt-6 p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs text-[#666666] leading-relaxed">
        EXIF metadata is embedded by most cameras and phones — it can include the exact GPS
        coordinates a photo was taken at, the device model, and the precise timestamp, none of
        which is visible just by looking at the image. Removing it before sharing a photo publicly
        is a genuine, common-sense privacy step. Parsing covers JPEG files specifically (the format
        the vast majority of cameras and phones actually produce) — everything runs locally; the
        image is never uploaded anywhere.
      </div>
    </ToolLayout>
  );
}
