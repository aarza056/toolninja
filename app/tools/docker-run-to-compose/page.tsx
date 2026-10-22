import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import DockerConverterClient from "./DockerConverterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("docker-run-to-compose");

export default function DockerRunToComposePage() {
  return (
    <>
      <ToolJsonLd slug="docker-run-to-compose" />
      <DockerConverterClient />
      <ToolSeoSection slug="docker-run-to-compose" />
    </>
  );
}
