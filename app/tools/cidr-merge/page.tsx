import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import CidrMergeClient from "./CidrMergeClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("cidr-merge");

export default function CidrMergePage() {
  return (
    <>
      <ToolJsonLd slug="cidr-merge" />
      <CidrMergeClient />
      <ToolSeoSection slug="cidr-merge" />
    </>
  );
}
