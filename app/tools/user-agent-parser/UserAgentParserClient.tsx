"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Trash2, Monitor, Smartphone, Tablet, Bot, Globe } from "lucide-react";
import { parseUserAgent } from "@/lib/user-agent-parser";

const STORAGE_KEY = "toolninja:user-agent-parser";

const SAMPLES = [
  { label: "iPhone Safari", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1" },
  { label: "Windows Chrome", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36" },
  { label: "Android Chrome", ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36" },
  { label: "macOS Firefox", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0" },
  { label: "Googlebot", ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
  { label: "GPTBot", ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot" },
];

const DEVICE_ICON = { mobile: Smartphone, tablet: Tablet, desktop: Monitor, bot: Bot };

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0">
      <span className="text-xs text-[#888888]">{label}</span>
      <span className="text-sm font-mono text-[#f5f5f5]">{value}</span>
    </div>
  );
}

export default function UserAgentParserClient() {
  const [input, setInput] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInput(saved);
      else if (typeof navigator !== "undefined") setInput(navigator.userAgent);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {}
  }, [input]);

  const result = useMemo(() => (input.trim() ? parseUserAgent(input) : null), [input]);
  const DeviceIcon = result ? DEVICE_ICON[result.device.type] : Globe;

  return (
    <ToolLayout
      title="User-Agent String Parser"
      description="Paste a User-Agent header and break it down into browser, engine, OS, and device — including bot detection"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">User-Agent string</label>
            <button
              onClick={() => setInput("")}
              className="flex items-center gap-1 text-xs text-[#555555] hover:text-[#888888] transition-colors"
            >
              <Trash2 size={11} /> Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Mozilla/5.0 (...)"
            spellCheck={false}
            className="w-full h-32 p-3 font-mono text-xs resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          />

          <div>
            <p className="text-[10px] text-[#555555] mb-2">Samples:</p>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setInput(s.ua)}
                  className="text-[11px] px-2 py-1 bg-[#111111] border border-[#222222] rounded-[4px] text-[#666666] hover:text-[#f5f5f5] hover:border-[#333333] transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#222222] rounded-[8px]">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-[#444444] py-12">
              <Globe size={36} strokeWidth={1} />
              <p className="text-sm">Paste or pick a User-Agent string</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#1a1a1a]">
                <DeviceIcon size={18} className="text-[#a855f7]" />
                <span className="text-sm font-medium text-[#f5f5f5] capitalize">
                  {result.isBot ? "Bot / crawler" : result.device.type}
                </span>
              </div>
              <Field label="Browser" value={result.browser ? `${result.browser.name}${result.browser.version ? " " + result.browser.version : ""}` : "Unknown"} />
              {!result.isBot && <Field label="Rendering engine" value={result.engine ? `${result.engine.name} ${result.engine.version}` : "Unknown"} />}
              <Field label="OS" value={result.os ? `${result.os.name}${result.os.version ? " " + result.os.version : ""}` : "Unknown"} />
              {result.device.vendor && <Field label="Device" value={`${result.device.vendor} ${result.device.model ?? ""}`.trim()} />}
            </>
          )}
        </div>
      </div>

      {input.trim() && (
        <div className="mt-4 flex items-center justify-between p-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-[8px]">
          <code className="text-xs font-mono text-[#666666] break-all">{input}</code>
          <CopyButton text={input} size="sm" className="ml-3 shrink-0" />
        </div>
      )}
    </ToolLayout>
  );
}
