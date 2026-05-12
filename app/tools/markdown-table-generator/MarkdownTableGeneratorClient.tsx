"use client";

import { useState, useCallback, useMemo, useRef, KeyboardEvent } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlignLeft, AlignCenter, AlignRight, Plus, Minus, Upload } from "lucide-react";

type Alignment = "left" | "center" | "right";
type OutputTab = "markdown" | "html" | "preview";

const DEFAULT_COLS = 3;
const DEFAULT_ROWS = 3;

function makeGrid(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(""));
}

function alignSeparator(a: Alignment) {
  if (a === "center") return ":---:";
  if (a === "right") return "---:";
  return "---";
}

function toMarkdown(headers: string[], data: string[][], alignments: Alignment[]) {
  const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - s.length));
  const colWidths = headers.map((h, ci) =>
    Math.max(h.length, ...data.map((r) => (r[ci] ?? "").length), alignSeparator(alignments[ci]).length)
  );

  const headerRow = "| " + headers.map((h, ci) => pad(h, colWidths[ci])).join(" | ") + " |";
  const sepRow =
    "| " +
    alignments
      .map((a, ci) => {
        const sep = alignSeparator(a);
        return pad(sep, colWidths[ci]);
      })
      .join(" | ") +
    " |";
  const dataRows = data.map(
    (row) => "| " + row.map((cell, ci) => pad(cell ?? "", colWidths[ci])).join(" | ") + " |"
  );
  return [headerRow, sepRow, ...dataRows].join("\n");
}

function toHtml(headers: string[], data: string[][], alignments: Alignment[]) {
  const styleFor = (a: Alignment) => ` style="text-align:${a}"`;
  const thead =
    "  <thead>\n    <tr>\n" +
    headers.map((h, ci) => `      <th${styleFor(alignments[ci])}>${esc(h)}</th>`).join("\n") +
    "\n    </tr>\n  </thead>";
  const tbody =
    "  <tbody>\n" +
    data
      .map(
        (row) =>
          "    <tr>\n" +
          row.map((cell, ci) => `      <td${styleFor(alignments[ci])}>${esc(cell ?? "")}</td>`).join("\n") +
          "\n    </tr>"
      )
      .join("\n") +
    "\n  </tbody>";
  return `<table>\n${thead}\n${tbody}\n</table>`;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function MarkdownTableGeneratorClient() {
  const [headers, setHeaders] = useState<string[]>(["Name", "Role", "Status"]);
  const [data, setData] = useState<string[][]>(makeGrid(DEFAULT_ROWS, DEFAULT_COLS));
  const [alignments, setAlignments] = useState<Alignment[]>(Array(DEFAULT_COLS).fill("left"));
  const [activeTab, setActiveTab] = useState<OutputTab>("markdown");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const numCols = headers.length;
  const numRows = data.length;

  const addRow = useCallback(() => {
    setData((d) => [...d, Array(numCols).fill("")]);
  }, [numCols]);

  const removeRow = useCallback(() => {
    if (numRows <= 1) return;
    setData((d) => d.slice(0, -1));
  }, [numRows]);

  const addCol = useCallback(() => {
    setHeaders((h) => [...h, `Col ${h.length + 1}`]);
    setData((d) => d.map((row) => [...row, ""]));
    setAlignments((a) => [...a, "left"]);
  }, []);

  const removeCol = useCallback(() => {
    if (numCols <= 1) return;
    setHeaders((h) => h.slice(0, -1));
    setData((d) => d.map((row) => row.slice(0, -1)));
    setAlignments((a) => a.slice(0, -1));
  }, [numCols]);

  const setAlignment = useCallback((ci: number, a: Alignment) => {
    setAlignments((prev) => {
      const next = [...prev];
      next[ci] = a;
      return next;
    });
  }, []);

  const setHeader = useCallback((ci: number, val: string) => {
    setHeaders((prev) => {
      const next = [...prev];
      next[ci] = val;
      return next;
    });
  }, []);

  const setCell = useCallback((ri: number, ci: number, val: string) => {
    setData((prev) => {
      const next = prev.map((row) => [...row]);
      next[ri][ci] = val;
      return next;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, ri: number, ci: number) => {
      if (e.key === "Tab" && !e.shiftKey && ri === numRows - 1 && ci === numCols - 1) {
        e.preventDefault();
        addRow();
        // Focus will shift to new row via next tick
        setTimeout(() => {
          const inputs = document.querySelectorAll<HTMLInputElement>("[data-cell]");
          inputs[inputs.length - numCols]?.focus();
        }, 0);
      }
    },
    [numRows, numCols, addRow]
  );

  const importCsv = useCallback((text: string) => {
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length === 0) return;
    const rows = lines.map((l) =>
      l.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
    );
    const maxCols = Math.max(...rows.map((r) => r.length));
    const padded = rows.map((r) => [...r, ...Array(Math.max(0, maxCols - r.length)).fill("")]);
    const [headerRow, ...dataRows] = padded;
    setHeaders(headerRow ?? []);
    setData(dataRows.length > 0 ? dataRows : [Array(maxCols).fill("")]);
    setAlignments(Array(maxCols).fill("left"));
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        importCsv(text);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [importCsv]
  );

  const markdownOutput = useMemo(
    () => toMarkdown(headers, data, alignments),
    [headers, data, alignments]
  );
  const htmlOutput = useMemo(
    () => toHtml(headers, data, alignments),
    [headers, data, alignments]
  );

  const tabs: OutputTab[] = ["markdown", "html", "preview"];

  return (
    <ToolLayout
      title="Markdown Table Generator"
      description="Build tables visually, copy as Markdown, HTML, or preview the rendered result."
    >
      <div className="space-y-5">
        {/* Controls bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={removeRow}
              disabled={numRows <= 1}
              className="p-1.5 rounded-[4px] border border-[#222222] text-[#888888] hover:border-[#a855f7] hover:text-[#a855f7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Remove last row"
            >
              <Minus size={13} />
            </button>
            <span className="text-xs text-[#888888] px-1.5 tabular-nums">{numRows} row{numRows !== 1 ? "s" : ""}</span>
            <button
              onClick={addRow}
              className="p-1.5 rounded-[4px] border border-[#222222] text-[#888888] hover:border-[#a855f7] hover:text-[#a855f7] transition-colors"
              title="Add row"
            >
              <Plus size={13} />
            </button>
          </div>
          <span className="text-[#333333]">·</span>
          <div className="flex items-center gap-1">
            <button
              onClick={removeCol}
              disabled={numCols <= 1}
              className="p-1.5 rounded-[4px] border border-[#222222] text-[#888888] hover:border-[#a855f7] hover:text-[#a855f7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Remove last column"
            >
              <Minus size={13} />
            </button>
            <span className="text-xs text-[#888888] px-1.5 tabular-nums">{numCols} col{numCols !== 1 ? "s" : ""}</span>
            <button
              onClick={addCol}
              className="p-1.5 rounded-[4px] border border-[#222222] text-[#888888] hover:border-[#a855f7] hover:text-[#a855f7] transition-colors"
              title="Add column"
            >
              <Plus size={13} />
            </button>
          </div>
          <span className="text-[#333333]">·</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border border-[#222222] text-[#888888] hover:border-[#a855f7] hover:text-[#a855f7] text-xs transition-colors"
          >
            <Upload size={12} />
            Import CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Grid editor */}
        <div className="overflow-x-auto rounded-[8px] border border-[#222222]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#222222] bg-[#0d0d0d]">
                {headers.map((h, ci) => (
                  <th key={ci} className="border-r last:border-r-0 border-[#222222] p-0">
                    <div className="flex flex-col">
                      <input
                        value={h}
                        onChange={(e) => setHeader(ci, e.target.value)}
                        placeholder={`Column ${ci + 1}`}
                        className="w-full bg-transparent px-3 py-2 text-[#f5f5f5] font-semibold placeholder:text-[#444444] focus:outline-none focus:bg-[#a855f7]/5 transition-colors min-w-[80px]"
                      />
                      <div className="flex border-t border-[#1a1a1a]">
                        {(["left", "center", "right"] as Alignment[]).map((a) => (
                          <button
                            key={a}
                            onClick={() => setAlignment(ci, a)}
                            title={`Align ${a}`}
                            className={`flex-1 flex justify-center py-1 transition-colors ${
                              alignments[ci] === a
                                ? "text-[#a855f7] bg-[#a855f7]/10"
                                : "text-[#444444] hover:text-[#888888]"
                            }`}
                          >
                            {a === "left" && <AlignLeft size={11} />}
                            {a === "center" && <AlignCenter size={11} />}
                            {a === "right" && <AlignRight size={11} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, ri) => (
                <tr key={ri} className="border-b last:border-b-0 border-[#1a1a1a] hover:bg-[#0d0d0d]/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="border-r last:border-r-0 border-[#1a1a1a] p-0">
                      <input
                        data-cell
                        value={cell}
                        onChange={(e) => setCell(ri, ci, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, ri, ci)}
                        placeholder="—"
                        className="w-full bg-transparent px-3 py-2 text-[#f5f5f5] placeholder:text-[#333333] focus:outline-none focus:bg-[#a855f7]/5 transition-colors min-w-[80px]"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Output tabs */}
        <div className="border border-[#222222] rounded-[8px] overflow-hidden">
          <div className="flex border-b border-[#222222] bg-[#0d0d0d]">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "text-[#a855f7] border-b-2 border-[#a855f7] -mb-px"
                    : "text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                {tab}
              </button>
            ))}
            <div className="flex-1" />
            <div className="flex items-center px-3">
              <CopyButton
                text={activeTab === "html" ? htmlOutput : markdownOutput}
                size="sm"
                label={`Copy ${activeTab === "preview" ? "Markdown" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
              />
            </div>
          </div>

          <div className="p-4 bg-[#111111]">
            {activeTab === "markdown" && (
              <pre className="font-mono text-xs text-[#a855f7] overflow-x-auto whitespace-pre leading-relaxed">
                {markdownOutput}
              </pre>
            )}
            {activeTab === "html" && (
              <pre className="font-mono text-xs text-[#22c55e] overflow-x-auto whitespace-pre leading-relaxed">
                {htmlOutput}
              </pre>
            )}
            {activeTab === "preview" && (
              <div
                className="prose prose-sm prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    // Render markdown table to HTML for preview
                    return toHtml(headers, data, alignments)
                      .replace(/<table>/g, '<table class="md-preview-table">')
                      .replace(/<th/g, '<th class="md-preview-th"')
                      .replace(/<td/g, '<td class="md-preview-td"');
                  })(),
                }}
              />
            )}
          </div>
        </div>

        <p className="text-xs text-[#444444] text-center">
          Tab in the last cell to add a new row automatically.
        </p>
      </div>

      <style jsx global>{`
        .md-preview-table {
          border-collapse: collapse;
          width: 100%;
          font-size: 13px;
        }
        .md-preview-th,
        .md-preview-td {
          border: 1px solid #222222;
          padding: 6px 12px;
        }
        .md-preview-th {
          background: #0d0d0d;
          color: #f5f5f5;
          font-weight: 600;
        }
        .md-preview-td {
          color: #d4d4d4;
        }
      `}</style>
    </ToolLayout>
  );
}
