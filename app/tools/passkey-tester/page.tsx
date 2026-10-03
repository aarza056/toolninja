import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import PasskeyTesterClient from "./PasskeyTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("passkey-tester");

export default function PasskeyTesterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("passkey-tester")) }}
      />
      <PasskeyTesterClient />
      <ToolSeoSection slug="passkey-tester" />
    </>
  );
}
