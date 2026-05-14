---
title: "Regex for Developers: Practical Patterns You'll Actually Use"
description: "A practical regex guide covering anchors, quantifiers, groups, lookaheads, and 20+ real-world patterns for emails, URLs, dates, IDs, and more. Includes JavaScript, Python, and Go examples."
date: "2026-05-04"
author: "ToolNinja"
coverEmoji: "🔍"
tags: ["regex tester online", "regex tutorial", "regular expressions explained", "regex patterns cheat sheet", "test regex online", "regex flags javascript", "capture groups regex", "regex email validation", "regex url matching", "regex101 alternative", "regex for beginners", "javascript regex guide"]
relatedTools: ["regex-tester"]
faqs:
  - q: "What is the difference between .* and .+ in regex?"
    a: ".* matches zero or more of any character and can match an empty string. .+ matches one or more and requires at least one character."
  - q: "How do I match a literal dot in regex?"
    a: "Use \\. (backslash-dot). A bare . in regex matches any character. To match an actual period you must escape it."
  - q: "What does the g flag do in JavaScript regex?"
    a: "The g (global) flag makes the regex find all matches in the string, not just the first one."
  - q: "Why does my regex work in testing but fail in production?"
    a: "Common causes: missing escape on special characters, wrong flags, greedy vs lazy quantifiers, or anchoring issues. Always test with edge cases."
---

## Regex Fundamentals

Regular expressions are a mini-language for pattern matching. Mastering a handful of building blocks gets you 90% of the way there.

### Character Classes

| Pattern | Matches |
|---------|---------|
| `\d` | Any digit 0–9 |
| `\w` | Word character (letters, digits, underscore) |
| `\s` | Whitespace (space, tab, newline) |
| `\D` | Non-digit |
| `\W` | Non-word character |
| `\S` | Non-whitespace |
| `.` | Any character except newline |
| `[abc]` | a, b, or c |
| `[^abc]` | Anything except a, b, or c |
| `[a-z]` | Lowercase letter a through z |
| `[A-Z0-9]` | Uppercase or digit |

### Quantifiers

| Pattern | Meaning |
|---------|---------|
| `*` | 0 or more (greedy) |
| `+` | 1 or more (greedy) |
| `?` | 0 or 1 (optional) |
| `{n}` | Exactly n times |
| `{n,}` | n or more times |
| `{n,m}` | Between n and m times |
| `*?` | 0 or more (lazy) |
| `+?` | 1 or more (lazy) |

### Anchors

| Pattern | Matches |
|---------|---------|
| `^` | Start of string (or line with `m` flag) |
| `$` | End of string (or line with `m` flag) |
| `\b` | Word boundary |
| `\B` | Non-word boundary |

### Groups and Alternation

| Pattern | Meaning |
|---------|---------|
| `(abc)` | Capturing group |
| `(?:abc)` | Non-capturing group |
| `(?<name>...)` | Named capturing group |
| `a\|b` | a or b |

---

## Lookarounds

Lookarounds match a position without consuming characters — they're **zero-width assertions**.

```
(?=...)   Positive lookahead   — followed by
(?!...)   Negative lookahead   — not followed by
(?<=...)  Positive lookbehind  — preceded by
(?<!...)  Negative lookbehind  — not preceded by
```

**Example:** Match a number only if followed by "px":
```regex
\d+(?=px)
```
Matches `14` in `14px` but not in `14em`.

**Example:** Extract the value part of a CSS variable:
```regex
(?<=--[\w-]+:\s*)[\w#(),. ]+
```

---

## 20 Real-World Patterns

### Validation

**Email address** (pragmatic, not RFC 5321 complete):
```regex
^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$
```

**URL** (http/https):
```regex
^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$
```

**IPv4 address**:
```regex
^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$
```

**Hex color** (3 or 6 digit):
```regex
^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$
```

**UUID v4**:
```regex
^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$
```

**Semantic version** (semver):
```regex
^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$
```

### Dates and Times

**ISO 8601 date** (YYYY-MM-DD):
```regex
^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$
```

**US date** (MM/DD/YYYY):
```regex
^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$
```

**Time** (HH:MM or HH:MM:SS, 24-hour):
```regex
^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$
```

### Identifiers

**Slug** (URL-friendly):
```regex
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

**Twitter/X handle** (without @):
```regex
^[a-zA-Z0-9_]{1,15}$
```

**GitHub repo path**:
```regex
^[a-zA-Z0-9]([a-zA-Z0-9.\-_]*[a-zA-Z0-9])?\/[a-zA-Z0-9.\-_]+$
```

### File Paths

**File extension** (capture the extension):
```regex
\.([a-z0-9]+)$
```

**Windows path**:
```regex
^[A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$
```

**Unix path** (absolute):
```regex
^\/([a-zA-Z0-9._\-]+\/)*[a-zA-Z0-9._\-]*$
```

### Text Processing

**Trim leading/trailing whitespace** (replacement pattern):
```regex
^\s+|\s+$
```

**Collapse multiple spaces to one**:
```regex
\s{2,}
```

**Remove HTML tags**:
```regex
<[^>]*>
```

**Extract all URLs from text**:
```regex
https?:\/\/[^\s<>"']+
```

**Match repeated words** (e.g., "the the"):
```regex
\b(\w+)\s+\1\b
```

---

## Language-Specific Notes

### JavaScript

```javascript
// Two ways to create
const re1 = /^\d+$/;
const re2 = new RegExp("^\\d+$");

// Flags: g (global), i (case insensitive), m (multiline), s (dotAll)
const emails = text.match(/[\w.+\-]+@[\w\-.]+\.\w{2,}/gi);

// Named groups (ES2018+)
const { year, month, day } = "2025-11-22".match(
  /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
).groups;

// Replace with function
const result = str.replace(/(\w+)/g, (match, word) => word.toUpperCase());
```

### Python

```python
import re

# Match vs Search vs Findall
re.match(r"^\d+", text)        # Only at start
re.search(r"\d+", text)        # First occurrence anywhere
re.findall(r"\d+", text)       # All occurrences
re.finditer(r"\d+", text)      # Iterator of match objects

# Named groups
m = re.search(r"(?P<year>\d{4})-(?P<month>\d{2})", text)
print(m.group("year"))

# Compile for reuse
pattern = re.compile(r"\b[A-Z]{2,}\b")
```

### Go

```go
import "regexp"

re := regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
re.MatchString("2025-11-22")        // true

// Named groups
re2 := regexp.MustCompile(`(?P<year>\d{4})-(?P<month>\d{2})`)
match := re2.FindStringSubmatch(text)
names := re2.SubexpNames()
```

---

## Performance Tips

1. **Compile once, reuse** — don't compile inside loops
2. **Anchors reduce backtracking** — `^` and `$` prevent the engine from checking every position
3. **Be specific over `.`** — `[A-Za-z0-9]` backtracks less than `.*`
4. **Avoid catastrophic backtracking** — patterns like `(a+)+` on long strings can hang
5. **Non-capturing groups `(?:...)` are faster** than capturing groups when you don't need the match

---

## Try It: ToolNinja Regex Tester

Build and test patterns in real time with the **[ToolNinja Regex Tester](/tools/regex-tester)**. Highlights matches live, shows all capture groups, supports global/multiline/case-insensitive flags. No sign-up, runs in the browser.
