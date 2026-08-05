import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ColorBlindnessSimulatorClient from "./ColorBlindnessSimulatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("color-blindness-simulator");

export default function ColorBlindnessSimulatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("color-blindness-simulator")) }}
      />
      <ColorBlindnessSimulatorClient />
      <ToolSeoSection slug="color-blindness-simulator" />
    </>
  );
}
