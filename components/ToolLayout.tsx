import { ReactNode } from "react";
import ToolHeaderActions from "./ToolHeaderActions";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  /** ISO date (YYYY-MM-DD) the tool's rules or data were last checked against their sources. */
  lastReviewed?: string;
  /** What was reviewed, e.g. "model prices". Shown after the date. */
  lastReviewedWhat?: string;
}

function formatReviewDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function ToolLayout({ title, description, children, lastReviewed, lastReviewedWhat }: ToolLayoutProps) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-[#222222] px-6 py-5">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-[#f5f5f5]">{title}</h1>
          <ToolHeaderActions />
        </div>
        <p className="text-sm text-[#888888] mt-0.5">{description}</p>
        {lastReviewed && (
          <p className="text-xs text-[#999999] mt-1.5" data-last-reviewed>
            Last reviewed: <time dateTime={lastReviewed}>{formatReviewDate(lastReviewed)}</time>
            {lastReviewedWhat && <> ({lastReviewedWhat})</>}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
