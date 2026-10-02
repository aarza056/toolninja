import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import CorsDebuggerClient from "./CorsDebuggerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("cors-debugger");

export default function CorsDebuggerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("cors-debugger")) }}
      />
      <CorsDebuggerClient />
      <ToolSeoSection slug="cors-debugger" />
    </>
  );
}
