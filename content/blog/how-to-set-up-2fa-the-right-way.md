---
title: "How to Set Up 2FA the Right Way: TOTP, Backup Codes, and What Actually Breaks"
description: "A practical guide to implementing two-factor authentication correctly — why TOTP beats HOTP for most cases, how backup codes should actually be stored, and the handful of mistakes that account for nearly every real-world 2FA bug report."
metaTitle: "How to Set Up 2FA the Right Way"
metaDescription: "Implement two-factor auth correctly: TOTP vs HOTP, how to store backup codes, and the mistakes behind most real-world 2FA bugs."
date: "2026-10-05"
author: "ToolNinja"
coverEmoji: "🔐"
tags: ["2fa setup guide", "totp vs hotp", "backup codes best practices", "how to implement 2fa", "otpauth url", "2fa recovery codes", "authenticator app setup", "security", "authentication"]
faqs:
  - q: "Should I implement TOTP or HOTP for a new 2FA feature?"
    a: "TOTP, in almost every case. It doesn't require your server to track and synchronize a counter with the client — time serves that role automatically, which eliminates an entire category of desync bugs. HOTP exists mainly for hardware tokens without a reliable clock; if you're building a software-based 2FA flow today, TOTP is the near-universal default."
  - q: "How many backup codes should I generate?"
    a: "8–10 is the common range. Enough that losing or using a few doesn't strand the user, but not so many that managing them becomes its own burden. Prompt the user to regenerate a fresh batch once they've used most of the current set."
  - q: "Can I store backup codes encrypted instead of hashed?"
    a: "Hashed is the better default, for the same reason passwords are hashed rather than encrypted: a hash can't be reversed even if your database is breached, while encrypted data is only as safe as the key protecting it. Since backup codes are only ever compared, never displayed back to the user after creation, there's no legitimate need to decrypt them later — hashing fits that use case better than encryption does."
  - q: "Why does my TOTP code not match what the authenticator app shows?"
    a: "The two most common causes: the secret was transcribed incorrectly (a single wrong character produces a completely different code), or the server and client clocks have drifted — TOTP depends on both sides agreeing on the current time within a small tolerance window, usually ±1 step (30 seconds)."
---

## Most 2FA Bugs Aren't Cryptography Bugs

The HMAC-based algorithm underneath TOTP and HOTP is simple, well-specified, and essentially impossible to get wrong if you follow [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) or [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226) directly. Almost every real 2FA bug report traces back to something else entirely: which algorithm variant was chosen, how backup codes are stored, or a clock that's drifted by more than the verification window tolerates.

---

## Step 1: Choose TOTP, Not HOTP, Unless You Have a Specific Reason Not To

Both algorithms compute an HMAC over a counter and truncate it into a short numeric code. The only real difference is where the counter comes from:

- **TOTP** (RFC 6238): counter = current Unix time ÷ a fixed period (usually 30 seconds). Both sides compute it independently from their own clock — no state to synchronize.
- **HOTP** (RFC 4226): counter = an explicit integer that increments every time a code is generated and accepted. Both sides must persist and agree on its current value.

```text
TOTP:  counter = floor(unix_time / 30)        — no synchronization needed
HOTP:  counter = stored_value, incremented on each use — must stay in sync
```

HOTP's counter-sync requirement is exactly the kind of state that drifts in production: a user's token advances (they pressed the button without submitting), a server-side counter update fails to commit, a retry double-increments. TOTP sidesteps all of it by using time, which both sides already have. Unless you're integrating with specific hardware tokens that only speak HOTP, default to TOTP.

---

## Step 2: Get the otpauth:// URL Format Right

Every authenticator app's QR-code setup flow reads the same URL scheme:

```text
otpauth://totp/Issuer:account@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Issuer&algorithm=SHA1&digits=6&period=30
```

A few details that are easy to get wrong:

- **`issuer` appears twice** — once in the label path (`Issuer:account`) and once as a query parameter. Most apps use the query parameter when present and fall back to the label; set both to the same value for compatibility across apps that only check one.
- **The label needs URL-encoding** if it contains special characters — a raw `@` or space in an unencoded label breaks parsing in some stricter clients.
- **`algorithm`, `digits`, and `period` all have defaults** (SHA1, 6, 30) that the overwhelming majority of authenticator apps assume even if the parameter is omitted — but don't omit them if you're using non-default values, since a client that doesn't read a parameter will silently fall back to the default and compute the wrong code.

---

## Step 3: Store Backup Codes Like Passwords, Not Like Data

Backup codes are a full 2FA bypass if they leak. Treat them with the same care as a password:

```text
On generation:  show the plaintext once → hash each code (SHA-256 is sufficient) → store only the hashes
On redemption:  hash the submitted code → compare against stored hashes → mark that hash as used
```

The failure mode to avoid is storing backup codes in plaintext or in a reversibly-encrypted form "just in case you need to show them again" — you don't. A user who loses their backup codes needs a fresh batch generated, the same way a user who forgets their password gets a reset link, not their old password decrypted and emailed back to them.

---

## Step 4: Handle Clock Drift Before It Becomes a Support Ticket

TOTP verification should check not just the current time step, but a small window around it — typically the step before and after (±30 seconds at the default period), to tolerate minor clock drift and the delay between a user reading a code and submitting it.

```text
valid if: computed_code(current_step - 1) == submitted
       OR computed_code(current_step)     == submitted
       OR computed_code(current_step + 1) == submitted
```

Too narrow a window (checking only the exact current step) causes legitimate codes to fail right at the edge of their 30-second validity. Too wide a window weakens the time-based security property TOTP is built on. ±1 step is the conventional balance.

---

## Quick Reference

| Symptom | Likely cause |
|---|---|
| Code never matches, even right after setup | Secret was transcribed incorrectly, or wrong algorithm/digit-count assumed |
| Code works sometimes, fails intermittently | Server verification window too narrow for normal clock drift |
| HOTP codes drift out of sync after repeated use | Counter desync between client and server — a known HOTP failure mode TOTP avoids |
| Backup code redemption "works" more than once | Redeemed codes aren't being marked used, allowing replay |
| Database breach exposes working backup codes | Codes were stored in plaintext or reversibly encrypted instead of hashed |

---

## Try It

**[ToolNinja's TOTP Generator →](/tools/totp-generator)** and **[HOTP Generator →](/tools/hotp-generator)** compute live codes from a secret so you can verify your server-side implementation against a known-correct reference. **[Backup Codes Generator →](/tools/backup-codes-generator)** produces a realistic code set with SHA-256 hashes shown side by side, and **[QR Code Scanner →](/tools/qr-code-scanner)** decodes an existing otpauth:// QR code when you need to check what it actually contains.

---

Sources:
- [RFC 6238 — TOTP: Time-Based One-Time Password Algorithm](https://datatracker.ietf.org/doc/html/rfc6238)
- [RFC 4226 — HOTP: An HMAC-Based One-Time Password Algorithm](https://datatracker.ietf.org/doc/html/rfc4226)
- [Google Authenticator Key URI Format](https://github.com/google/google-authenticator/wiki/Key-Uri-Format)
