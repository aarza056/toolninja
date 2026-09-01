import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import SecurityHeadersCheckerClient from "./SecurityHeadersCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("security-headers-checker");

export default function SecurityHeadersCheckerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("security-headers-checker")) }}
      />
      <SecurityHeadersCheckerClient />
      <ToolSeoSection slug="security-headers-checker" />
    </>
  );
}
