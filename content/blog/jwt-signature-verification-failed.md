---
title: "SignatureVerificationException: Signature verification failed ? JWT Fix Guide"
description: "JWT signature verification failures are almost always caused by key mismatches, algorithm mismatches, or encoding differences. Learn to diagnose and fix every case with step-by-step examples."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "??"
tags: ["jwt", "security", "authentication", "tokens", "signature verification", "jwt invalid signature"]
relatedTools: ["jwt-decoder"]
faqs:
  - q: "What is the difference between HS256 and RS256, and why does it cause this error?"
    a: "HS256 (HMAC-SHA256) is symmetric ? the same secret key signs and verifies. RS256 (RSA-SHA256) is asymmetric ? a private key signs, a public key verifies. The error occurs when you sign with one algorithm but verify with another, or when library defaults differ between signing and verification code."
  - q: "Can environment variables cause signature verification failures?"
    a: "Yes, and this is extremely common. If your signing service uses JWT_SECRET=mysecret but your verification service reads a different value, or the variable has trailing whitespace, the keys won't match. Always log key.length (not the key itself) in both services to confirm they're identical."
  - q: "How do I verify the algorithm used to sign an existing JWT?"
    a: "The JWT header contains the algorithm. Decode the first segment: atob(token.split('.')[0]). The result is JSON with an 'alg' field like {alg: 'HS256', typ: 'JWT'}. Your verification code must use the exact same algorithm."
  - q: "Is it safe to debug JWT signature issues by decoding the token?"
    a: "Decoding a JWT payload is completely safe ? the payload is just Base64-encoded, not encrypted. Anyone with the token can read the claims. The signature only proves authenticity. Never put sensitive secrets inside JWT payloads."
---

## The Exact Error

```
SignatureVerificationException: Signature verification failed
```

Or in various libraries:
```
JsonWebTokenError: invalid signature
io.jsonwebtoken.SignatureException: JWT signature does not match locally computed signature
jwt.exceptions.InvalidSignatureError: Signature verification failed
```

> Quick summary: The signature in the JWT doesn't match what the verification code computes using its key. The token was signed with a different key, a different algorithm, or the secret has been corrupted or mismatched between services.

---

## Why This Error Happens

A JWT consists of three parts: header, payload, and signature. The signature is computed by taking the base64-encoded header + "." + base64-encoded payload and signing with a secret key using the specified algorithm.

When you verify a JWT, the library recomputes this signature using the key you provide and compares it to the signature in the token. If they don't match, you get `SignatureVerificationException`.

There are four root causes:

**1. Key mismatch** ? The signing service used `SECRET_KEY=abc123` but the verification service read a different value.

**2. Algorithm mismatch** ? Token was signed with HS256 but code tries to verify with RS256, or vice versa.

**3. Encoding mismatch** ? The secret is the same string but one service treats it as raw UTF-8 and another decodes it from Base64 first.

**4. Key rotation** ? The signing key was rotated and old tokens signed with the previous key are still being used.

---

## Step-by-Step Diagnosis

### Step 1 ? Decode the JWT header to check the algorithm

```javascript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const headerJson = atob(token.split('.')[0]);
console.log(JSON.parse(headerJson));
// {"alg":"HS256","typ":"JWT"}
```

### Step 2 ? Compare key lengths in signing vs verification

```javascript
// In signing service:
console.log('Signing key length:', process.env.JWT_SECRET?.length);
// In verification service:
console.log('Verification key length:', process.env.JWT_SECRET?.length);
```

If lengths differ, the keys are different.

### Step 3 ? Test with a known-good token

```javascript
const token = jwt.sign({ test: true }, secret, { algorithm: 'HS256' });
const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
console.log(decoded); // Should work if keys and algo match
```

---

## Solutions

### Solution 1 ? Explicitly specify the algorithm on both sign and verify

```javascript
const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
```

Never rely on library defaults for the algorithm.

### Solution 2 ? For RS256, verify the key pair matches

```javascript
const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
```

Generate a fresh key pair and test end-to-end.

### Solution 3 ? Normalize secret handling across services

```javascript
// Standardize: always use raw string, consistent everywhere
const secret = process.env.JWT_SECRET;
```

If you generated a Base64 secret with `openssl rand -base64 32`, store and use it as-is.

### Solution 4 ? Handle key rotation gracefully

```javascript
const secrets = [process.env.JWT_SECRET_CURRENT, process.env.JWT_SECRET_PREVIOUS];

function verifyToken(token) {
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret, { algorithms: ['HS256'] });
    } catch {}
  }
  throw new Error('Invalid token');
}
```

---

## Real-World Examples

### Example 1: Microservices with different env vars

Auth service signs with `JWT_SECRET=production-secret-abc`, API service verifies with `JWT_SECRET=production-secret-xyz`. Both log different key lengths. Fix: audit environment variable configuration in your deployment system.

### Example 2: Algorithm confusion in multi-language stack

Node.js service signs HS256, Java Spring service expects RS256 by default. Decode the JWT header to confirm `{"alg":"HS256"}`, then configure Spring to accept HS256.

---

## Quick Reference

| Symptom | Likely Cause | Fix |
|---|---|---|
| Works in dev, fails in production | Different env vars | Audit secret values in all deployments |
| Works for new tokens, fails for old | Key rotation | Support multiple verification keys |
| Fails across microservices | Key not shared | Use shared secret store (Vault, K8s secrets) |
| HS256 vs RS256 mismatch | Library default algorithm | Explicitly set algorithm on sign AND verify |
| Different key lengths in logs | Whitespace in env var | Trim secret: `secret.trim()` |

---

## Prevent This Error in the Future

**1. Always explicitly specify the algorithm** in both `sign()` and `verify()` calls.

**2. Use a centralized secrets manager** so all services read from the same source.

**3. Add integration tests** that sign a token in service A and verify it in service B as part of CI.

---

## Use ToolNinja to Debug Faster

The JWT Decoder lets you instantly inspect any JWT's header, payload, and claims. Check the `alg` field in the header and verify `exp` hasn't passed ? before writing a single line of debugging code.

?? **[JWT Decoder ? toolninja.io/tools/jwt-decoder](https://toolninja.io/tools/jwt-decoder)**
