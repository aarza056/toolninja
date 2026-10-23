import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import PasskeyTesterClient from "./PasskeyTesterClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("passkey-tester");

export default function PasskeyTesterPage() {
  return (
    <>
      <ToolJsonLd slug="passkey-tester" />
      <PasskeyTesterClient />
      <ToolSeoSection slug="passkey-tester" />
    </>
  );
}
