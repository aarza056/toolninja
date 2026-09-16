import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import Ts7MigrationCheckerClient from "./Ts7MigrationCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("ts7-migration-checker");

export default function Ts7MigrationCheckerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("ts7-migration-checker")) }}
      />
      <Ts7MigrationCheckerClient />
      <ToolSeoSection slug="ts7-migration-checker" />
    </>
  );
}
