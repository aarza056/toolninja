import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";

export const metadata: Metadata = {
  title: "Changelog | ToolNinja",
  description: "What's new in ToolNinja — updates, new tools, and fixes.",
};

export default function ChangelogPage() {
  const filePath = path.join(process.cwd(), "CHANGELOG.md");
  const content = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf8")
    : "# Changelog\n\nNothing yet.";

  return (
    <div className="px-6 py-10 max-w-2xl mx-auto">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold text-[#a855f7] mt-10 mb-3 uppercase tracking-widest">
              {children}
            </h2>
          ),
          p: ({ children }) => (
            <p className="text-sm text-[#666666] leading-relaxed mb-4">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 mb-6">{children}</ul>
          ),
          li: ({ children }) => (
            <li className="text-sm text-[#888888] leading-relaxed flex gap-2">
              <span className="text-[#333333] shrink-0 mt-0.5">·</span>
              <span>{children}</span>
            </li>
          ),
          code: ({ children }) => (
            <code className="text-xs font-mono text-[#a855f7] bg-[#a855f7]/10 px-1 py-0.5 rounded">
              {children}
            </code>
          ),
          hr: () => <hr className="border-[#1a1a1a] my-8" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
