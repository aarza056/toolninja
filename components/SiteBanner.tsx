"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Banner } from "@/lib/site-config";
import { isAdminPath } from "@/lib/owner";

const TONES = {
  info: { c: "bg-[#a855f7]/10 border-[#a855f7]/30 text-[#e9d5ff]", Icon: Info },
  success: { c: "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#bbf7d0]", Icon: CheckCircle2 },
  warning: { c: "bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#fde68a]", Icon: AlertTriangle },
} as const;
const dismissKey = (id: string) => `toolninja:banner-dismissed:${id}`;

export default function SiteBanner({ banner }: { banner: Banner | null }) {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!banner) return;
    // pages are cached, so the end date is also checked here
    if (banner.until && Date.parse(banner.until) <= Date.now()) return;
    try {
      if (localStorage.getItem(dismissKey(banner.id))) return;
    } catch {}
    setShow(true);
  }, [banner]);

  if (!banner || !show || isAdminPath(pathname)) return null;
  const { c, Icon } = TONES[banner.tone] ?? TONES.info;
  const external = /^https?:\/\//.test(banner.href);

  return (
    <div role="region" aria-label="Announcement" className={`relative flex items-center justify-center gap-2 px-12 py-2 text-sm border-b ${c}`}>
      <Icon size={15} className="shrink-0" />
      <span>
        {banner.text}
        {banner.href && banner.linkText && (
          <>
            {" "}
            {external ? (
              <a href={banner.href} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
                {banner.linkText}
              </a>
            ) : (
              <Link href={banner.href} className="font-semibold underline underline-offset-2">
                {banner.linkText}
              </Link>
            )}
          </>
        )}
      </span>
      <button
        onClick={() => {
          setShow(false);
          try {
            localStorage.setItem(dismissKey(banner.id), "1");
          } catch {}
        }}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-70 hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}
