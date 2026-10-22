import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import DockerfileGeneratorClient from "./DockerfileGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("dockerfile-generator");

export default function DockerfileGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="dockerfile-generator" />
      <DockerfileGeneratorClient />
      <ToolSeoSection slug="dockerfile-generator" />
    </>
  );
}
