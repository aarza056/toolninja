import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import RobotsTxtGeneratorClient from "./RobotsTxtGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("robots-txt-generator");

export default function RobotsTxtGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="robots-txt-generator" />
      <RobotsTxtGeneratorClient />
      <ToolSeoSection slug="robots-txt-generator" />
    </>
  );
}
