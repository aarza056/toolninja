---
title: "URIError: URI Malformed — JavaScript URL Parsing Fix"
description: "The 'URI malformed' error in JavaScript happens when decodeURIComponent() or decodeURI() receives a string with invalid percent-encoding. Learn the exact causes and safe decoding patterns."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "🔗"
tags: ["javascript", "url", "uri", "encoding", "uriError", "malformed uri", "decodeURIComponent"]
relatedTools: ["url-encoder"]
faqs:
  - q: "What is the difference between decodeURI and decodeURIComponent?"
    a: "decodeURI() decodes a complete URI and leaves reserved characters (; , / ? : @ & = + $ #) encoded. decodeURIComponent() decodes every percent-encoded character including reserved ones. Use decodeURIComponent for query parameter values."
  - q: "Why does '%' in a URL cause a URIError?"
    a: "A bare % sign that is not followed by two hex digits is invalid percent-encoding. The decoder throws URIError: URI malformed instead of guessing what it means."
  - q: "How do I safely decode a URL that might be malformed?"
    a: "Wrap decodeURIComponent in a try-catch and fall back to the raw string, or use a URL-parsing library that handles malformed input gracefully."
---

## The Exact Error

```
URIError: URI malformed
URIError: malformed URI sequence
URIError: The URI to be decoded is not a valid encoding
```

> Quick summary: `decodeURIComponent()` or `decodeURI()` received a string containing a `%` not followed by two valid hex digits. The most common source is user-supplied URLs or improperly encoded query strings.

---

## Why This Error Happens

Percent-encoding requires `%` followed by exactly two hexadecimal characters (`0-9`, `A-F`). Any other sequence throws:

**1. Bare % in the string** — `hello%world` — `%wo` is not valid hex

**2. Truncated encoding** — `value%2` — incomplete sequence

**3. Decoding twice** — calling `decodeURIComponent` on an already-decoded string that contains `%` as a literal character

**4. User input** — a user pastes a URL with `%` not meant as an escape character

---

## Step-by-Step Diagnosis

### Step 1 — Identify where the malformed input comes from

```javascript
const raw = req.query.redirect; // User-supplied
console.log('Raw value:', raw);
// Check for invalid % sequences
console.log('Has bare %:', /%(?![0-9A-Fa-f]{2})/.test(raw));
```

### Step 2 — Check for double decoding

```javascript
// If the string was already decoded, it may contain literal % signs
// that are not valid percent-encoding
const alreadyDecoded = 'hello 50% done';
decodeURIComponent(alreadyDecoded); // URIError: % is followed by ' d'
```

### Step 3 — Verify the encoding at the source

```javascript
// Always encode before sending
const param = encodeURIComponent('value with % and spaces');
// Use this in the URL, then decode on the receiving end
```

---

## Solutions

### Solution 1 — Wrap in try-catch

```javascript
function safeDecode(str) {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}
```

### Solution 2 — Sanitize % signs before decoding

```javascript
function decodeSafe(str) {
  // Replace bare % (not followed by two hex digits) with %25
  const sanitized = str.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
  return decodeURIComponent(sanitized);
}
```

### Solution 3 — Use the URL API instead of manual decoding

```javascript
try {
  const url = new URL(input);
  // url.searchParams automatically handles decoding
  const value = url.searchParams.get('redirect');
} catch (e) {
  console.error('Invalid URL:', e.message);
}
```

### Solution 4 — Encode properly at the source

```javascript
// Building a URL with query parameters
const base = 'https://example.com/search';
const params = new URLSearchParams({ q: 'hello world & more', page: '2' });
const fullUrl = `${base}?${params.toString()}`;
// All values are properly encoded automatically
```

---

## Real-World Examples

**Express.js route handling:**

```javascript
app.get('/redirect', (req, res) => {
  let target;
  try {
    target = decodeURIComponent(req.query.to || '');
  } catch {
    return res.status(400).json({ error: 'Invalid redirect URL' });
  }

  if (!target.startsWith('/')) {
    return res.status(400).json({ error: 'Invalid redirect target' });
  }

  res.redirect(target);
});
```

---

## Quick Reference — URL Encoding Functions

| Function | Encodes | Leaves unencoded |
|---|---|---|
| `encodeURIComponent(s)` | All except `A-Z a-z 0-9 - _ . ! ~ * ' ( )` | Unreserved chars |
| `encodeURI(s)` | Special chars except `;,/?:@&=+$#` | URI structure chars |
| `decodeURIComponent(s)` | Decodes all `%XX` sequences | — |
| `decodeURI(s)` | Decodes all except `;,/?:@&=+$#` | — |

---

## Prevent This Error in the Future

**1. Always use `encodeURIComponent`** for individual query parameter values.

**2. Use `URLSearchParams`** to build query strings — it handles encoding automatically.

**3. Wrap `decodeURIComponent` in try-catch** when handling any user-supplied input.

---

## Use ToolNinja to Debug Faster

The URL Encoder lets you encode and decode URL components interactively — paste any string to see the correct percent-encoded form or decode a malformed URL fragment.

🔧 **[URL Encoder — toolninja.io/tools/url-encoder](https://toolninja.io/tools/url-encoder)**
