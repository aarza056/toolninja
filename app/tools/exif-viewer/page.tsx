import type { Metadata } from "next";
import { generateToolMetadata, generateToolJsonLd } from "@/lib/metadata";
import ExifViewerClient from "./ExifViewerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("exif-viewer");

export default function ExifViewerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateToolJsonLd("exif-viewer")) }}
      />
      <ExifViewerClient />
      <ToolSeoSection slug="exif-viewer" />
    </>
  );
}
