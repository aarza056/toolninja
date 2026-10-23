import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import EnvFileToolClient from "./EnvFileToolClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("env-file-tool");

export default function EnvFileToolPage() {
  return (
    <>
      <ToolJsonLd slug="env-file-tool" />
      <EnvFileToolClient />
      <ToolSeoSection slug="env-file-tool" />
    </>
  );
}
