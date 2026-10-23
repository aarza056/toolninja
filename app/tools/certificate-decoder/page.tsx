import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CertificateDecoderClient from "./CertificateDecoderClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("certificate-decoder");

export default function CertificateDecoderPage() {
  return (
    <>
      <ToolJsonLd slug="certificate-decoder" />
      <CertificateDecoderClient />
      <ToolSeoSection slug="certificate-decoder" />
    </>
  );
}
