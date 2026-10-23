"use client";

import { useEffect, useState } from "react";
import { OWNER_KEY, readOwnerFlag } from "@/lib/owner";

/** Marks this browser as the owner's the first time /admin is opened (unless turned off before). */
export function OwnerModeAutoEnable() {
  useEffect(() => {
    try {
      if (readOwnerFlag() === null) localStorage.setItem(OWNER_KEY, "1");
    } catch {}
  }, []);
  return null;
}

export function OwnerModeToggle() {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => setOn(readOwnerFlag() !== "0"), []);

  const set = (v: boolean) => {
    try {
      localStorage.setItem(OWNER_KEY, v ? "1" : "0");
    } catch {}
    setOn(v);
  };

  if (on === null) return <div className="h-12" />;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm text-[#dddddd]">
          Don&apos;t count my visits <span className={`ml-1 text-xs ${on ? "text-[#4ade80]" : "text-[#fbbf24]"}`}>{on ? "● on" : "● off"}</span>
        </p>
        <p className="text-xs text-[#777777] mt-0.5 max-w-lg">
          In this browser, your visits to the public site aren&apos;t counted in Vercel Analytics, Speed Insights or Google Analytics, and no ads are
          requested (protects AdSense from self-impressions). /admin itself is never counted. Applies per browser — open admin once on each device.
        </p>
      </div>
      <button
        type="button"
        onClick={() => set(!on)}
        role="switch"
        aria-checked={on}
        className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-[#a855f7]" : "bg-[#333333]"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
