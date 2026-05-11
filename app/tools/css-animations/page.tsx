import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ToolLayout from "@/components/ToolLayout";
import CssAnimationsClient from "./CssAnimationsClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("css-animations");

export default function CssAnimationsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("css-animations")) }}
      />
      <ToolLayout
        title="CSS Animations ✨"
        description="Copy-paste ready HTML + CSS combos. Live previews. No dependencies."
      >
        <CssAnimationsClient />
      </ToolLayout>
      <ToolSeoSection slug="css-animations" />
    </>
  );
}
