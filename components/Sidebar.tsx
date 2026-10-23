"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { tools, categories, LATEST_TOOL_SLUGS } from "@/lib/tools";
import { Menu, X, Search, Sparkles } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { openAssistant } from "@/lib/showcase";
import PatreonLink, { PatreonIcon } from "@/components/support/PatreonLink";

const NEW_TOOL_SLUGS = new Set(LATEST_TOOL_SLUGS);

function ToolIcon({ name }: { name: string }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
  if (!Icon) return null;
  return <Icon size={16} />;
}

export default function Sidebar({ showSupport = true }: { showSupport?: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPod|iPad/.test(navigator.userAgent));
    setHasConsent(!!localStorage.getItem("toolninja_cookie_consent"));
  }, []);

  const openPalette = () => {
    window.dispatchEvent(new CustomEvent("toolninja:openpalette"));
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#222222]">
        <Link href="/" aria-label="ToolNinja home" className="flex items-center gap-2.5 min-w-0" onClick={() => setMobileOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={52} height={45} className="shrink-0 w-[52px] h-auto" />
          <span className="whitespace-nowrap font-extrabold text-[23px] leading-none tracking-tight text-[#f5f5f5]">
            Tool<span className="text-[#a855f7] [text-shadow:0_0_14px_rgba(168,85,247,0.55)]">Ninja</span>
            <span className="text-[#71717a] font-bold">.io</span>
          </span>
        </Link>
      </div>

      {/* Search trigger */}
      <div className="px-3 pb-2 pt-1">
        <button
          onClick={openPalette}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-[#555555] hover:text-[#888888] hover:border-[#333333] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search size={12} />
            <span className="text-xs">Search tools...</span>
          </div>
          <kbd className="text-[10px] bg-[#111111] border border-[#333333] px-1.5 py-0.5 rounded text-[#444444]">
            {isMac ? "⌘K" : "Ctrl+K"}
          </kbd>
        </button>
        <button
          onClick={() => {
            openAssistant();
            setMobileOpen(false);
          }}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-lg text-xs text-[#c4a5f7] hover:bg-[#a855f7]/20 hover:text-[#f5f5f5] transition-colors"
        >
          <Sparkles size={12} />
          <span>Ask Ninja — paste anything</span>
        </button>
        {showSupport && <PatreonLink
          placement="sidebar"
          onClick={() => setMobileOpen(false)}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 bg-[#ff424d]/[0.08] border border-[#ff424d]/25 rounded-lg text-xs text-[#ff8a90] hover:bg-[#ff424d]/15 hover:text-[#f5f5f5] transition-colors"
        >
          <PatreonIcon size={11} />
          <span>Support us on Patreon</span>
        </PatreonLink>}
      </div>

      {/* Tool list */}
      <nav className="flex-1 overflow-y-auto py-3">
        {categories.map((cat) => {
          const catTools = tools.filter((t) => t.category === cat);
          return (
            <div key={cat} className="mb-4">
              <Link
                href={`/tools/category/${cat.toLowerCase()}`}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  pathname === `/tools/category/${cat.toLowerCase()}` ? "text-[#a855f7]" : "text-[#888888] hover:text-[#f5f5f5]"
                }`}
              >
                {cat}
              </Link>
              {catTools.map((tool) => {
                const isActive = pathname === `/tools/${tool.slug}`;
                return (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? "text-[#a855f7] border-l-2 border-[#a855f7] bg-[#a855f7]/5"
                        : "text-[#888888] hover:text-[#f5f5f5] hover:bg-[#1a1a1a] border-l-2 border-transparent"
                    }`}
                  >
                    <ToolIcon name={tool.icon} />
                    <span className="flex-1 truncate">{tool.name}</span>
                    {NEW_TOOL_SLUGS.has(tool.slug) && (
                      <span className="text-[9px] px-1 py-0.5 bg-[#a855f7]/20 text-[#a855f7] rounded-[3px] font-bold tracking-wider flex-shrink-0">
                        NEW
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#222222]">
        <p className="text-xs text-[#888888] leading-relaxed mb-2">
          Every tool runs in your browser 🔒
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-[#555555]">
          <Link href="/tools" onClick={() => setMobileOpen(false)} className="hover:text-[#888888] transition-colors">
            All tools
          </Link>
          <Link href="/ask" onClick={() => setMobileOpen(false)} className="hover:text-[#888888] transition-colors">
            Ask Ninja
          </Link>
          <Link href="/privacy" onClick={() => setMobileOpen(false)} className="hover:text-[#888888] transition-colors">
            Privacy
          </Link>
          <Link href="/terms" onClick={() => setMobileOpen(false)} className="hover:text-[#888888] transition-colors">
            Terms
          </Link>
          <Link href="/changelog" onClick={() => setMobileOpen(false)} className="hover:text-[#888888] transition-colors">
            Changelog
          </Link>
          <Link href="/blog" onClick={() => setMobileOpen(false)} className="hover:text-[#888888] transition-colors">
            Blog
          </Link>
          <Link href="/explain-error" onClick={() => setMobileOpen(false)} className="hover:text-[#888888] transition-colors">
            Explain Error
          </Link>
          <Link href="/support" onClick={() => setMobileOpen(false)} className="hover:text-[#ff8a90] transition-colors">
            Support ♥
          </Link>
          {hasConsent && (
            <button
              onClick={() => {
                localStorage.removeItem("toolninja_cookie_consent");
                window.location.reload();
              }}
              className="text-xs text-[#555555] hover:text-[#888888] transition-colors bg-transparent border-0 p-0 m-0 cursor-pointer text-left"
            >
              Cookies
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#111111] border border-[#222222] rounded-[6px] text-[#f5f5f5]"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Single sidebar, shared between mobile drawer and desktop rail — rendered once so the
          full tool nav doesn't appear twice in the DOM. On mobile it slides on/off screen with
          mobileOpen; md:translate-x-0 pins it on-screen unconditionally at the desktop breakpoint. */}
      <aside
        className={`flex flex-col fixed top-0 left-0 z-50 md:z-30 w-[240px] h-screen bg-[#111111] border-r border-[#222222] transform transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
