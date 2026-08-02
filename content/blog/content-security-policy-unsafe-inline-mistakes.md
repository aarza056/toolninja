---
title: "Content-Security-Policy: The 'unsafe-inline' Mistake 87% of Sites Make"
description: "Most CSP headers in the wild include 'unsafe-inline' in script-src — which quietly disables the exact XSS protection CSP exists to provide. Here's why it happens and what to do instead."
date: "2026-08-09"
author: "ToolNinja"
coverEmoji: "🛡️"
tags: ["content security policy", "csp unsafe-inline", "csp xss protection", "csp header mistakes", "csp nonce hash", "content-security-policy guide", "csp object-src none", "csp best practices 2026", "security", "csp", "xss"]
relatedTools: ["csp-builder"]
faqs:
  - q: "What does Content-Security-Policy actually protect against?"
    a: "CSP's primary purpose is mitigating Cross-Site Scripting (XSS). Even if an attacker successfully injects a <script> tag into your page — through a stored XSS vulnerability, for example — a correctly configured CSP prevents that injected script from executing, because it didn't come from an explicitly allowed source. It also restricts other risky behaviors, including framing (clickjacking) and form submission targets."
  - q: "Why does 'unsafe-inline' defeat the purpose of CSP?"
    a: "CSP's core defense works by only allowing scripts from trusted, explicitly listed sources — meaning any injected inline <script> tag, which is how most XSS attacks execute code, gets blocked by default. 'unsafe-inline' tells the browser to allow any inline script or inline event handler to run regardless of source, which is exactly the mechanism most XSS attacks rely on. A policy with 'unsafe-inline' in script-src provides little to no protection against classic XSS."
  - q: "What should I use instead of 'unsafe-inline' for scripts I can't externalize?"
    a: "A nonce (a random, per-request token added to both the CSP header and the script tag as <script nonce=\"random-value\">) or a hash of the exact script content (CSP accepts 'sha256-<hash>' as a valid source). Both let specific inline scripts execute without opening the door to arbitrary injected ones, since an attacker can't predict the nonce or produce content matching the hash."
  - q: "Do I need to set object-src if my site doesn't use Flash or Java applets?"
    a: "Yes, precisely because you don't use them — set object-src 'none' explicitly. <object>, <embed>, and <applet> are legacy attack surface that most sites in 2026 have zero legitimate use for, so blocking them entirely costs nothing and closes a class of bypass techniques that specifically target these elements."
---

## A Security Header That's Usually Half-Disabled

Content-Security-Policy is one of the most effective browser-level defenses against XSS that exists — and one of the most commonly deployed in a way that provides almost none of that protection. The specific culprit, in the overwhelming majority of cases: `'unsafe-inline'` sitting in `script-src`, quietly undoing the header's entire purpose while still looking, to anyone skimming the response headers, like a real security control is in place.

One analysis of deployed CSP headers found that **87.63% of policies with XSS-mitigation intent used `'unsafe-inline'` without a nonce** — meaning the overwhelming majority of sites that bothered to set a CSP at all did so in a way that provides essentially no XSS protection.

---

## Why This Specific Mistake Is So Common

CSP works by restricting scripts to an explicit allowlist of trusted sources. By default, that allowlist doesn't include inline scripts — any `<script>...</script>` block written directly in the HTML, or any inline event handler like `onclick="..."`, is blocked unless you say otherwise. This is deliberate: injecting an inline `<script>` tag is exactly how the majority of XSS attacks execute their payload, so blocking inline scripts by default is where most of CSP's protective value comes from.

The problem is that a lot of real codebases — especially older ones, or ones using certain templating patterns — genuinely have inline scripts and inline event handlers scattered throughout their HTML. Turning on a strict CSP against that codebase breaks the page immediately, in the browser console, with a wall of blocked-script errors. The fast fix that makes the errors go away is adding `'unsafe-inline'` to `script-src`. It works, in the sense that the errors disappear — but it also means the CSP is no longer actually restricting inline scripts at all, which was the entire point.

```
# Looks like a real security header:
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'

# What it actually does for XSS: close to nothing.
# 'unsafe-inline' re-allows the exact thing script-src exists to block.
```

---

## The Correct Fix: Nonces or Hashes

The point of restricting inline scripts is to distinguish scripts *you* wrote from scripts an *attacker* injected. `'unsafe-inline'` gives up on that distinction entirely. Nonces and hashes solve the same underlying problem — legitimate inline scripts existing in your codebase — without giving up the distinction.

**Nonces** — a random, unpredictable value generated fresh on every single page load, included in both the CSP header and the script tag:

```html
<!-- Server generates a fresh random nonce per request -->
<script nonce="8fZ2mK9x...">
  console.log('this inline script is explicitly trusted');
</script>
```

```
Content-Security-Policy: script-src 'self' 'nonce-8fZ2mK9x...'
```

An attacker injecting a script into your page has no way to know the nonce for the current request — it changes every time — so their injected script gets blocked while your legitimate one runs.

**Hashes** — for scripts with fixed, unchanging content, CSP can allow them by their SHA hash instead:

```
Content-Security-Policy: script-src 'self' 'sha256-<base64-hash-of-exact-script-content>'
```

Any script matching that exact hash is allowed; anything else — including an attacker's injected payload, which by definition has different content — is blocked. The tradeoff: if the script's content changes even slightly, the hash no longer matches and you have to regenerate it.

Neither approach is free — both require actual engineering work to wire nonces through your templating layer or compute hashes at build time — which is precisely why `'unsafe-inline'` is so tempting as a shortcut. It's also why it's worth budgeting real time for this rather than treating it as a quick header tweak.

---

## The Second Most Common Gap: `object-src`

Less dramatic than `unsafe-inline`, but still worth fixing deliberately: **explicitly set `object-src 'none'`** unless you have a specific, current reason not to. `<object>`, `<embed>`, and `<applet>` are legacy HTML elements that most sites built in 2026 have no legitimate use for at all, and they've historically been a vector for CSP bypass techniques that specifically target plugin content. Since the vast majority of sites don't need them, blocking them outright costs nothing:

```
Content-Security-Policy: object-src 'none'
```

---

## A Policy Actually Worth Deploying

Putting the fixes together, a reasonably strong baseline CSP for a modern site looks like:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-<per-request-value>';
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'self';
```

Notice what's absent: no `'unsafe-inline'`, no `'unsafe-eval'`, no wildcard `*` sources. Every one of those, if present, substantially weakens or eliminates the protection the header is meant to provide — and every one of them is exactly the kind of thing that's easy to add under deadline pressure and easy to forget to remove.

---

## Check Your Own Policy

**[ToolNinja's CSP Header Builder & Analyzer →](/tools/csp-builder)** does both directions of this work: build a policy visually with per-directive source lists, or switch to Analyze mode and paste your current production CSP to get it checked automatically for `unsafe-inline`, `unsafe-eval`, wildcard sources, and missing `object-src`/`base-uri`/`frame-ancestors` — the exact mistakes covered above, flagged instantly instead of found during a security review.

---

Sources:
- [Why It's Bad to Use 'unsafe-inline' in script-src](https://csper.io/blog/no-more-unsafe-inline)
- [Content Security Policy Guide: Stop XSS Step-by-Step (2026)](https://zeriflow.com/blog/content-security-policy-guide)
