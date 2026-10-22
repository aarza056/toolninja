import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CronTesterClient from "./CronTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("cron-tester");

export default function CronTesterPage() {
  return (
    <>
      <ToolJsonLd slug="cron-tester" />
      <CronTesterClient />
      <ToolSeoSection slug="cron-tester" />
    </>
  );
}
