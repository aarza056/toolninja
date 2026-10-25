"use client";

import { useEffect, useMemo, useState } from "react";
import CopyButton from "@/components/CopyButton";
import { extractSecret, generateTOTP } from "@/lib/totp";
import { Zap } from "lucide-react";

// "2FA live code": paste secrets, get the current codes. One secret per line, any common format.
// Nothing here is saved — not even to localStorage — because these are login secrets.

export default function LiveCodes() {
  const [input, setInput] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [left, setLeft] = useState(30);

  const entries = useMemo(
    () =>
      input
        .split(/\r?\n/)
        .map((line) => ({ line, parsed: extractSecret(line) }))
        .filter((e) => e.line.trim())
        .slice(0, 50),
    [input]
  );

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const now = Date.now();
      const next = await Promise.all(entries.map((e) => (e.parsed ? generateTOTP(e.parsed.secret).catch(() => "") : Promise.resolve(""))));
      if (!alive) return;
      setCodes(next);
      setLeft(30 - (Math.floor(now / 1000) % 30));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [entries]);

  return (
    <section className="mb-8 p-4 bg-[#0f0f10] border border-[#a855f7]/30 rounded-[12px]">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-[#f5f5f5]">
        <Zap size={15} className="text-[#a855f7]" /> 2FA live code
      </h2>
      <p className="text-xs text-[#999999] mt-1">Paste a 2FA secret — or several, one per line — and get the current 6-digit code. Spaces, lowercase and otpauth:// links are fine.</p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={entries.length > 1 ? 4 : 2}
        spellCheck={false}
        autoComplete="off"
        placeholder="JBSWY3DPEHPK3PXP"
        aria-label="2FA secrets, one per line"
        className="mt-3 w-full p-3 font-mono text-sm bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
      />
      {entries.length > 0 && (
        <ul className="mt-3 space-y-2">
          {entries.map((e, i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-2 bg-[#111111] border border-[#222222] rounded-[8px]">
              {e.parsed && codes[i] ? (
                <>
                  <span className="font-mono text-2xl font-bold tracking-[0.2em] text-[#a855f7] tabular-nums">{codes[i]}</span>
                  <span className="flex-1 min-w-0 text-xs text-[#888888] truncate">
                    {e.parsed.label || `${e.parsed.secret.slice(0, 4)}…${e.parsed.secret.slice(-4)}`}
                  </span>
                  <span className={`text-xs tabular-nums ${left <= 5 ? "text-[#f87171]" : "text-[#666666]"}`}>{left}s</span>
                  <CopyButton text={codes[i]} size="sm" />
                </>
              ) : (
                <span className="text-xs text-[#f87171] truncate">Not a valid Base32 secret: {e.line.slice(0, 40)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-[#666666]">Codes are calculated in your browser and nothing is saved. Need custom digits, period or SHA-256? Use the full generator below.</p>
    </section>
  );
}
