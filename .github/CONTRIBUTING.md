# Contributing to ToolNinja

Thanks for your interest in contributing! 🥷

## Adding a New Tool

1. Add entry to `lib/tools.ts` with slug, name, description, icon, category, keywords
2. Create `app/tools/[slug]/page.tsx` — server component with metadata
3. Create `app/tools/[slug]/[Name]Client.tsx` — "use client" interactive component
4. Add to `lib/tool-content.ts` — about, useCases, tips, 4 FAQs
5. Add to `app/sitemap.ts`
6. Test locally with `npm run dev`
7. Open a PR with a description of the tool

## Code Style

- TypeScript strict mode — no `any` unless absolutely necessary
- Tailwind only — no CSS modules or styled-components
- All tool logic client-side — no server calls from tools
- Follow existing component patterns (ToolLayout, CopyButton)

## Reporting Bugs

Open a GitHub Issue with:
- Tool name
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS
