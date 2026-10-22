import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import Ts7MigrationCheckerClient from "./Ts7MigrationCheckerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("ts7-migration-checker");

export default function Ts7MigrationCheckerPage() {
  return (
    <>
      <ToolJsonLd slug="ts7-migration-checker" />
      <Ts7MigrationCheckerClient />
      <ToolSeoSection slug="ts7-migration-checker" />
    </>
  );
}
