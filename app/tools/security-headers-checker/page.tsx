import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import SecurityHeadersCheckerClient from "./SecurityHeadersCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("security-headers-checker");

export default function SecurityHeadersCheckerPage() {
  return (
    <>
      <ToolJsonLd slug="security-headers-checker" />
      <SecurityHeadersCheckerClient />
      <ToolSeoSection slug="security-headers-checker" />
    </>
  );
}
