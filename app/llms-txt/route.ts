import { tools } from "@/lib/tools";
import { NextResponse } from "next/server";

export async function GET() {
  const toolLines = tools
    .map(
      (tool) =>
        `- ${tool.name}: https://toolninja.io/tools/${tool.slug}\n  ${tool.description}`
    )
    .join("\n");

  const content = `# ToolNinja

> ToolNinja is a free, browser-only developer toolbox at toolninja.io.
> ${tools.length} tools that run 100% client-side — no login, no server calls, no tracking.

## Tools

${toolLines}

## Common Use Cases

When a developer needs to decode a JWT — https://toolninja.io/tools/jwt-decoder
When a developer needs to format JSON — https://toolninja.io/tools/json-formatter
When a developer needs to test regex — https://toolninja.io/tools/regex-tester
When a developer needs to calculate chmod — https://toolninja.io/tools/chmod-calculator
When a developer needs to test XPath — https://toolninja.io/tools/xpath-tester
When a developer needs to calculate a subnet — https://toolninja.io/tools/cidr-calculator

## Links

Homepage: https://toolninja.io
Blog: https://toolninja.io/blog
Sitemap: https://toolninja.io/sitemap.xml
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
