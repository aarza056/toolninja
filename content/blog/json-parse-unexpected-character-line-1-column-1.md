---
title: "Unexpected Token in JSON: Every Cause and How to Fix It"
description: "SyntaxError: Unexpected token in JSON at position N is the most common JSON error in JavaScript. Here's every real-world cause — from HTML error pages to trailing commas to BOM characters — and the fix for each."
date: "2026-08-03"
author: "ToolNinja"
coverEmoji: "🧩"
tags: ["unexpected token json", "json.parse error", "syntaxerror unexpected token", "unexpected token in json at position", "json parse error fix", "unexpected token < in json", "json trailing comma error", "fix json syntax error", "javascript", "json", "errors"]
relatedTools: ["json-formatter"]
faqs:
  - q: "What does 'position N' actually mean in the error message?"
    a: "It's the character offset (not line number) in the string where JSON.parse gave up — counting every character from the very start of the string, including whitespace and newlines. For a large string this is hard to use directly; the fastest approach is usually to paste the string into a JSON formatter/validator, which converts that raw offset into a specific line and column."
  - q: "Why does the error say 'Unexpected token < in JSON at position 0'?"
    a: "Position 0 with a < character almost always means your code called JSON.parse() on an HTML document, not JSON — the < is the opening angle bracket of <!DOCTYPE html> or <html>. This happens when a fetch request expecting JSON actually receives an error page (404/500), a login redirect page, or a maintenance page from the server."
  - q: "Is a trailing comma really invalid in JSON if it works fine in JavaScript?"
    a: "Yes — this is one of the most common sources of confusion. A trailing comma after the last item in an array or object is valid, ignored syntax in JavaScript object/array literals, but JSON is a stricter subset with no such allowance. Copy-pasting a JavaScript object literal and expecting it to parse as JSON is a frequent cause of this exact error."
  - q: "What is a BOM character and why does it break JSON.parse?"
    a: "A Byte Order Mark (BOM) is an invisible sequence of bytes (EF BB BF in UTF-8) that some editors — notably Windows Notepad — prepend to a file when saving as 'UTF-8'. It's invisible in most text editors but is technically the first character of the file, and JSON.parse treats it as an unexpected character before the actual JSON content begins, typically failing at position 0."
---

## The Most Common JSON Error, by a Wide Margin

```
SyntaxError: Unexpected token < in JSON at position 0
SyntaxError: Unexpected token } in JSON at position 47
SyntaxError: Unexpected non-whitespace character after JSON at position 128
```

If you write JavaScript that talks to an API, you will see some variant of this error. It comes from `JSON.parse()` encountering a character it didn't expect at a specific position in the string — and while the message is precise about *where*, it says nothing about *why*. Here's every real-world cause, in the order you should actually check them.

---

## Cause 1: You Parsed HTML, Not JSON (the #1 cause of position 0)

```
SyntaxError: Unexpected token < in JSON at position 0
```

A `<` at position 0 is the single most common version of this error, and it's almost never actually a JSON formatting problem. It means your code called `JSON.parse()` on a string that starts with `<!DOCTYPE html>` or `<html>` — an actual HTML page, not JSON at all.

This happens when:

- The API returned a **404 or 500 error page** (many servers serve an HTML error page by default, even for API routes)
- You hit a **login redirect** — your session expired and the server sent back an HTML login page instead of the JSON you expected
- The API is temporarily down and a **load balancer or CDN's maintenance page** intercepted the request

**Fix:** don't call `.json()` or `JSON.parse()` blindly — check the response status first:

```js
const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();
```

---

## Cause 2: Trailing Commas

```json
{
  "name": "Jane",
  "age": 30,
}
```

That comma after `30` is invalid JSON — it throws `Unexpected token } in JSON`. This trips people up specifically because a trailing comma is **completely valid in a JavaScript object literal**. Copy a JS object out of your code and paste it somewhere expecting real JSON, and this is exactly what happens.

**Fix:** remove the trailing comma. If you're hand-editing JSON often, use an editor with JSON linting enabled — it'll flag this before you ever run the code.

---

## Cause 3: Single Quotes Instead of Double Quotes

```json
{ 'name': 'Jane' }
```

JSON requires **double quotes**, for both keys and string values, with no exceptions. Single quotes are valid JavaScript, not valid JSON.

**Fix:** double quotes only. If you're generating JSON via string concatenation, use `JSON.stringify()` instead of hand-building the string — it handles quoting correctly by construction.

---

## Cause 4: JavaScript-Only Values

```json
{ "id": undefined, "count": NaN, "callback": function() {} }
```

JSON supports exactly six types: string, number, boolean, `null`, object, array. `undefined`, `NaN`, `Infinity`, and functions are JavaScript concepts with no JSON representation.

**Fix:** if you're serializing a JS object with `JSON.stringify()`, note that it silently *drops* `undefined` values and functions rather than erroring — so this cause usually shows up when JSON was hand-written or came from a non-JS source that doesn't know these rules.

---

## Cause 5: Comments in the JSON

```json
{
  // this is the user's name
  "name": "Jane"
}
```

Unlike JavaScript, YAML, or JSONC (used by `tsconfig.json` and VS Code settings), **standard JSON has no comment syntax at all**. Any `//` or `/* */` immediately breaks parsing.

**Fix:** strip comments before parsing, or if you control the format, confirm whether you actually need JSONC (and a JSONC-aware parser) instead of strict JSON.

---

## Cause 6: A Byte Order Mark (BOM)

This is the sneaky one. A file saved with a UTF-8 BOM starts with an invisible three-byte sequence (`EF BB BF`) that most text editors don't display — but it's technically the first character of the file. `JSON.parse()` sees it as an unexpected, invisible character before your actual `{` even begins, and fails at position 0 with no visible cause in the file.

This is especially common with files created or re-saved in **Windows Notepad**, which defaults to adding a BOM when you choose "UTF-8" encoding.

**Fix:** strip a leading BOM before parsing:

```js
const clean = rawText.replace(/^﻿/, '');
const data = JSON.parse(clean);
```

---

## Quick Reference

| Symptom | Likely cause | Fix |
|---|---|---|
| `Unexpected token <` at position 0 | Server returned HTML, not JSON | Check `res.ok` / status before parsing |
| `Unexpected token }` near the end | Trailing comma | Remove the extra comma |
| Error right after a quoted string | Single quotes used | Use double quotes only |
| Error on `undefined`/`NaN`/function | Non-JSON JS value | Use `JSON.stringify()` to serialize correctly |
| Error right after `//` or `/*` | Comments in JSON | Strip comments, or use a JSONC parser if intentional |
| Error at position 0, file looks fine | UTF-8 BOM | Strip `﻿` from the start of the string |

---

## Find It Instantly

Manually counting to "position 47" in a minified API response is not a good use of anyone's time. **[ToolNinja's JSON Formatter →](/tools/json-formatter)** pastes-and-validates instantly, pointing to the exact line and character of the problem with a clear error message — paste the broken JSON in and see precisely where it breaks, formatted and readable, entirely in your browser.

---

Sources:
- [Unexpected Token in JSON: How to Fix This Error — JSONLint](https://jsonlint.com/unexpected-token-in-json)
- [Fix JSON SyntaxError: Every Cause Explained with Examples — JSONWebTools](https://jsonwebtools.com/json-syntax-error-guide)
