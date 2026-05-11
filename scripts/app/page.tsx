import Link from "next/link";
import { tools, categories } from "@/lib/tools";
import * as LucideIcons from "lucide-react";

function ToolIcon({ name }: { name: string }) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
  if (!Icon) return null;
  return <Icon size={22} className="text-[#a855f7]" />;
}

const categoryColors: Record<string, string> = {
  Format: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Encode: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Generate: "bg-green-500/10 text-green-400 border-green-500/20",
  Convert: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Test: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function HomePage() {
  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <div className="mb-12 text-center">
        <div className="text-5xl mb-4">🥷</div>
        <h1 className="text-3xl font-bold text-[#f5f5f5] mb-3">ToolNinja</h1>
        <p className="text-[#888888] text-base max-w-lg mx-auto">
          Fast, free developer tools. No login. No nonsense. Everything runs in your browser.
        </p>
      </div>
      {categories.map((cat) => {
        const catTools = tools.filter((t) => t.category === cat);
        return (
          <div key={cat} className="mb-10">
            <h2 className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-4">{cat}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="group flex flex-col gap-3 p-5 bg-[#111111] border border-[#222222] rounded-[8px] hover:border-[#a855f7]/50 hover:bg-[#1a1a1a] transition-all duration-150"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-[#1a1a1a] rounded-[6px] group-hover:bg-[#a855f7]/10 transition-colors">
                      <ToolIcon name={tool.icon} />
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-[4px] border ${categoryColors[tool.category] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                      {tool.category}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#f5f5f5] mb-1 group-hover:text-[#a855f7] transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-[#888888] leading-relaxed">{tool.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
