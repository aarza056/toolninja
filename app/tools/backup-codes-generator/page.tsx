import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import BackupCodesGeneratorClient from "./BackupCodesGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("backup-codes-generator");

export default function BackupCodesGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("backup-codes-generator")) }}
      />
      <BackupCodesGeneratorClient />
      <ToolSeoSection slug="backup-codes-generator" />
    </>
  );
}
