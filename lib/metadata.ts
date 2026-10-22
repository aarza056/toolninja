import type { Metadata } from "next";
import { tools } from "./tools";

const BASE_URL = "https://toolninja.io";

const toolMeta: Record<string, { title: string; description: string }> = {
  // ── Format ───────────────────────────────────────────────────────────────
  "json-formatter": {
    title: "JSON Formatter & Validator Online | ToolNinja",
    description:
      "Free online JSON formatter, validator and beautifier. Format, validate, minify and pretty print JSON instantly with syntax highlighting and error detection. JSONPath query support included. No login, 100% browser-based.",
  },
  "ndjson-formatter": {
    title: "NDJSON / JSON Lines Formatter & Validator Online | ToolNinja",
    description:
      "Free online NDJSON (JSON Lines) formatter and validator. Validate and pretty-print newline-delimited JSON line by line, or convert to and from a regular JSON array. No login, 100% browser-based.",
  },
  "markdown-preview": {
    title: "Markdown Preview & Live Editor Online | ToolNinja",
    description:
      "Free online Markdown editor with live preview. Write and preview Markdown in real time with GitHub Flavored Markdown support. Includes word count, reading time and HTML export. No login required.",
  },
  "sql-formatter": {
    title: "SQL Formatter Online — Beautify & Format SQL Queries | ToolNinja",
    description:
      "Free online SQL formatter, beautifier and minifier. Format or minify SQL instantly across 14 dialects — MySQL, PostgreSQL, SQL Server (T-SQL), Oracle PL/SQL, SQLite, MariaDB, Snowflake, BigQuery, Redshift, DuckDB and more. Keyword case options included. No login, browser-only.",
  },
  "html-formatter": {
    title: "HTML Formatter Online — Beautify & Minify HTML Code | ToolNinja",
    description:
      "Free online HTML formatter, beautifier and minifier. Format messy HTML instantly with proper indentation and clean output. Also minifies HTML for production. No login, 100% browser-based.",
  },
  "word-counter": {
    title: "Word Counter — Words, Characters & Reading Time | ToolNinja",
    description:
      "Free online word counter. Count words, characters, sentences and paragraphs instantly, with reading time and speaking time estimates. No login, 100% browser-based.",
  },
  "svg-optimizer": {
    title: "SVG Optimizer — Minify & Clean SVG Online | ToolNinja",
    description:
      "Free SVG optimizer and minifier. Strip comments, metadata, and editor cruft from SVG files and shrink their size instantly. Runs in your browser.",
  },
  "image-compressor": {
    title: "Image Compressor — Compress JPG, PNG & WebP | ToolNinja",
    description:
      "Free online image compressor. Compress and resize JPEG, PNG and WebP images with adjustable quality, right in your browser. See before/after size comparison instantly. No upload to a server — images never leave your device.",
  },
  "exif-viewer": {
    title: "EXIF Viewer & Remover — Strip Photo Metadata | ToolNinja",
    description:
      "Free online EXIF viewer and remover. See a JPEG's embedded camera info, timestamp, and GPS location, then strip it before sharing. No upload to a server — the photo never leaves your device.",
  },
  "graphql-formatter": {
    title: "GraphQL Formatter & Minifier Online | ToolNinja",
    description:
      "Free online GraphQL query formatter and minifier. Beautify queries, mutations, subscriptions and fragments with proper indentation, or minify for production. Handles inline fragments and directives correctly. No login, browser-only.",
  },
  "xml-formatter": {
    title: "XML Formatter Online — Beautify, Minify & Validate XML | ToolNinja",
    description:
      "Free online XML formatter and validator. Prettify or minify XML instantly with CDATA-safe formatting and structural validation that catches unclosed and mismatched tags. No login, 100% browser-based.",
  },
  "js-formatter": {
    title: "JavaScript & TypeScript Formatter / Minifier Online | ToolNinja",
    description:
      "Free online JavaScript and TypeScript formatter and minifier. Beautify messy code with Prettier, or minify it with Terser for production — right in your browser. No login, your code never leaves your device.",
  },

  // ── Encode ───────────────────────────────────────────────────────────────
  "base64": {
    title: "Base64 Encode & Decode Online — Text & Files | ToolNinja",
    description:
      "Free Base64 encoder and decoder. Encode or decode text and files to Base64 or Base64URL instantly in your browser. Nothing is uploaded. No login.",
  },
  "url-encoder": {
    title: "URL Encoder & Decoder Online — Percent Encoding | ToolNinja",
    description:
      "Free online URL encoder and decoder. Encode special characters for safe URL usage or decode percent-encoded URLs instantly. Supports full URI encoding and query string encoding. No login, browser-only.",
  },
  "jwt-decoder": {
    title: "JWT Decoder — Decode & Verify JWT Tokens Online | ToolNinja",
    description:
      "Free JWT decoder: decode a JSON Web Token's header and payload, check expiry, and verify the signature (HS, RS, PS, ES). Your token stays in your browser.",
  },
  "hash-generator": {
    title: "Hash Generator — MD5, SHA-256, SHA-512 & HMAC | ToolNinja",
    description:
      "Free online hash generator. Generate MD5, SHA1, SHA256, SHA384, SHA512, or HMAC signatures instantly, for text or files, and verify a hash against an expected value with a constant-time comparison. Perfect for checksums and webhook signature verification. No login required.",
  },
  "html-entity": {
    title: "HTML Entity Encoder & Decoder — Escape & Unescape HTML | ToolNinja",
    description:
      "Free online HTML entity encoder and decoder. Escape special characters to HTML entities or unescape HTML entities to plain text. Supports all standard HTML5 entities. No login, browser-only.",
  },
  "image-to-base64": {
    title: "Image to Base64 Converter Online | ToolNinja",
    description:
      "Free online image to Base64 converter. Convert PNG, JPG, GIF, SVG and WebP images to Base64 strings instantly. Generate data URIs for embedding images in CSS or HTML. No upload to server — 100% browser-based.",
  },
  "base58": {
    title: "Base58 Encoder & Decoder Online — Base58Check | ToolNinja",
    description:
      "Free Base58 encoder and decoder. Encode or decode text and hex with the Bitcoin alphabet, including checksummed Base58Check. Runs in your browser.",
  },
  "base32": {
    title: "Base32 Encoder & Decoder Online — RFC 4648 Base32 | ToolNinja",
    description:
      "Free online Base32 encoder and decoder. Encode text or hex bytes into RFC 4648 Base32 — the format behind TOTP secrets and DNSSEC — or decode Base32 back to text/hex. No login, 100% browser-based.",
  },
  "base62-encoder": {
    title: "Base62 Encoder & Decoder Online | ToolNinja",
    description:
      "Free online Base62 encoder and decoder. Encode text or hex bytes into Base62 — the symbol-free alphabet (0-9A-Za-z) behind short URL slugs and compact database IDs — or decode back. No login, 100% browser-based.",
  },

  // ── Generate ─────────────────────────────────────────────────────────────
  "lorem-ipsum": {
    title: "Lorem Ipsum Generator — Placeholder Text | ToolNinja",
    description:
      "Free online Lorem Ipsum generator. Generate placeholder and dummy text by paragraphs, sentences or words instantly. Classic Lorem Ipsum or random text. No login required, 100% browser-based.",
  },
  "password-generator": {
    title: "Password Generator — Strong Random Passwords | ToolNinja",
    description:
      "Free online strong password generator. Generate secure random passwords with custom length, uppercase, lowercase, numbers and symbols. Password strength indicator included. No login, runs entirely in your browser.",
  },
  "uuid-generator": {
    title: "UUID Generator Online — UUID v4, v5, v7 & NanoID | ToolNinja",
    description:
      "Free online UUID and GUID generator. Generate random UUID v4, time-ordered UUID v7, deterministic namespace-based UUID v5, or NanoID identifiers, in bulk up to 100 at a time. No login, 100% browser-based.",
  },
  "ulid-generator": {
    title: "ULID Generator Online — Sortable, URL-Safe Unique IDs | ToolNinja",
    description:
      "Free online ULID generator. Generate sortable, URL-safe ULIDs in bulk — a 48-bit timestamp plus 80 bits of randomness, Crockford Base32 encoded. No login, 100% browser-based.",
  },
  "json-to-typescript": {
    title: "JSON to TypeScript — Generate Interfaces Online | ToolNinja",
    description:
      "Free online JSON to TypeScript converter. Paste any JSON and instantly generate TypeScript interfaces and type definitions. Perfect for API response typing. No login, 100% browser-based.",
  },
  "json-to-zod": {
    title: "JSON to Zod Schema Generator Online | ToolNinja",
    description:
      "Free online JSON to Zod converter. Paste sample JSON and get a Zod schema with nested objects, arrays, optional and nullable fields, plus email/URL/UUID/datetime detection and a z.infer TypeScript type. No login, 100% browser-based.",
  },
  "github-actions-generator": {
    title: "GitHub Actions Workflow Generator — CI YAML | ToolNinja",
    description:
      "Free GitHub Actions workflow generator. Pick Node.js, Python, Go, or Docker-to-GHCR, choose triggers and a version matrix, and get a ready-to-commit .github/workflows YAML file using current action versions. No login required.",
  },
  "qr-code-generator": {
    title: "QR Code Generator — Free, No Signup, PNG & SVG | ToolNinja",
    description:
      "Free online QR code generator. Create QR codes for URLs, text, emails and more instantly. Download as PNG or print-ready vector SVG. No account required, no watermarks, 100% free and browser-based.",
  },
  "qr-code-scanner": {
    title: "QR Code Scanner & Decoder Online — Read Any QR Code | ToolNinja",
    description:
      "Free online QR code scanner and decoder. Upload any QR code image and instantly see the decoded text, URL, or 2FA otpauth:// secret. Decoding runs entirely in your browser. No login, no upload to a server.",
  },
  "jwt-generator": {
    title: "JWT Generator Online — Create & Sign JSON Web Tokens | ToolNinja",
    description:
      "Free online JWT generator. Create and sign JSON Web Tokens with HS256, RS256, or ES256 using WebCrypto directly in your browser — paste a private key or generate a fresh RSA/EC key pair. Your key never leaves the browser.",
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
  "markdown-toc-generator": {
    title: "Markdown Table of Contents Generator Online — Auto TOC | ToolNinja",
    description:
      "Free online Markdown table of contents generator. Paste a document and instantly get a nested, anchor-linked TOC with GitHub-style heading slugs, as Markdown or HTML. No login, 100% browser-based.",
  },
  "meta-tags-generator": {
    title: "Meta Tags Generator — OG Tags & Social Preview Tool | ToolNinja",
    description:
      "Free online meta tags generator. Generate Open Graph, Twitter Card and SEO meta tags with live social preview for Twitter, LinkedIn and Slack. See exactly how your link looks when shared. No login required.",
  },
  "favicon-generator": {
    title: "Favicon Generator — Every Favicon Size You Need | ToolNinja",
    description:
      "Free favicon generator: upload one image and get favicon-16x16, favicon-32x32, apple-touch-icon, and Android Chrome icons, plus the HTML tags to add them.",
  },
  "fake-data-generator": {
    title: "Fake Data Generator — Mock JSON, CSV & SQL | ToolNinja",
    description:
      "Free fake data generator: define fields and get realistic mock JSON, CSV, or SQL INSERT test data. Optional seed for reproducible output. No login.",
  },
  "gitignore-generator": {
    title: ".gitignore Generator — Templates for Any Stack | ToolNinja",
    description:
      "Free .gitignore generator: pick your languages, frameworks, editor, and OS to get one combined .gitignore file. Node, Python, Java, Go, and more.",
  },
  "json-schema-generator": {
    title: "JSON Schema Generator — From JSON Online | ToolNinja",
    description:
      "Free JSON Schema generator: infer a draft-07 schema from sample JSON, or validate JSON against a schema and see exactly which fields fail and why.",
  },
  "slug-generator": {
    title: "Slug Generator — Convert Titles to URL Slugs | ToolNinja",
    description:
      "Free slug generator: turn any title into a clean, URL-safe slug instantly. Batch mode converts one title per line. Runs in your browser, no login.",
  },
  "robots-txt-generator": {
    title: "robots.txt Generator Online — Block AI Crawlers & Bots | ToolNinja",
    description:
      "Free online robots.txt generator. Build per-bot Allow/Disallow rules, block AI crawlers like GPTBot and Google-Extended with one click, and add sitemap links. No login required.",
  },
  "sitemap-generator": {
    title: "XML Sitemap Generator Online — Create sitemap.xml Free | ToolNinja",
    description:
      "Free online XML sitemap generator. Paste your page URLs and get a ready-to-upload sitemap.xml with lastmod, changefreq, and priority. No login, 100% browser-based.",
  },
  "barcode-generator": {
    title: "Barcode Generator Online — Code 128, EAN-13 & UPC-A | ToolNinja",
    description:
      "Free online barcode generator. Create Code 128, EAN-13, and UPC-A barcodes with automatic check digits and download as PNG. Verified byte-for-byte against a reference decoder. No login, 100% browser-based.",
  },
  "readme-badge-generator": {
    title: "README Badge Generator — Free shields.io Badge Maker | ToolNinja",
    description:
      "Free online README badge generator. Build custom shields.io badges with any label, message, color and style, or generate live npm/GitHub/PyPI stat badges instantly. No login required — custom badges are built entirely client-side; live badges fetch current data from npm, GitHub, or PyPI.",
  },
  "license-generator": {
    title: "License Generator — MIT, Apache, GPL & More | ToolNinja",
    description:
      "Free open source license generator. Pick MIT, Apache 2.0, BSD, ISC, MPL 2.0, GPL 3.0, or Unlicense and get a ready-to-commit LICENSE file with your name and year filled in — canonical text sourced from GitHub's Licenses API. No login required.",
  },

  // ── Convert ──────────────────────────────────────────────────────────────
  "color-converter": {
    title: "Color Converter Online — HEX, RGB, HSL, CMYK, OKLCH | ToolNinja",
    description:
      "Free online color converter. Convert between HEX, RGB, HSL, CMYK, and OKLCH color formats instantly. Includes live color picker and copy buttons for each format. No login, 100% browser-based.",
  },
  "timestamp-converter": {
    title: "Unix Timestamp Converter — Epoch to Date | ToolNinja",
    description:
      "Free online Unix timestamp converter. Convert epoch time to human readable dates or dates to Unix timestamps instantly. Supports seconds and milliseconds. Shows UTC, local time and relative time. No login required.",
  },
  "number-base-converter": {
    title: "Number Base Converter — Binary, Decimal, Hex Converter | ToolNinja",
    description:
      "Free online number base converter. Convert between binary, decimal, hexadecimal and octal number systems instantly. Supports any base from 2 to 36. No login, 100% browser-based.",
  },
  "string-case-converter": {
    title: "Case Converter — camelCase, snake_case & More | ToolNinja",
    description:
      "Free online string case converter. Convert text between camelCase, snake_case, kebab-case, PascalCase, UPPER_CASE and more instantly. No login, 100% browser-based.",
  },
  "json-yaml": {
    title: "JSON to YAML Converter — Convert JSON & YAML Online | ToolNinja",
    description:
      "Free online JSON to YAML and YAML to JSON converter. Convert between JSON and YAML formats instantly with syntax validation. Perfect for config file conversion. No login, browser-only.",
  },
  "cidr-calculator": {
    title: "CIDR Calculator — IP Range & Subnet Mask | ToolNinja",
    description:
      "Free CIDR calculator: get the IP range, subnet mask, and host count for any CIDR block, or convert an IP range or subnet mask back to CIDR. IPv4 & IPv6.",
  },

  "docker-run-to-compose": {
    title: "Docker Run to Docker Compose Converter | ToolNinja",
    description:
      "Convert docker run commands to docker-compose.yml instantly, or a Compose file back to docker run. Handles ports, volumes, env vars, and networks.",
  },
  "dockerfile-generator": {
    title: "Dockerfile Generator — Node, Python, Go & More | ToolNinja",
    description:
      "Free online Dockerfile generator. Pick Node.js, Python, Go, or a static site and get a sensible, multi-stage-aware Dockerfile plus a matching .dockerignore, ready to copy or download. No login, 100% browser-based.",
  },
  "csv-json": {
    title: "CSV to JSON Converter Online — and JSON to CSV | ToolNinja",
    description:
      "Free CSV to JSON converter. Paste or upload CSV and get a JSON array instantly, or convert JSON back to CSV. Handles quoted fields and custom delimiters.",
  },
  "xml-json-converter": {
    title: "XML to JSON Converter Online — Both Ways | ToolNinja",
    description:
      "Free online XML to JSON and JSON to XML converter. Convert instantly in either direction, with attributes, text content, and repeated tags all handled correctly. No login, 100% browser-based.",
  },
  "env-file-tool": {
    title: "Env File Tool — Parse, Convert & Generate .env.example | ToolNinja",
    description:
      "Free online .env file tool. Parse and validate .env files, convert to JSON, and generate a safe-to-commit .env.example with values stripped. Catches duplicate keys instantly. No login, 100% browser-based.",
  },
  "curl-to-code": {
    title: "cURL to Code — Convert curl to Python, JS & Go | ToolNinja",
    description:
      "Free online curl command converter. Paste any curl command and instantly get working code in JavaScript (fetch), Node.js (axios), Python (requests), PHP (cURL), or Go (net/http). No login required.",
  },
  "url-parser": {
    title: "URL Parser Online — Parse URLs & Build Query Strings | ToolNinja",
    description:
      "Free online URL parser and query string builder. Break any URL down into protocol, host, path, and query parameters, then edit params and rebuild the URL live. One-click UTM parameter add. No login, 100% browser-based.",
  },
  "htaccess-to-nginx": {
    title: ".htaccess to Nginx Config Converter | ToolNinja",
    description:
      "Free online .htaccess to nginx converter. Convert RewriteRule, RewriteCond, redirects, ErrorDocument, and the standard WordPress rewrite block to nginx server block syntax. No login, 100% browser-based.",
  },
  "meeting-planner": {
    title: "Meeting Planner — Time Zone Meeting Finder | ToolNinja",
    description:
      "Free meeting planner: compare working hours across time zones on one grid, find a time that works for everyone, and export a calendar invite. No login.",
  },
  "json-to-markdown-table": {
    title: "JSON to Markdown Table Converter Online | ToolNinja",
    description:
      "Free online JSON to Markdown table converter. Paste a JSON array of objects and instantly get a ready-to-paste GitHub-Flavored Markdown table, with a live HTML preview. No login, 100% browser-based.",
  },
  "list-sorter": {
    title: "List Sorter — Sort Lines & Remove Duplicates | ToolNinja",
    description:
      "Free online list sorter and deduplicator. Sort lines alphabetically or numerically, remove duplicates and blank lines, shuffle, reverse, and number a list of text lines. No login, 100% browser-based.",
  },
  "svg-to-jsx": {
    title: "SVG to JSX Converter Online — SVG to React Component | ToolNinja",
    description:
      "Free online SVG to JSX converter. Paste raw SVG markup and get a ready-to-use React component — attributes converted to camelCase, props spread onto the root element. No login, 100% browser-based.",
  },
  "connection-string-parser": {
    title: "Database Connection String Parser & Builder Online | ToolNinja",
    description:
      "Free online database connection string parser and builder. Break a Postgres, MySQL, MongoDB, or Redis connection URI into user, password, host, port, database, and query params — or build one visually. No login, 100% browser-based.",
  },

  // ── Test ─────────────────────────────────────────────────────────────────
  "regex-tester": {
    title: "Regex Tester — Test & Check Regular Expressions | ToolNinja",
    description:
      "Free online regex tester and checker. Test regular expressions live with match highlighting, capture groups, and a regex cheat sheet. Runs in your browser.",
  },
  "diff-checker": {
    title: "Diff Checker — Compare Two Texts Online | ToolNinja",
    description:
      "Free online diff checker. Compare two texts side by side with split or unified views, addition/deletion counts, and options to ignore whitespace or case. Character-level highlighting. No login, 100% browser-based.",
  },
  "cron-tester": {
    title: "Cron Expression Tester & Parser Online | ToolNinja",
    description:
      "Free online CRON expression tester. Validate, parse and test cron job schedules instantly. See next execution times in human readable format. Supports standard and Quartz cron syntax. No login required.",
  },
  "http-request": {
    title: "HTTP Request Builder — Online API Tester & REST Client | ToolNinja",
    description:
      "Free online HTTP request builder and API tester. Send GET, POST, PUT, DELETE requests with custom headers and body. See response status, headers and formatted JSON. A free Postman alternative. No login required.",
  },
  "websocket-tester": {
    title: "WebSocket Tester Online — Free WebSocket Client | ToolNinja",
    description:
      "Free online WebSocket tester. Connect to any ws:// or wss:// endpoint, send text or JSON messages, set subprotocols, and watch a live, timestamped message log with JSON pretty-printing. Connects directly from your browser — no proxy, no login.",
  },
  "semver-calculator": {
    title: "SemVer Calculator — npm Version Range Checker | ToolNinja",
    description:
      "Free online semver calculator. Test versions against npm ranges like ^1.2.3, ~2.0 or >=1 <2 and see exactly what each range means, compare two versions, and preview major/minor/patch/prerelease bumps — using npm's own semver logic. No login.",
  },
  "config-validator": {
    title: "YAML & TOML Validator — Config File Validator Online | ToolNinja",
    description:
      "Free online YAML, TOML and JSON validator. Validate and lint config files instantly with detailed error messages. Auto-detect format and convert between YAML, TOML and JSON. No login, browser-only.",
  },
  "text-diff": {
    title: "Text Diff — Character & Word Level Compare | ToolNinja",
    description:
      "Free online text diff tool. Compare strings at character, word or line level with inline diff highlighting. Uses Myers algorithm for accurate differences. Perfect for comparing code snippets. No login required.",
  },
  "xpath-tester": {
    title: "XPath Tester Online — Test XPath on XML & HTML | ToolNinja",
    description:
      "Free online XPath tester and evaluator. Run XPath expressions against XML or HTML and see every match live, with an XPath cheat sheet. No login needed.",
  },
  "css-xpath-converter": {
    title: "CSS Selector to XPath Converter Online | ToolNinja",
    description:
      "Free online CSS selector to XPath converter. Convert CSS selectors (id, class, attribute, combinators, nth-child) to XPath expressions and back. Useful for Selenium, Playwright, and scraping. No login, browser-only.",
  },
  "json-diff": {
    title: "JSON Diff Checker Online — Compare Two JSON Objects | ToolNinja",
    description:
      "Free online JSON diff checker. Compare two JSON objects structurally and see exactly what was added, removed, or changed, path by path — key order doesn't matter, and an ignore-array-order option treats re-sorted arrays as unchanged. No login, 100% browser-based.",
  },
  "json-patch-tool": {
    title: "JSON Patch (RFC 6902) Generator & Applier Online | ToolNinja",
    description:
      "Free online JSON Patch generator and applier. Diff two JSON documents into an RFC 6902 patch, or apply an existing patch to a document — the format behind HTTP PATCH requests. No login, 100% browser-based.",
  },
  "iban-validator": {
    title: "IBAN Validator & Test IBAN Generator | ToolNinja",
    description:
      "Free online IBAN validator and test IBAN generator. Validate an IBAN's MOD-97 checksum and country structure, or generate a valid test IBAN for 35+ countries. No login, 100% browser-based.",
  },
  "patch-generator": {
    title: "Patch File Generator — Unified Diff Online | ToolNinja",
    description:
      "Free online unified diff and patch generator. Paste an original and modified text and get a real, downloadable .patch file usable with git apply or the patch command. No login, 100% browser-based.",
  },
  "uuid-parser": {
    title: "UUID Parser Online — Decode UUID & ULID Timestamps | ToolNinja",
    description:
      "Free online UUID and ULID parser. Decode any UUID's version, variant, and embedded timestamp (v1, v6, v7), or a ULID's timestamp and randomness. No login, 100% browser-based.",
  },
  "ts7-migration-checker": {
    title: "TypeScript 7 Migration Checker — tsconfig | ToolNinja",
    description:
      "Free online TypeScript 7 migration checker. Paste a tsconfig.json and instantly see which compiler options the Go-based TypeScript 7 compiler removes — es5/es3 targets, amd/umd/systemjs modules, and more. No login, 100% browser-based.",
  },
  "node-type-stripping-checker": {
    title: "Node.js Type Stripping Compatibility Checker | ToolNinja",
    description:
      "Free online Node.js type-stripping compatibility checker. Scan a TypeScript file for enums, parameter properties, runtime namespaces, and decorators — syntax Node's built-in --experimental-strip-types can't run. No login, 100% browser-based.",
  },
  "http-header-inspector": {
    title: "HTTP Header Inspector — Explain Any Header | ToolNinja",
    description:
      "Free online HTTP header inspector. Paste raw response headers and get a plain-English explanation of every one — Cache-Control, ETag, CSP, CORS headers, and more. No login, 100% browser-based.",
  },
  "credit-card-test-generator": {
    title: "Credit Card Test Generator & Luhn Validator | ToolNinja",
    description:
      "Free online credit card test number generator. Generate Luhn-valid fake Visa, Mastercard, Amex, and Discover numbers for testing payment forms, or validate any number's Luhn checksum. Not real cards. No login, 100% browser-based.",
  },
  "cors-debugger": {
    title: "CORS Error Debugger — Fix CORS Errors Online | ToolNinja",
    description:
      "Free online CORS error debugger. Enter your request details and the response headers you received, and get a step-by-step diagnosis of exactly why the browser blocked it. No login, 100% browser-based.",
  },
  "jsonpath-tester": {
    title: "JSONPath Tester Online — Evaluate JSONPath | ToolNinja",
    description:
      "Free online JSONPath tester. Run JSONPath expressions against JSON and see every match with its exact path, live. Supports wildcards, recursive descent, slices and multi-index selectors. No login, 100% browser-based.",
  },
  "user-agent-parser": {
    title: "User-Agent Parser Online — Decode Browser, OS & Device | ToolNinja",
    description:
      "Free online User-Agent string parser. Paste any User-Agent header and instantly see the browser, rendering engine, OS, and device type, with built-in bot and crawler detection. No login, 100% browser-based.",
  },

  // ── Design ───────────────────────────────────────────────────────────────
  "css-animations": {
    title: "CSS Animations Library — Copy-Paste Animation Code | ToolNinja",
    description:
      "Free CSS animations library with live previews. Ready-to-use CSS animation examples including buttons, loaders, text effects, card animations, and zero-JS scroll-driven animations (animation-timeline: scroll()/view()). One-click copy HTML and CSS code. No login required.",
  },
  "css-flexbox-generator": {
    title: "CSS Flexbox Generator — Visual Playground | ToolNinja",
    description:
      "Free online CSS flexbox generator. Build flex container and item properties visually — direction, wrap, justify-content, align-items, gap, and per-item align-self — with a live preview and copy-ready CSS. No login, browser-only.",
  },
  "css-grid-generator": {
    title: "CSS Grid Generator Online — Visual Grid Layout Builder | ToolNinja",
    description:
      "Free online CSS grid generator. Build a grid-template-columns/rows layout visually, including responsive auto-fit tracks and per-cell column/row spans, with a live preview and copy-ready CSS. No login, browser-only.",
  },
  "fluid-typography-calculator": {
    title: "CSS clamp() / Fluid Typography Calculator Online | ToolNinja",
    description:
      "Free online CSS clamp() and fluid typography calculator. Build a font-size that scales smoothly between a min and max viewport width, with a live type-scale preview. No login, browser-only.",
  },
  "css-unit-converter": {
    title: "CSS Unit Converter Online — px, rem, em, pt, % | ToolNinja",
    description:
      "Free online CSS unit converter. Convert between px, rem, em, pt, and percent with a configurable base font size, instantly. No login, 100% browser-based.",
  },
  "aspect-ratio-calculator": {
    title: "Aspect Ratio Calculator — 16:9, 4:3 & Custom | ToolNinja",
    description:
      "Free online aspect ratio calculator. Simplify a width/height into a clean ratio, or solve for a missing dimension given a ratio — with common presets like 16:9 and 4:3. No login, browser-only.",
  },
  "svg-path-visualizer": {
    title: "SVG Path Visualizer Online — Render & Inspect a Path d | ToolNinja",
    description:
      "Free online SVG path visualizer. Paste a path d attribute and see it rendered live, with its bounding box and a per-command breakdown. No login, 100% browser-based.",
  },
  "css-variables-auditor": {
    title: "CSS Variables Auditor — Find Unused Tokens | ToolNinja",
    description:
      "Free online CSS custom properties auditor. Paste CSS and find every --token, its usage count, duplicate declarations, and unused or undefined variables. No login, browser-only.",
  },
  "css-gradient": {
    title: "CSS Gradient Generator — Linear, Radial, Conic | ToolNinja",
    description:
      "Free online CSS gradient generator. Create linear, radial, conic and mesh gradients with a visual editor. Get clean CSS code instantly. Multi-stop gradient support included. No login, browser-only.",
  },
  "color-palette": {
    title: "Color Palette Generator — Export CSS & Tailwind | ToolNinja",
    description:
      "Free online color palette generator. Create complementary, analogous, triadic, tetradic and monochromatic color schemes from any base color, and export as CSS variables, a Tailwind config snippet, or SCSS. No login required.",
  },
  "mermaid-editor": {
    title: "Mermaid Live Editor — Flowcharts & Diagrams | ToolNinja",
    description:
      "Free online Mermaid diagram editor. Write flowcharts, sequence diagrams, class diagrams, ER diagrams, Gantt charts and more as text, with a live preview. Export as SVG or PNG. No login, 100% browser-based.",
  },
  "image-color-picker": {
    title: "Image Color Picker — Extract a Palette | ToolNinja",
    description:
      "Free online image color palette extractor. Upload any image and instantly extract its dominant colors as HEX and RGB values, ready to copy as CSS variables. No login, 100% browser-based — images never leave your device.",
  },
  "box-shadow-generator": {
    title: "CSS Box Shadow Generator Online — Multi-Layer Shadows | ToolNinja",
    description:
      "Free online CSS box shadow generator. Build single or multi-layer box shadows visually with live preview — adjust offset, blur, spread, color, and opacity per layer. No login, 100% browser-based.",
  },
  "css-specificity-calculator": {
    title: "CSS Specificity Calculator Online — Compare Selectors | ToolNinja",
    description:
      "Free online CSS specificity calculator. Calculate the (ids, classes, elements) specificity of any CSS selector and compare multiple selectors to see which one wins. Supports :is(), :not(), :where(). No login required.",
  },
  "placeholder-image-generator": {
    title: "Placeholder Image Generator — Any Size & Color | ToolNinja",
    description:
      "Free online placeholder image generator. Create placeholder images with a custom width, height, background color, text color, and label, and download as PNG. No login, 100% browser-based.",
  },
  "scrollbar-generator": {
    title: "CSS Scrollbar Generator — Custom Scrollbars | ToolNinja",
    description:
      "Free online CSS scrollbar generator. Style scrollbars visually with the modern scrollbar-color/scrollbar-width properties, plus a ::-webkit-scrollbar fallback for broader browser support. No login, 100% browser-based.",
  },
  "css-carousel-generator": {
    title: "CSS Carousel Generator — No JavaScript | ToolNinja",
    description:
      "Free online CSS carousel generator. Build a scroll-snap carousel with auto-generated dot navigation using ::scroll-marker and ::scroll-marker-group — no JavaScript required. No login, 100% browser-based.",
  },

  // ── Security ─────────────────────────────────────────────────────────────
  "crypto-tools": {
    title: "AES & RSA Encryption Online — Encrypt & Decrypt Text | ToolNinja",
    description:
      "Free online AES-GCM and RSA-OAEP encryption tool. Encrypt and decrypt text directly in your browser using WebCrypto API. AES 256-bit with PBKDF2 key derivation. Your data never leaves your machine. No login.",
  },
  "csp-builder": {
    title: "CSP Builder & Analyzer — Content-Security-Policy | ToolNinja",
    description:
      "Free online Content-Security-Policy builder and analyzer. Build a CSP header visually from a preset or from scratch, toggle Report-Only mode, or paste an existing policy to check for unsafe-inline, unsafe-eval, and other risky directives. No login required.",
  },
  "jwt-keypair-generator": {
    title: "JWT Key Pair Generator — RS256, ES256, PS256 | ToolNinja",
    description:
      "Free online JWT key pair generator. Generate RSA and ECDSA key pairs for RS256, RS384, RS512, PS256, ES256 and more, in both PEM and JWK format, using WebCrypto. Private keys never leave your browser. No login required.",
  },
  "ssh-key-generator": {
    title: "SSH Key Generator Online — Ed25519 & RSA Keys | ToolNinja",
    description:
      "Generate SSH keys online: Ed25519 or RSA key pairs in real OpenSSH format, with fingerprint and randomart. Keys are created locally and never uploaded.",
  },
  "totp-generator": {
    title: "TOTP Generator — Live 2FA Codes Online | ToolNinja",
    description:
      "Free TOTP generator with live 2FA codes from any Base32 secret. Works like Google Authenticator: scan or create otpauth:// QR codes. Runs in your browser.",
  },
  "hotp-generator": {
    title: "HOTP Generator Online — RFC 4226 Counter-Based OTP | ToolNinja",
    description:
      "Free online HOTP generator. Generate RFC 4226 counter-based one-time passwords from a Base32 secret key, with otpauth://hotp/ import/export. The counter-based sibling to TOTP. No login, 100% browser-based.",
  },
  "backup-codes-generator": {
    title: "2FA Backup Codes Generator Online — Recovery Codes | ToolNinja",
    description:
      "Free online 2FA backup codes generator. Generate a set of one-time recovery codes plus their SHA-256 hashes, ready to store server-side. No login, 100% browser-based — nothing is sent anywhere.",
  },
  "package-json-inspector": {
    title: "package.json Inspector — Risky Install Scripts | ToolNinja",
    description:
      "Free online package.json inspector. See exactly which scripts run automatically on npm install (preinstall, postinstall, prepare) and which dependencies aren't version-pinned. No login, 100% browser-based.",
  },
  "security-headers-checker": {
    title: "Security Headers Checker — HSTS, CSP & More | ToolNinja",
    description:
      "Free online HTTP security headers checker. Paste raw response headers and get a scored analysis against HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy and more. No login, 100% browser-based.",
  },
  "jwk-pem-converter": {
    title: "JWK to PEM Converter Online — Convert RSA & EC Keys | ToolNinja",
    description:
      "Free online JWK to PEM and PEM to JWK converter. Convert RSA and EC (P-256/P-384/P-521) public and private keys between formats using the Web Crypto API. Nothing you paste ever leaves your browser. No login.",
  },
  "secret-scanner": {
    title: "Secret Scanner — Find Hardcoded API Keys | ToolNinja",
    description:
      "Free online secret scanner. Paste code or a config file and find hardcoded AWS keys, GitHub tokens, Stripe keys, Slack webhooks, and more before they reach git. No login, 100% browser-based.",
  },
  "password-strength-checker": {
    title: "Password Strength Checker — Entropy Test | ToolNinja",
    description:
      "Free online password strength checker. Check entropy, common-password matches, sequential and keyboard-pattern weaknesses for any password. No login, 100% browser-based — nothing is sent anywhere.",
  },
  "jwk-thumbprint-calculator": {
    title: "JWK Thumbprint Calculator — RFC 7638 | ToolNinja",
    description:
      "Free online JWK thumbprint calculator. Compute the RFC 7638 canonical thumbprint (SHA-256/384/512) for any RSA, EC, or oct JSON Web Key — the standard way to derive a stable kid. No login, 100% browser-based.",
  },
  "passkey-tester": {
    title: "Passkey & WebAuthn Tester — Browser Playground | ToolNinja",
    description:
      "Free online passkey and WebAuthn tester. Create a real passkey and run an authentication ceremony using navigator.credentials, then inspect the decoded authenticator data — flags, sign count, AAGUID. No server, no login.",
  },
  "certificate-decoder": {
    title: "SSL Certificate Decoder — Decode PEM & X.509 | ToolNinja",
    description:
      "Free online X.509 certificate decoder. Paste a PEM certificate or full chain and see subject, issuer, expiry countdown, SANs, key type and size, extensions, and SHA-256/SHA-1 fingerprints. Decoded locally — nothing is uploaded. No login.",
  },
  "bcrypt-hash-generator": {
    title: "Bcrypt Hash Generator & Verifier Online | ToolNinja",
    description:
      "Free online bcrypt hash generator and verifier. Hash a password with a configurable cost factor, or verify a password against an existing bcrypt hash — using a pure-JavaScript implementation that runs entirely in your browser. No login.",
  },

  // ── Accessibility ────────────────────────────────────────────────────────
  "contrast-checker": {
    title: "Color Contrast Checker — WCAG AA/AAA Compliance Tool | ToolNinja",
    description:
      "Free online WCAG color contrast checker. Check contrast ratio between foreground and background colors against AA and AAA thresholds for normal text, large text, and UI components. No login, 100% browser-based.",
  },
  "color-blindness-simulator": {
    title: "Color Blindness Simulator — Test Any Image | ToolNinja",
    description:
      "Free online color blindness simulator. Upload an image and instantly see how it looks under protanopia, deuteranopia, tritanopia, achromatopsia, and their anomalous variants. No login — images never leave your browser.",
  },

  // ── Reference ────────────────────────────────────────────────────────────
  "http-status-codes": {
    title: "HTTP Status Codes — Complete List & Meanings | ToolNinja",
    description:
      "Complete HTTP status codes reference. Look up every HTTP response code including 200, 301, 404, 500 and more, plus a side-by-side comparison of commonly confused codes (401 vs 403, 409 vs 412 vs 423, and more). No login required.",
  },
  "chmod-calculator": {
    title: "Chmod Calculator — Linux Permissions Generator | ToolNinja",
    description:
      "Free chmod calculator: convert between octal (755, 644) and rwxr-xr-x permissions with checkboxes, including setuid, setgid, and the sticky bit.",
  },
  "ai-token-counter": {
    title: "AI Token Counter — Claude, GPT & Gemini Cost | ToolNinja",
    description:
      "Free online AI token counter and cost estimator. Paste a prompt and estimate token count plus the cost across Claude, GPT, and Gemini models side by side. No login, 100% browser-based — your text never leaves your device.",
  },
  "unicode-explorer": {
    title: "Unicode Explorer — Character & Code Point Lookup | ToolNinja",
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

  // The root layout applies a "%s | ToolNinja" title template, so strip the
  // trailing " | ToolNinja" here to avoid it appearing twice in the <title> tag.
  // meta.title itself keeps the full branded string for openGraph/twitter below.
  const pageTitle = meta.title.replace(/\s*\|\s*ToolNinja\s*$/, "");

  return {
    title: pageTitle,
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

/** `rating` adds aggregateRating — only pass it once the tool has enough real ratings (Google's rules). */
export function generateToolJsonLd(slug: string, rating?: { avg: number; count: number }) {
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
    ...(rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.avg.toFixed(1),
            ratingCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}
