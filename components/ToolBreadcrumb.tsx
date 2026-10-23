"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools } from "@/lib/tools";

export default function ToolBreadcrumb() {
  const pathname = usePathname();
  const slug = pathname?.match(/^\/tools\/([^/]+)/)?.[1];
  const tool = slug ? tools.find((t) => t.slug === slug) : undefined;
  if (!tool) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#555555] mb-1.5">
      <Link href="/tools" className="hover:text-[#888888] transition-colors">Tools</Link>
      <span>/</span>
      <Link href={`/tools/category/${tool.category.toLowerCase()}`} className="hover:text-[#888888] transition-colors">
        {tool.category}
      </Link>
    </nav>
  );
}
