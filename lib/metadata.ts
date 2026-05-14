import type { Metadata } from "next";
import { tools } from "./tools";

const BASE_URL = "https://toolninja.io";

const toolMeta: Record<string, { title: string; description: string }> = {
  // ── Format ───────────────────────────────────────────────────────────────
  "json-formatter": {
    title: "JSON Formatter & Validator Online — Beautify, Minify & Validate JSON | ToolNinja",
    description:
      "Free online JSON formatter, validator and beautifier. Format, validate, minify and pretty print JSON instantly with syntax highlighting and error detection. JSONPath query support included. No login, 100% browser-based.",
  },
  "markdown-preview": {
    title: "Markdown Preview & Editor Online — Live Markdown Renderer | ToolNinja",
    description:
      "Free online Markdown editor with live preview. Write and preview Markdown in real time with GitHub Flavored Markdown support. Includes word count, reading time and HTML export. No login required.",
  },
  "sql-formatter": {
    title: "SQL Formatter Online — Beautify & Format SQL Queries | ToolNinja",
    description:
      "Free online SQL formatter and beautifier. Format, indent and pretty print SQL queries instantly. Supports MySQL, PostgreSQL, SQLite, T-SQL and more. Keyword case options included. No login, browser-only.",
  },
  "html-formatter": {
    title: "HTML Formatter Online — Beautify & Minify HTML Code | ToolNinja",
    description:
      "Free online HTML formatter, beautifier and minifier. Format messy HTML instantly with proper indentation and clean output. Also minifies HTML for production. No login, 100% browser-based.",
  },

  // ── Encode ───────────────────────────────────────────────────────────────
  "base64": {
    title: "Base64 Encoder & Decoder Online — Encode & Decode Base64 | ToolNinja",
    description:
      "Free online Base64 encoder and decoder. Encode text to Base64 or decode Base64 strings instantly. Supports standard Base64 and Base64URL encoding. Your data never leaves the browser. No login required.",
  },
  "url-encoder": {
    title: "URL Encoder & Decoder Online — Percent Encode & Decode URLs | ToolNinja",
    description:
      "Free online URL encoder and decoder. Encode special characters for safe URL usage or decode percent-encoded URLs instantly. Supports full URI encoding and query string encoding. No login, browser-only.",
  },
  "jwt-decoder": {
    title: "JWT Decoder Online — Decode & Inspect JSON Web Tokens | ToolNinja",
    description:
      "Free online JWT decoder. Decode and inspect JSON Web Token header, payload and signature instantly. Check JWT expiry, view claims and debug authentication tokens. Your token never leaves the browser.",
  },
  "hash-generator": {
    title: "Hash Generator Online — MD5, SHA256, SHA512 Hash Calculator | ToolNinja",
    description:
      "Free online hash generator. Generate MD5, SHA1, SHA256, SHA512 and other cryptographic hashes instantly. Perfect for checksums, data integrity verification and password hashing comparison. No login required.",
  },
  "html-entity": {
    title: "HTML Entity Encoder & Decoder — Escape & Unescape HTML | ToolNinja",
    description:
      "Free online HTML entity encoder and decoder. Escape special characters to HTML entities or unescape HTML entities to plain text. Supports all standard HTML5 entities. No login, browser-only.",
  },
  "image-to-base64": {
    title: "Image to Base64 Converter Online — Encode Images as Base64 | ToolNinja",
    description:
      "Free online image to Base64 converter. Convert PNG, JPG, GIF, SVG and WebP images to Base64 strings instantly. Generate data URIs for embedding images in CSS or HTML. No upload to server — 100% browser-based.",
  },

  // ── Generate ─────────────────────────────────────────────────────────────
  "lorem-ipsum": {
    title: "Lorem Ipsum Generator Online — Placeholder Text Generator | ToolNinja",
    description:
      "Free online Lorem Ipsum generator. Generate placeholder and dummy text by paragraphs, sentences or words instantly. Classic Lorem Ipsum or random text. No login required, 100% browser-based.",
  },
  "password-generator": {
    title: "Password Generator Online — Strong Random Password Creator | ToolNinja",
    description:
      "Free online strong password generator. Generate secure random passwords with custom length, uppercase, lowercase, numbers and symbols. Password strength indicator included. No login, runs entirely in your browser.",
  },
  "uuid-generator": {
    title: "UUID Generator Online — Generate UUID v4 & GUID Online | ToolNinja",
    description:
      "Free online UUID and GUID generator. Generate random UUID v4 identifiers instantly, in bulk up to 100 at a time. Copy individually or all at once. No login, 100% browser-based.",
  },
  "json-to-typescript": {
    title: "JSON to TypeScript Converter — Generate TypeScript Interfaces | ToolNinja",
    description:
      "Free online JSON to TypeScript converter. Paste any JSON and instantly generate TypeScript interfaces and type definitions. Perfect for API response typing. No login, 100% browser-based.",
  },
  "qr-code-generator": {
    title: "QR Code Generator Online — Create Free QR Codes Instantly | ToolNinja",
    description:
      "Free online QR code generator. Create QR codes for URLs, text, emails and more instantly. Download as PNG. No account required, no watermarks, 100% free and browser-based.",
  },
  "jwt-generator": {
    title: "JWT Generator Online — Create & Sign JSON Web Tokens | ToolNinja",
    description:
      "Free online JWT generator. Create and sign JSON Web Tokens with HMAC-SHA256 using WebCrypto directly in your browser. Custom header, payload and expiry support. Your secret never leaves the browser.",
  },
  "git-command-generator": {
    title: "Git Command Generator — Plain English to Git Commands | ToolNinja",
    description:
      "Free online Git command generator. Describe what you want to do in plain English and get the exact git command instantly. 65+ git commands including undo commit, branch, stash, rebase and more. No login required.",
  },
  "markdown-table-generator": {
    title: "Markdown Table Generator — Create Tables Visually | ToolNinja",
    description:
      "Free online Markdown table generator. Build tables visually with a spreadsheet-style editor and export as clean Markdown or HTML. Import from CSV, set column alignment. No login, browser-only.",
  },
  "meta-tags-generator": {
    title: "Meta Tags Generator — OG Tags & Social Preview Tool | ToolNinja",
    description:
      "Free online meta tags generator. Generate Open Graph, Twitter Card and SEO meta tags with live social preview for Twitter, LinkedIn and Slack. See exactly how your link looks when shared. No login required.",
  },

  // ── Convert ──────────────────────────────────────────────────────────────
  "color-converter": {
    title: "Color Converter Online — HEX to RGB, HSL Color Code Converter | ToolNinja",
    description:
      "Free online color converter. Convert HEX to RGB, RGB to HSL, HSL to HEX and all color formats instantly. Includes live color picker and copy buttons for each format. No login, 100% browser-based.",
  },
  "timestamp-converter": {
    title: "Unix Timestamp Converter — Epoch Time to Date Converter | ToolNinja",
    description:
      "Free online Unix timestamp converter. Convert epoch time to human readable dates or dates to Unix timestamps instantly. Supports seconds and milliseconds. Shows UTC, local time and relative time. No login required.",
  },
  "number-base-converter": {
    title: "Number Base Converter — Binary, Decimal, Hex Converter | ToolNinja",
    description:
      "Free online number base converter. Convert between binary, decimal, hexadecimal and octal number systems instantly. Supports any base from 2 to 36. No login, 100% browser-based.",
  },
  "string-case-converter": {
    title: "String Case Converter — camelCase, snake_case, kebab-case | ToolNinja",
    description:
      "Free online string case converter. Convert text between camelCase, snake_case, kebab-case, PascalCase, UPPER_CASE and more instantly. No login, 100% browser-based.",
  },
  "json-yaml": {
    title: "JSON to YAML Converter — Convert JSON & YAML Online | ToolNinja",
    description:
      "Free online JSON to YAML and YAML to JSON converter. Convert between JSON and YAML formats instantly with syntax validation. Perfect for config file conversion. No login, browser-only.",
  },
  "cidr-calculator": {
    title: "CIDR Calculator — Subnet Calculator & IP Range Tool | ToolNinja",
    description:
      "Free online CIDR calculator and subnet calculator. Calculate IP ranges, subnet masks, network and broadcast addresses instantly. Supports ip to cidr conversion, cidr ranges calculator and subnetting. 100% browser-based, no login.",
  },

  // ── Test ─────────────────────────────────────────────────────────────────
  "regex-tester": {
    title: "Regex Tester Online — Test & Debug Regular Expressions | ToolNinja",
    description:
      "Free online regex tester with live match highlighting. Test regular expressions with real-time results, match tables, capture groups and replace mode. Supports all JavaScript regex flags. No login, browser-only.",
  },
  "diff-checker": {
    title: "Diff Checker Online — Compare Two Texts & Find Differences | ToolNinja",
    description:
      "Free online diff checker. Compare two texts side by side and see differences highlighted instantly. Line-by-line git-style diff with addition and deletion counts. No login, 100% browser-based.",
  },
  "cron-tester": {
    title: "CRON Expression Tester — Validate & Parse Cron Jobs Online | ToolNinja",
    description:
      "Free online CRON expression tester. Validate, parse and test cron job schedules instantly. See next execution times in human readable format. Supports standard and Quartz cron syntax. No login required.",
  },
  "http-request": {
    title: "HTTP Request Builder — Online API Tester & REST Client | ToolNinja",
    description:
      "Free online HTTP request builder and API tester. Send GET, POST, PUT, DELETE requests with custom headers and body. See response status, headers and formatted JSON. A free Postman alternative. No login required.",
  },
  "config-validator": {
    title: "YAML & TOML Validator — Config File Validator Online | ToolNinja",
    description:
      "Free online YAML, TOML and JSON validator. Validate and lint config files instantly with detailed error messages. Auto-detect format and convert between YAML, TOML and JSON. No login, browser-only.",
  },
  "text-diff": {
    title: "Text Diff Tool — Character & Word Level Text Comparison | ToolNinja",
    description:
      "Free online text diff tool. Compare strings at character, word or line level with inline diff highlighting. Uses Myers algorithm for accurate differences. Perfect for comparing code snippets. No login required.",
  },

  // ── Design ───────────────────────────────────────────────────────────────
  "css-animations": {
    title: "CSS Animations Library — Copy-Paste Animation Code | ToolNinja",
    description:
      "Free CSS animations library with live previews. 27 ready-to-use CSS animation examples including buttons, loaders, text effects and card animations. One-click copy HTML and CSS code. No login required.",
  },
  "css-gradient": {
    title: "CSS Gradient Generator — Linear, Radial & Mesh Gradients | ToolNinja",
    description:
      "Free online CSS gradient generator. Create linear, radial, conic and mesh gradients with a visual editor. Get clean CSS code instantly. Multi-stop gradient support included. No login, browser-only.",
  },
  "color-palette": {
    title: "Color Palette Generator — Create Color Schemes Online | ToolNinja",
    description:
      "Free online color palette generator. Create complementary, analogous, triadic, tetradic and monochromatic color schemes from any base color. Copy HEX, RGB and HSL values. No login required.",
  },

  // ── Security ─────────────────────────────────────────────────────────────
  "crypto-tools": {
    title: "AES & RSA Encryption Online — Encrypt & Decrypt Text | ToolNinja",
    description:
      "Free online AES-GCM and RSA-OAEP encryption tool. Encrypt and decrypt text directly in your browser using WebCrypto API. AES 256-bit with PBKDF2 key derivation. Your data never leaves your machine. No login.",
  },

  // ── Reference ────────────────────────────────────────────────────────────
  "http-status-codes": {
    title: "HTTP Status Codes Reference — Complete List of HTTP Codes | ToolNinja",
    description:
      "Complete HTTP status codes reference. Look up every HTTP response code including 200, 301, 404, 500 and more with descriptions and use cases. Developer-friendly HTTP codes cheat sheet. No login required.",
  },
  "chmod-calculator": {
    title: "Chmod Calculator — Linux File Permission Calculator | ToolNinja",
    description:
      "Free online chmod calculator and Linux file permission calculator. Convert between symbolic (rwxr-xr-x) and octal (755, 644, 777) permissions visually. Calculate chmod values for any Unix/Linux permission. No login, browser-only.",
  },
  "unicode-explorer": {
    title: "Unicode Explorer — Search Unicode Characters & Code Points | ToolNinja",
    description:
      "Free online Unicode explorer. Search and browse Unicode characters by name, code point or character. View UTF-8 bytes, HTML entities and Unicode blocks. Perfect for finding special characters. No login required.",
  },
};

export function generateToolMetadata(slug: string): Metadata {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) return {};

  const meta = toolMeta[slug] ?? {
    title: `${tool.name} Online — Free Developer Tool | ToolNinja`,
    description: `${tool.description}. Free, online, no login required. Your data never leaves your browser.`,
  };

  const url = `${BASE_URL}/tools/${slug}`;
  const ogImage = `/api/og?title=${encodeURIComponent(tool.name)}&desc=${encodeURIComponent(tool.description)}`;

  return {
    title: meta.title,
    description: meta.description,
    keywords: [
      ...tool.keywords,
      "free online tool",
      "developer tools",
      "browser tool",
      "no login",
      "toolninja",
    ],
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      siteName: "ToolNinja",
      images: [{ url: ogImage, width: 1200, height: 630, alt: tool.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateToolJsonLd(slug: string) {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) return null;

  const meta = toolMeta[slug];

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    url: `${BASE_URL}/tools/${slug}`,
    description: meta?.description ?? `${tool.description}. Free, online, no login required.`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    provider: {
      "@type": "Organization",
      name: "ToolNinja",
      url: BASE_URL,
    },
  };
}
