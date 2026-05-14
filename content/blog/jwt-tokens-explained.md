---
title: "JWT Tokens Explained: Structure, Signing, and Security"
description: "Learn how JSON Web Tokens (JWT) work, how to decode and verify them, common vulnerabilities like the 'alg:none' attack, and best practices for using JWTs securely in your applications."
date: "2026-05-03"
author: "ToolNinja"
coverEmoji: "🔑"
tags: ["jwt decoder", "decode jwt token", "json web token explained", "jwt token structure", "jwt header payload signature", "jwt security", "how to decode jwt online", "jwt debugger", "jwt expiry check", "jwt vs session tokens", "jwt alg none attack", "jwt tutorial"]
relatedTools: ["jwt-decoder"]
faqs:
  - q: "Can I decode a JWT without the secret key?"
    a: "Yes — the header and payload of a JWT are just Base64URL encoded, not encrypted. Anyone can decode them without the secret. The secret is only needed to verify the signature."
  - q: "Is it safe to paste my JWT into an online decoder?"
    a: "Only if the tool runs entirely in your browser with no server calls. ToolNinja's JWT Decoder processes your token 100% client-side — nothing is ever sent to any server."
  - q: "What is the difference between JWT and session tokens?"
    a: "Session tokens require a database lookup on every request. JWTs are self-contained — the server can verify them without a database by checking the signature."
  - q: "What does the alg:none vulnerability mean in JWT?"
    a: "Some JWT libraries historically accepted tokens with algorithm set to none, bypassing signature verification entirely. Always verify your library rejects alg:none tokens."
---

## What Is a JWT?

A **JSON Web Token (JWT)** is a compact, URL-safe token format defined in [RFC 7519](https://tools.ietf.org/html/rfc7519). It's used to represent claims between two parties — typically an authentication server and your application.

You've seen them: that long `eyJ...` string in an `Authorization: Bearer` header. Every modern auth system (Auth0, Cognito, Supabase, Firebase) issues JWTs.

---

## The Three-Part Structure

A JWT is three Base64URL-encoded JSON objects joined by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJzdWIiOiJ1c2VyXzEyMyIsImVtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20iLCJpYXQiOjE3MzAwMDAwMDAsImV4cCI6MTczMDA4NjQwMH0
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Header** — algorithm and token type:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload** — the claims (user data):
```json
{
  "sub": "user_123",
  "email": "alice@example.com",
  "iat": 1730000000,
  "exp": 1730086400
}
```

**Signature** — proof of integrity:
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

The signature is what makes the token **tamper-proof** — but it doesn't encrypt the payload. Anyone can read the header and claims by Base64-decoding them.

---

## Registered Claims (the Standard Fields)

| Claim | Full Name | Description |
|-------|-----------|-------------|
| `iss` | Issuer | Who issued the token |
| `sub` | Subject | Who the token is about (user ID) |
| `aud` | Audience | Who the token is intended for |
| `exp` | Expiration | Unix timestamp when token expires |
| `nbf` | Not Before | Token not valid before this time |
| `iat` | Issued At | When the token was issued |
| `jti` | JWT ID | Unique identifier for this token |

Always include `exp`. A token with no expiry is valid forever — a massive security risk if it leaks.

---

## Signing Algorithms

### Symmetric (shared secret)

**HS256 / HS384 / HS512** — HMAC with SHA-256/384/512

The same secret is used to sign and verify. Simple, fast, and works well when the issuer and verifier are the same service.

```bash
# Signing and verifying both use the same secret
SECRET="your-256-bit-secret"
```

**Risk:** Anyone with the secret can forge tokens. Never use HS256 across trust boundaries.

### Asymmetric (public/private key)

**RS256 / RS384 / RS512** — RSA with SHA

The server signs with a **private key**; anyone can verify with the **public key**. Ideal for:
- Third-party services verifying your tokens
- Microservices where you don't want every service holding a signing secret
- Auth providers like Auth0 and AWS Cognito

**ES256 / ES384 / ES512** — ECDSA with SHA

Same model as RSA but smaller keys and faster verification. Preferred over RS256 for new systems.

---

## The `alg:none` Attack

One of the most dangerous JWT vulnerabilities. Some naive libraries accept a token with `"alg": "none"` and no signature:

```json
// Header
{ "alg": "none", "typ": "JWT" }
// Payload  
{ "sub": "admin", "role": "superuser" }
// Signature: (empty)
```

An attacker can craft a token claiming to be any user and the library accepts it.

**Fix:** Always explicitly specify which algorithms are acceptable when verifying. Never allow `none`.

```javascript
// Bad
jwt.verify(token, secret)

// Good — whitelist the algorithm
jwt.verify(token, secret, { algorithms: ["HS256"] })
```

---

## Algorithm Confusion Attack

Attackers sometimes switch a token from RS256 to HS256 and sign with the **public key** as the HMAC secret (since public keys are... public). A library that doesn't enforce the expected algorithm will verify this as valid.

**Fix:** Same as above — always lock down the allowed algorithms.

---

## Token Expiry and Refresh

Short-lived access tokens + long-lived refresh tokens is the standard pattern:

```
Access token:  15 minutes  (stored in memory, not localStorage)
Refresh token: 7–30 days   (stored in httpOnly cookie)
```

When the access token expires:
1. Client sends the refresh token to `/auth/refresh`
2. Server validates refresh token, issues new access token
3. Optionally rotates the refresh token (recommended)

---

## Where to Store JWTs

| Storage | XSS Risk | CSRF Risk | Recommendation |
|---------|----------|-----------|---------------|
| `localStorage` | High ❌ | None | Avoid for sensitive tokens |
| `sessionStorage` | High ❌ | None | Slightly better, same XSS risk |
| Memory (JS var) | None ✅ | None | Best for access tokens |
| httpOnly cookie | None ✅ | Medium | Best for refresh tokens |

Use an httpOnly, Secure, SameSite=Strict cookie for refresh tokens. Store access tokens in memory and re-issue them from the refresh token on page reload.

---

## Decoding Without a Library

Since the payload is just Base64URL-encoded JSON, you can decode it anywhere:

```javascript
function decodeJwt(token) {
  const [, payload] = token.split(".");
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json);
}
```

This only decodes — it does **not** verify the signature. Use this for debugging and logging, never for authorization decisions.

---

## Common JWT Pitfalls

1. **Not verifying the signature** — decoding ≠ verifying
2. **Trusting `exp` from the token** — verify it server-side with a known-good time
3. **Putting sensitive data in the payload** — it's readable by anyone
4. **No `aud` check** — a token from service A could be replayed at service B
5. **Long expiry times** — a leaked token stays valid until expiry
6. **Not using HTTPS** — JWTs in transit can be intercepted

---

## Try It: ToolNinja JWT Decoder

Paste any JWT into the **[ToolNinja JWT Decoder](/tools/jwt-decoder)** to instantly see the decoded header, payload, and expiry status. Works 100% in your browser — the token never leaves your machine.
