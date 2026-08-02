---
title: "HMAC Webhook Signature Verification: The Two Bugs Everyone Hits"
description: "Stripe, GitHub, and Shopify all sign webhooks with HMAC-SHA256 — and almost everyone trips on the same two mistakes: verifying against the parsed body instead of the raw one, and comparing signatures with ==."
date: "2026-08-07"
author: "ToolNinja"
coverEmoji: "🔏"
tags: ["hmac signature verification", "webhook signature verification", "stripe webhook signature failed", "github webhook secret", "hmac sha256 webhook", "verify webhook signature nodejs", "timing safe comparison", "webhook security", "webhooks", "security", "api"]
relatedTools: ["hash-generator"]
faqs:
  - q: "Why does my webhook signature verification fail even though I'm using the correct secret?"
    a: "The most common cause by far is verifying against the parsed-and-reserialized JSON body instead of the exact raw bytes the provider sent. JSON.stringify(JSON.parse(rawBody)) is not guaranteed to produce byte-identical output — key order, whitespace, and number formatting can all shift — and HMAC is computed over exact bytes, so any difference produces a completely different signature."
  - q: "Why shouldn't I use === to compare the computed and received signatures?"
    a: "String equality operators compare character by character and return as soon as they find a mismatch, which means the comparison takes measurably less time for a signature that's wrong in the first character than one that's wrong in the last. An attacker who can measure response timing precisely enough can exploit that difference to guess a valid signature one byte at a time. A constant-time comparison function (crypto.timingSafeEqual in Node, hmac.compare_digest in Python) always takes the same time regardless of where the mismatch is."
  - q: "Do all webhook providers use the same signing algorithm?"
    a: "Not identical, but HMAC-SHA256 is by far the most common — Stripe, GitHub, Shopify, and Slack all use it, accounting for the large majority of webhook providers in practice. The differences are in the details: which header carries the signature, whether a timestamp is included and prefixed to the payload before signing, and the exact header format (raw hex vs a prefixed string like sha256=...)."
  - q: "Why does Stripe include a timestamp in its signature header?"
    a: "To prevent replay attacks. If an attacker intercepts a valid, correctly-signed webhook request, the signature alone doesn't expire — they could resend it later and it would still verify successfully. Stripe signs the timestamp together with the payload and expects you to reject any request where the timestamp is more than a few minutes old, closing that replay window."
---

## The Same Two Bugs, Every Time

If you've implemented webhook signature verification for Stripe, GitHub, or Shopify, there's a good chance you hit one of exactly two bugs on the first attempt. Both produce the same frustrating symptom — "invalid signature" on a request you're certain is legitimate — and both come from a misunderstanding of what HMAC actually verifies.

---

## How HMAC Webhook Signing Actually Works

The provider (Stripe, GitHub, whoever) computes an HMAC-SHA256 over the exact bytes of the request body, using a secret key only you and the provider know, and sends the result in a header — `Stripe-Signature`, `X-Hub-Signature-256`, or similar depending on the provider. Your job is to compute the same HMAC independently, using the same secret, over the same bytes, and check that your result matches theirs.

If it matches, you know two things: the request really came from the provider (only they have the secret), and the body wasn't tampered with in transit (any change to the bytes changes the HMAC completely).

```javascript
const crypto = require('crypto');

function verifySignature(rawBody, signatureHeader, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader)
  );
}
```

That's the whole algorithm. The two bugs are both about what you feed into it.

---

## Bug 1: Verifying Against the Parsed Body Instead of the Raw One

This is the single most common cause of "signature verification failed" errors, and it's almost always a framework default working against you.

```javascript
// WRONG — most Node frameworks parse the body before your handler runs
app.post('/webhook', express.json(), (req, res) => {
  const isValid = verifySignature(
    JSON.stringify(req.body), // this is NOT the original bytes
    req.headers['x-signature'],
    secret
  );
  // ...
});
```

**Why it fails:** `express.json()` (or any body-parsing middleware) parses the incoming JSON into a JavaScript object, discarding the original bytes. When you later call `JSON.stringify(req.body)` to "get the body back," you're not guaranteed to get an identical string — key order can differ, number formatting can differ (`1.0` vs `1`), and whitespace is definitely different. HMAC is computed over exact bytes; a single differing character produces a completely different signature.

**Fix:** capture the raw body *before* any parsing happens, and verify against that:

```javascript
app.post('/webhook',
  express.raw({ type: 'application/json' }), // raw Buffer, not parsed
  (req, res) => {
    const isValid = verifySignature(req.body, req.headers['x-signature'], secret);
    if (!isValid) return res.status(400).send('Invalid signature');

    const event = JSON.parse(req.body); // parse only after verifying
    // ...
  }
);
```

The rule: **verify first, parse second.** Most webhook library bugs trace back to doing it in the other order.

---

## Bug 2: Comparing Signatures with `===`

Even with the raw body handled correctly, this one is subtler and easy to miss in code review because it looks completely reasonable:

```javascript
// WRONG — looks fine, has a timing side-channel
if (expectedSignature === receivedSignature) {
  // process webhook
}
```

**Why it's a problem:** `===` (and `==`) compare strings character by character and return `false` as soon as they hit a mismatch. That means comparing a signature that's wrong in the very first character is measurably faster than comparing one that's wrong in the last character. An attacker with the ability to send many requests and measure response time precisely enough can, in theory, exploit that timing difference to guess a valid signature one byte at a time — a timing attack.

**Fix:** use a constant-time comparison, which always takes the same amount of time regardless of where (or whether) the strings differ:

```javascript
// Node.js
crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
```

```python
# Python
import hmac
hmac.compare_digest(expected, received)
```

Every mainstream language's standard crypto library has one of these — there's no reason to hand-roll string comparison for a signature check.

---

## Bonus: Why Stripe Also Signs a Timestamp

Stripe's `Stripe-Signature` header includes a timestamp alongside the signature, and the signature itself is computed over `timestamp + "." + payload`, not just the payload. This closes a gap that pure signature verification leaves open: **replay attacks**. A valid, correctly-signed request doesn't expire on its own — if an attacker intercepts one, they can resend it days later and it still verifies successfully, because nothing about the signature says *when* it was valid.

By binding the timestamp into the signed data and requiring you to reject anything older than a few minutes, a captured request becomes useless to replay shortly after it was sent. If you're designing your own webhook signing scheme rather than consuming someone else's, include a timestamp the same way.

---

## Quick Reference

| Symptom | Cause | Fix |
|---|---|---|
| Signature fails on every request | Verifying against parsed/reserialized body | Capture and verify the raw body before any JSON parsing |
| Signature fails intermittently, or only under certain payloads | Body-parsing middleware normalizing whitespace/key order | Same fix — use raw body middleware for the webhook route specifically |
| Code review flags a security concern in signature comparison | Using `===`/`==` on the signature strings | Use `crypto.timingSafeEqual` (Node) or `hmac.compare_digest` (Python) |
| Old, previously-valid requests still work | No timestamp/expiry check | Bind a timestamp into the signed payload and reject stale requests |

---

## Test Your HMAC Calculation

**[ToolNinja's Hash Generator →](/tools/hash-generator)** has an HMAC mode built specifically for this — paste your raw payload and secret, pick SHA-256 (or whatever algorithm your provider uses), and compare the output directly against the signature header from a real webhook request. Useful for confirming your server-side implementation is computing the right value before you go hunting for a raw-body-parsing bug.

---

Sources:
- [Webhook Signature Verification (HMAC-SHA256) in Node, Python, Ruby — 2026 Guide](https://hookray.com/blog/webhook-signature-verification-2026)
- [Debugging Webhook Signature Verification Failures in Stripe, GitHub, and Shopify](https://leo88.medium.com/debugging-webhook-signature-verification-failures-in-stripe-github-and-shopify-f758e8bacbbc)
