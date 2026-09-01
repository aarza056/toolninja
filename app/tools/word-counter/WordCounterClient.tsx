"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import { Trash2 } from "lucide-react";
import { computeTextStats } from "@/lib/text-stats";

const STORAGE_KEY = "toolninja:word-counter";

export default function WordCounterClient() {
  const [text, setText] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setText(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, text); } catch {}
  }, [text]);

  const stats = useMemo(() => computeTextStats(text), [text]);

  const statCards = [
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.characters },
    { label: "Characters (no spaces)", value: stats.charactersNoSpaces },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
    { label: "Reading time", value: `${stats.readingTimeMinutes} min` },
    { label: "Speaking time", value: `${stats.speakingTimeMinutes} min` },
  ];

  return (
    <ToolLayout title="Word Counter" description="Count words, characters, sentences, and estimate reading time — live as you type">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#888888] font-medium">Text</label>
            {text && (
              <button
                onClick={() => setText("")}
                className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#ef4444] transition-colors"
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your text here…"
            className="w-full h-[calc(100vh-280px)] min-h-[350px] p-3 text-sm resize-none bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] leading-relaxed"
            spellCheck={true}
          />
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {statCards.map((s) => (
              <div key={s.label} className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
                <div className="text-lg font-semibold text-[#a855f7] font-mono">{s.value}</div>
                <div className="text-[11px] text-[#888888] leading-tight mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {stats.readability && (
            <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <div className="text-[11px] text-[#888888] font-medium uppercase tracking-wide mb-2">Readability</div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg font-semibold text-[#a855f7] font-mono">{stats.readability.fleschReadingEase}</span>
                <span className="text-[11px] text-[#555555]">Flesch Reading Ease</span>
              </div>
              <p className="text-xs text-[#888888] mb-2">{stats.readability.level}</p>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1a1a1a]">
                <span className="text-[#555555]">Flesch-Kincaid grade level</span>
                <span className="font-mono text-[#f5f5f5]">{stats.readability.fleschKincaidGrade}</span>
              </div>
            </div>
          )}

          {stats.topWords.length > 0 && (
            <div className="p-3 bg-[#111111] border border-[#222222] rounded-[8px]">
              <div className="text-[11px] text-[#888888] font-medium uppercase tracking-wide mb-2">Most frequent words</div>
              <div className="space-y-1.5">
                {stats.topWords.map((w) => (
                  <div key={w.word} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#f5f5f5]">{w.word}</span>
                    <span className="text-[#555555]">{w.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
