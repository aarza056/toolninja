"use client";

import { useState, useRef, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { ImageIcon, Trash2, Upload } from "lucide-react";

interface ImageInfo {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  dataUri: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function truncateForDisplay(str: string, maxLen = 120): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

export default function ImageToBase64Client() {
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    const ACCEPTED = ["image/png", "image/jpeg", "image/gif", "image/svg+xml", "image/webp"];
    setError("");
    if (!ACCEPTED.includes(file.type)) {
      setError("Unsupported file type. Please upload PNG, JPEG, GIF, SVG, or WebP.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setImageInfo({
          name: file.name,
          size: file.size,
          type: file.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
          dataUri,
        });
      };
      img.onerror = () => {
        // SVGs may not load via Image(), still show the data
        setImageInfo({
          name: file.name,
          size: file.size,
          type: file.type,
          width: 0,
          height: 0,
          dataUri,
        });
      };
      img.src = dataUri;
    };
    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleClear = () => {
    setImageInfo(null);
    setError("");
  };

  const htmlTag = imageInfo ? `<img src="${imageInfo.dataUri}" alt="${imageInfo.name}" />` : "";
  const cssBackground = imageInfo ? `background-image: url('${imageInfo.dataUri}');` : "";

  return (
    <ToolLayout
      title="Image to Base64 Converter"
      description="Convert images to Base64 data URIs for embedding in HTML and CSS."
    >
      <div className="max-w-2xl space-y-6">
        {!imageInfo ? (
          <>
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-[8px] cursor-pointer transition-colors ${
                dragging
                  ? "border-[#a855f7] bg-[#a855f7]/5"
                  : "border-[#333333] hover:border-[#444444] bg-[#111111]"
              }`}
            >
              <div
                className={`p-3 rounded-full transition-colors ${
                  dragging ? "bg-[#a855f7]/20" : "bg-[#1a1a1a]"
                }`}
              >
                <Upload
                  size={24}
                  className={dragging ? "text-[#a855f7]" : "text-[#555555]"}
                />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${dragging ? "text-[#a855f7]" : "text-[#888888]"}`}>
                  Drop image here or click to upload
                </p>
                <p className="text-xs text-[#555555] mt-1">
                  Supports PNG, JPEG, GIF, SVG, WebP
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#111111] border border-[#ef4444] rounded-[8px]">
                <ImageIcon size={14} className="text-[#ef4444] shrink-0" />
                <span className="text-sm text-[#ef4444]">{error}</span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Image preview */}
            <div className="bg-[#111111] border border-[#222222] rounded-[8px] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#888888] font-medium">Preview</span>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#ef4444] border border-[#222222] rounded-[6px] transition-colors"
                >
                  <Trash2 size={11} /> Remove
                </button>
              </div>
              <div className="flex items-center justify-center bg-[#0a0a0a] rounded-[6px] p-4" style={{ minHeight: "120px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageInfo.dataUri}
                  alt={imageInfo.name}
                  style={{ maxHeight: "200px", maxWidth: "100%", objectFit: "contain" }}
                  className="rounded-[4px]"
                />
              </div>
            </div>

            {/* File info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Filename", value: imageInfo.name },
                { label: "Size", value: formatBytes(imageInfo.size) },
                { label: "Type", value: imageInfo.type.replace("image/", "") },
                {
                  label: "Dimensions",
                  value: imageInfo.width && imageInfo.height
                    ? `${imageInfo.width} × ${imageInfo.height}`
                    : "N/A",
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#111111] border border-[#222222] rounded-[8px] p-3">
                  <p className="text-[10px] text-[#555555] uppercase tracking-wide font-medium mb-1">{label}</p>
                  <p className="text-sm text-[#f5f5f5] truncate font-mono" title={value}>{value}</p>
                </div>
              ))}
            </div>

            {/* Outputs */}
            {[
              {
                id: "data-uri",
                label: "Data URI",
                value: imageInfo.dataUri,
              },
              {
                id: "html-tag",
                label: "HTML img tag",
                value: htmlTag,
              },
              {
                id: "css-bg",
                label: "CSS background",
                value: cssBackground,
              },
            ].map(({ id, label, value }) => (
              <div key={id}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-[#888888] font-medium">{label}</label>
                  <CopyButton text={value} size="sm" />
                </div>
                <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] max-h-[80px] overflow-y-auto">
                  <code className="text-xs font-mono text-[#f5f5f5] break-all whitespace-pre-wrap">
                    {truncateForDisplay(value, 300)}
                  </code>
                </div>
              </div>
            ))}

            {/* Base64 size note */}
            <p className="text-xs text-[#555555]">
              Base64 encoded size:{" "}
              <span className="text-[#888888] font-mono">
                {formatBytes(Math.round(imageInfo.dataUri.length * 0.75))}
              </span>{" "}
              (~33% larger than the original binary)
            </p>
          </>
        )}
      </div>
    </ToolLayout>
  );
}
