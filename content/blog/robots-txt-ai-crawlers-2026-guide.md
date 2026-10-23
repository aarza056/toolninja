---
title: "robots.txt for AI Crawlers in 2026: What to Actually Block"
description: "GPTBot, ClaudeBot, CCBot and others can eat 40% of your bandwidth during a deep crawl. Here's the selective-blocking approach more site owners are taking instead of an all-or-nothing rule."
date: "2026-08-10"
author: "ToolNinja"
coverEmoji: "🤖"
tags: ["robots.txt ai crawlers", "block gptbot", "block claudebot", "google-extended robots.txt", "ai bot blocking 2026", "robots.txt template ai", "ccbot disallow", "cloudflare ai crawler block", "seo", "robots-txt", "ai"]
relatedTools: ["robots-txt-generator"]
faqs:
  - q: "Which AI crawler is blocked most often?"
    a: "GPTBot leads, appearing in roughly 5.5% of Disallow rules sitewide as of early 2026, just ahead of CCBot (about 5.1%) and ClaudeBot (about 4.9%). These three account for the majority of AI-crawler-specific blocking rules currently in the wild."
  - q: "What's the difference between GPTBot and ChatGPT-User?"
    a: "GPTBot crawls content to train OpenAI's models — a one-time (or periodic) bulk harvesting operation with no direct benefit to your site. ChatGPT-User fetches a page in real time because a user asked ChatGPT a question that required browsing your specific page — closer to a referral, since it can send that user to your site with attribution. Many site owners now block one and allow the other rather than treating all OpenAI bots identically."
  - q: "Does blocking AI crawlers actually stop them from accessing my site?"
    a: "Only for crawlers that respect robots.txt, which the major, reputable AI companies (OpenAI, Anthropic, Google) have stated they do. It does nothing against crawlers that ignore the file entirely, which does happen with smaller or less scrupulous scrapers — robots.txt is a request honored voluntarily, not an access control mechanism enforced by your server."
  - q: "Why did Cloudflare start blocking AI crawlers by default?"
    a: "Cloudflare announced that AI training and agent crawlers would be blocked by default on newly created domains starting September 15, 2026, and gave every customer dashboard controls to allow or block AI crawlers by category. The move reflects how mainstream AI-crawler management has become — treated as a default security posture rather than a niche configuration only specialists bother with."
---

## This Stopped Being a Niche Configuration

Blocking or allowing AI crawlers in robots.txt used to be the kind of thing only a handful of publishers with a specific grievance bothered configuring. That changed fast enough that Cloudflare now blocks AI training and agent crawlers by default on every new domain — a default, not an opt-in, as of their September 15, 2026 rollout — with dashboard controls for every customer to manage it by category.

If you haven't touched your robots.txt's AI-crawler rules, here's what's actually worth doing, and why an all-or-nothing block might be leaving value on the table either way.

---

## The Bandwidth Case for Blocking Something

The concrete, non-ideological reason to care: a single AI training crawler doing a deep crawl of your site can consume **up to 40% of total bandwidth** during that crawl cycle. That's not a rounding error for most sites' hosting bills, and it's happening whether or not you're getting anything back for it.

The most-blocked crawlers as of early 2026, by share of sites with an explicit Disallow rule against them:

| Crawler | Approx. share of Disallow rules | Operator |
|---|---|---|
| GPTBot | ~5.5% | OpenAI (training) |
| CCBot | ~5.1% | Common Crawl (used by many AI labs for training data) |
| ClaudeBot | ~4.9% | Anthropic (training) |

---

## The Case for Not Blocking Everything

Blocking every AI-related crawler indiscriminately has a real cost too: it can mean your content never gets cited by AI-powered search and answer engines, which is a meaningful and growing referral channel in its own right — closer to how being excluded from Google search results would hurt you, not a purely defensive win.

This is the actual tension driving the "selective blocking" approach that's become the more common 2026 recommendation: **not every AI bot does the same thing**, so treating them identically throws away a real distinction.

---

## Training Crawlers vs. Search/Agent Crawlers

The useful split is between bots that harvest your content to train a model somewhere else (no benefit to you, ever) and bots that fetch your page in the moment because a real user's query needs it (closer to a referral, with attribution and potential traffic back to you):

**Training-focused (commonly blocked):**
- `GPTBot` — OpenAI's training crawler
- `CCBot` — Common Crawl, whose dataset many AI labs train on
- `Bytespider` — ByteDance's crawler
- `anthropic-ai` — Anthropic's training crawler
- `cohere-ai` — Cohere's training crawler

**Search/agent-focused (commonly allowed):**
- `ChatGPT-User` — fetches a page live in response to a specific user query in ChatGPT
- `OAI-SearchBot` — powers ChatGPT's search features specifically
- `PerplexityBot` — powers Perplexity's answer engine, typically with citation/attribution
- `ClaudeBot` — increasingly treated as allow-worthy for its search-adjacent use, though some site owners still block it given Anthropic also uses crawled data for training

A robots.txt reflecting that split looks roughly like this:

```
# Block training-only crawlers
User-agent: GPTBot
User-agent: CCBot
User-agent: Bytespider
User-agent: anthropic-ai
User-agent: cohere-ai
Disallow: /

# Allow search/agent crawlers that can drive referral traffic
User-agent: ChatGPT-User
User-agent: OAI-SearchBot
User-agent: PerplexityBot
Allow: /

Sitemap: https://example.com/sitemap.xml
```

This isn't a universal answer — a publisher whose entire business model is licensing content has different incentives than a documentation site that wants maximum AI-answer-engine visibility. But it's a considerably more deliberate starting point than either "block everything AI-related" or "block nothing."

---

## `Google-Extended` Is a Special Case

Worth calling out separately: `Google-Extended` doesn't control whether Googlebot indexes your site for regular search — that's a completely separate crawler and separate rule. `Google-Extended` specifically controls whether Google can use your content to train Gemini and improve AI Overviews. Blocking it has no effect on your regular Google search rankings, which makes it one of the lower-risk blocks available if training-data use is your specific concern, independent of your broader AI-crawler stance.

```
User-agent: Google-Extended
Disallow: /
```

---

## The Honesty Caveat

robots.txt is a voluntary convention, not an enforcement mechanism your server actively applies. OpenAI, Anthropic, and Google have all stated they honor it for their crawlers — and that's genuinely worth relying on for the major, reputable players. It does nothing against a scraper that simply ignores the file, which is a real category of bad actor. Rate limiting, IP-based blocking, or a service like Cloudflare's crawler management are the actual enforcement layer if you need one; robots.txt is the signal of intent that well-behaved crawlers agree to respect.

---

## Build Your Rules

**[ToolNinja's robots.txt Generator →](/tools/robots-txt-generator)** includes a one-click preset that adds a Disallow group for the common AI training crawlers — GPTBot, Google-Extended, ClaudeBot, CCBot, and others — which you can then edit down to match a selective-blocking policy like the one above, plus per-bot Allow/Disallow rules and sitemap links, all generated and downloadable in your browser.

---

Sources:
- [We Analyzed robots.txt Across Cloudflare's Network](https://technologychecker.io/blog/robots-txt-ai-crawlers-blocking-report)
- [Robots.txt for AI Crawlers: 2026 Template](https://cubitrek.com/blog/robots-txt-2026-managing-ai-crawler-budgets)
