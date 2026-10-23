import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ExifViewerClient from "./ExifViewerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("exif-viewer");

export default function ExifViewerPage() {
  return (
    <>
      <ToolJsonLd slug="exif-viewer" />
      <ExifViewerClient />
      <ToolSeoSection slug="exif-viewer" />
    </>
  );
}
