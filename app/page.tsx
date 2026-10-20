import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { PATREON_URL } from "@/lib/support";

export const metadata: Metadata = {
  alternates: { canonical: "https://toolninja.io" },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ToolNinja",
  url: "https://toolninja.io",
  description:
    "Free online developer tools that run 100% in your browser. No login. Your data stays in your browser.",
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ToolNinja",
  url: "https://toolninja.io",
  logo: "https://toolninja.io/logo.png",
  sameAs: [PATREON_URL],
  description:
    "Fast, free developer tools. No login. No nonsense. Everything runs in your browser.",
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <HomeClient />
    </>
  );
}
