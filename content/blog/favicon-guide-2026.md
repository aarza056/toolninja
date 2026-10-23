---
title: "The Favicon Guide for 2026: Which Files You Actually Need"
description: "Favicon requirements have quietly simplified — SVG is now the primary format, several old PNG sizes are obsolete, and Android manifests still need raster icons. Here's the current, minimal setup."
date: "2026-07-30"
author: "ToolNinja"
coverEmoji: "🖼️"
tags: ["favicon guide 2026", "favicon sizes", "favicon generator", "svg favicon", "apple touch icon size", "android chrome icon", "favicon best practices", "how many favicon sizes do i need", "favicon", "web development", "seo"]
relatedTools: ["favicon-generator"]
faqs:
  - q: "Do I still need a favicon.ico file in 2026?"
    a: "Not strictly. Modern browsers all support PNG and SVG favicons referenced via <link> tags in your HTML. A .ico file at your site root is a fallback some very old browsers and crawlers request by default, so keeping one doesn't hurt, but it is no longer a hard requirement for current browser versions."
  - q: "What favicon sizes are now considered obsolete?"
    a: "96×96, 128×128, and 64×64 PNG sizes are legacy leftovers from older Windows and Chrome Web Store requirements that current specs no longer call for. Skip them — they add file weight without adding real device or browser coverage in 2026."
  - q: "Can I use SVG for all my favicon needs?"
    a: "Not entirely. SVG covers roughly 95% of browsers as the primary tab icon and can support dark mode via an embedded CSS media query, but Android's home screen and PWA manifest icons still require raster PNG — SVG is not accepted there as of 2026. You need both formats for full coverage."
  - q: "Why does my new favicon still show the old one after I replace the file?"
    a: "Browsers and operating systems cache favicons aggressively, sometimes for weeks. After replacing your favicon files, force a refresh with a cache-busting query string (favicon.png?v=2) or a hard reload — simply re-uploading the same filename often isn't enough to bust the cache."
---

## Favicon Requirements Actually Got Simpler

For years, the "correct" favicon setup meant generating six or more PNG sizes to cover every browser and device permutation — a genuinely confusing checklist that most developers just copy-pasted from an old blog post without questioning. That's changed. Browser support has consolidated, several sizes have become dead weight, and the current recommended setup in 2026 needs far fewer files than it used to.

Here's what's actually required now, and what you can drop.

---

## The Modern Minimal Set

For full browser and device coverage in 2026, the files that matter are:

1. **An SVG favicon** — vector-sharp at any size, can embed a dark-mode variant via a CSS media query, and typically weighs under 1KB. Roughly 95% of browsers render SVG favicons directly.
2. **32×32 PNG** — the fallback for the ~5% of browsers that don't support SVG favicons (mainly older Safari versions and IE).
3. **180×180 PNG** — the Apple touch icon, used when a user adds your site to their iOS home screen.
4. **192×192 and 512×512 PNG** — required by Android and PWA web app manifests for home screen icons and splash screens. This is a hard requirement, not a nice-to-have: **Android does not accept SVG for manifest icons** as of 2026, only raster PNG.

That's the complete modern list. Everything else is legacy noise.

---

## What's Now Obsolete

Skip these — they were relevant to older Windows tile requirements and the now-defunct Chrome Web Store icon spec, and current browsers don't call for them:

- 96×96 PNG
- 128×128 PNG
- 64×64 PNG

If you inherited a favicon setup with a dozen files in it, these are almost certainly safe to delete.

---

## The One Nuance: SVG Isn't a Complete Replacement

It's tempting to read "SVG covers 95% of browsers" and conclude you can go all-in on a single vector file. You can't — not yet. The two things SVG doesn't currently handle:

- **The remaining ~5%** of browsers (older Safari, IE, some crawlers) still need a PNG fallback for the browser tab itself.
- **Android and PWA manifests require raster PNG**, full stop. This isn't a fallback situation — SVG manifest icons simply aren't honored by Android's home screen or splash screen rendering.

So the honest 2026 setup is a **hybrid**: one SVG for the primary modern-browser experience, plus a small set of PNGs for the fallback and manifest cases. Pure-SVG or pure-PNG single-format setups both leave coverage gaps.

---

## Dark Mode, the Easy Way

If you're already producing an SVG favicon, dark mode support is nearly free — a single SVG file can switch its fill colors between a light and dark variant using a CSS media query embedded directly inside the SVG's own `<style>` block, keying off `prefers-color-scheme`. Browsers that support SVG favicons respect this and swap the rendering automatically based on the user's OS theme, with zero JavaScript and zero extra requests.

This is a genuine 2026-era capability — it wasn't practically possible with the ICO/PNG-only approach that dominated favicon guidance for the past decade.

---

## What ToolNinja's Favicon Generator Covers

**[ToolNinja's Favicon Generator →](/tools/favicon-generator)** handles the raster half of the modern setup in one pass: upload a source image and it generates the full PNG set — 16×16 and 32×32 for browser tabs, 48×48 for Windows taskbar pinning, 180×180 for the Apple touch icon, and 192×192 / 512×512 for Android and PWA manifests — plus the exact `<link>` tags to paste into your `<head>`. It also supports adding a solid background fill for source images with transparency that would otherwise look washed out at small sizes.

It doesn't vectorize a raster upload into an SVG — that's a fundamentally different (and much harder) problem than resizing — so if you want the primary SVG favicon with dark-mode support, that piece still needs to come from your design source file (Figma, Illustrator, or hand-authored SVG). But for the PNG fallback and manifest set that every setup needs regardless of whether you add an SVG on top, this covers it in one upload, entirely in your browser.

---

## Quick Checklist

| File | Purpose | Required? |
|---|---|---|
| SVG (with dark mode) | Primary favicon, ~95% of browsers | Recommended, not strictly required |
| 32×32 PNG | Non-SVG browser fallback | Yes |
| 180×180 PNG | Apple touch icon (iOS home screen) | Yes if you support iOS |
| 192×192 PNG | Android home screen / manifest | Yes if you have a manifest |
| 512×512 PNG | Android splash screen / manifest | Yes if you have a manifest |
| favicon.ico | Legacy fallback for old browsers/crawlers | Optional, not harmful to keep |
| 96×96, 128×128, 64×64 | — | No, obsolete |

---

Sources:
- [Favicon Size Guide - All Favicon Sizes for 2026 — favicon.io](https://favicon.io/tutorials/favicon-sizes/)
- [SVG Favicon 2026: Browser Support, Dark Mode & All Recommended Sizes — JW Tool Box](https://www.jwtoolbox.com/blog/svg-favicon-2026-browser-support-dark-mode-guide)
- [Modern Favicon Strategy for 2026: Minimal Files & Web Manifests — Icojoy](https://icojoy.com/blog/favicon-strategy-2026-minimal-files-web-manifests/)
