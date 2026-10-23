"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/ninja", label: "Ninja AI" },
  { href: "/admin/ideas", label: "Ideas" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/ratings", label: "Ratings" },
  { href: "/admin/site", label: "Site" },
  { href: "/admin/health", label: "Content health" },
  { href: "/admin/status", label: "Status" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-[#1f1f1f] [scrollbar-width:none]">
      {TABS.map((t) => {
        const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`shrink-0 px-3.5 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
              active ? "border-[#a855f7] text-[#f5f5f5]" : "border-transparent text-[#888888] hover:text-[#f5f5f5]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
