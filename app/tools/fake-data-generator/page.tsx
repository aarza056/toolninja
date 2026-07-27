import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import FakeDataGeneratorClient from "./FakeDataGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("fake-data-generator");

export default function FakeDataGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("fake-data-generator")) }}
      />
      <FakeDataGeneratorClient />
      <ToolSeoSection slug="fake-data-generator" />
    </>
  );
}
