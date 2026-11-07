import type { Metadata } from "next";
import { generateToolMetadata } from "@/lib/metadata";
import ToolJsonLd from "@/components/ToolJsonLd";
import AwsVpcSubnetCalculatorClient from "./AwsVpcSubnetCalculatorClient";
import ToolSeoSection from "@/components/ToolSeoSection";

export const metadata: Metadata = generateToolMetadata("aws-vpc-subnet-calculator");

export default function AwsVpcSubnetCalculatorPage() {
  return (
    <>
      <ToolJsonLd slug="aws-vpc-subnet-calculator" />
      <AwsVpcSubnetCalculatorClient />
      <ToolSeoSection slug="aws-vpc-subnet-calculator" />
    </>
  );
}
