import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import HttpRequestClient from "./HttpRequestClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("http-request");

export default function HttpRequestPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("http-request")) }}
      />
      <HttpRequestClient />
      <ToolSeoSection slug="http-request" />
    </>
  );
}
