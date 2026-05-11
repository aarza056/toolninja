"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Shuffle } from "lucide-react";

const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nulla gravida orci a odio nullam varius turpis".split(" ");

const CLASSIC_START = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

function getWord() {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function getSentence(wordCount = 10): string {
  const words = Array.from({ length: wordCount }, (_, i) => {
    const w = getWord();
    return i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w;
  });
  return words.join(" ") + ".";
}

function getParagraph(sentenceCount = 5): string {
  return Array.from({ length: sentenceCount }, () => getSentence(8 + Math.floor(Math.random() * 8))).join(" ");
}

export default function LoremIpsumClient() {
  const [type, setType] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const [count, setCount] = useState(3);
  const [classic, setClassic] = useState(true);
  const [output, setOutput] = useState("");

  const generate = () => {
    let result = "";
    if (type === "paragraphs") {
      const paras = Array.from({ length: count }, (_, i) =>
        i === 0 && classic ? CLASSIC_START + " " + getParagraph(4) : getParagraph()
      );
      result = paras.join("\n\n");
    } else if (type === "sentences") {
      const sentences = Array.from({ length: count }, (_, i) =>
        i === 0 && classic ? CLASSIC_START : getSentence()
      );
      result = sentences.join(" ");
    } else {
      const words = Array.from({ length: count }, (_, i) => {
        const w = getWord();
        return i === 0 && classic ? w.charAt(0).toUpperCase() + w.slice(1) : w;
      });
      result = words.join(" ");
    }
    setOutput(result);
  };

  return (
    <ToolLayout title="Lorem Ipsum Generator" description="Generate placeholder text for your designs">
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Type</label>
            <div className="flex">
              {(["paragraphs", "sentences", "words"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 text-sm border first:rounded-l-[6px] last:rounded-r-[6px] transition-colors ${
                    type === t
                      ? "bg-[#a855f7] border-[#a855f7] text-white"
                      : "bg-[#111111] border-[#222222] text-[#888888] hover:text-[#f5f5f5]"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#888888] font-medium block mb-1">Count</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, +e.target.value)))}
              className="w-20 px-3 py-1.5 text-sm bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7]"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#888888] cursor-pointer pb-1.5">
            <input
              type="checkbox"
              checked={classic}
              onChange={(e) => setClassic(e.target.checked)}
              className="accent-[#a855f7]"
            />
            Start with classic &ldquo;Lorem ipsum...&rdquo;
          </label>

          <button
            onClick={generate}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-[6px] transition-colors pb-1.5"
          >
            <Shuffle size={14} /> Generate
          </button>
        </div>

        {output ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#888888] font-medium">Output</label>
              <CopyButton text={output} size="sm" />
            </div>
            <textarea
              value={output}
              readOnly
              rows={12}
              className="w-full p-3 text-sm resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none leading-relaxed"
            />
          </div>
        ) : (
          <div className="p-8 text-center text-[#444444] border border-dashed border-[#222222] rounded-[8px]">
            Click Generate to create placeholder text
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
