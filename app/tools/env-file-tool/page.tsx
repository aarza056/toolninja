import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import EnvFileToolClient from "./EnvFileToolClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("env-file-tool");

export default function EnvFileToolPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("env-file-tool")) }}
      />
      <EnvFileToolClient />
      <ToolSeoSection slug="env-file-tool" />
    </>
  );
}
