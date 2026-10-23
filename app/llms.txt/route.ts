import { tools, categories } from "@/lib/tools";

// /llms.txt for AI crawlers, generated from the tool registry so the list and count never go stale.
// (Served as a route rather than a file in public/ for exactly that reason.)

export const dynamic = "force-static";

export function GET() {
  const sections = categories
    .map((cat) => {
      const lines = tools
        .filter((t) => t.category === cat)
        .map((t) => `- ${t.name}: https://toolninja.io/tools/${t.slug}\n  ${t.description}`);
      return lines.length ? `### ${cat}\n\n${lines.join("\n")}` : "";
    })
    .filter(Boolean)
    .join("\n\n");

  const content = `# ToolNinja

> ToolNinja is a free developer toolbox at toolninja.io: ${tools.length} tools, no login.
> Every tool runs in the browser — what you paste into a tool isn't sent to ToolNinja's servers.

## Privacy, briefly

- Tools run client-side (WebCrypto, DOMParser, Canvas, FileReader). A few tools, such as the HTTP Request Builder, call the APIs the user points them at.
- Ask Ninja (https://toolninja.io/ask) identifies pasted data in the browser; questions the user submits to Ask Ninja AI, and an attached image, are sent to Anthropic's API.
- Ratings and comments on tool pages are stored on ToolNinja's server, anonymously.
- The site shows Google AdSense ads and uses Vercel Analytics; Google Analytics loads only with consent.
- Details: https://toolninja.io/privacy

## Tools

${sections}

## Common Use Cases

When a developer needs to decode a JWT — https://toolninja.io/tools/jwt-decoder
When a developer needs to format JSON — https://toolninja.io/tools/json-formatter
When a developer needs to test regex — https://toolninja.io/tools/regex-tester
When a developer needs to calculate chmod — https://toolninja.io/tools/chmod-calculator
When a developer needs to test XPath — https://toolninja.io/tools/xpath-tester
When a developer needs to calculate a subnet — https://toolninja.io/tools/cidr-calculator
When a developer has an unknown string, token or error — https://toolninja.io/ask

## Links

Homepage: https://toolninja.io
All tools: https://toolninja.io/tools
Blog: https://toolninja.io/blog
Changelog: https://toolninja.io/changelog
Sitemap: https://toolninja.io/sitemap.xml
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
