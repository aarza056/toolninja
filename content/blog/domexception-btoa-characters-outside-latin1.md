---
title: "DOMException: btoa() ? The string contains characters outside of the Latin1 range"
description: "btoa() only handles Latin-1 characters. This error appears when you try to encode Unicode strings. Learn the correct two-step approach using encodeURIComponent + btoa(), and why you need it."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "??"
tags: ["javascript", "base64", "encoding", "unicode", "btoa", "frontend", "domexception"]
relatedTools: ["base64"]
faqs:
  - q: "Why does btoa() only support Latin-1 characters?"
    a: "btoa() was designed to encode binary data (Latin-1 = one byte per character). Base64 encoding works on raw bytes, and Latin-1 maps exactly one character to one byte (character codes 0-255). Unicode characters above U+00FF require multiple bytes in UTF-8 and btoa() doesn't handle multi-byte characters."
  - q: "What is the difference between btoa() and Base64 encoding a UTF-8 string?"
    a: "btoa() converts a binary string where each character is a byte value 0-255. To encode a UTF-8 Unicode string, you first convert it to UTF-8 bytes with encodeURIComponent, then Base64-encode those bytes with btoa. The result is longer because multi-byte characters require multiple bytes."
  - q: "Is atob(btoa(str)) === str always true?"
    a: "Only for Latin-1 strings. For Unicode strings encoded with encodeURIComponent, you need the reverse: decodeURIComponent(atob(encoded)). The encoding and decoding approach must match exactly."
  - q: "Should I use btoa/atob or a library for Base64 in modern JavaScript?"
    a: "For simple Base64 encoding of UTF-8 text in browsers, the encodeURIComponent+btoa pattern is reliable. In Node.js 16+, use Buffer.from(str, 'utf8').toString('base64') ? it handles Unicode correctly without workarounds."
---

## The Exact Error

```
DOMException: Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.
```

> Quick summary: `btoa()` can only encode characters in the Latin-1 range (codes 0-255). Any Unicode character above U+00FF ? emojis, Chinese characters, Arabic text, the euro sign ? triggers this error. The fix is to convert the string to UTF-8 bytes before encoding.

---

## Why This Error Happens

`btoa()` (Binary To Ascii) treats each character as a single byte. Latin-1 maps one character to one byte, covering codes 0-255. Unicode characters above U+00FF don't fit in a single byte, so `btoa()` throws.

```javascript
btoa('hello');      // 'aGVsbG8=' ? OK (all ASCII)
btoa('cafe');       // OK (all Latin-1)
btoa('?100');       // THROWS ? '?' is U+20AC, above U+00FF
btoa('Hello ??');   // THROWS ? emoji is above U+00FF
btoa('??');        // THROWS ? CJK characters above U+00FF
```

---

## Step-by-Step Diagnosis

### Step 1 ? Find the non-Latin-1 character

```javascript
function findNonLatin1(str) {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code > 255) {
      console.log(`Non-Latin1 at position ${i}: '${str[i]}' (U+${code.toString(16).toUpperCase()})`);
    }
  }
}
findNonLatin1('Hello ?100');
// Non-Latin1 at position 6: '?' (U+20AC)
```

### Step 2 ? Determine what you're encoding

- Text content ? Use `encodeURIComponent` + `btoa`
- Binary data ? Use `Uint8Array` ? `btoa`
- Node.js ? Use `Buffer`

---

## Solutions

### Solution 1 ? Use encodeURIComponent before btoa

```javascript
function base64Encode(str) {
  return btoa(encodeURIComponent(str));
}

function base64Decode(str) {
  return decodeURIComponent(atob(str));
}

const encoded = base64Encode('Hello ?? ?? ?100');
const decoded = base64Decode(encoded);  // 'Hello ?? ?? ?100'
```

### Solution 2 ? Use TextEncoder + Uint8Array

```javascript
function base64EncodeUnicode(str) {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, b => String.fromCodePoint(b)).join('');
  return btoa(binString);
}

function base64DecodeUnicode(base64) {
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, c => c.codePointAt(0));
  return new TextDecoder().decode(bytes);
}
```

### Solution 3 ? Node.js Buffer approach

```javascript
const encoded = Buffer.from('Hello ?? ??', 'utf8').toString('base64');
const decoded = Buffer.from(encoded, 'base64').toString('utf8');
```

### Solution 4 ? URL-safe Base64

```javascript
function base64UrlEncode(str) {
  return btoa(encodeURIComponent(str))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

---

## Quick Reference

| Scenario | Works with btoa()? | Fix |
|---|---|---|
| ASCII text only | Yes | Use directly |
| Latin-1 text (?, ?) | Yes (codes ?255) | Use directly |
| Euro sign ?, emojis | No (> U+00FF) | `btoa(encodeURIComponent(str))` |
| Node.js server | N/A | `Buffer.from(str, 'utf8').toString('base64')` |

---

## Prevent This Error in the Future

**1. Never use bare `btoa(text)` for user-provided strings.** Always use the `encodeURIComponent` wrapper.

**2. Create helper functions once** and reuse everywhere:
```javascript
const b64encode = str => btoa(encodeURIComponent(str));
const b64decode = str => decodeURIComponent(atob(str));
```

**3. In Node.js, use `Buffer` always** ? it handles UTF-8 natively.

---

## Use ToolNinja to Debug Faster

The Base64 tool handles Unicode encoding and decoding correctly ? paste any string including emojis, CJK characters, and accented text to get the correct Base64 output.

?? **[Base64 Encoder/Decoder ? toolninja.io/tools/base64](https://toolninja.io/tools/base64)**
