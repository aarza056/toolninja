import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CurlToCodeClient from "./CurlToCodeClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("curl-to-code");

export default function CurlToCodePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("curl-to-code")) }}
      />
      <CurlToCodeClient />
      <ToolSeoSection slug="curl-to-code" />
    </>
  );
}
