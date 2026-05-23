---
title: "JSON.parse: unexpected character at line 1 column 1 ? Complete Fix Guide"
description: "This error almost always means your API returned an HTML error page instead of JSON. Learn the full checklist ? BOM characters, trailing commas, empty responses ? and how to fix each one."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "??"
tags: ["javascript", "json", "frontend", "parsing", "json parse error", "unexpected character json"]
relatedTools: ["json-formatter"]
faqs:
  - q: "Why does my API return HTML when I expect JSON?"
    a: "Most commonly, the server encountered an error (500, 404, 401) and returned its default HTML error page instead of a JSON error response. Always check response.ok or response.status before calling response.json()."
  - q: "What is a BOM (Byte Order Mark) and how does it cause this error?"
    a: "A BOM (\uFEFF) is an invisible character some editors add to the beginning of UTF-8 files. JSON parsers don't expect this character and immediately throw 'unexpected character at line 1 column 1'. Check with charCodeAt(0) === 0xFEFF and strip it with replace(/^\uFEFF/, '')."
  - q: "Is a trailing comma valid in JSON?"
    a: 'No. Trailing commas are valid in JavaScript object literals but are explicitly forbidden in the JSON specification. Both {"a": 1,} and [1, 2,] cause parse errors.'
  - q: "How can I safely parse JSON without crashing my application?"
    a: "Always wrap JSON.parse in a try/catch and log the raw string before parsing. In fetch-based code, always check response.ok before calling response.json(). Consider a safeJsonParse utility that returns null on failure instead of throwing."
---

## The Exact Error

```
SyntaxError: JSON.parse: unexpected character at line 1 column 1 of the JSON data
```

Or in different environments:
```
SyntaxError: Unexpected token '<', "<!DOCTYPE ..." is not valid JSON
SyntaxError: Unexpected token 'u', "undefined" is not valid JSON
JSON Parse error: Unexpected identifier "undefined"
```

> Quick summary: The JSON parser hit something at position 1 that isn't the start of a valid JSON value. The most common cause is an API returning an HTML error page when your code expected JSON.

---

## Why This Error Happens

`JSON.parse()` expects its input to start with a valid JSON value. The very first character tells the parser what to expect: `{` for object, `[` for array, `"` for string, a digit for number.

When the parser sees anything else at position 1, it immediately throws. The character in the error message is the giveaway:

- `<` ? HTML response (`<!DOCTYPE html>`)
- `u` ? The string `undefined`
- `?` ? BOM character
- `,` or `}` ? Malformed JSON

**The most important thing to understand:** the response reached your code ? the network request succeeded. The problem is the content of the response, not the connection.

---

## Step-by-Step Diagnosis

### Step 1 ? Log the raw response before parsing

```javascript
const response = await fetch('/api/data');
const text = await response.text();
console.log('Status:', response.status);
console.log('Content-Type:', response.headers.get('content-type'));
console.log('First 200 chars:', text.slice(0, 200));
const data = JSON.parse(text);
```

### Step 2 ? Check the HTTP status code

```javascript
const response = await fetch('/api/data');
if (!response.ok) {
  throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
}
const data = await response.json();
```

A `404` or `500` response with an HTML error page is the #1 cause.

### Step 3 ? Check for BOM character

```javascript
const text = await response.text();
if (text.charCodeAt(0) === 0xFEFF) {
  console.warn('BOM detected at start of response');
}
```

---

## Solutions

### Solution 1 ? Always check response.ok before parsing

```javascript
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 100)}`);
  }
  return response.json();
}
```

### Solution 2 ? Strip BOM if present

```javascript
function parseJsonSafe(text) {
  const cleaned = text.replace(/^\uFEFF/, '');
  return JSON.parse(cleaned);
}
```

### Solution 3 ? Handle empty responses

```javascript
async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  if (!text || text.trim() === '') return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Parse failed. Raw response:', text.slice(0, 300));
    throw new Error(`Invalid JSON response from ${url}`);
  }
}
```

### Solution 4 ? Fix trailing commas in JSON files

```json
// INVALID:
{
  "name": "myapp",
  "version": "1.0",
}

// VALID:
{
  "name": "myapp",
  "version": "1.0"
}
```

---

## Quick Reference

| First character in error | What it means | Fix |
|---|---|---|
| `<` | HTML response returned | Check response.ok, handle non-200 status |
| `u` | String "undefined" returned | Check API logic |
| BOM (invisible) | BOM in file | Strip with `.replace(/^\uFEFF/, '')` |
| `,` | Trailing comma in JSON | Remove trailing comma |
| Empty string | Empty response | Guard with `if (!text)` |

---

## Prevent This Error in the Future

**1. Never call `response.json()` directly** ? always check `response.ok` first.

**2. Add a global fetch wrapper** that handles status checking and error logging in one place.

**3. Validate JSON files before committing** using a JSON linter or the ToolNinja JSON Formatter.

---

## Use ToolNinja to Debug Faster

Paste the raw API response into the JSON Formatter and it instantly highlights the exact line and character of any syntax error ? trailing commas, missing brackets, BOM characters all surface immediately.

?? **[JSON Formatter ? toolninja.io/tools/json-formatter](https://toolninja.io/tools/json-formatter)**
