import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import SshKeyGeneratorClient from "./SshKeyGeneratorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("ssh-key-generator");

export default function SshKeyGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("ssh-key-generator")) }}
      />
      <SshKeyGeneratorClient />
      <ToolSeoSection slug="ssh-key-generator" />
    </>
  );
}
