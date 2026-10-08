# 🥷 ToolNinja — Fast, Free Developer Tools

> 110 free developer tools. No login. Your input is processed in your browser and never uploaded.

**Live at: [toolninja.io](https://toolninja.io)**

---

## What is ToolNinja?

ToolNinja is a free, browser-based developer toolbox. Every tool processes
your input locally — your data is never sent to our servers. No accounts
required. (A couple of tools, like the HTTP Request Builder and the README
Badge Generator's live stats, make requests to the APIs you point them at —
that's inherent to what those tools do, not data leaving to us.)

---

## 🛠️ Tools (95 total)

### Format
JSON Formatter · Markdown Preview · SQL Formatter · HTML Formatter · Word Counter · SVG Optimizer · Image Compressor · GraphQL Query Formatter · XML Formatter · List Sorter & Deduplicator

### Encode
Base64 Encoder/Decoder · URL Encoder/Decoder · JWT Decoder · Hash Generator · HTML Entity Encoder · Image to Base64 · Base58 Encoder / Decoder · Base32 Encoder / Decoder · Base62 Encoder / Decoder

### Generate
Lorem Ipsum Generator · Password Generator · UUID Generator · JSON to TypeScript · QR Code Generator · JWT Generator · Git Command Generator · Markdown Table Generator · Meta Tags Generator · Favicon Generator · Fake Data Generator · .gitignore Generator · JSON Schema Generator · Slug Generator · robots.txt Generator · Barcode Generator · README Badge Generator

### Convert
Color Converter · Timestamp Converter · Number Base Converter · String Case Converter · JSON ↔ YAML Converter · IP / CIDR Calculator · Docker Run to Compose · CSV ↔ JSON Converter · Env File Tool · cURL to Code · URL Parser & Query String Builder · .htaccess to Nginx Converter · Meeting Planner · JSON to Markdown Table · SVG to JSX / React Component

### Test
Regex Tester · Diff Checker · CRON Expression Tester · HTTP Request Builder · YAML / TOML / JSON Validator · Text Diff · XPath Tester · JSON Diff Checker · IBAN Validator & Generator · Unified Diff / Patch Generator · UUID Parser · TypeScript 7 Migration Checker · Node.js Type-Stripping Checker · HTTP Header Inspector · CORS Error Debugger · JSONPath Tester · User-Agent String Parser

### Design
CSS Animations · CSS Gradient Generator · Color Palette Generator · Mermaid Diagram Editor · Image Color Palette Extractor · CSS Box Shadow Generator · CSS Specificity Calculator · Placeholder Image Generator · CSS Scrollbar Generator · CSS Scroll Carousel Generator

### Security
AES / RSA Encryption · CSP Header Builder & Analyzer · JWT Key Pair Generator · SSH Key Generator · TOTP / 2FA Code Generator · package.json Script Inspector · HTTP Security Headers Checker · JWK ↔ PEM Converter · Secret / API Key Scanner · Password Strength Checker · JWK Thumbprint Calculator · Passkey / WebAuthn Playground

### Accessibility
Color Contrast Checker · Color Blindness Simulator

### Reference
HTTP Status Codes · Chmod Calculator · Unicode Explorer

---

## ✨ Why ToolNinja?

- **Input stays local** — your input is processed in your browser and never uploaded
- **Zero setup** — open a tool and start working
- **Built for depth** — match tables, tree views, char-level diffs, WebCrypto
- **Mostly works offline** — once loaded, tools that don't call an external API keep working
- **No accounts** — just tools that work (the site shows ads and uses analytics only after cookie consent)

---

## 🏗 Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 |
| Fonts | Geist Sans + Geist Mono |
| Analytics | Vercel Analytics (privacy-friendly) |
| Hosting | Vercel |

---

## 🚀 Run Locally

```bash
git clone https://github.com/aarza056/toolninja.git
cd toolninja
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ➕ Adding a New Tool

1. Add entry to `lib/tools.ts`
2. Create `app/tools/[slug]/page.tsx` (server — metadata + JSON-LD)
3. Create `app/tools/[slug]/[Name]Client.tsx` ("use client" — interactive logic)
4. Add SEO content to `lib/tool-content.ts` (about, useCases, tips, faq)
5. Add to `app/sitemap.ts`

---

## 📁 Project Structure

```
app/
  layout.tsx          → Root layout with Sidebar + ParticleBackground
  page.tsx            → Homepage server component
  HomeClient.tsx      → Client homepage: search, categories, featured
  tools/[slug]/       → Individual tool pages
  blog/               → Blog articles
  sitemap.ts          → Auto-generates sitemap
  robots.ts           → robots.txt

components/
  Sidebar.tsx         → Navigation sidebar
  ToolLayout.tsx      → Shared tool wrapper
  CopyButton.tsx      → Universal copy button
  CommandPalette.tsx  → Ctrl+K search

lib/
  tools.ts            → Master tool registry (95 tools)
  tool-content.ts     → SEO content per tool
  metadata.ts         → generateToolMetadata() + generateToolJsonLd()
```

---

## 📄 License

MIT — free to use, modify and distribute.

---

## 🤝 Contributing

PRs welcome! Found a bug? Open an issue.
Want to add a tool? Follow the "Adding a New Tool" guide above.

---

*Built with ❤️ and caffeine by [@aarza056](https://github.com/aarza056)*
