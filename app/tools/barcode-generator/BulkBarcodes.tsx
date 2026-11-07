"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { barcodeSvg, generateBarcode, type BarcodeFormat, type BarcodeResult } from "@/lib/barcode";
import { createZip } from "@/lib/zip-store";

const STORAGE_KEY = "toolninja:barcode-generator-bulk";
const MAX_ROWS = 500;

interface Props {
  format: BarcodeFormat;
  formats: { id: BarcodeFormat; label: string; placeholder: string; hint: string }[];
  onFormat: (f: BarcodeFormat) => void;
  barWidth: number;
  height: number;
}

const safeName = (text: string, index: number) => `${String(index + 1).padStart(3, "0")}-${text.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 60) || "barcode"}`;

function saveBytes(name: string, bytes: Uint8Array, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** The same drawing as the single barcode's PNG download */
function pngBytes(result: BarcodeResult, barWidth: number, height: number): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  const quietZone = barWidth * 10;
  canvas.width = result.modules.length * barWidth + quietZone * 2;
  canvas.height = height + 20;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  for (let i = 0; i < result.modules.length; i++) if (result.modules[i] === "1") ctx.fillRect(quietZone + i * barWidth, 0, barWidth, height);
  ctx.font = "14px monospace";
  ctx.textAlign = "center";
  ctx.fillText(result.displayText, canvas.width / 2, height + 16);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? b.arrayBuffer().then((buf) => resolve(new Uint8Array(buf))) : reject(new Error("PNG failed"))), "image/png");
  });
}

export default function BulkBarcodes({ format, formats, onFormat, barWidth, height }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const active = formats.find((f) => f.id === format)!;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setText(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, text);
    } catch {}
  }, [text]);

  const lines = useMemo(() => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean), [text]);
  const rows = useMemo(
    () =>
      lines.slice(0, MAX_ROWS).map((value) => {
        try {
          return { value, result: generateBarcode(format, value), error: "" };
        } catch (e) {
          return { value, result: null, error: e instanceof Error ? e.message : "Couldn't encode this value" };
        }
      }),
    [lines, format]
  );
  const good = rows.filter((r) => r.result);
  const bad = rows.filter((r) => !r.result);

  const downloadZip = async (kind: "svg" | "png") => {
    setBusy(true);
    try {
      const encoder = new TextEncoder();
      const files = await Promise.all(
        good.map(async (r, i) => ({
          name: `${safeName(r.result!.displayText, i)}.${kind}`,
          data: kind === "svg" ? encoder.encode(barcodeSvg(r.result!, barWidth, height)) : await pngBytes(r.result!, barWidth, height),
        }))
      );
      saveBytes(`barcodes-${format}.zip`, createZip(files), "application/zip");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {formats.map((f) => (
          <button
            key={f.id}
            onClick={() => onFormat(f.id)}
            className={`px-3 py-1.5 text-sm border rounded-[6px] transition-colors ${format === f.id ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="bulk-barcodes" className="text-xs text-[#888888] font-medium block mb-1">
          One value per line — up to {MAX_ROWS}
        </label>
        <textarea
          id="bulk-barcodes"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder={`${active.placeholder}\n…`}
          className="w-full p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
        <p className="text-xs text-[#555555] mt-1">{active.hint}</p>
        {lines.length > MAX_ROWS && <p className="text-xs text-[#fbbf24] mt-1">Only the first {MAX_ROWS} lines are used.</p>}
      </div>

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-[#bbbbbb]">
            {good.length} barcode{good.length === 1 ? "" : "s"}
            {bad.length > 0 && <span className="text-[#f87171]"> · {bad.length} with problems</span>}
          </p>
          {(["png", "svg"] as const).map((kind) => (
            <button
              key={kind}
              disabled={busy || good.length === 0}
              onClick={() => downloadZip(kind)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-[6px] disabled:opacity-50 ${kind === "png" ? "bg-[#a855f7] hover:bg-[#9333ea] text-white" : "bg-[#1a1a1a] border border-[#222222] text-[#f5f5f5] hover:bg-[#222222]"}`}
            >
              <Download size={14} /> ZIP of {kind.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {bad.length > 0 && (
        <ul className="space-y-1 max-h-32 overflow-auto">
          {bad.slice(0, 20).map((r, i) => (
            <li key={i} className="text-xs text-[#f87171] break-all">
              <span className="font-mono">{r.value}</span> — {r.error}
            </li>
          ))}
        </ul>
      )}

      {good.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {good.slice(0, 60).map((r, i) => (
            // An <img> keeps the SVG inert, whatever text the barcode holds
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={`data:image/svg+xml,${encodeURIComponent(barcodeSvg(r.result!, 1, 50))}`} alt={r.result!.displayText} className="w-full h-20 object-contain bg-white rounded p-1" />
          ))}
        </div>
      )}
      {good.length > 60 && <p className="text-xs text-[#666666]">Showing the first 60 here; the ZIP has all {good.length}.</p>}
    </div>
  );
}
