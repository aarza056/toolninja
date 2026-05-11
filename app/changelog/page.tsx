import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export const metadata: Metadata = {
  title: "Changelog — ToolNinja",
  description: "A full history of every feature, fix, and improvement shipped to ToolNinja.",
};

function getChangelog(): string {
  try {
    return readFileSync(join(process.cwd(), "CHANGELOG.md"), "utf8");
  } catch {
    return "# Changelog\n\nNo entries yet.";
  }
}

export default function ChangelogPage() {
  const content = getChangelog();

  return (
    <div className="px-6 py-12 max-w-2xl mx-auto">
      <Link
        href="/"
        className="text-xs text-[#555555] hover:text-[#888888] transition-colors mb-8 inline-block"
      >
        ← Back to tools
      </Link>

      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">{children}</h1>
          ),
          p: ({ children }) => (
            <p className="text-sm text-[#555555] mb-6 leading-relaxed">{children}</p>
          ),
          hr: () => <hr className="border-[#1a1a1a] my-8" />,
          h2: ({ children }) => (
            <div className="flex items-center gap-3 mb-5 mt-2">
              <span className="text-xs font-mono font-semibold text-[#a855f7] bg-[#a855f7]/10 border border-[#a855f7]/20 px-2.5 py-1 rounded-full">
                {children}
              </span>
            </div>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-[#555555] uppercase tracking-widest mb-2 mt-5">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 mb-4">{children}</ul>
          ),
          li: ({ children }) => (
            <li className="flex gap-2 text-sm text-[#777777] leading-relaxed">
              <span className="text-[#a855f7] shrink-0 mt-0.5">–</span>
              <span>{children}</span>
            </li>
          ),
          code: ({ children }) => (
            <code className="font-mono text-[10px] px-1.5 py-0.5 bg-[#1a1a1a] text-[#a855f7] rounded">
              {children}
            </code>
          ),
          strong: ({ children }) => (
            <strong className="text-[#d4d4d4] font-semibold">{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      <div className="mt-12 pt-6 border-t border-[#1a1a1a] flex gap-4 text-xs text-[#444444]">
        <Link href="/privacy" className="hover:text-[#666666] transition-colors">Privacy Policy</Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-[#666666] transition-colors">Terms of Service</Link>
      </div>
    </div>
  );
}
