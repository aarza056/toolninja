import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import DockerConverterClient from "./DockerConverterClient";

export const metadata: Metadata = generateToolMetadata("docker-run-to-compose");

export default function DockerRunToComposePage() {
  return <DockerConverterClient />;
}
