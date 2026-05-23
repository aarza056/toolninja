---
title: "ClaimJwtException: JWT Claim Validation Failed ? Timestamp and Expiry Fix Guide"
description: "JWT claim validation errors are almost always caused by milliseconds vs seconds confusion or clock skew between services. Learn to diagnose expired tokens, iat-in-the-future errors, and fix each case."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "??"
tags: ["jwt", "security", "authentication", "tokens", "timestamp", "jwt expired", "claim validation"]
relatedTools: ["timestamp-converter", "jwt-decoder"]
faqs:
  - q: "What is the difference between exp, iat, and nbf JWT claims?"
    a: "exp (expiration time) is the Unix timestamp after which the token is invalid. iat (issued at) is when the token was created. nbf (not before) is the earliest time the token can be used. All three are Unix timestamps in seconds ? not milliseconds ? per the JWT specification (RFC 7519)."
  - q: "Why does my JWT expire immediately after being issued?"
    a: "Almost always a milliseconds vs seconds bug. JavaScript's Date.now() returns milliseconds (13 digits) but JWT timestamps must be in seconds (10 digits). Setting exp: Date.now() + 3600 instead of Math.floor(Date.now() / 1000) + 3600 sets the expiry billions of seconds in the past from a seconds-based verifier's perspective."
  - q: "What is clock skew and how much is acceptable for JWT validation?"
    a: "Clock skew is the difference in system time between the issuing and verifying servers. Even with NTP, servers can drift by seconds. Most JWT libraries allow configuring a clockTolerance (e.g., 60 seconds) to accept tokens that appear slightly expired due to clock drift."
  - q: "How do I check the actual expiry time of a JWT without running code?"
    a: "Decode the payload segment from Base64: atob(token.split('.')[1]). The result contains the exp field as a Unix timestamp in seconds. Convert it to a human-readable date using a timestamp converter to see if it's in the past."
---

## The Exact Error

```
io.jsonwebtoken.ExpiredJwtException: JWT expired at 2024-01-15T10:00:00Z. Current time: 2024-01-15T11:00:00Z
```

Or:
```
ClaimJwtException: JWT claim validation failed
JsonWebTokenError: jwt expired
jwt.exceptions.ExpiredSignatureError: Signature has expired
```

> Quick summary: The JWT's `exp` claim has passed, or another claim like `nbf` or `iat` is invalid. Either the token genuinely expired, there's a milliseconds-vs-seconds bug in the issuer, or there's clock skew between signing and verification services.

---

## Why This Error Happens

JWT timestamps (`exp`, `iat`, `nbf`) are Unix timestamps measured in **seconds** since January 1, 1970 (RFC 7519).

Four root causes:

**1. Token genuinely expired** ? The server time has passed the `exp` value.

**2. Milliseconds vs seconds bug** ? `Date.now()` returns milliseconds (13 digits), but JWT expects seconds (10 digits).

**3. Clock skew** ? The signing and verifying servers have different system clocks.

**4. Wrong timezone handling** ? Creating expiry timestamps from local timezone date objects instead of UTC Unix seconds.

---

## Step-by-Step Diagnosis

### Step 1 ? Decode the JWT and read the exp claim

```javascript
const token = "eyJhbGci...";
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('exp:', payload.exp);
console.log('now (seconds):', Math.floor(Date.now() / 1000));
console.log('exp readable:', new Date(payload.exp * 1000).toISOString());
```

If `exp` is a 13-digit number, you have the milliseconds bug.

### Step 2 ? Check if exp is seconds or milliseconds

```javascript
const exp = payload.exp;
if (exp > 9999999999) {
  console.error('BUG: exp is in milliseconds, not seconds');
} else {
  console.log('Already expired:', exp < Math.floor(Date.now() / 1000));
}
```

### Step 3 ? Measure clock skew between services

```bash
# On the signing server:
date +%s
# On the verification server:
date +%s
# Difference greater than 60 seconds = clock skew problem
```

---

## Solutions

### Solution 1 ? Fix milliseconds to seconds

```javascript
// WRONG:
const payload = { exp: Date.now() + 3600000 };  // milliseconds!

// RIGHT ? use expiresIn option:
const token = jwt.sign(payload, secret, { expiresIn: '1h' });

// RIGHT ? manual seconds:
const payload = {
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};
```

### Solution 2 ? Add clock tolerance to the verifier

```javascript
// jsonwebtoken (Node.js):
const decoded = jwt.verify(token, secret, {
  algorithms: ['HS256'],
  clockTolerance: 60
});
```

```python
# PyJWT:
decoded = jwt.decode(token, secret, algorithms=["HS256"], leeway=60)
```

### Solution 3 ? Handle token refresh for expired tokens

```javascript
async function fetchWithAuth(url) {
  let token = localStorage.getItem('access_token');
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.status === 401) {
    token = await refreshAccessToken();
    localStorage.setItem('access_token', token);
    return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  }
  return response;
}
```

---

## Quick Reference

| Symptom | Likely Cause | Fix |
|---|---|---|
| Token expires immediately | exp set in milliseconds | Divide by 1000: `Math.floor(Date.now()/1000)` |
| Works in dev, fails in prod | Different server clocks | Add clockTolerance to verifier |
| iat-in-the-future error | Clock skew between services | Enable NTP, add leeway |
| exp is 13 digits | Milliseconds bug | Correct to 10-digit Unix seconds |

---

## Prevent This Error in the Future

**1. Always use the library's `expiresIn` option** rather than setting `exp` manually.

**2. Set `clockTolerance: 60`** as a baseline in all verifiers.

**3. Add a startup check** that logs token claim values and timestamps.

---

## Use ToolNinja to Debug Faster

The Timestamp Converter lets you instantly convert between Unix timestamps and human-readable dates. Paste the `exp` value from your JWT payload and see if it's in seconds or milliseconds, and when the token actually expires.

?? **[Timestamp Converter ? toolninja.io/tools/timestamp-converter](https://toolninja.io/tools/timestamp-converter)**
