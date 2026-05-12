"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "md";
  label?: string;
  onAfterCopy?: () => void;
}

export default function CopyButton({ text, className = "", size = "md", label, onAfterCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onAfterCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      onAfterCopy?.();
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text, onAfterCopy]);

  const sizeClasses = size === "sm"
    ? "px-2 py-1 text-xs gap-1"
    : "px-3 py-1.5 text-sm gap-1.5";

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center ${sizeClasses} rounded-[6px] border transition-colors ${
        copied
          ? "border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10"
          : "border-[#222222] text-[#888888] hover:border-[#a855f7] hover:text-[#a855f7] bg-[#111111]"
      } ${className}`}
      title="Copy to clipboard (Ctrl+Shift+C)"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied!" : (label ?? "Copy")}
    </button>
  );
}
