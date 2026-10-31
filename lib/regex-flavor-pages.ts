// Content for the /tools/regex-tester/<language> pages: what's specific to each regex flavor.
import type { FlavorId } from "@/lib/regex-flavors";

export interface FlavorPage {
  flavor: FlavorId;
  /** Name/syntax table rows: [what, how in this flavor] */
  syntax: [string, string][];
  notes: string[];
  faq: { q: string; a: string }[];
}

export const FLAVOR_PAGES: Record<FlavorId, FlavorPage> = {
  javascript: {
    flavor: "javascript",
    syntax: [
      ["Literal", "/pattern/flags or new RegExp(\"pattern\", \"flags\")"],
      ["Named group", "(?<name>…), back-reference \\k<name>"],
      ["Replacement", "$1, $<name>, $& (whole match)"],
      ["Flags", "g, i, m, s (dotAll), u / v (Unicode), y (sticky), d (indices)"],
      ["Find all", "\"text\".matchAll(/…/g)"],
    ],
    notes: [
      "Lookbehind (?<=…) works with any length since ES2018.",
      "There are no atomic groups, possessive quantifiers or inline (?i) flags — put flags after the closing slash.",
      "\\d and \\w are ASCII-only, even with the u flag; use \\p{Nd} or \\p{L} with u for Unicode.",
      "^ and $ match only at the very start and end unless you add the m flag — $ does not allow a trailing newline.",
    ],
    faq: [
      { q: "Why does my regex only find the first match?", a: "Without the g flag, match() and replace() stop after the first match. Add g, or use matchAll() with a g regex to loop over every match with its groups." },
      { q: "How do I build a JavaScript regex from a variable?", a: "Use new RegExp(text, flags), and escape special characters in the text first — newer engines have RegExp.escape(), otherwise text.replace(/[.*+?^${}()|[\\]\\\\]/g, \"\\\\$&\")." },
    ],
  },
  python: {
    flavor: "python",
    syntax: [
      ["Literal", "re.compile(r\"pattern\") — use a raw string so backslashes stay as written"],
      ["Named group", "(?P<name>…), back-reference (?P=name)"],
      ["Replacement", "\\1, \\g<1>, \\g<name>"],
      ["Flags", "re.IGNORECASE, re.MULTILINE, re.DOTALL, re.VERBOSE, re.ASCII — or (?i) at the very start"],
      ["Find all", "re.findall(), re.finditer()"],
    ],
    notes: [
      "re.match() only matches at the start of the string; re.search() looks anywhere and re.fullmatch() needs the whole string.",
      "Lookbehind must be fixed-width: no *, +, ? or {n,m} inside (?<=…).",
      "Atomic groups (?>…) and possessive quantifiers (*+, ++) arrived in Python 3.11.",
      "\\d and \\w match Unicode digits and letters by default; add re.ASCII to limit them to [0-9] and [A-Za-z0-9_].",
      "The re module has no \\p{…} Unicode properties; the third-party regex package adds them.",
      "Without re.MULTILINE, $ matches at the end and also just before a final newline; \\Z is the absolute end.",
    ],
    faq: [
      { q: "Why does re.match() return None when the text contains my pattern?", a: "re.match() is anchored at the start of the string. Use re.search() to find the pattern anywhere, or re.fullmatch() to require the whole string to match." },
      { q: "Why should I use r\"…\" strings for Python regexes?", a: "In a normal string, \\d or \\b are processed by Python first (\\b becomes a backspace character). A raw string passes the backslashes to the regex engine untouched." },
      { q: "Does this tester run Python's re module?", a: "Matches run in your browser's JavaScript engine. Python-only syntax with an exact equivalent — like (?P<name>…), (?P=name), (?i) and \\Z — is translated before testing, and anything that behaves differently in Python is flagged above the results." },
    ],
  },
  java: {
    flavor: "java",
    syntax: [
      ["Literal", "Pattern.compile(\"pattern\") — every backslash doubled in the string: \"\\\\d+\""],
      ["Named group", "(?<name>…), back-reference \\k<name>"],
      ["Replacement", "$1, ${name}"],
      ["Flags", "Pattern.CASE_INSENSITIVE, MULTILINE, DOTALL, COMMENTS, UNICODE_CHARACTER_CLASS — or inline (?i)"],
      ["Find all", "while (matcher.find()) { … }"],
    ],
    notes: [
      "matcher.matches() needs the whole string to match; matcher.find() looks for the pattern anywhere.",
      "Lookbehind needs a maximum length: {0,100} works, * and + don't.",
      "Possessive quantifiers (*+, ++) and atomic groups (?>…) are supported.",
      "\\w and \\d are ASCII unless you add Pattern.UNICODE_CHARACTER_CLASS; POSIX-style classes are written \\p{Alpha}, \\p{Digit}.",
    ],
    faq: [
      { q: "Why does matcher.matches() return false when the text contains my pattern?", a: "matches() succeeds only if the entire input matches. Use find() to search inside the text, or lookingAt() to match at the start." },
      { q: "How do I match a backslash in a Java regex?", a: "The regex needs \\\\ (an escaped backslash), and each of those needs escaping in a Java string, so you write \"\\\\\\\\\" — four backslashes in the source." },
    ],
  },
  dotnet: {
    flavor: "dotnet",
    syntax: [
      ["Literal", "new Regex(@\"pattern\") — a verbatim string, where \" is written \"\""],
      ["Named group", "(?<name>…) or (?'name'…), back-reference \\k<name>"],
      ["Replacement", "$1, ${name}, $0"],
      ["Flags", "RegexOptions.IgnoreCase, Multiline, Singleline (dot matches \\n), IgnorePatternWhitespace — or inline (?i)"],
      ["Find all", "foreach (Match m in regex.Matches(text))"],
    ],
    notes: [
      "\\d matches any Unicode digit (Arabic-Indic, Devanagari…), not just 0–9 — use [0-9] or RegexOptions.ECMAScript when that matters.",
      "Lookbehind can be any length, and balancing groups (?<open-close>…) can match nested brackets.",
      "There are no possessive quantifiers; use an atomic group (?>…) instead.",
      "Pass a match timeout (new Regex(pattern, options, TimeSpan.FromSeconds(1))) for patterns that run on user input, and prefer [GeneratedRegex] in .NET 7+.",
    ],
    faq: [
      { q: "Why does \\d match characters that aren't 0–9 in C#?", a: ".NET follows Unicode: \\d is any decimal digit, including other scripts. Use [0-9], or RegexOptions.ECMAScript to get ASCII-only behavior." },
      { q: "What does RegexOptions.Singleline do?", a: "It makes . match newline characters too (other languages call this dotAll or DOTALL). It doesn't change ^ and $ — that's RegexOptions.Multiline." },
    ],
  },
  go: {
    flavor: "go",
    syntax: [
      ["Literal", "regexp.MustCompile(`pattern`) — a raw string in backticks"],
      ["Named group", "(?P<name>…) or (?<name>…) (Go 1.22+)"],
      ["Replacement", "${1}, ${name} (write ${1}x, not $1x)"],
      ["Flags", "inline only: (?i), (?m), (?s), (?U)"],
      ["Find all", "re.FindAllString(text, -1)"],
    ],
    notes: [
      "Go uses RE2: matching time grows linearly with the input, so it can't be hit by catastrophic backtracking (ReDoS).",
      "That's why there's no lookahead, lookbehind or back-references — rewrite the pattern, or post-filter matches in Go code.",
      "\\A and \\z are supported; \\Z isn't. Without (?m), $ matches only at the very end.",
      "\\d and \\w are ASCII; use \\p{Nd} and \\p{L} for Unicode.",
    ],
    faq: [
      { q: "How do I write a lookahead in Go?", a: "You can't — RE2 doesn't support lookaround. Capture more and check the extra part in code, run a second regexp on the match, or use a backtracking package such as regexp2 if you accept its risks." },
      { q: "Why is my replacement $1suffix empty in Go?", a: "Go reads $1suffix as a group named \"1suffix\". Write ${1}suffix to end the group reference explicitly." },
    ],
  },
  pcre: {
    flavor: "pcre",
    syntax: [
      ["Literal", "'/pattern/flags' with delimiters — escape / inside, or use # or ~ as the delimiter"],
      ["Named group", "(?<name>…), (?P<name>…) or (?'name'…)"],
      ["Replacement", "$1, ${1}, \\1 in preg_replace"],
      ["Flags", "i, m, s, x, u (UTF-8), D (dollar end only)"],
      ["Find all", "preg_match_all('/…/', $text, $matches)"],
    ],
    notes: [
      "PCRE is also what nginx, Apache, grep -P and many tools use, so this page fits their patterns too.",
      "Add the u modifier for UTF-8 text, or multibyte characters are treated as separate bytes.",
      "Recursion (?R), conditionals, possessive quantifiers and atomic groups are all supported.",
      "Variable-length lookbehind needs PCRE2 10.43+ (PHP 8.4); older versions want fixed-length lookbehind.",
    ],
    faq: [
      { q: "Why do I get \"No ending delimiter '/' found\"?", a: "PHP regexes need delimiters: '/\\d+/' not '\\d+'. If the pattern contains /, escape it as \\/ or pick another delimiter like #…#." },
      { q: "Does nginx use the same regex syntax?", a: "Yes — nginx location and rewrite rules use PCRE, so named groups, lookarounds and the flags here behave the same. The case-insensitive form is written ~* in nginx." },
    ],
  },
};
