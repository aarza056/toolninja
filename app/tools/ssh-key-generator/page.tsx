import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import SshKeyGeneratorClient from "./SshKeyGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("ssh-key-generator");

export default function SshKeyGeneratorPage() {
  return (
    <>
      <ToolJsonLd slug="ssh-key-generator" />
      <SshKeyGeneratorClient />
      <ToolSeoSection slug="ssh-key-generator" />
    </>
  );
}
