"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { addRecentTool } from "@/lib/user-prefs";
import StarButton from "./StarButton";

export default function ToolHeaderActions() {
  const pathname = usePathname();
  const slug = pathname.startsWith("/tools/") ? pathname.split("/tools/")[1] : null;

  useEffect(() => {
    if (slug) addRecentTool(slug);
  }, [slug]);

  if (!slug) return null;

  return <StarButton slug={slug} size="md" />;
}
