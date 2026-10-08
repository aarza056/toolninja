import type { Metadata } from "next";
import { tools } from "./tools";
import { SITE_NAME, SITE_URL } from "./site";
import { toolGraph } from "./structured-data";

// Search titles and descriptions for every tool page. Titles exclude the " | ToolNinja" suffix,
// which the root layout's title template adds. Keep titles within 48 characters (60 with the
// suffix) and descriptions within 155; `npm run check:seo` enforces both after a build.
const toolMeta: Record<string, { title: string; description: string }> = {
  "json-formatter": {
    title: "JSON Formatter & Validator Online",
    description:
      "Format, validate and minify JSON with clear error locations, a tree view, JSONPath queries and flatten/unflatten. Free, no login.",
  },
  "ndjson-formatter": {
    title: "NDJSON / JSON Lines Formatter & Validator",
    description:
      "Validate and pretty-print newline-delimited JSON line by line, and convert NDJSON to or from a regular JSON array. Free, no login.",
  },
  "markdown-preview": {
    title: "Markdown Editor with Live Preview",
    description:
      "Write Markdown and see GitHub Flavored Markdown rendered live, with word count, reading time and HTML export. Free, no login.",
  },
  "sql-formatter": {
    title: "SQL Formatter: Beautify SQL Queries",
    description:
      "Format and indent SQL queries for MySQL, PostgreSQL, SQLite, T-SQL and more, with keyword case options. Free, no login.",
  },
  "html-formatter": {
    title: "HTML Formatter & Minifier Online",
    description:
      "Beautify messy HTML with clean indentation, or minify it for production. Free online HTML formatter, no login.",
  },
  "word-counter": {
    title: "Word Counter: Words, Characters, Reading Time",
    description:
      "Count words, characters, sentences and paragraphs, with reading and speaking time estimates. Free online word counter, no login.",
  },
  "svg-optimizer": {
    title: "SVG Optimizer: Minify and Clean SVG Files",
    description:
      "Shrink SVG files by stripping comments, metadata and editor cruft from Inkscape and other tools. See the size saving instantly.",
  },
  "image-compressor": {
    title: "Image Compressor for JPEG, PNG & WebP",
    description:
      "Compress and resize JPEG, PNG and WebP images in your browser with adjustable quality and a before/after size comparison.",
  },
  "graphql-formatter": {
    title: "GraphQL Formatter: Beautify & Minify Queries",
    description:
      "Format GraphQL queries, mutations, subscriptions and fragments with clean indentation, or minify them. Handles directives.",
  },
  "xml-formatter": {
    title: "XML Formatter & Validator Online",
    description:
      "Prettify or minify XML with CDATA-safe formatting, and catch unclosed or mismatched tags with structural validation.",
  },
  "base64": {
    title: "Base64 Encoder & Decoder Online",
    description:
      "Encode text or files to Base64 and decode Base64 back, with standard and URL-safe alphabets. Free online Base64 tool, no login.",
  },
  "url-encoder": {
    title: "URL Encoder & Decoder: Percent-Encoding",
    description:
      "Percent-encode special characters for URLs or decode encoded URLs, for full URIs or single query string values. Free, no login.",
  },
  "jwt-decoder": {
    title: "JWT Decoder: Decode & Verify JSON Web Tokens",
    description:
      "Decode a JWT's header and payload, check expiry, and verify the signature with a secret or public key (HS, RS, PS, ES).",
  },
  "hash-generator": {
    title: "Hash Generator: SHA-256, SHA-512 & HMAC",
    description:
      "Generate SHA-1, SHA-256, SHA-384, SHA-512 and HMAC hashes of text or files, and verify a hash against an expected value.",
  },
  "html-entity": {
    title: "HTML Entity Encoder & Decoder",
    description:
      "Escape special characters to HTML entities or decode entities back to plain text. Supports all standard HTML5 named entities.",
  },
  "image-to-base64": {
    title: "Image to Base64 & Data URI Converter",
    description:
      "Convert PNG, JPG, GIF, SVG and WebP images to Base64 strings and data URIs for embedding in CSS or HTML. Free, no login.",
  },
  "base58": {
    title: "Base58 Encoder & Decoder (Bitcoin Alphabet)",
    description:
      "Encode text or hex bytes to Base58, the Bitcoin alphabet without 0, O, I and l, or decode Base58 back to text or hex.",
  },
  "base32": {
    title: "Base32 Encoder & Decoder (RFC 4648)",
    description:
      "Encode text or hex bytes to RFC 4648 Base32, the format behind TOTP secrets, or decode Base32 back to text or hex.",
  },
  "base62-encoder": {
    title: "Base62 Encoder & Decoder Online",
    description:
      "Encode text or hex bytes to Base62 (0-9, A-Z, a-z), the alphabet behind short URLs and compact IDs, or decode it back.",
  },
  "lorem-ipsum": {
    title: "Lorem Ipsum Generator: Placeholder Text",
    description:
      "Generate Lorem Ipsum placeholder text by paragraphs, sentences or words, ready to copy into mockups. Free, no login.",
  },
  "password-generator": {
    title: "Strong Password Generator Online",
    description:
      "Generate strong random passwords and passphrases with custom length and character sets, using your browser's secure RNG.",
  },
  "uuid-generator": {
    title: "UUID Generator: v4, v5, v7 & NanoID",
    description:
      "Generate random UUID v4, time-ordered UUID v7, namespace UUID v5 or NanoID values, up to 100 at a time. Free, no login.",
  },
  "ulid-generator": {
    title: "ULID Generator: Sortable Unique IDs",
    description:
      "Generate sortable, URL-safe ULIDs in bulk: a 48-bit timestamp plus 80 bits of randomness in Crockford Base32.",
  },
  "json-to-typescript": {
    title: "JSON to TypeScript Interface Generator",
    description:
      "Paste JSON and generate TypeScript interfaces and type definitions for API responses, nested objects included.",
  },
  "qr-code-generator": {
    title: "QR Code Generator: URL, WiFi, vCard",
    description:
      "Create QR codes for URLs, text, WiFi logins, contact cards and calendar events, and download them as PNG. Free, no watermarks.",
  },
  "qr-code-scanner": {
    title: "QR Code Scanner & Decoder Online",
    description:
      "Upload a QR code image and see the decoded text, URL or otpauth:// 2FA secret inside. Decoding runs in your browser.",
  },
  "jwt-generator": {
    title: "JWT Generator: Create & Sign Tokens",
    description:
      "Create and sign JSON Web Tokens with HS256, RS256 or ES256 for testing, using a pasted key or a freshly generated key pair.",
  },
  "git-command-generator": {
    title: "Git Command Generator & Explainer",
    description:
      "Describe what you want to do in plain English and get the matching git command, or paste a command to see what it does.",
  },
  "markdown-table-generator": {
    title: "Markdown Table Generator",
    description:
      "Build Markdown tables visually, with column alignment, then copy clean GitHub Flavored Markdown. Free, no login.",
  },
  "markdown-toc-generator": {
    title: "Markdown Table of Contents Generator",
    description:
      "Generate a linked table of contents from your Markdown headings, with GitHub-compatible anchors. Free, no login.",
  },
  "meta-tags-generator": {
    title: "Meta Tags & Open Graph Generator",
    description:
      "Generate title, description, Open Graph and Twitter Card tags, and preview how a link will look when shared.",
  },
  "favicon-generator": {
    title: "Favicon Generator: All Sizes from One Image",
    description:
      "Upload one image and get 16x16 and 32x32 favicons, an Apple touch icon and Android Chrome icons, plus the HTML tags.",
  },
  "fake-data-generator": {
    title: "Fake Data Generator: Mock JSON & CSV",
    description:
      "Define a schema with names, emails, UUIDs, dates and more, and generate realistic mock JSON or CSV with an optional seed.",
  },
  "gitignore-generator": {
    title: ".gitignore Generator for Any Stack",
    description:
      "Build a .gitignore from templates for languages, frameworks, editors and OSes, and test which paths it ignores.",
  },
  "json-schema-generator": {
    title: "JSON Schema Generator & Validator",
    description:
      "Generate a JSON Schema from sample JSON, then validate documents against it with clear error paths. Free, no login.",
  },
  "slug-generator": {
    title: "URL Slug Generator",
    description:
      "Turn titles into clean, URL-safe slugs, one at a time or in batch mode with one title per line. Free, no login.",
  },
  "robots-txt-generator": {
    title: "robots.txt Generator with AI Crawler Rules",
    description:
      "Build a robots.txt file with rules for search engines and AI crawlers like GPTBot and ClaudeBot, plus a Sitemap line.",
  },
  "sitemap-generator": {
    title: "XML Sitemap Generator: Create sitemap.xml",
    description:
      "Create a valid sitemap.xml from a list of URLs, with optional lastmod, changefreq and priority values. Free, no login.",
  },
  "barcode-generator": {
    title: "Barcode Generator: Code 128, EAN-13, UPC-A",
    description:
      "Create Code 128, EAN-13 and UPC-A barcodes with automatic check digits, and download them as PNG. Free, no login.",
  },
  "readme-badge-generator": {
    title: "README Badge Generator for shields.io",
    description:
      "Build shields.io badges for your README, custom or live npm and GitHub stats, as ready-to-paste Markdown and HTML.",
  },
  "color-converter": {
    title: "Color Converter: HEX, RGB, HSL, OKLCH",
    description:
      "Convert colors between HEX, RGB, HSL, CMYK and OKLCH with a live preview and copy-ready CSS values. Free, no login.",
  },
  "timestamp-converter": {
    title: "Unix Timestamp Converter: Epoch to Date",
    description:
      "Convert Unix epoch time in seconds or milliseconds to readable dates (UTC, local and relative), and dates back to epoch.",
  },
  "number-base-converter": {
    title: "Number Base Converter: Binary, Hex, Decimal",
    description:
      "Convert numbers between binary, octal, decimal and hexadecimal, including large values. Free online converter, no login.",
  },
  "string-case-converter": {
    title: "String Case Converter: camelCase, snake_case",
    description:
      "Convert text between camelCase, PascalCase, snake_case, kebab-case, UPPER_CASE and more in one click. Free, no login.",
  },
  "json-yaml": {
    title: "JSON to YAML Converter (and YAML to JSON)",
    description:
      "Convert JSON to YAML or YAML to JSON with validation and clear errors, for configs, Kubernetes manifests and CI files.",
  },
  "cidr-calculator": {
    title: "CIDR Calculator: IPv4 & IPv6 Subnets",
    description:
      "Calculate network address, broadcast, usable host range and mask for any CIDR block, and split networks into subnets.",
  },
  "docker-run-to-compose": {
    title: "Docker Run to Compose Converter",
    description:
      "Convert docker run commands to docker-compose.yml and back, with multi-service support and a best-practice check.",
  },
  "csv-json": {
    title: "CSV to JSON Converter (and JSON to CSV)",
    description:
      "Convert CSV to JSON or JSON to CSV with custom delimiters, quoted fields and file upload. Free online converter, no login.",
  },
  "xml-json-converter": {
    title: "XML to JSON Converter (and JSON to XML)",
    description:
      "Convert XML to JSON or JSON to XML, with attributes and repeated elements handled predictably. Free, no login.",
  },
  "env-file-tool": {
    title: ".env File Parser & .env.example Generator",
    description:
      "Parse and validate .env files, catch duplicate keys, convert to JSON, and generate a safe-to-commit .env.example.",
  },
  "curl-to-code": {
    title: "cURL to Code: JavaScript, Python, Go",
    description:
      "Convert curl commands to fetch, axios, Python requests, PHP or Go code with headers, auth and body preserved.",
  },
  "url-parser": {
    title: "URL Parser & Query String Builder",
    description:
      "Break a URL into protocol, host, path, query parameters and hash, then edit parameters and rebuild the URL.",
  },
  "htaccess-to-nginx": {
    title: ".htaccess to Nginx Config Converter",
    description:
      "Convert Apache RewriteRule, RewriteCond, redirects, ErrorDocument and the WordPress rewrite block to nginx config.",
  },
  "meeting-planner": {
    title: "Meeting Planner: Compare Time Zones",
    description:
      "Find a meeting time that works across time zones, see overlapping working hours, and export the slot to your calendar.",
  },
  "json-to-markdown-table": {
    title: "JSON to Markdown Table Converter",
    description:
      "Turn a JSON array of objects into a GitHub Flavored Markdown table, ready for READMEs and docs. Free, no login.",
  },
  "list-sorter": {
    title: "List Sorter & Deduplicator",
    description:
      "Sort lines alphabetically or numerically, remove duplicates and blank lines, and shuffle, reverse or number a list.",
  },
  "svg-to-jsx": {
    title: "SVG to JSX & React Component Converter",
    description:
      "Convert raw SVG markup into a ready-to-use React component, with attributes camelCased and props spread onto the root.",
  },
  "regex-tester": {
    title: "Regex Tester with Live Match Highlighting",
    description:
      "Test JavaScript regular expressions with live highlighting, capture groups, a plain-English explanation and a pattern library.",
  },
  "diff-checker": {
    title: "Diff Checker: Compare Two Texts Online",
    description:
      "Compare two blocks of text or code side by side and see added, removed and changed lines highlighted. Free, no login.",
  },
  "cron-tester": {
    title: "Cron Expression Tester & Explainer",
    description:
      "Validate a cron expression, read it in plain English, and preview the next run times before you deploy the schedule.",
  },
  "http-request": {
    title: "HTTP Request Builder: Online API Tester",
    description:
      "Send GET, POST, PUT and DELETE requests from your browser, inspect status, headers and JSON, and import Postman collections.",
  },
  "config-validator": {
    title: "YAML, TOML & JSON Config Validator",
    description:
      "Validate YAML, TOML and JSON config files and get the exact line and reason for syntax errors. Free, no login.",
  },
  "text-diff": {
    title: "Text Diff: Word & Character Level",
    description:
      "Compare two texts at word or character level to spot small edits that line-based diff tools miss. Free, no login.",
  },
  "xpath-tester": {
    title: "XPath Tester: Evaluate XPath on XML & HTML",
    description:
      "Test XPath 1.0 expressions against XML or HTML and see matched nodes, result types and values live. Free, no login.",
  },
  "css-xpath-converter": {
    title: "CSS Selector to XPath Converter",
    description:
      "Convert CSS selectors (ids, classes, attributes, combinators, nth-child) to XPath and back, for Selenium, Playwright and scraping.",
  },
  "json-diff": {
    title: "JSON Diff: Compare Two JSON Objects",
    description:
      "Compare two JSON documents structurally and see added, removed and changed paths, ignoring key order. Free, no login.",
  },
  "json-patch-tool": {
    title: "JSON Patch (RFC 6902) Generator & Applier",
    description:
      "Diff two JSON documents into an RFC 6902 JSON Patch, or apply an existing patch to a document. Free, no login.",
  },
  "iban-validator": {
    title: "IBAN Validator & Test IBAN Generator",
    description:
      "Validate an IBAN's country format and MOD-97 checksum, see its parts, or generate valid test IBANs. Free, no login.",
  },
  "patch-generator": {
    title: "Unified Diff & Patch File Generator",
    description:
      "Create a unified diff or .patch file from two versions of a text, ready to apply with git apply or patch.",
  },
  "uuid-parser": {
    title: "UUID Parser: Version, Variant & Timestamp",
    description:
      "Decode a UUID or ULID to see its version, variant and embedded timestamp for v1, v6, v7 and ULID values.",
  },
  "ts7-migration-checker": {
    title: "TypeScript 7 Migration Checker",
    description:
      "Paste a tsconfig.json and see which compiler options the Go-based TypeScript 7 compiler removes or changes.",
  },
  "node-type-stripping-checker": {
    title: "Node.js Type-Stripping Checker",
    description:
      "Check whether TypeScript code can run under Node.js type stripping, and find enums, namespaces and other blockers.",
  },
  "http-header-inspector": {
    title: "HTTP Header Inspector & Explainer",
    description:
      "Paste raw HTTP response headers and get a plain-English explanation of each one, from Cache-Control to CSP and CORS.",
  },
  "credit-card-test-generator": {
    title: "Test Credit Card Numbers & Luhn Validator",
    description:
      "Generate Luhn-valid fake Visa, Mastercard, Amex and Discover numbers for testing payment forms, or check any Luhn checksum.",
  },
  "cors-debugger": {
    title: "CORS Error Debugger: Fix Allow-Origin Errors",
    description:
      "Paste your request and response headers to see why a CORS request fails, including preflight issues, and how to fix it.",
  },
  "jsonpath-tester": {
    title: "JSONPath Tester: Query JSON Online",
    description:
      "Run JSONPath expressions against your JSON and see matched values and paths live, with filters and wildcards.",
  },
  "user-agent-parser": {
    title: "User-Agent Parser: Browser, OS & Device",
    description:
      "Decode any User-Agent string into browser, engine, operating system and device type. Free online UA parser.",
  },
  "css-animations": {
    title: "CSS Animations Library: Copy-Paste Code",
    description:
      "Browse ready-made CSS keyframe animations, preview them live, and copy the code for your project. Free, no login.",
  },
  "css-flexbox-generator": {
    title: "CSS Flexbox Generator & Playground",
    description:
      "Build flexbox layouts visually with live preview, then copy the CSS for the container and items. Free, no login.",
  },
  "css-grid-generator": {
    title: "CSS Grid Generator: Visual Layout Builder",
    description:
      "Build CSS Grid layouts visually, including auto-fit tracks and per-cell row and column spans, then copy the CSS.",
  },
  "fluid-typography-calculator": {
    title: "Fluid Typography clamp() Calculator",
    description:
      "Generate CSS clamp() values that scale font sizes smoothly between two viewport widths, with a live preview.",
  },
  "css-gradient": {
    title: "CSS Gradient Generator: Linear & Radial",
    description:
      "Create linear, radial and mesh-style CSS gradients with a visual editor and copy the CSS. Free, no login.",
  },
  "color-palette": {
    title: "Color Palette Generator & Exporter",
    description:
      "Generate complementary, analogous, triadic and monochrome palettes from a base color and export CSS variables, Tailwind or SCSS.",
  },
  "mermaid-editor": {
    title: "Mermaid Diagram Editor with Live Preview",
    description:
      "Write Mermaid flowcharts, sequence and class diagrams with a live preview, then export them as SVG or PNG.",
  },
  "image-color-picker": {
    title: "Image Color Palette Extractor",
    description:
      "Upload an image to extract its dominant colors as HEX and RGB values, ready to copy as CSS variables. Free, no login.",
  },
  "box-shadow-generator": {
    title: "CSS Box Shadow Generator",
    description:
      "Design single or multi-layer CSS box shadows with a live preview and copy the CSS. Free online generator, no login.",
  },
  "css-specificity-calculator": {
    title: "CSS Specificity Calculator",
    description:
      "Calculate the specificity of CSS selectors, compare them side by side, and see which rule wins and why.",
  },
  "placeholder-image-generator": {
    title: "Placeholder Image Generator",
    description:
      "Create placeholder images at any size, color and label, and download them or copy a data URI. Free, no login.",
  },
  "scrollbar-generator": {
    title: "CSS Scrollbar Generator",
    description:
      "Style custom scrollbars with a live preview and get CSS for both WebKit browsers and Firefox. Free, no login.",
  },
  "css-carousel-generator": {
    title: "CSS Scroll Carousel Generator (No JS)",
    description:
      "Build a scroll-snap carousel in pure CSS with a live preview, then copy the HTML and CSS. No JavaScript needed.",
  },
  "crypto-tools": {
    title: "AES & RSA Encryption Tool Online",
    description:
      "Encrypt and decrypt text or files with AES-GCM or RSA-OAEP using your browser's Web Crypto API. Free, no login.",
  },
  "csp-builder": {
    title: "CSP Header Builder & Analyzer",
    description:
      "Build a Content-Security-Policy header directive by directive, or paste an existing policy to find weaknesses.",
  },
  "jwt-keypair-generator": {
    title: "JWT Key Pair Generator: RS256, ES256",
    description:
      "Generate RSA and EC key pairs for signing JWTs (RS256, PS256, ES256) as PEM and JWK, using WebCrypto.",
  },
  "ssh-key-generator": {
    title: "SSH Key Generator: Ed25519 & RSA",
    description:
      "Generate Ed25519 or RSA SSH key pairs in OpenSSH format, ready for authorized_keys. Keys are created in your browser.",
  },
  "totp-generator": {
    title: "TOTP Generator: Live 2FA Codes",
    description:
      "Generate live time-based one-time passwords from a Base32 secret, with a countdown and configurable period and digits.",
  },
  "hotp-generator": {
    title: "HOTP Generator (RFC 4226 Counter OTP)",
    description:
      "Generate counter-based one-time passwords from a secret and counter value, following RFC 4226. Free, no login.",
  },
  "backup-codes-generator": {
    title: "2FA Backup Codes Generator",
    description:
      "Generate a set of one-time 2FA recovery codes plus their SHA-256 hashes, ready to store server-side. Free, no login.",
  },
  "package-json-inspector": {
    title: "package.json Install Script Inspector",
    description:
      "Paste a package.json to see which scripts run on npm install (preinstall, postinstall, prepare) and which deps aren't pinned.",
  },
  "security-headers-checker": {
    title: "HTTP Security Headers Checker",
    description:
      "Paste response headers to grade HSTS, CSP, X-Frame-Options and more, with a fix snippet for Nginx, Express or Apache.",
  },
  "jwk-pem-converter": {
    title: "JWK to PEM Converter (RSA & EC)",
    description:
      "Convert RSA and EC keys between JWK and PEM formats, for public and private keys, using the Web Crypto API.",
  },
  "secret-scanner": {
    title: "Secret Scanner: Find Hardcoded API Keys",
    description:
      "Paste code or config to find hardcoded API keys, tokens and credentials from AWS, GitHub, Stripe and more.",
  },
  "password-strength-checker": {
    title: "Password Strength Checker: Entropy",
    description:
      "Check a password's entropy, common-password matches, and sequential or keyboard-pattern weaknesses. Free, no login.",
  },
  "jwk-thumbprint-calculator": {
    title: "JWK Thumbprint Calculator (RFC 7638)",
    description:
      "Compute the RFC 7638 thumbprint of an RSA, EC or oct JSON Web Key with SHA-256, SHA-384 or SHA-512 to derive a stable kid.",
  },
  "passkey-tester": {
    title: "Passkey & WebAuthn Playground",
    description:
      "Create a real passkey and run a WebAuthn registration and sign-in ceremony in your browser to see every field.",
  },
  "contrast-checker": {
    title: "Color Contrast Checker (WCAG AA/AAA)",
    description:
      "Check text and background contrast against WCAG AA and AAA, and get a suggested color that passes. Free, no login.",
  },
  "color-blindness-simulator": {
    title: "Color Blindness Simulator for Images",
    description:
      "Preview an image or design as people with protanopia, deuteranopia, tritanopia and achromatopsia would see it.",
  },
  "http-status-codes": {
    title: "HTTP Status Codes: Complete Reference",
    description:
      "Look up every HTTP status code with plain-English meanings, common causes, and the codes developers often confuse.",
  },
  "chmod-calculator": {
    title: "Chmod Calculator: Linux File Permissions",
    description:
      "Convert between symbolic and octal Linux permissions, including setuid, setgid and sticky bits. Free, no login.",
  },
  "ai-token-counter": {
    title: "AI Token Counter & LLM Cost Estimator",
    description:
      "Roughly estimate a prompt's token count and compare its cost across Claude, GPT and Gemini models side by side.",
  },
  "unicode-explorer": {
    title: "Unicode Character Explorer",
    description:
      "Search Unicode characters by name, code point or character and see UTF-8 bytes, HTML entities and Unicode blocks.",
  },
};

export function generateToolMetadata(slug: string): Metadata {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) return {};

  const meta = toolMeta[slug] ?? {
    title: tool.name,
    description: `${tool.description}. Free, no login.`,
  };

  const url = `${SITE_URL}/tools/${slug}`;
  const ogImage = `/api/og?title=${encodeURIComponent(tool.name)}&desc=${encodeURIComponent(tool.description)}`;
  const socialTitle = `${meta.title} | ${SITE_NAME}`;

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: socialTitle,
      description: meta.description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: tool.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: meta.description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  };
}

/** SoftwareApplication + BreadcrumbList (+ FAQPage when the tool has an FAQ) as one @graph. */
export function generateToolJsonLd(slug: string) {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) return null;
  return toolGraph(slug, toolMeta[slug]?.description ?? tool.description);
}
