"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { Trash2 } from "lucide-react";

const STORAGE_KEY = "toolninja:string-case-converter";

/**
 * Split an arbitrary string into an array of lowercase words.
 * Handles: camelCase, PascalCase, snake_case, kebab-case, dot.case,
 * SCREAMING_SNAKE, COBOL-CASE, plain spaces, and mixed combinations.
 */
function splitIntoWords(input: string): string[] {
  if (!input.trim()) return [];

  // Insert a space before uppercase letters that follow lowercase/digits (camel/Pascal split)
  let s = input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");

  // Replace common delimiters with space
  s = s.replace(/[_\-.\s]+/g, " ");

  return s
    .trim()
    .split(" ")
    .map((w) => w.toLowerCase())
    .filter(Boolean);
}

interface CaseVariant {
  id: string;
  label: string;
  example: string;
  convert: (words: string[]) => string;
}

const CASE_VARIANTS: CaseVariant[] = [
  {
    id: "camel",
    label: "camelCase",
    example: "myVariableName",
    convert: (words) =>
      words
        .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(""),
  },
  {
    id: "pascal",
    label: "PascalCase",
    example: "MyVariableName",
    convert: (words) =>
      words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(""),
  },
  {
    id: "snake",
    label: "snake_case",
    example: "my_variable_name",
    convert: (words) => words.join("_"),
  },
  {
    id: "screaming_snake",
    label: "SCREAMING_SNAKE_CASE",
    example: "MY_VARIABLE_NAME",
    convert: (words) => words.join("_").toUpperCase(),
  },
  {
    id: "kebab",
    label: "kebab-case",
    example: "my-variable-name",
    convert: (words) => words.join("-"),
  },
  {
    id: "cobol",
    label: "COBOL-CASE",
    example: "MY-VARIABLE-NAME",
    convert: (words) => words.join("-").toUpperCase(),
  },
  {
    id: "dot",
    label: "dot.case",
    example: "my.variable.name",
    convert: (words) => words.join("."),
  },
  {
    id: "title",
    label: "Title Case",
    example: "My Variable Name",
    convert: (words) =>
      words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
  },
  {
    id: "upper",
    label: "UPPERCASE",
    example: "MY VARIABLE NAME",
    convert: (words) => words.join(" ").toUpperCase(),
  },
  {
    id: "lower",
    label: "lowercase",
    example: "my variable name",
    convert: (words) => words.join(" "),
  },
];

export default function StringCaseConverterClient() {
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

  const words = useMemo(() => splitIntoWords(input), [input]);

  const converted = useMemo(
    () =>
      CASE_VARIANTS.reduce<Record<string, string>>((acc, variant) => {
        acc[variant.id] = words.length > 0 ? variant.convert(words) : "";
        return acc;
      }, {}),
    [words]
  );

  const clear = () => setInput("");

  return (
    <ToolLayout title="String Case Converter" description="Convert text between camelCase, PascalCase, snake_case, kebab-case, and more">
      <div className="space-y-5">
        {/* Input area */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888888] font-medium">Input</label>
            <button
              onClick={clear}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] border border-[#222222] rounded-[6px] transition-colors"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your text here..."
            rows={4}
            spellCheck={false}
            className="w-full p-3 text-sm resize-y bg-[#111111] border border-[#222222] rounded-[8px] text-[#f5f5f5] focus:outline-none focus:border-[#a855f7] placeholder:text-[#444444]"
          />
        </div>

        {/* Output cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CASE_VARIANTS.map((variant) => {
            const value = converted[variant.id];
            const isEmpty = !value;

            return (
              <div
                key={variant.id}
                className="p-3 bg-[#111111] border border-[#222222] rounded-[8px] flex flex-col gap-1.5"
              >
                {/* Card header */}
                <div className="flex items-center justify-between min-h-[24px]">
                  <span className="text-xs font-medium text-[#888888]">
                    {variant.label}
                  </span>
                  {value && <CopyButton text={value} size="sm" />}
                </div>

                {/* Card value */}
                <div className="min-h-[28px] flex items-center">
                  {isEmpty ? (
                    <span className="text-sm font-mono text-[#333333]">
                      {variant.example}
                    </span>
                  ) : (
                    <span className="text-sm font-mono text-[#f5f5f5] break-all">
                      {value}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToolLayout>
  );
}
