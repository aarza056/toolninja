"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { isAdminPath, isExcludedVisit, readOwnerFlag } from "@/lib/owner";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
}

// Vercel Analytics, Speed Insights and Google Analytics, minus /admin and the owner's own browser.
export default function SiteTrackers() {
  const pathname = usePathname();

  // GA4 checks this flag on every hit, including the page views it records on client-side navigation
  useEffect(() => {
    if (!GA_ID) return;
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = isAdminPath(pathname) || readOwnerFlag() === "1";
  }, [pathname]);

  const drop = <T extends { url: string }>(event: T): T | null => (isExcludedVisit(pathOf(event.url)) ? null : event);

  return (
    <>
      <Analytics beforeSend={drop} />
      <SpeedInsights beforeSend={drop} />
    </>
  );
}
