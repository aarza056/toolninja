import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import DockerfileGeneratorClient from "./DockerfileGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("dockerfile-generator");

export default function DockerfileGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("dockerfile-generator")) }}
      />
      <DockerfileGeneratorClient />
      <ToolSeoSection slug="dockerfile-generator" />
    </>
  );
}
