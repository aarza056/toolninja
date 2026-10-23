import Link from "next/link";
import { Heart } from "lucide-react";
import { SUPPORT_TIERS } from "@/lib/support";
import PatreonLink, { PatreonIcon } from "./PatreonLink";

// A quiet "if this helped" card for the end of tool pages and blog posts — after the content, never inside it.
export default function SupportCard({ placement, className = "" }: { placement: "tool-page" | "blog-post"; className?: string }) {
  const tier = SUPPORT_TIERS[0];
  return (
    <aside
      aria-label="Support ToolNinja"
      className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-gradient-to-br from-[#ff424d]/[0.07] to-[#111111] border border-[#ff424d]/20 rounded-xl ${className}`}
    >
      <div className="flex-1 min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-[#f5f5f5] mb-1">
          <Heart size={14} className="text-[#ff424d]" /> {placement === "tool-page" ? "Did this tool save you time?" : "Was this guide helpful?"}
        </p>
        <p className="text-xs text-[#888888] leading-relaxed">
          ToolNinja is free, with no login and no paywall. Supporters cover hosting and Ninja AI, and keep new tools coming.{" "}
          <Link href="/support" className="text-[#aaaaaa] underline decoration-[#444] hover:text-[#f5f5f5]">
            Why support?
          </Link>
        </p>
      </div>
      {tier && (
        <PatreonLink
          placement={placement}
          className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#ff424d] hover:bg-[#e63a44] rounded-[8px] transition-colors"
        >
          <PatreonIcon size={13} /> Support from ${tier.price}/mo
        </PatreonLink>
      )}
    </aside>
  );
}
