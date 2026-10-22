import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import FakeDataGeneratorClient from "./FakeDataGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("fake-data-generator");

export default function FakeDataGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="fake-data-generator" />
      <FakeDataGeneratorClient />
      <ToolSeoSection slug="fake-data-generator" />
    </>
  );
}
