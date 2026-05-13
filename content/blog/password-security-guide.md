---
title: "Password Security: Entropy, Strength, and Best Practices"
description: "Understand password entropy and why length beats complexity. Learn the difference between random and memorable passwords, how password managers work, and current NIST guidelines."
date: "2026-01-03"
author: "ToolNinja"
coverEmoji: "🛡️"
tags: ["security", "passwords", "authentication", "best-practices"]
relatedTools: ["password-generator"]
---

## What Makes a Password Strong?

The key metric is **entropy** — the measure of unpredictability. A password with high entropy takes longer to crack by brute force.

Entropy is calculated as:

```
H = L × log₂(N)
```

Where:
- `L` = length of the password
- `N` = size of the character set used
- `H` = entropy in bits

| Character Set | Size (N) | Entropy per character |
|--------------|----------|-----------------------|
| Lowercase only | 26 | 4.7 bits |
| Lower + upper | 52 | 5.7 bits |
| Lower + upper + digits | 62 | 5.95 bits |
| All printable ASCII | 95 | 6.57 bits |

A **12-character** password using the full 95-character set has:
`12 × 6.57 = 78.8 bits` of entropy — extremely difficult to brute-force.

---

## Length Beats Complexity

The most important factor is **length**, not character variety.

| Password | Characters | Entropy | Crack time (10B guesses/s) |
|----------|-----------|---------|---------------------------|
| `P@ssw0rd!` | 10, mixed | ~30 bits | Seconds (dictionary match) |
| `correcthorsebatterystaple` | 25, lower | 117 bits | Centuries |
| `Tr0ub4dor&3` | 11, mixed | ~28 bits | Hours (dictionary-based) |
| `j9$mK#vQ2!wL` | 12, full ASCII | 79 bits | Years |
| `xkcd-style-four-random-words` | 25+ | 100+ bits | Centuries |

The xkcd comic from 2011 was right: four random common words is more secure and more memorable than `P@ssw0rd!`.

---

## Random vs Memorable

### High-security passwords (use a manager)

For accounts accessed via a password manager:

```
Random 20-character: T7$kN#m2Qp!vZe9xRw3Y
```

You never type this — the manager fills it in. Maximize entropy and length.

### Passphrases (for accounts you type)

For accounts you type frequently (system login, password manager master password):

```
correct-horse-battery-staple
purple-cloud-eleven-dragon
```

4 random words from a 2000-word list gives `4 × log₂(2000) = 44 bits` minimum. 5 words = 55 bits. Easy to type, hard to crack.

---

## NIST Password Guidelines (SP 800-63B, 2024)

The current NIST guidelines are a significant departure from older advice:

**Do:**
- ✅ Require a minimum of 8 characters (15 for critical accounts)
- ✅ Allow up to 64 characters
- ✅ Accept all printable ASCII and Unicode characters (including spaces and emoji)
- ✅ Check against known-breached password lists (HaveIBeenPwned API)
- ✅ Require MFA for sensitive operations

**Don't:**
- ❌ Require complexity rules (uppercase + number + symbol) — they lead to predictable patterns
- ❌ Force periodic password changes (unless breach suspected)
- ❌ Use security questions
- ❌ Limit character types or allow only certain special characters

---

## How Password Cracking Works

Understanding attacks helps you design better passwords:

### Dictionary attacks

Crackers don't try random characters — they start with known passwords and common patterns:
```
password, password1, Password1, P@ssword1, p@$$w0rd
```
Any password that follows a predictable substitution pattern (a→@, o→0, e→3) is vulnerable.

### Credential stuffing

Breached username/password pairs from one site tried against other sites. If you reuse passwords, one breach exposes everything.

### Targeted attacks

For high-value targets, attackers use personal information: birthdays, pet names, addresses, favorite sports teams. Never use any personal information in passwords.

### GPU cracking speeds

Modern GPU cracking rigs can test:
- MD5 hashes: ~100 billion/second
- bcrypt (cost 12): ~25,000/second
- Argon2id: even slower (by design)

This is why your password strength is relative to how the site stores passwords. A strong hash function (bcrypt, Argon2id, scrypt) makes cracking infeasible even for passwords that aren't perfect.

---

## Password Storage (for Developers)

If you're building an app with passwords:

```javascript
// ✅ Use bcrypt with cost factor 12+
import bcrypt from "bcrypt";
const hash = await bcrypt.hash(password, 12);
const valid = await bcrypt.compare(password, hash);

// ✅ Or Argon2id (better, NIST-recommended)
import argon2 from "argon2";
const hash = await argon2.hash(password, { type: argon2.argon2id });
const valid = await argon2.verify(hash, password);
```

**Never:**
- Store plaintext passwords
- Use MD5 or SHA-1/256 alone (even salted, too fast to crack)
- Roll your own crypto

---

## Password Managers

The single most impactful security improvement most people can make:

**How they work:**
1. Master password + key file → derived encryption key
2. Vault encrypted locally with AES-256
3. Synced encrypted to cloud (only you can decrypt)
4. Browser extension auto-fills credentials

**Recommended options:**
- **Bitwarden** — open source, self-hostable, free tier is generous
- **1Password** — polished UX, good for teams
- **KeePassXC** — local-only, no cloud dependency

**For developers:** Store API keys, SSH passphrases, database credentials in your password manager — not in `.env` files in your home directory.

---

## Multi-Factor Authentication (MFA)

Even a perfect password can be phished. MFA adds a second factor:

| Type | Security | Phishable? |
|------|----------|-----------|
| SMS OTP | Weak (SIM swap attacks) | Yes |
| TOTP (Authenticator app) | Good | Yes (real-time) |
| FIDO2 / Passkey | Excellent | No |
| Hardware key (YubiKey) | Excellent | No |

**Passkeys** are the emerging standard: cryptographic key pairs where the private key never leaves your device. No password to phish, no SMS to intercept.

---

## Try It: ToolNinja Password Generator

Generate cryptographically strong passwords and passphrases with the **[ToolNinja Password Generator](/tools/password-generator)**. Configure length, character sets, and exclusions. Runs entirely in your browser — the password is never transmitted anywhere.
