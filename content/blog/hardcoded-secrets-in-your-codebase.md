---
title: "Why Hardcoded Secrets Still End Up in Git — and How to Actually Catch Them"
description: "Hardcoded API keys and credentials remain one of the most common security findings in real codebases. Here's what the common secret formats actually look like, why regex-based scanning works (and where it doesn't), and how to stop a leak before it's committed."
date: "2026-10-02"
author: "ToolNinja"
coverEmoji: "🔑"
tags: ["hardcoded secrets", "secret scanning", "api key leak", "gitleaks", "security mistakes", "env variables", "git history secrets", "credential leak"]
relatedTools: ["secret-scanner", "env-file-tool"]
faqs:
  - q: "If GitHub already scans for secrets, do I need to check my own code too?"
    a: "GitHub's secret scanning only covers patterns from partner providers who've registered their token format, and by default only runs automatically on public repositories (private repos need it enabled, and historically needed GitHub Advanced Security for some features). It's also reactive — it finds a secret after it's already in your git history. Catching a hardcoded secret before you commit it, in your editor or in a pre-commit hook, avoids ever needing a revocation step at all."
  - q: "I found a secret with a scanner — is deleting the line from my code enough?"
    a: "No. Once a secret is committed to git, it exists in that commit's history forever unless you rewrite history (git filter-repo, BFG Repo-Cleaner) — simply deleting it in a new commit leaves it fully recoverable in the old one. The only fully reliable fix is to treat the credential as compromised: rotate/revoke it at the provider, then clean the line from your working code."
  - q: "Why do regex-based secret scanners sometimes miss real secrets or flag fake ones?"
    a: "Regex matches a known shape (a prefix like AKIA or sk_live_, a length, a character set) — it can't know whether a matched string is a live, valid credential or an expired/fake one, and it can't catch a secret in a format it doesn't have a rule for. More advanced tools add entropy analysis (flagging any sufficiently random-looking string) or live validation (making an API call to check if a found credential actually works) to catch more, at the cost of more false positives or needing network access."
  - q: "What's the actual fix once I've found a hardcoded secret?"
    a: "Move it to an environment variable loaded from a .env file (added to .gitignore, never committed) or a dedicated secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler) for production. Rotate the exposed credential at its provider regardless of whether you believe it was ever actually seen by anyone — treat any committed secret as burned."
---

## A Problem That Hasn't Gone Away

Hardcoded secrets — API keys, database passwords, cloud credentials pasted directly into source code — remain one of the most consistently reported findings across security audits of real-world repositories. It's not a problem caused by carelessness alone: it's the path of least resistance. Hardcoding `const apiKey = "sk_live_..."` works immediately, in local dev, in a demo, in a hotfix pushed at 11pm — and then it quietly survives into the next commit, and the one after that.

The fix isn't "be more careful." It's catching the pattern automatically, before it reaches a shared branch.

## What a Hardcoded Secret Actually Looks Like

Most real secrets aren't random-looking strings with no structure — they have a recognizable shape, because providers design their token formats to be identifiable (partly so their own scanning partnerships, like GitHub's, can detect them):

| Provider | Format | Example shape |
|---|---|---|
| AWS Access Key ID | `AKIA` + 16 chars | `AKIAIOSFODNN7EXAMPLE` |
| GitHub PAT | `ghp_` + 36+ chars | `ghp_wWPw5k4aXcaT4fNP...` |
| Stripe secret key | `sk_live_` / `sk_test_` + 24+ chars | `sk_live_4eC39HqLyjWD...` |
| Slack webhook | `hooks.slack.com/services/...` | full URL |
| Google API key | `AIza` + 35 chars | `AIzaSyD-9tSrke72PouQ...` |
| Private key block | `-----BEGIN ... PRIVATE KEY-----` | PEM header |

This is exactly why format-based regex scanning — the approach tools like Gitleaks, TruffleHog, and GitHub's own secret scanning all lead with — catches a large share of real leaks despite being, at its core, a list of pattern-matching rules. You don't need machine learning to notice a string starting with `AKIA` followed by 16 uppercase letters and digits; you need a rule that says exactly that.

**One detail worth getting right if you build or evaluate a scanner yourself:** Stripe's `pk_live_`/`pk_test_` *publishable* keys are designed to be public — they're meant to sit in client-side JavaScript. Flagging them as a leaked secret is a straight-up false alarm. Only `sk_` (secret) and `rk_` (restricted) prefixed Stripe keys are actual credentials worth catching.

## Where Regex Alone Falls Short

Format matching has a real ceiling. It can't tell you whether a matched `AKIA...` string is a live, currently-valid key or one that was rotated out six months ago — only that it *looks* like one. And it can't catch a credential in a format it has no rule for, which is why more thorough tools add two complementary techniques:

- **Entropy analysis** — flagging any string that's statistically "too random" to be a normal word or identifier, independent of matching a specific provider's format. Catches unknown/custom token formats, at the cost of more false positives (a long base64-encoded image or a hash can trip this too).
- **Live validation** — for providers that support it, actually calling the provider's API with the found credential (a benign request like `sts:GetCallerIdentity` for AWS) to confirm it's currently active. This turns "this looks like a secret" into "this secret is real and currently valid" — a much stronger signal, at the cost of needing live network access and raising its own handling-care questions (you're now making authenticated requests with a credential you just found).

[ToolNinja's Secret Scanner](/tools/secret-scanner) uses the first approach — format-based rules for the most common providers, plus a lower-confidence check for secret-sounding variable names holding a literal string — entirely in your browser, with no network calls and no live validation. It's a fast first pass, not a replacement for a real scanning pipeline on your actual repository.

## The Part That's Easy to Get Wrong: It's Already in History

Finding a hardcoded secret and deleting that line in a new commit feels like a fix. It isn't. Git keeps every version of every file in its history by default — the secret is still sitting in the commit where you first added it, retrievable by anyone with read access to the repository (or who finds an old clone, fork, or cached copy) using nothing more than `git log -p` or `git show`.

The only reliable response once a real secret has been committed:

1. **Rotate or revoke the credential at the provider immediately.** This is the step that actually neutralizes the leak — everything else is cleanup.
2. **Remove it from your working code**, moving it to an environment variable (a `.env` file excluded via `.gitignore`) or a proper secrets manager for anything beyond local dev.
3. **Optionally scrub git history** (`git filter-repo`, BFG Repo-Cleaner) if the exposure is serious enough to warrant it — but understand this rewrites history and requires everyone with a clone to re-sync, so it's a bigger operation than step 1 or 2 and isn't always necessary once the credential itself is already dead.

Step 1 is the one that actually matters. A rotated key is safe to leave sitting in old git history, in the sense that it no longer grants access to anything — which is precisely why "just rotate it" is the standard first response from every major provider's own incident guidance.

## Sources

- [Best Secret Scanning Tools 2026 — appsecsanta.com](https://appsecsanta.com/secret-scanning-tools)
- [List of regex for scraping secret API keys — h33tlit/secret-regex-list](https://github.com/h33tlit/secret-regex-list)
- [How to Find Hardcoded Secrets in Your Codebase — aquilax.ai](https://aquilax.ai/blog/find-hardcoded-secrets-codebase)
- [Rafter — Secrets Detection: How to Find and Fix Hardcoded Credentials](https://rafter.so/blog/secrets-detection-guide)
