import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import HttpStatusCodesClient from "./HttpStatusCodesClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("http-status-codes");

export default function HttpStatusCodesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("http-status-codes")) }}
      />
      <HttpStatusCodesClient />
      <ToolSeoSection slug="http-status-codes" />
    </>
  );
}
