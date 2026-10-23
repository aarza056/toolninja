"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { AlertTriangle } from "lucide-react";
import { convertHtaccessToNginx } from "@/lib/htaccess-to-nginx";

const STORAGE_KEY = "toolninja:htaccess-to-nginx";

const EXAMPLE = `RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

# WordPress front controller
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]

ErrorDocument 404 /404.html
DirectoryIndex index.php index.html
Options -Indexes`;

export default function HtaccessToNginxClient() {
  const [input, setInput] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const { output, warnings } = useMemo(() => {
    if (!input.trim()) return { output: "", warnings: [] };
    try {
      return convertHtaccessToNginx(input);
    } catch {
      return { output: "", warnings: ["Could not parse this .htaccess file."] };
    }
  }, [input]);

  return (
    <ToolLayout
      title=".htaccess to Nginx Converter"
      description="Convert Apache .htaccess rules to nginx server block syntax — RewriteRule, RewriteCond, redirects, and more"
    >
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setInput(EXAMPLE)}
          className="text-xs text-[#a855f7] hover:text-[#9333ea] transition-colors"
        >
          Load example
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: "420px" }}>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-[#888888] font-medium">.htaccess</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your .htaccess contents here…"
            spellCheck={false}
            className="flex-1 p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] resize-none"
            style={{ minHeight: "400px" }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">nginx (server block)</label>
            {output && <CopyButton text={output} size="sm" />}
          </div>
          <pre
            className="flex-1 p-3 font-mono text-xs bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] overflow-auto whitespace-pre-wrap"
            style={{ minHeight: "400px" }}
          >
            {output || <span className="text-[#444444] italic">Nginx config will appear here…</span>}
          </pre>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 p-3 bg-[#f97316]/10 border border-[#f97316]/30 rounded-[8px]">
          <div className="flex items-center gap-2 text-xs font-medium text-[#f97316] mb-2">
            <AlertTriangle size={14} />
            {warnings.length} directive{warnings.length !== 1 ? "s" : ""} need manual review
          </div>
          <ul className="space-y-1.5">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-[#888888] font-mono whitespace-pre-wrap">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </ToolLayout>
  );
}
