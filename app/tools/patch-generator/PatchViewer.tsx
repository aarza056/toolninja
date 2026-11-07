"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { parsePatch, sideBySide, type FileStatus, type PatchFile, type PatchLine } from "@/lib/patch-parser";

const STORAGE_KEY = "toolninja:patch-viewer";
const MAX_INPUT = 2_000_000;

const EXAMPLE = `From 3f2a1c9d8e7b6a5f4e3d2c1b0a9f8e7d6c5b4a39 Mon Sep 17 00:00:00 2001
From: Ada Lovelace <ada@example.com>
Date: Sat, 7 Nov 2026 10:12:00 +0000
Subject: [PATCH] Validate the page size and add a health check

diff --git a/src/api.js b/src/api.js
index 83db48f..bf2a1c9 100644
--- a/src/api.js
+++ b/src/api.js
@@ -12,5 +12,6 @@ function listItems(req, res) {
   const page = Number(req.query.page) || 1;
-  const size = Number(req.query.size) || 20;
+  const size = Math.min(Number(req.query.size) || 20, 100);
   const items = store.find({ page, size });
+  res.set("Cache-Control", "no-store");
   res.json({ items, page, size });
 }
diff --git a/src/health.js b/src/health.js
new file mode 100644
index 0000000..e69de29
--- /dev/null
+++ b/src/health.js
@@ -0,0 +1,3 @@
+export function health(req, res) {
+  res.json({ status: "ok" });
+}
diff --git a/logo.png b/logo.png
index 1b2c3d4..5e6f7a8 100644
Binary files a/logo.png and b/logo.png differ
`;

const STATUS: Record<FileStatus, { label: string; tone: string }> = {
  modified: { label: "Modified", tone: "text-[#60a5fa] border-[#60a5fa]/30" },
  added: { label: "Added", tone: "text-[#4ade80] border-[#4ade80]/30" },
  deleted: { label: "Deleted", tone: "text-[#f87171] border-[#f87171]/30" },
  renamed: { label: "Renamed", tone: "text-[#c084fc] border-[#c084fc]/30" },
  binary: { label: "Binary", tone: "text-[#fbbf24] border-[#fbbf24]/30" },
};

const LINE_TONE: Record<PatchLine["type"], string> = {
  context: "text-[#999999]",
  delete: "bg-[#ef4444]/10 text-[#fca5a5]",
  insert: "bg-[#22c55e]/10 text-[#86efac]",
  note: "text-[#666666] italic",
};
const MARK: Record<PatchLine["type"], string> = { context: " ", delete: "-", insert: "+", note: " " };

const No = ({ n }: { n: number | null }) => <span className="inline-block w-10 shrink-0 pr-2 text-right text-[#444444] select-none">{n ?? ""}</span>;

function Unified({ file }: { file: PatchFile }) {
  return (
    <>
      {file.hunks.map((h, i) => (
        <div key={i}>
          <div className="px-2 py-0.5 text-[#60a5fa] bg-[#3b82f6]/5 truncate">{h.header}</div>
          {h.lines.map((l, j) => (
            <div key={j} className={`flex whitespace-pre ${LINE_TONE[l.type]}`}>
              <No n={l.oldNo} />
              <No n={l.newNo} />
              <span className="pr-1 select-none">{MARK[l.type]}</span>
              <span>{l.text}</span>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function Split({ file }: { file: PatchFile }) {
  const cell = (l: PatchLine | null, side: "old" | "new") => (
    <div className={`flex flex-1 min-w-0 overflow-hidden whitespace-pre ${l ? LINE_TONE[l.type] : "bg-[#0d0d0d]"}`}>
      <No n={l ? (side === "old" ? l.oldNo : l.newNo) : null} />
      <span className="overflow-x-auto">{l?.text ?? ""}</span>
    </div>
  );
  return (
    <>
      {file.hunks.map((h, i) => (
        <div key={i}>
          <div className="px-2 py-0.5 text-[#60a5fa] bg-[#3b82f6]/5 truncate">{h.header}</div>
          {sideBySide(h).map((r, j) => (
            <div key={j} className="flex divide-x divide-[#1f1f1f]">
              {cell(r.left, "old")}
              {cell(r.right, "new")}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

export default function PatchViewer() {
  const [text, setText] = useState("");
  const [view, setView] = useState<"unified" | "split">("unified");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setText(localStorage.getItem(STORAGE_KEY) || EXAMPLE);
    } catch {
      setText(EXAMPLE);
    }
  }, []);
  useEffect(() => {
    if (!text) return;
    try {
      localStorage.setItem(STORAGE_KEY, text);
    } catch {}
  }, [text]);

  const patch = useMemo(() => parsePatch(text), [text]);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_INPUT) {
      setError("That patch is over 2 MB — too large to show in the browser.");
      return;
    }
    setError("");
    setText(await f.text());
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="patch-view-input" className="text-xs text-[#888888] font-medium">
            Patch or diff — from git diff, git format-patch or diff -u
          </label>
          <button onClick={() => fileInput.current?.click()} className="flex items-center gap-1 text-xs text-[#a855f7] hover:text-[#c084fc]">
            <Upload size={12} /> Open a .patch file
          </button>
          <input ref={fileInput} type="file" accept=".patch,.diff,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        <textarea
          id="patch-view-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          spellCheck={false}
          className="w-full p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
        />
        {error && <p className="text-xs text-[#f87171] mt-1">{error}</p>}
      </div>

      {text.trim() && patch.files.length === 0 && <p className="text-sm text-[#fbbf24]">No diff found. A patch has lines like “--- a/file”, “+++ b/file” and “@@ -1,3 +1,3 @@”.</p>}

      {patch.files.length > 0 && (
        <>
          {patch.commits.map((c, i) => (
            <div key={i} className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] text-xs space-y-0.5">
              {c.subject && <p className="text-sm text-[#f5f5f5]">{c.subject}</p>}
              <p className="text-[#888888]">
                {c.author && <span>{c.author}</span>}
                {c.date && <span> · {c.date}</span>}
              </p>
              {c.hash && <p className="font-mono text-[#555555]">{c.hash}</p>}
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[#bbbbbb]">
              {patch.files.length} file{patch.files.length === 1 ? "" : "s"} changed · <span className="text-[#4ade80]">+{patch.additions}</span> <span className="text-[#f87171]">−{patch.deletions}</span>
            </p>
            <div className="flex rounded-[6px] border border-[#222222] overflow-hidden">
              {(["unified", "split"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-xs ${view === v ? "bg-[#a855f7] text-white" : "bg-[#111111] text-[#888888] hover:text-[#f5f5f5]"}`}>
                  {v === "unified" ? "Unified" : "Side by side"}
                </button>
              ))}
            </div>
          </div>

          {patch.files.map((f, i) => (
            <div key={i} className="border border-[#222222] rounded-[8px] overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-[#111111] text-xs">
                <span className={`px-1.5 py-0.5 border rounded ${STATUS[f.status].tone}`}>{STATUS[f.status].label}</span>
                <span className="font-mono text-[#f5f5f5] break-all">{f.status === "renamed" ? `${f.oldPath} → ${f.newPath}` : f.newPath || f.oldPath}</span>
                <span className="ml-auto font-mono">
                  <span className="text-[#4ade80]">+{f.additions}</span> <span className="text-[#f87171]">−{f.deletions}</span>
                </span>
                {f.notes.map((n) => (
                  <span key={n} className="w-full text-[#666666]">
                    {n}
                  </span>
                ))}
              </div>
              {f.hunks.length > 0 ? (
                <div className="overflow-x-auto font-mono text-xs leading-5 py-1">{view === "unified" ? <Unified file={f} /> : <Split file={f} />}</div>
              ) : (
                <p className="px-3 py-2 text-xs text-[#666666]">{f.status === "binary" ? "Binary file — no text changes to show." : "No line changes."}</p>
              )}
            </div>
          ))}
        </>
      )}
      <p className="text-xs text-[#666666]">Your patch stays in this browser tab; nothing is uploaded.</p>
    </div>
  );
}
