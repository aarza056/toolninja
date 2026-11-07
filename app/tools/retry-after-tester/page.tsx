import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import RetryAfterTesterClient from "./RetryAfterTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("retry-after-tester");

export default function RetryAfterTesterPage() {
  return (
    <>
      <ToolJsonLd slug="retry-after-tester" />
      <RetryAfterTesterClient />
      <ToolSeoSection slug="retry-after-tester" />
    </>
  );
}
