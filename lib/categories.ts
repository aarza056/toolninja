import { tools, categories, type Category, type Tool } from "./tools";

export interface CategoryInfo {
  name: Category;
  slug: string;
  heading: string;
  title: string;
  description: string;
  intro: string[];
}

const INFO: Record<Category, Omit<CategoryInfo, "name" | "slug">> = {
  Format: {
    heading: "Code Formatters & Beautifiers",
    title: "Code Formatters — JSON, SQL, JS & XML",
    description:
      "Free online formatters for JSON, SQL, JavaScript, TypeScript, HTML, XML, GraphQL and more. Beautify, minify, and validate code in your browser. No login.",
    intro: [
      "Formatters turn minified, machine-generated, or hand-mangled code back into something a human can read — and minifiers do the reverse for production. Every tool here runs locally in your browser, so API responses, SQL with real table names, or config files with secrets never leave your machine.",
      "Most of these also validate as they format: a JSON formatter that pinpoints the exact line of a syntax error, an XML formatter that catches unclosed tags, an SQL formatter that understands 14 dialects. Paste, read, copy — no account, no upload.",
    ],
  },
  Encode: {
    heading: "Encoders & Decoders",
    title: "Encoders & Decoders — Base64, URL, JWT",
    description:
      "Free online encoders and decoders: Base64, URL encoding, HTML entities, JWT, Base58, Base32, Base62 and hashing. Everything runs in your browser. No login.",
    intro: [
      "Encoding isn't encryption — it's how binary data and special characters survive being placed somewhere they'd otherwise break: inside a URL, a JSON string, an HTTP header, or an HTML attribute. These tools convert both ways, so you can inspect what an encoded value actually contains.",
      "Use them to decode a JWT's payload while debugging auth, read a Base64 blob from an API response, percent-encode a query parameter correctly, or hash a file to verify a download. All processing is local — tokens and payloads you paste stay on your device.",
    ],
  },
  Generate: {
    heading: "Developer Generators",
    title: "Developer Generators — UUID, Password, QR",
    description:
      "Free online generators for UUIDs, ULIDs, passwords, QR codes, fake test data, .gitignore, licenses, Zod schemas, GitHub Actions workflows and more. No login.",
    intro: [
      "Generators save you from writing boilerplate by hand: unique IDs for database rows, strong passwords and secrets, realistic fake data for tests, a .gitignore for your stack, a LICENSE file, a CI workflow, or a typed schema inferred from a sample JSON payload.",
      "Anything security-sensitive — passwords, secrets, keys — is generated with your browser's cryptographically secure random number generator and never sent anywhere. Copy the result straight into your project.",
    ],
  },
  Convert: {
    heading: "Format Converters",
    title: "Developer Converters — JSON, YAML, CSV, CIDR",
    description:
      "Free online converters: JSON ↔ YAML, CSV ↔ JSON, XML ↔ JSON, cURL to code, docker run to Compose, timestamps, number bases, IP/CIDR ranges and more. No login.",
    intro: [
      "Converters translate the same data between the formats different tools expect: a CSV export into JSON for an API, a docker run command into a docker-compose.yml, a cURL command into fetch or Python requests, a Unix timestamp into a readable date, or a CIDR block into the IP range it covers.",
      "Each converter works in both directions where that makes sense, handles the edge cases that break naive conversions (quoted CSV fields, XML attributes, YAML anchors), and runs entirely client-side.",
    ],
  },
  Test: {
    heading: "Testers & Validators",
    title: "Testers & Validators — Regex, XPath, JSON",
    description:
      "Free online testers and validators: regex tester, XPath tester, JSONPath, JSON diff, cron expressions, CORS debugger, WebSocket client, semver ranges and more. No login.",
    intro: [
      "Testers give you an instant feedback loop for the expressions and payloads that are hard to get right in your head: a regular expression against sample text, an XPath query against real HTML, a cron schedule's next run times, or whether a version satisfies an npm range.",
      "Validators and diff tools answer the debugging questions — what exactly changed between two API responses, why a CORS request is blocked, whether a card number passes the Luhn check. Results update live as you type.",
    ],
  },
  Design: {
    heading: "CSS & Design Tools",
    title: "CSS & Design Tools — Gradient, Grid, Color",
    description:
      "Free CSS and design tools: gradient, box-shadow, flexbox and grid generators, color palettes, unit converter, clamp() calculator, SVG tools and Mermaid diagrams. No login.",
    intro: [
      "Visual tools for the parts of front-end work that are faster to tune by eye than by editing numbers: gradients, shadows, flexbox and grid layouts, fluid typography, color palettes, and scrollbar styling — each with a live preview and copy-ready CSS.",
      "There are also utilities for the assets around a design — optimizing SVGs, converting SVG to JSX, extracting a palette from an image, and generating placeholder images — all running locally in your browser.",
    ],
  },
  Security: {
    heading: "Security Tools",
    title: "Developer Security Tools — TOTP, SSH, SSL",
    description:
      "Free browser-based security tools: TOTP/2FA generator, SSH and JWT key generators, bcrypt, certificate decoder, CSP builder, secret scanner and more. Nothing leaves your device.",
    intro: [
      "Security tooling is exactly where you shouldn't paste data into a random website — so every tool here runs entirely in your browser using the Web Crypto API. Keys, secrets, certificates, and passwords are generated or processed locally and never transmitted.",
      "Use them to test a 2FA integration with live TOTP codes, generate SSH or JWT signing keys, hash and verify passwords with bcrypt, inspect a TLS certificate's expiry and SANs, build a Content-Security-Policy, or scan code for hardcoded API keys before it reaches git.",
    ],
  },
  Accessibility: {
    heading: "Accessibility Tools",
    title: "Accessibility Tools — WCAG Contrast Checker",
    description:
      "Free accessibility tools: check WCAG AA/AAA color contrast and simulate how images look under 7 types of color vision deficiency. Runs in your browser. No login.",
    intro: [
      "Around 1 in 12 men and 1 in 200 women have some form of color vision deficiency, and low-contrast text is one of the most common accessibility failures on the web. These tools check your design against WCAG contrast thresholds and show what an image actually looks like to people with different types of color blindness.",
      "With the European Accessibility Act now enforced, contrast compliance is increasingly a legal requirement as well as a usability one.",
    ],
  },
  Reference: {
    heading: "Developer References",
    title: "Developer References — HTTP Codes, Chmod",
    description:
      "Interactive developer references: searchable HTTP status codes, chmod permission calculator, Unicode character explorer, and an AI token cost estimator. Free, no login.",
    intro: [
      "Interactive references for the lookups you do often enough to need, but not often enough to memorize: what an HTTP status code means and how it differs from its neighbors, what chmod 755 actually grants, which Unicode code point a character is, or what a prompt will cost across different LLMs.",
    ],
  },
};

export function categorySlug(name: string): string {
  return name.toLowerCase();
}

export const CATEGORY_INFO: CategoryInfo[] = categories.map((name) => ({
  name,
  slug: categorySlug(name),
  ...INFO[name],
}));

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return CATEGORY_INFO.find((c) => c.slug === slug);
}

export function toolsInCategory(name: Category): Tool[] {
  return tools.filter((t) => t.category === name);
}
