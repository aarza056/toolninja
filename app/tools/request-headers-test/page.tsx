import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import RequestHeadersTestClient from "./RequestHeadersTestClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("request-headers-test");

export default function RequestHeadersTestPage() {
  return (
    <>
      <ToolJsonLd slug="request-headers-test" />
      <RequestHeadersTestClient />
      <ToolSeoSection slug="request-headers-test" />
    </>
  );
}
