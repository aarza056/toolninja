import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  alternates: { canonical: "https://toolninja.io" },
};

// WebSite and Organization JSON-LD come from the root layout.
export default function HomePage() {
  return <HomeClient />;
}
