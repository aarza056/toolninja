"use client";

import type { ReactNode } from "react";
import { patreonHref, trackSupportClick } from "@/lib/support";

export function PatreonIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  // Patreon's mark: a circle and a vertical bar
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <circle cx="14.5" cy="9.5" r="7" />
      <rect x="2.5" y="2.5" width="3.6" height="19" rx="0.6" />
    </svg>
  );
}

/** An outbound Patreon link that records which placement it came from. */
export default function PatreonLink({
  placement,
  className,
  children,
  onClick,
}: {
  placement: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <a
      href={patreonHref(placement)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        trackSupportClick(placement);
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
