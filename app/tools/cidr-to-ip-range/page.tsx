import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CidrToIpRangeClient from "./CidrToIpRangeClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("cidr-to-ip-range");

export default function CidrToIpRangePage() {
  return (
    <>
      <ToolJsonLd slug="cidr-to-ip-range" />
      <CidrToIpRangeClient />
      <ToolSeoSection slug="cidr-to-ip-range" />
    </>
  );
}
