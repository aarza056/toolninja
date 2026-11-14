---
title: "How to Find Hardcoded API Keys in Your Code, and What to Do When One Leaks"
description: "The three ways scanners detect hardcoded secrets, the commands to search your code and its whole git history, and the order to act in when a key has leaked: revoke, check, clean, prevent."
date: "2026-11-14"
author: "ToolNinja"
coverEmoji: "🔑"
tags: ["hardcoded api keys", "detect hardcoded secrets", "secret scanning", "leaked api key", "gitleaks", "git history secrets", "api key security", "rotate api key"]
relatedTools: ["secret-scanner", "api-key-identifier", "env-file-tool", "gitignore-generator"]
faqs:
  - q: "How do you detect hardcoded API keys?"
    a: "Scanners combine three signals: known key formats (AKIA… for AWS, ghp_… for GitHub, sk_live_… for Stripe), high-entropy random-looking strings, and secret-sounding variable names like api_key or password. Run one over your working tree and your whole git history, since a deleted key still lives in old commits."
  - q: "Is deleting the commit enough after leaking a key?"
    a: "No. Clones, forks, CI caches and anyone who fetched in the meantime still have it, and bots scan public GitHub pushes within minutes. Revoke or rotate the key first; cleaning history comes after, and only reduces future exposure."
  - q: "Are all API keys secret?"
    a: "No. Some are designed to be public: Stripe publishable keys (pk_), Supabase anon keys and Firebase web API keys go in front-end code. Their safety comes from restrictions on the service side. Secret keys, restricted keys and service-role keys must never reach a browser or a repository."
  - q: "Can I put API keys in environment variables in a front-end app?"
    a: "Only public ones. Variables prefixed NEXT_PUBLIC_, VITE_ or REACT_APP_ are copied into the JavaScript bundle that every visitor downloads. Call services that need a secret key from your server or a serverless function instead."
  - q: "Which tools scan git history for secrets?"
    a: "Gitleaks and TruffleHog are the common open-source choices, and GitHub secret scanning with push protection checks public repositories automatically. For a quick look at one file or snippet, ToolNinja's Secret Scanner runs in the browser."
---

A hardcoded API key is a credential written directly into source code or a committed config file, where anyone who can read the code can use it. It usually starts innocently: a quick test, a "temporary" constant, a config file that wasn't in `.gitignore`. Then the repository goes public, gets forked, or ends up in a front-end bundle.

This guide covers how scanners find these keys, how to search your own code and its history, and what to do, in order, when one has leaked.

## How scanners recognize a secret

Every secret scanner, from GitHub's built-in one to Gitleaks and TruffleHog, combines three signals.

### 1. Known key formats

Most services now give their keys a recognizable prefix precisely so they can be found:

| Prefix | Service | What it is |
|---|---|---|
| `AKIA…` / `ASIA…` | AWS | Access key ID (long-term / temporary) |
| `ghp_`, `gho_`, `ghs_`, `github_pat_` | GitHub | Personal, OAuth, app and fine-grained tokens |
| `sk_live_`, `rk_live_` | Stripe | Secret and restricted keys (`pk_` is public) |
| `xoxb-`, `xoxp-` | Slack | Bot and user tokens |
| `sk-ant-api03-` | Anthropic | API key |
| `sk-proj-` | OpenAI | Project API key |
| `AIza…` | Google | API key |
| `npm_` | npm | Access token |
| `-----BEGIN … PRIVATE KEY-----` | Any | A private key |

Some formats carry more than a prefix. GitHub and npm tokens end in a CRC32 checksum, so a scanner can tell a real token from a random string without calling GitHub. AWS access key IDs even encode the AWS account number. Paste a key into the [API Key Identifier](/tools/api-key-identifier) to see which service issued it, whether it's live or test, and what can be read out of it, without the key leaving your browser.

### 2. Entropy

Keys without a prefix (Cloudflare tokens, Twilio auth tokens, most internal API keys) are found by how random they look. A 40-character string of mixed letters and digits has far more entropy per character than English text or a variable name. Entropy checks catch unknown formats, at the cost of false positives on hashes, UUIDs and test fixtures.

### 3. Context

A string assigned to `api_key`, `secret`, `password` or `token`, or sitting next to a URL like `api.stripe.com`, is suspicious even if it doesn't match a known format. Good scanners combine this with entropy, so `password = "changeme"` is flagged as a weak placeholder rather than a leaked credential.

## Searching your own code

For a quick check of a file, a config or a snippet someone sent you, paste it into the [Secret Scanner](/tools/secret-scanner): it runs in your browser and shows each finding with its line.

For a whole repository, use a dedicated scanner on the working tree **and** the history:

```bash
# Gitleaks: scan every commit in the repository
gitleaks git -v

# TruffleHog: scan history and check whether found keys are still live
trufflehog git file://. --results=verified
```

Without installing anything, git itself can search every commit for a specific format:

```bash
# Every commit that ever added or removed an AWS access key ID
git log -p --all -G'AKIA[0-9A-Z]{16}'

# Every file in every commit containing a Stripe live secret key
git grep -E 'sk_live_[0-9a-zA-Z]{24,}' $(git rev-list --all)
```

Don't stop at the repository. Keys also turn up in:

- **Front-end bundles.** Anything in `NEXT_PUBLIC_*`, `VITE_*` or `REACT_APP_*` variables is shipped to every visitor. Open your built JavaScript and search for `sk_`, `AKIA` or your API hostnames.
- **CI logs.** A debug `echo` or `set -x` prints secrets that masking didn't recognize.
- **Docker images.** A `COPY . .` before `.dockerignore` existed, or an `ENV API_KEY=` line, bakes the key into an image layer for good.
- **Issues, chat and pasted logs.** A stack trace or a curl command copied into a ticket often carries an `Authorization` header.

## When a key has leaked: the order matters

### Step 1: Revoke or rotate it, now

Before anything else. Bots scan public GitHub pushes for keys within minutes, and a deleted commit doesn't help: forks, clones, CI caches and anyone who pulled still have it. Revoking makes every copy worthless at once.

If you're not sure which service a key belongs to, identify it first. The [API Key Identifier](/tools/api-key-identifier) names the service and links to its revocation page. Then create the replacement, deploy it, and only then disable the old key, so production doesn't go down in between.

GitHub revokes some leaked tokens on its own (its own tokens, and partners' keys through secret scanning), but don't count on it.

### Step 2: Check what it was used for

Look at the service's own logs for activity you don't recognize, between the moment the key was exposed and the moment you revoked it:

- **AWS:** CloudTrail events for that access key ID, and unexpected EC2 instances in regions you don't use (crypto-mining is the classic abuse).
- **Stripe:** API request logs, new webhook endpoints, refunds and payouts.
- **GitHub:** the security log, new deploy keys, changed Actions workflows.
- **AI APIs (OpenAI, Anthropic, Google):** usage spikes on the bill. Leaked AI keys get resold.

### Step 3: Clean the history

Once the key is dead, remove it from the history so it stops showing up in scans and doesn't lead anyone to look further:

```bash
# git filter-repo replaces the string in every commit
git filter-repo --replace-text <(echo 'sk_live_abc123...==>REMOVED')
git push --force --all
```

Everyone with a clone must then re-clone, and old pull requests may still show the original diff. That's why this step comes after revocation, never instead of it.

### Step 4: Make it hard to happen again

- **Keep secrets out of the code.** Read them from environment variables, kept in a `.env` file that's in `.gitignore`, or better, from a secrets manager (AWS Secrets Manager, Doppler, 1Password, Vault). The [Env File Tool](/tools/env-file-tool) turns a `.env` file into the `.env.example` you commit instead, with the values stripped, and the [.gitignore Generator](/tools/gitignore-generator) adds `.env` for you.
- **Turn on push protection.** GitHub secret scanning with push protection blocks a push that contains a recognizable key, before it reaches the server.
- **Add a pre-commit hook.** `gitleaks git --pre-commit --staged` (`gitleaks protect --staged` in versions before 8.19) catches keys before they're even committed.
- **Use short-lived credentials.** OIDC from GitHub Actions to AWS, GCP or Azure removes long-lived cloud keys from CI entirely.
- **Restrict what every key can do.** Restricted Stripe keys, scoped GitHub tokens and IAM policies with only the needed actions limit the damage of the next leak.

## Public keys that are fine to commit

Not every key is a secret. These are designed to be in front-end code, and a scanner flagging them is a false positive:

- Stripe **publishable** keys (`pk_live_`, `pk_test_`)
- Supabase **anon** / publishable keys (the service_role key is secret)
- Firebase web config, including its `AIza…` API key, as long as the key has API and referrer restrictions
- Google OAuth **client IDs** (the client secret is secret)
- Mapbox **public** tokens (`pk.`)

The rule of thumb: if the service calls it publishable, public or client-side, it can ship; if it says secret, restricted, service or admin, it must stay on your server.

## Summary

1. Scanners find keys by format, entropy and context. Prefixed keys are easy to find, and that's the point.
2. Scan the working tree **and** the git history, and remember bundles, logs and images.
3. When a key leaks: revoke first, check usage, clean history, then prevent.
4. Keep secrets in environment variables or a secrets manager, and turn on push protection.
