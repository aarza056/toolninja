---
title: "Invalid Regular Expression: Nothing to Repeat ? Regex Fix Guide"
description: "The 'nothing to repeat' regex error happens when a quantifier like *, +, or ? has nothing to apply to. Learn the exact triggers, how to escape metacharacters, and how to write valid regex."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "??"
tags: ["javascript", "regex", "regexp", "frontend", "regex error", "nothing to repeat", "invalid regex"]
relatedTools: ["regex-tester"]
faqs:
  - q: "What does 'nothing to repeat' mean in a regex error?"
    a: "Quantifiers like *, +, ?, and {n} modify the preceding element. If there is no preceding element ? because the quantifier is at the start of the pattern or after another quantifier ? the regex engine throws 'nothing to repeat'."
  - q: "How do I use * or + as a literal character in a regex?"
    a: "Escape them with a backslash: /\\*/ matches a literal asterisk, /\\+/ matches a literal plus sign. The metacharacters that must be escaped are: . * + ? ^ $ { } [ ] ( ) | \\."
  - q: "What is the difference between .* and .+ in regex?"
    a: ".* means zero or more of any character. .+ means one or more of any character. The dot is the preceding element that * or + applies to. Writing just * or + without a preceding element is invalid."
  - q: "Can I use regex special characters inside a character class []?"
    a: "Inside a character class, most metacharacters lose their special meaning. [.*+?] matches a literal dot, asterisk, plus, or question mark. However, ] - ^ \\ still have special meaning inside character classes."
---

## The Exact Error

```
SyntaxError: Invalid regular expression: /+test/: Nothing to repeat
```

Or:
```
SyntaxError: Invalid regular expression: /?pattern/: Nothing to repeat
SyntaxError: Invalid regular expression: /*/: Nothing to repeat
```

> Quick summary: A quantifier (`*`, `+`, `?`, `{n}`) was placed at the start of a pattern or after another quantifier. Quantifiers must follow a character, group, or character class ? they need something to apply to.

---

## Why This Error Happens

Quantifiers are operators that specify "how many" of the preceding element to match. When there's no preceding element ? at the start of the pattern, after `(`, or after `|` ? the regex engine throws.

Common triggers:

**1. Quantifier at start of pattern** ? `/+test/` or `/*pattern/`

**2. Literal intended** ? User wants to match a literal `+` but writes `/+/` instead of `/\+/`

**3. Double quantifier** ? `/a++/` ? a quantifier after another quantifier

**4. User input in dynamic regex** ? `new RegExp(userInput)` where user types `*word*`

---

## Step-by-Step Diagnosis

### Step 1 ? Find the position

```javascript
try {
  const regex = new RegExp(pattern);
} catch (e) {
  console.error('Regex error:', e.message);
  // "Invalid regular expression: /+test/: Nothing to repeat"
}
```

### Step 2 ? Check what's before the quantifier

```javascript
const pattern = '+test';
// + is at position 0 ? nothing before it!

const pattern2 = 'a++';
// second + has only the first + before it ? also a quantifier
```

### Step 3 ? Check for dynamic regex from user input

```javascript
const search = req.query.q;  // User types "*word*"
const regex = new RegExp(search);  // Throws!
```

---

## Solutions

### Solution 1 ? Escape the metacharacter

```javascript
const regex1 = /\*/;   // Matches literal *
const regex2 = /\+/;   // Matches literal +
const regex3 = /\?/;   // Matches literal ?
```

### Solution 2 ? Add the element before the quantifier

```javascript
// WRONG:
const bad = /+word/;

// RIGHT:
const good = /\w+word/;
const good2 = /.+word/;
const good3 = /[a-z]+/;
```

### Solution 3 ? Escape user input in dynamic regex

```javascript
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const regex = new RegExp(escapeRegex(userInput), 'gi');
```

### Solution 4 ? Use try-catch for dynamic regex

```javascript
function safeRegex(pattern, flags = '') {
  try {
    return new RegExp(pattern, flags);
  } catch (e) {
    console.error(`Invalid regex: "${pattern}"`, e.message);
    return null;
  }
}
```

---

## Quick Reference ? Metacharacter Escape Cheat Sheet

| Character | Meaning | Escaped literal |
|---|---|---|
| `.` | Any character | `\.` |
| `*` | Zero or more | `\*` |
| `+` | One or more | `\+` |
| `?` | Zero or one | `\?` |
| `^` | Start of string | `\^` |
| `$` | End of string | `\$` |
| `(` `)` | Group | `\(` `\)` |

---

## Prevent This Error in the Future

**1. Always escape user input** before using it in `new RegExp()`.

**2. Use regex literals (`/pattern/`) for static patterns** ? your editor flags invalid literals at development time.

**3. Test complex regex patterns in isolation** against valid, edge-case, and failing test strings.

---

## Use ToolNinja to Debug Faster

The Regex Tester shows the exact error position and highlights matching parts of input in real time. Fix the pattern and immediately see which test strings match.

?? **[Regex Tester ? toolninja.io/tools/regex-tester](https://toolninja.io/tools/regex-tester)**
