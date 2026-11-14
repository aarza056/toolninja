import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import RobotsTxtTesterClient from "./RobotsTxtTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("robots-txt-tester");

export default function RobotsTxtTesterPage() {
  return (
    <>
      <ToolJsonLd slug="robots-txt-tester" />
      <RobotsTxtTesterClient />
      <ToolSeoSection slug="robots-txt-tester" />
    </>
  );
}
