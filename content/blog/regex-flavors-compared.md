---
title: "Regex Flavors Compared: What Breaks When You Copy a Regex Between JavaScript, Python, Java, .NET, Go and PHP"
description: "The same regex can match, fail to compile or silently match something else depending on the language. Named groups, lookbehind, $ and newlines, \\d and Unicode, possessive quantifiers and replacement syntax — flavor by flavor, with the errors you'll see."
date: "2026-10-31"
author: "ToolNinja"
coverEmoji: "🧩"
tags: ["regex flavors", "javascript vs python regex", "python regex named group", "look-behind requires fixed-width pattern", "go regex lookahead", "invalid or unsupported perl syntax", "java regex tester", "c# regex", "pcre vs python", "regex works in regex101 but not in code", "regex trailing newline", "possessive quantifier"]
relatedTools: ["regex-tester"]
faqs:
  - q: "Why does my regex work on regex101 but not in my code?"
    a: "Usually one of two things: the site was set to a different flavor than your language (regex101 defaults to PCRE), or the backslashes got eaten when you put the pattern in a string. Pick your language's flavor when testing, and use a raw string (Python r\"…\", C# @\"…\", Go backticks) or double every backslash (Java)."
  - q: "Is Python's re module the same as PCRE?"
    a: "No. They share a lot of syntax, but Python needs fixed-width lookbehind, has no \\p{…} Unicode properties, no recursion and writes named groups as (?P<name>…). PHP, nginx and grep -P use PCRE."
  - q: "Why doesn't Go support lookahead or back-references?"
    a: "Go's regexp package uses RE2, which guarantees matching time that grows linearly with the input. Lookaround and back-references need backtracking, which can blow up exponentially on hostile input (ReDoS), so RE2 leaves them out on purpose."
  - q: "Which regex flavor is the most portable?"
    a: "Stick to character classes, quantifiers, groups, alternation, ^ and $ (with the multiline flag set the same way) and lookahead. Avoid lookbehind, named-group syntax, possessive quantifiers, \\p{…} and inline flags if a pattern has to run unchanged in several languages — or test it per language first."
---

## Same pattern, different engine

A regular expression isn't one language. JavaScript, Python, Java, .NET, Go and PHP each ship their own engine — a *flavor* — and they agree on the basics but disagree on just enough to bite you when you copy a pattern from a Stack Overflow answer, an API's docs or one service to another.

The failures come in three kinds. Some patterns **don't compile**: you get an error and at least you know. Some **compile but match something different**, which is worse. And some only break once they're **inside a string literal**, because the language ate a backslash before the regex engine ever saw it.

Here's the quick reference, then each difference with the error you'll actually see. You can check any pattern against all six flavors in the [Regex Tester](/tools/regex-tester), or open the tester for one language: [Python](/tools/regex-tester/python), [Java](/tools/regex-tester/java), [C# / .NET](/tools/regex-tester/csharp), [Go](/tools/regex-tester/go), [PHP](/tools/regex-tester/php), [JavaScript](/tools/regex-tester/javascript).

| | JavaScript | Python `re` | Java | .NET | Go | PHP (PCRE) |
|---|---|---|---|---|---|---|
| Named group | `(?<n>…)` | `(?P<n>…)` | `(?<n>…)` | `(?<n>…)`, `(?'n'…)` | `(?P<n>…)`, `(?<n>…)` | all three |
| Named back-reference | `\k<n>` | `(?P=n)` | `\k<n>` | `\k<n>` | — | `\k<n>`, `(?P=n)` |
| Lookahead | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Lookbehind | any length | fixed width | bounded length | any length | ✗ | fixed (bounded since PCRE2 10.43) |
| Back-references `\1` | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Atomic `(?>…)` / possessive `*+` | ✗ / ✗ | ✓ / ✓ (3.11+) | ✓ / ✓ | ✓ / ✗ | ✗ / ✗ | ✓ / ✓ |
| Inline flags `(?i)` | ✗ | at the start only | ✓ | ✓ | ✓ | ✓ |
| `\p{L}` Unicode properties | with `u` flag | ✗ | ✓ | ✓ (no `Script=`) | ✓ | ✓ |
| `\d` means | `[0-9]` | any Unicode digit | `[0-9]` | any Unicode digit | `[0-9]` | `[0-9]` |
| `$` also matches before a final `\n` | no | yes | yes | yes | no | yes |
| Replacement references | `$1`, `$<n>` | `\1`, `\g<n>` | `$1`, `${n}` | `$1`, `${n}` | `${1}`, `${n}` | `$1`, `${1}`, `\1` |

## 1. Named groups have three spellings

Python invented named groups and wrote them `(?P<name>…)`. Most other engines later standardized on `(?<name>…)`. Copy one into the other and it doesn't compile:

```text
JavaScript:  SyntaxError: Invalid regular expression: /(?P<year>\d{4})/: Invalid group
Python:      re.error: unknown extension ?<y at position 1
Java:        PatternSyntaxException: Unknown inline modifier near index 2
```

PHP's PCRE and Go (since 1.22) accept both forms, which is why a pattern can work in PHP and fail in Python. The same split applies to referring back to a named group: `\k<year>` everywhere except Python, which uses `(?P=year)`, and Go, which has no back-references at all.

## 2. Lookbehind: from "anything goes" to "not at all"

Lookbehind `(?<=…)` checks what comes *before* the current position. JavaScript and .NET allow any pattern inside it. The others restrict it:

```text
Python:  re.error: look-behind requires fixed-width pattern
Java:    PatternSyntaxException: Look-behind group does not have an obvious maximum length
PHP:     preg_match(): Compilation failed: lookbehind assertion is not fixed length
Go:      error parsing regexp: invalid or unsupported Perl syntax: `(?<`
```

`(?<=\$)\d+` (digits after a dollar sign) is fine everywhere but Go. `(?<=price:\s*)\d+` fails in Python and Java because `\s*` has no fixed length. In Java you can bound it — `\s{0,10}` works; in Python, match the prefix with a normal group and read the group you need instead. PHP 8.4 ships PCRE2 10.44, which allows bounded variable-length lookbehind; older PHP versions want each alternative to be a fixed length.

## 3. Go leaves out lookaround and back-references — on purpose

Go's `regexp` package is built on RE2, which promises that matching time grows linearly with the input. Lookahead, lookbehind and back-references need backtracking, and backtracking engines can be pushed into exponential time by crafted input — the classic ReDoS attack. So RE2 refuses them:

```text
error parsing regexp: invalid or unsupported Perl syntax: `(?=`
error parsing regexp: invalid escape sequence: `\1`
```

The fix is usually to restructure: capture more than you need and check the extra part in Go code, or run a second, simpler regexp on the match. If you truly need a backtracking engine, packages like `regexp2` exist, but you're opting back into the risk RE2 was designed to remove.

## 4. `$` and the trailing newline — a validation trap

Without the multiline flag, `$` means "end of string" in JavaScript and Go. In Python, Java, .NET and PCRE it means "end of string, **or just before a final newline**". That makes this check behave differently:

```python
import re
re.match(r"^[a-z]+$", "admin\n")   # matches in Python
```

```js
/^[a-z]+$/.test("admin\n")         // false in JavaScript
```

If the regex is validating a username, an ID or anything that ends up in a file name, header or log line, that newline gets through. Anchor with the absolute end instead: `\Z` in Python (which, unusually, is absolute there), `\z` in Java, .NET and PCRE — or use Python's `re.fullmatch()`, Java's `matcher.matches()`, which both require the whole string.

## 5. `\d` isn't always `[0-9]`

In Python 3 (with `str` patterns) and .NET, `\d` matches every Unicode decimal digit — Arabic-Indic `٣`, Devanagari `३`, full-width `３`. `\w` matches letters from every script too. JavaScript, Java, Go and PCRE match ASCII digits only unless you opt in.

That's often what you want for text, and rarely what you want for an order number or a port. In .NET, `int.Parse("٣")` then throws on a value your regex accepted. Write `[0-9]` when you mean ASCII digits, or switch the behavior off: `re.ASCII` in Python, `RegexOptions.ECMAScript` in .NET.

## 6. Possessive quantifiers and atomic groups

`a++` (possessive) and `(?>a+)` (atomic) tell a backtracking engine "once you've matched this, don't give any of it back". They're the standard defense against catastrophic backtracking in patterns like `(\w+\s?)+$`.

Java and PCRE support both; Python since 3.11; .NET has atomic groups but no possessive syntax; JavaScript and Go have neither. In JavaScript `a++` isn't silently ignored — it's a syntax error, `Nothing to repeat`. If the pattern must also run in JavaScript, keep the hot part simple instead: avoid nested quantifiers over overlapping character classes.

## 7. Flags: after the slash, in the call, or inline

JavaScript puts flags after the closing slash (`/abc/gi`) and has no global `(?i)`; the newest engines accept scoped modifiers like `(?i:abc)` (ES2025), but not a bare `(?i)` at the start. Everyone else accepts inline flags — Python since 3.11 only at the very start of the pattern (`global flags not at the start of the expression`).

The "dot matches newline" flag has the most confusing names: `s` in JavaScript, Go and PHP, `re.DOTALL` in Python, `Pattern.DOTALL` in Java — and `RegexOptions.Singleline` in .NET, which has nothing to do with `^` and `$` despite the name.

## 8. Getting the pattern into a string

Half of "it works in the tester but not in my code" is string escaping, not regex:

- **Python:** use a raw string, `r"\d+\.\d+"`. In a normal string, `"\b"` becomes a backspace character before `re` sees it.
- **Java:** no raw strings for regex — every backslash is doubled: `"\\d+\\.\\d+"`, and a literal backslash in the regex is `"\\\\"`.
- **C#:** a verbatim string `@"\d+\.\d+"` keeps backslashes; a double quote inside it is written `""`.
- **Go:** backtick raw strings, `` `\d+\.\d+` ``.
- **PHP:** the pattern needs delimiters, `'/\d+\.\d+/'`. Forget them and you get `No ending delimiter '/' found`.
- **JavaScript:** a literal `/\d+\.\d+/` keeps backslashes; `new RegExp("\\d+\\.\\d+")` needs them doubled.

## 9. Replacement strings differ too

Even when the match is identical, `replace` isn't. Group 1 is `$1` in JavaScript, Java, .NET and PHP, `\1` in Python (or `\g<1>`), and `${1}` in Go — where `$1x` is read as a group named `1x`, so write `${1}x`. Named groups: `$<name>` in JavaScript, `\g<name>` in Python, `${name}` in Java, .NET and Go.

## A checklist before you move a regex

- Named groups and named back-references use the target's spelling.
- No lookbehind with `*`, `+` or `?` inside if the target is Python or Java — and no lookaround at all for Go.
- `$` and `\Z` / `\z` anchor where you think they do; use full-match methods for validation.
- `\d` / `\w` mean ASCII or Unicode in the target, as you intend.
- Flags moved from `/…/flags` to the call or inline, and dotAll is spelled right.
- The pattern sits in a raw / verbatim string, or the backslashes are doubled.
- Replacement references use the target's syntax.

Paste the pattern into the [Regex Tester](/tools/regex-tester): the "Works in" row checks it against all six flavors at once and explains anything that will behave differently, and **Use in code** writes the snippet for your language with the escaping already done.
