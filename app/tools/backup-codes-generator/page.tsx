import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import BackupCodesGeneratorClient from "./BackupCodesGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("backup-codes-generator");

export default function BackupCodesGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="backup-codes-generator" />
      <BackupCodesGeneratorClient />
      <ToolSeoSection slug="backup-codes-generator" />
    </>
  );
}
