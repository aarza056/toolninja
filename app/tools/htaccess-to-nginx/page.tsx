import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import HtaccessToNginxClient from "./HtaccessToNginxClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("htaccess-to-nginx");

export default function HtaccessToNginxPage() {
  return (
    <>
      <ToolJsonLd slug="htaccess-to-nginx" />
      <HtaccessToNginxClient />
      <ToolSeoSection slug="htaccess-to-nginx" />
    </>
  );
}
