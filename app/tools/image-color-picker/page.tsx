import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import ImageColorPickerClient from "./ImageColorPickerClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("image-color-picker");

export default function ImageColorPickerPage() {
  return (
    <>
      <ToolJsonLd slug="image-color-picker" />
      <ImageColorPickerClient />
      <ToolSeoSection slug="image-color-picker" />
    </>
  );
}
