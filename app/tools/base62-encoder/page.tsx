import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import Base62Client from "./Base62Client";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("base62-encoder");

export default function Base62Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("base62-encoder")) }}
      />
      <Base62Client />
      <ToolSeoSection slug="base62-encoder" />
    </>
  );
}
