import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import DockerConverterClient from "./DockerConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("docker-run-to-compose");

export default function DockerRunToComposePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("docker-run-to-compose")) }}
      />
      <DockerConverterClient />
      <ToolSeoSection slug="docker-run-to-compose" />
    </>
  );
}
