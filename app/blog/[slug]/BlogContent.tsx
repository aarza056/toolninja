"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-[#f5f5f5] mt-10 mb-4 leading-snug border-b border-[#1e1e1e] pb-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-[#e5e5e5] mt-7 mb-3 leading-snug">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-[#cccccc] mt-5 mb-2 uppercase tracking-wide">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-[#aaaaaa] leading-relaxed mb-4 text-[15px]">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-[#a855f7] hover:text-[#c084fc] underline decoration-[#a855f7]/30 hover:decoration-[#a855f7] transition-colors"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#f5f5f5]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-[#bbbbbb]">{children}</em>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) return null; // handled by pre
    return (
      <code className="text-[#e879f9] bg-[#1a0a2e] border border-[#2d1250] px-1.5 py-0.5 rounded text-[13px] font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg p-4 overflow-x-auto mb-5 text-[13px] font-mono text-[#c9d1d9] leading-relaxed">
      {children}
    </pre>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 space-y-1.5 pl-5 list-disc marker:text-[#a855f7]/50">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 space-y-1.5 pl-5 list-decimal marker:text-[#a855f7]/50">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-[#aaaaaa] text-[15px] leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[#a855f7]/40 pl-4 my-4 text-[#666666] italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-[#1e1e1e] my-8" />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#111111]">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-left px-3 py-2 text-xs font-semibold text-[#888888] uppercase tracking-wide border border-[#1e1e1e]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-[#aaaaaa] border border-[#1e1e1e] text-[13px]">
      {children}
    </td>
  ),
  tr: ({ children }) => (
    <tr className="even:bg-[#0d0d0d]">{children}</tr>
  ),
};

export default function BlogContent({ content }: { content: string }) {
  return (
    <article className="prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
