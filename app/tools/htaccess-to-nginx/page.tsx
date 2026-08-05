import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import HtaccessToNginxClient from "./HtaccessToNginxClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("htaccess-to-nginx");

export default function HtaccessToNginxPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("htaccess-to-nginx")) }}
      />
      <HtaccessToNginxClient />
      <ToolSeoSection slug="htaccess-to-nginx" />
    </>
  );
}
