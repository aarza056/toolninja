import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import VlsmSubnetPlannerClient from "./VlsmSubnetPlannerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("vlsm-subnet-planner");

export default function VlsmSubnetPlannerPage() {
  return (
    <>
      <ToolJsonLd slug="vlsm-subnet-planner" />
      <VlsmSubnetPlannerClient />
      <ToolSeoSection slug="vlsm-subnet-planner" />
    </>
  );
}
