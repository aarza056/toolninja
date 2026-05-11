import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CronTesterClient from "./CronTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("cron-tester");

export default function CronTesterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("cron-tester")) }}
      />
      <CronTesterClient />
      <ToolSeoSection slug="cron-tester" />
    </>
  );
}
