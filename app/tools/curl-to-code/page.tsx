import type { Metadata } from "next";
import { Suspense } from "react";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CurlToCodeClient from "./CurlToCodeClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("curl-to-code");

export default function CurlToCodePage() {
  return (
    <>
      <ToolJsonLd slug="curl-to-code" />
      <Suspense fallback={null}>
        <CurlToCodeClient />
      </Suspense>
      <ToolSeoSection slug="curl-to-code" />
    </>
  );
}
