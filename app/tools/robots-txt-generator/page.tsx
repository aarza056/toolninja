import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import RobotsTxtGeneratorClient from "./RobotsTxtGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("robots-txt-generator");

export default function RobotsTxtGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("robots-txt-generator")) }}
      />
      <RobotsTxtGeneratorClient />
      <ToolSeoSection slug="robots-txt-generator" />
    </>
  );
}
