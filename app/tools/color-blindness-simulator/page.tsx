import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ColorBlindnessSimulatorClient from "./ColorBlindnessSimulatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("color-blindness-simulator");

export default function ColorBlindnessSimulatorPage() {
  return (
    <>
      <ToolJsonLd slug="color-blindness-simulator" />
      <ColorBlindnessSimulatorClient />
      <ToolSeoSection slug="color-blindness-simulator" />
    </>
  );
}
