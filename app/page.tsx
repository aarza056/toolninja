import HomeClient from "./HomeClient";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ToolNinja",
  url: "https://toolninja.io",
  description:
    "Free online developer tools that run 100% in your browser. No login, no tracking.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://toolninja.io/?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ToolNinja",
  url: "https://toolninja.io",
  logo: "https://toolninja.io/icon.svg",
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
