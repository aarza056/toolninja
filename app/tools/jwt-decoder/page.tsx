import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import JwtDecoderClient from "./JwtDecoderClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("jwt-decoder");

export default function JwtDecoderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("jwt-decoder")) }}
      />
      <JwtDecoderClient />
      <ToolSeoSection slug="jwt-decoder" />
    </>
  );
}
