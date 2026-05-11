import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import UrlEncoderClient from "./UrlEncoderClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("url-encoder");

export default function UrlEncoderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("url-encoder")) }}
      />
      <UrlEncoderClient />
      <ToolSeoSection slug="url-encoder" />
    </>
  );
}
