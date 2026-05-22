# 🥷 ToolNinja — Fast, Free Developer Tools

> 40 free browser-only developer tools. No login. No tracking. No nonsense.

**Live at: [toolninja.io](https://toolninja.io)**

---

## What is ToolNinja?

ToolNinja is a free, browser-based developer toolbox. Every tool runs 100%
client-side — your data never leaves your machine. No accounts, no server
calls, no telemetry.

---

## 🛠️ Tools (40 total)

### Format
JSON Formatter · Markdown Preview · SQL Formatter · HTML Formatter

### Encode
Base64 Encoder/Decoder · URL Encoder/Decoder · JWT Decoder · Hash Generator · HTML Entity Encoder · Image to Base64 · JWT Generator

### Generate
Lorem Ipsum · Password Generator · UUID Generator · JSON to TypeScript · QR Code Generator · Git Command Generator · Markdown Table Generator · Meta Tags Generator

### Convert
Color Converter · Timestamp Converter · Number Base Converter · String Case Converter · JSON ↔ YAML · CIDR Calculator · Docker Run to Compose ⭐

### Test
Regex Tester (40+ patterns) · Diff Checker · CRON Expression Tester · HTTP Request Builder · Config Validator · Text Diff · XPath Tester ⭐

### Design
CSS Animations · CSS Gradient Generator · Color Palette Generator

### Security
AES / RSA Encryption (WebCrypto — in-browser)

### Reference
HTTP Status Codes · Chmod Calculator · Unicode Explorer

---

## ✨ Why ToolNinja?

- **Private by default** — nothing sent to any server, ever
- **Zero setup** — open a tool and start working
- **Built for depth** — match tables, tree views, char-level diffs, WebCrypto
- **Works offline** — once loaded, no internet required
- **No ads, no accounts** — just tools that work

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
  tools.ts            → Master tool registry (40 tools)
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
