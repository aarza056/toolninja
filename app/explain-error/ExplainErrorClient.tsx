"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Search, ArrowRight, Wrench } from "lucide-react";
import { matchError, type ErrorArticleIndex, type ErrorMatch } from "@/lib/error-matcher";
import { tools } from "@/lib/tools";

interface Props {
  articles: ErrorArticleIndex[];
}

export default function ExplainErrorClient({ articles }: Props) {
  const [input, setInput] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedInput(input), 250);
    return () => clearTimeout(t);
  }, [input]);

  const matches: ErrorMatch[] = useMemo(
    () => matchError(debouncedInput, articles),
    [debouncedInput, articles]
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#555555] mb-8">
        <Link href="/" className="hover:text-[#888888] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#f5f5f5]">Explain This Error</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-[#f5f5f5] mb-3">
        Explain This Error
      </h1>
      <p className="text-[#888888] text-base leading-relaxed mb-8">
        Paste any error message and we&apos;ll match it against ToolNinja&apos;s developer guides —
        no AI, just keyword matching against real articles.
      </p>

      <div className="relative mb-6">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your error message here…"
          rows={4}
          className="w-full p-4 font-mono text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
          spellCheck={false}
          autoFocus
        />
        <Search size={16} className="absolute top-4 right-4 text-[#444444]" />
      </div>

      {matches.length > 0 && (
        <div className="space-y-3">
          {matches.map((m) => {
            const tool = tools.find((t) => t.slug === m.toolSlug);
            return (
              <div
                key={m.slug}
                className="p-4 bg-[#111111] border border-[#222222] rounded-[8px]"
              >
                <h3 className="text-sm font-semibold text-[#f5f5f5] mb-2">{m.title}</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/blog/${m.slug}`}
                    className="flex items-center gap-1 text-xs text-[#a855f7] hover:text-[#c084fc] transition-colors"
                  >
                    Open guide <ArrowRight size={12} />
                  </Link>
                  {tool && (
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="flex items-center gap-1 text-xs text-[#666666] hover:text-[#888888] transition-colors"
                    >
                      <Wrench size={11} /> Try the tool <ArrowRight size={12} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {debouncedInput.trim() && matches.length === 0 && (
        <div className="p-6 text-center border border-dashed border-[#222222] rounded-[8px]">
          <p className="text-sm text-[#666666] mb-2">
            No matches yet — we&apos;re adding new error guides every week.
          </p>
          <Link
            href="/blog"
            className="text-sm text-[#a855f7] hover:text-[#c084fc] transition-colors"
          >
            Search all guides →
          </Link>
        </div>
      )}

      {!debouncedInput.trim() && (
        <div className="p-6 text-center border border-dashed border-[#222222] rounded-[8px] text-[#444444] text-sm">
          Paste an error message above to see matching guides
        </div>
      )}
    </div>
  );
}
