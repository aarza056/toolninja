import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CidrCalculatorClient from "./CidrCalculatorClient";
import CidrCheatSheet from "./CidrCheatSheet";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("cidr-calculator");

export default function CidrCalculatorPage() {
  return (
    <>
      <ToolJsonLd slug="cidr-calculator" />
      <CidrCalculatorClient />
      <CidrCheatSheet />
      <ToolSeoSection slug="cidr-calculator" />
    </>
  );
}
