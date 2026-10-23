import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { Tool } from "@/lib/tools";

function ToolIcon({ name }: { name: string }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
  if (!Icon) return null;
  return <Icon size={18} className="text-[#a855f7]" />;
}

export default function ToolGrid({ tools }: { tools: Tool[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {tools.map((tool) => (
        <Link
          key={tool.slug}
          href={`/tools/${tool.slug}`}
          className="group flex gap-3 p-4 bg-[#111111] border border-[#222222] rounded-[8px] hover:border-[#a855f7]/50 hover:bg-[#1a1a1a] transition-all duration-150"
        >
          <div className="h-fit p-2 bg-[#1a1a1a] rounded-[6px] group-hover:bg-[#a855f7]/10 transition-colors">
            <ToolIcon name={tool.icon} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#f5f5f5] mb-1 group-hover:text-[#a855f7] transition-colors">{tool.name}</h3>
            <p className="text-xs text-[#888888] leading-relaxed">{tool.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
