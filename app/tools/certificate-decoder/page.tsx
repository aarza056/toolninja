import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CertificateDecoderClient from "./CertificateDecoderClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("certificate-decoder");

export default function CertificateDecoderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("certificate-decoder")) }}
      />
      <CertificateDecoderClient />
      <ToolSeoSection slug="certificate-decoder" />
    </>
  );
}
