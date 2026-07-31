"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertCircle, Download } from "lucide-react";
import { mermaidTemplates } from "@/lib/mermaid-templates";

const STORAGE_KEY = "toolninja:mermaid-editor";
let renderCounter = 0;

const THEME_VARIABLES = {
  darkMode: true,
  background: "#0a0a0a",
  primaryColor: "#1a1a1a",
  primaryTextColor: "#f5f5f5",
  primaryBorderColor: "#a855f7",
  lineColor: "#888888",
  secondaryColor: "#111111",
  tertiaryColor: "#111111",
  textColor: "#f5f5f5",
  mainBkg: "#1a1a1a",
  nodeBorder: "#a855f7",
  clusterBkg: "#111111",
  clusterBorder: "#333333",
  edgeLabelBackground: "#0a0a0a",
  actorBkg: "#1a1a1a",
  actorBorder: "#a855f7",
  actorTextColor: "#f5f5f5",
  signalColor: "#888888",
  signalTextColor: "#f5f5f5",
  labelBoxBkgColor: "#1a1a1a",
  labelBoxBorderColor: "#a855f7",
  labelTextColor: "#f5f5f5",
  loopTextColor: "#f5f5f5",
  noteBkgColor: "#1a1a1a",
  noteBorderColor: "#a855f7",
  noteTextColor: "#f5f5f5",
};

export default function MermaidEditorClient() {
  const [code, setCode] = useState(mermaidTemplates[0].code);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCode(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, code); } catch {}
  }, [code]);

  const render = useCallback(async (text: string) => {
    if (!text.trim()) {
      setSvg("");
      setError("");
      return;
    }
    try {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: THEME_VARIABLES,
        securityLevel: "strict",
        fontFamily: "ui-monospace, monospace",
      });
      const id = `mermaid-${renderCounter++}`;
      const { svg: rendered } = await mermaid.render(id, text);
      setSvg(rendered);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message.split("\n")[0] : "Failed to render diagram");
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => render(code), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [code, render]);

  const downloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "diagram.svg";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadPng = () => {
    if (!svg || !containerRef.current) return;
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const bbox = svgEl.getBoundingClientRect();
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = bbox.width * scale;
      canvas.height = bbox.height * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, bbox.width, bbox.height);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "diagram.png";
          a.click();
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <ToolLayout
      title="Mermaid Diagram Editor"
      description="Write flowcharts, sequence diagrams, and more as text — rendered live"
    >
      {/* Template picker */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {mermaidTemplates.map((t) => (
          <button
            key={t.id}
            onClick={() => setCode(t.code)}
            className="px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-[#f5f5f5] border border-[#222222] rounded-[6px] transition-colors"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">Mermaid syntax</label>
            <CopyButton text={code} size="sm" />
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full h-[calc(100vh-360px)] min-h-[350px] p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-1">
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>

        {/* Preview */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">Preview</label>
            {svg && (
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadSvg}
                  className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
                >
                  <Download size={12} /> SVG
                </button>
                <button
                  onClick={downloadPng}
                  className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#f5f5f5] transition-colors"
                >
                  <Download size={12} /> PNG
                </button>
              </div>
            )}
          </div>
          <div
            ref={containerRef}
            className="h-[calc(100vh-360px)] min-h-[350px] p-4 bg-[#0a0a0a] border border-[#222222] rounded-[8px] overflow-auto flex items-center justify-center"
          >
            {svg ? (
              <div dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              <p className="text-[#444444] text-sm">Diagram preview will appear here…</p>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
