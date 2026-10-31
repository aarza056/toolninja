// Regex flavors: what changes when a pattern moves between JavaScript, Python, Java, .NET, Go and PHP
// (PCRE). The tester runs patterns with the browser's JavaScript engine, so for the other flavors this
// module (1) flags syntax that behaves differently or fails there, (2) rewrites the constructs that
// have an exact JavaScript equivalent so they can be tested, and (3) writes a code snippet in that
// language with its own string-literal rules.

export type FlavorId = "javascript" | "python" | "java" | "dotnet" | "go" | "pcre";

export interface Flavor {
  id: FlavorId;
  /** URL slug of the /tools/regex-tester/<slug> page */
  slug: string;
  name: string;
  engine: string;
}

export const FLAVORS: Flavor[] = [
  { id: "javascript", slug: "javascript", name: "JavaScript", engine: "ECMAScript RegExp" },
  { id: "python", slug: "python", name: "Python", engine: "re module" },
  { id: "java", slug: "java", name: "Java", engine: "java.util.regex" },
  { id: "dotnet", slug: "csharp", name: "C# / .NET", engine: "System.Text.RegularExpressions" },
  { id: "go", slug: "go", name: "Go", engine: "regexp (RE2)" },
  { id: "pcre", slug: "php", name: "PHP (PCRE)", engine: "PCRE2 (preg_*)" },
];

export type Level = "error" | "warning" | "info";
export interface Finding {
  level: Level;
  message: string;
}

// ─── scanning ────────────────────────────────────────────────────────────────

interface Group {
  /** The opening text, e.g. "(?<=" or "(?P<name>" (up to 24 chars) */
  head: string;
  /** Contents between the parentheses */
  body: string;
}

interface Scan {
  groups: Group[];
  /** Escapes as written: "\\d", "\\p{L}", "\\k<name>", "\\A", "\\1" … */
  escapes: string[];
  possessive: boolean;
  posixClass: boolean;
  endsWithDollar: boolean;
}

/** Index of the ")" closing the group that opens at `open`, skipping escapes and character classes */
function closeOf(p: string, open: number): number {
  let depth = 0;
  let inClass = false;
  for (let i = open; i < p.length; i++) {
    const ch = p[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (inClass) {
      if (ch === "]") inClass = false;
      continue;
    }
    if (ch === "[") inClass = true;
    else if (ch === "(") depth++;
    else if (ch === ")" && --depth === 0) return i;
  }
  return p.length;
}

export function scanPattern(p: string): Scan {
  const s: Scan = { groups: [], escapes: [], possessive: false, posixClass: false, endsWithDollar: false };
  let inClass = false;
  for (let i = 0; i < p.length; i++) {
    const ch = p[i];
    if (ch === "\\") {
      const next = p[i + 1] ?? "";
      let end = i + 2;
      if ((next === "p" || next === "P") && p[i + 2] === "{") end = p.indexOf("}", i) + 1 || p.length;
      else if (next === "k" && (p[i + 2] === "<" || p[i + 2] === "{" || p[i + 2] === "'")) end = p.slice(i).search(/[>}']/) + i + 1 || p.length;
      else if (/[1-9]/.test(next)) end = i + 1 + (/^\d+/.exec(p.slice(i + 1))?.[0].length ?? 1);
      s.escapes.push(p.slice(i, end));
      if (next === "Q") {
        const e = p.indexOf("\\E", i + 2);
        i = e < 0 ? p.length : e + 1;
        continue;
      }
      i = end - 1;
      continue;
    }
    if (inClass) {
      if (ch === "[" && p[i + 1] === ":" && /^\[:[a-z]+:\]/.test(p.slice(i))) s.posixClass = true;
      if (ch === "]") inClass = false;
      continue;
    }
    if (ch === "[") {
      inClass = true;
      if (p[i + 1] === "^") i++;
      if (p[i + 1] === "]") i++; // a leading ] is a literal
      continue;
    }
    if (ch === "(") {
      const close = closeOf(p, i);
      s.groups.push({ head: p.slice(i, i + 24), body: p.slice(i + 1, close) });
      continue;
    }
    if (p[i + 1] === "+" && (ch === "*" || ch === "+" || ch === "?" || (ch === "}" && /\{\d+(,\d*)?$/.test(p.slice(0, i))))) {
      // `?` right after "(" was part of a group head, handled above; here it's a quantifier
      if (!(ch === "?" && p[i - 1] === "(")) s.possessive = true;
    }
    if (ch === "$" && i === p.length - 1) s.endsWithDollar = true;
  }
  return s;
}

const has = (scan: Scan, re: RegExp) => scan.groups.some((g) => re.test(g.head));
const esc = (scan: Scan, re: RegExp) => scan.escapes.some((e) => re.test(e));

function lookbehinds(scan: Scan) {
  return scan.groups.filter((g) => /^\(\?<[=!]/.test(g.head)).map((g) => g.body.slice(3));
}
const unbounded = (body: string) => /(^|[^\\])[*+]/.test(body) || /\{\d+,\}/.test(body);
const variable = (body: string) => unbounded(body) || /(^|[^\\(])\?/.test(body) || /\{(\d+),(\d+)\}/.test(body) || /(^|[^\\])\|/.test(body);

// ─── checking ────────────────────────────────────────────────────────────────

/** Syntax in `pattern` that fails or behaves differently in `flavor`, most serious first */
export function checkFlavor(pattern: string, flavor: FlavorId, flags = ""): Finding[] {
  if (!pattern) return [];
  const s = scanPattern(pattern);
  const out: Finding[] = [];
  const add = (level: Level, message: string) => out.push({ level, message });
  const is = (...ids: FlavorId[]) => ids.includes(flavor);

  // Named groups
  if (has(s, /^\(\?<[A-Za-z_]/) && is("python")) add("error", "Python's re needs (?P<name>…) for named groups, not (?<name>…).");
  if (has(s, /^\(\?P<\w/) && is("javascript", "java", "dotnet")) add("error", `${flavorName(flavor)} doesn't support (?P<name>…); write (?<name>…).`);
  if (has(s, /^\(\?P=\w/) && !is("python", "pcre")) add("error", `(?P=name) back-references are Python/PCRE syntax; ${flavorName(flavor)} uses ${flavor === "go" ? "no back-references at all" : "\\k<name>"}.`);
  if (esc(s, /^\\k[<{']/) && is("python")) add("error", "Python refers back to a named group with (?P=name), not \\k<name>.");
  if (has(s, /^\(\?'\w/) && !is("dotnet", "pcre")) add("error", `(?'name'…) named groups only work in .NET and PCRE.`);

  // Lookaround
  if (has(s, /^\(\?<?[=!]/) && is("go")) add("error", "Go's RE2 engine has no lookahead or lookbehind — it guarantees linear-time matching instead.");
  const lbs = lookbehinds(s);
  if (lbs.length && !is("go")) {
    if (is("python") && lbs.some(variable)) add("error", "Python's re only allows fixed-width lookbehind: no *, +, ?, {n,m} or alternatives of different lengths inside (?<=…).");
    else if (is("java") && lbs.some(unbounded)) add("error", "Java lookbehind must have a maximum length: * and + aren't allowed inside it (use {0,100} instead).");
    else if (is("pcre") && lbs.some(variable)) add("warning", "Variable-length lookbehind needs PCRE2 10.43+ (PHP 8.4); older PHP versions only accept fixed-length lookbehind.");
  }

  // Back-references
  if ((esc(s, /^\\[1-9]/) || esc(s, /^\\k/)) && is("go")) add("error", "Go's RE2 engine doesn't support back-references (\\1, \\k<name>).");

  // Atomic groups and possessive quantifiers
  if (has(s, /^\(\?>/)) {
    if (is("javascript", "go")) add("error", `${flavorName(flavor)} has no atomic groups (?>…).`);
    else if (is("python")) add("info", "Atomic groups (?>…) need Python 3.11 or newer.");
  }
  if (s.possessive) {
    if (is("javascript", "dotnet", "go")) add("error", `${flavorName(flavor)} has no possessive quantifiers (*+, ++, ?+)${flavor === "dotnet" ? " — use an atomic group (?>…) instead" : ""}.`);
    else if (is("python")) add("info", "Possessive quantifiers need Python 3.11 or newer.");
  }

  // Conditionals, recursion, balancing groups, comments
  if (has(s, /^\(\?\(/) && is("javascript", "java", "go")) add("error", `${flavorName(flavor)} has no conditional groups (?(1)yes|no).`);
  if (has(s, /^\(\?(R|\d+|&\w+|P>\w+)\)/) && !is("pcre")) add("error", "Recursion such as (?R) or (?1) is PCRE-only.");
  if (has(s, /^\(\?<\w*-\w+>/) && !is("dotnet")) add("error", "Balancing groups (?<open-close>…) are .NET-only.");
  if (has(s, /^\(\?#/) && is("javascript", "java", "go")) add("error", `${flavorName(flavor)} doesn't support (?#comment) groups.`);

  // Inline flags
  if (has(s, /^\(\?[a-zA-Z]+\)/)) {
    if (is("javascript")) add("error", "JavaScript has no inline flags like (?i) — set flags after the closing slash instead (/…/i).");
    else if (is("python") && !/^\(\?[a-zA-Z]+\)/.test(pattern)) add("error", "Python requires global inline flags like (?i) at the very start of the pattern.");
  }

  // Escapes
  if (esc(s, /^\\[AZz]$/)) {
    if (is("javascript")) add("error", "JavaScript doesn't know \\A, \\Z or \\z — use ^ and $ without the m flag.");
    else if (is("go") && esc(s, /^\\Z$/)) add("error", "Go has \\A and \\z but no \\Z.");
    else if (is("python") && esc(s, /^\\z$/)) add("warning", "\\z only exists in Python 3.14+; Python's \\Z already means the absolute end of the string.");
    else if (is("java", "dotnet", "pcre") && esc(s, /^\\Z$/)) add("info", `In ${flavorName(flavor)}, \\Z also matches before a final newline; \\z is the absolute end.`);
  }
  if (esc(s, /^\\[pP]/)) {
    if (is("python")) add("error", "Python's re doesn't support \\p{…} Unicode properties — use the third-party regex module.");
    else if (is("javascript") && !/[uv]/.test(flags)) add("warning", "\\p{…} only works with the u or v flag in JavaScript; without it, \\p matches the letter p.");
    else if (is("dotnet") && esc(s, /^\\[pP]\{(Script|sc|Script_Extensions|scx)=/i)) add("error", ".NET doesn't support \\p{Script=…}; use a block such as \\p{IsGreek}.");
  }
  if (esc(s, /^\\h$/) && !is("java", "pcre")) add("error", `\\h (horizontal whitespace) is Java/PCRE syntax; in ${flavorName(flavor)} use [ \\t].`);
  if (esc(s, /^\\Q$/) && is("javascript", "python", "dotnet")) add("error", `${flavorName(flavor)} doesn't support \\Q…\\E quoting; escape the characters instead.`);
  if (esc(s, /^\\G$/) && is("javascript", "python", "go")) add("error", `${flavorName(flavor)} doesn't support \\G.`);
  if (s.posixClass && !is("pcre", "go")) add("error", `POSIX classes like [[:alpha:]] are matched literally in ${flavorName(flavor)}${flavor === "java" ? "; use \\p{Alpha}" : ""}.`);

  // Different meaning, same syntax
  if (esc(s, /^\\[dDwW]$/) && is("python", "dotnet")) add("info", `In ${flavorName(flavor)}, \\d and \\w match Unicode digits and letters too (e.g. Arabic-Indic digits), not just ASCII.`);
  if (s.endsWithDollar && !/m/.test(flags) && is("python", "java", "dotnet", "pcre")) add("info", `In ${flavorName(flavor)}, a final $ also matches just before a trailing newline.`);

  const rank: Record<Level, number> = { error: 0, warning: 1, info: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}

const flavorName = (id: FlavorId) => FLAVORS.find((f) => f.id === id)!.name.replace(" (PCRE)", "").replace("C# / ", "");

// ─── translating for the browser ─────────────────────────────────────────────

/**
 * Rewrites constructs that have an exact JavaScript equivalent so a pattern written for another
 * flavor can be tested in the browser. Anything without an equivalent is left (and flagged above).
 */
export function toJavaScript(pattern: string, flavor: FlavorId, flags: string): { pattern: string; flags: string; changed: boolean } {
  if (flavor === "javascript") return { pattern, flags, changed: false };
  let p = pattern;
  let f = flags;
  // Leading inline flags: (?i), (?ims) …
  const lead = /^\(\?([a-zA-Z]+)\)/.exec(p);
  if (lead && /^[ims]+$/.test(lead[1])) {
    p = p.slice(lead[0].length);
    for (const c of lead[1]) if (!f.includes(c)) f += c;
  }
  p = p
    .replace(/\(\?P<(\w+)>/g, "(?<$1>")
    .replace(/\(\?P=(\w+)\)/g, "\\k<$1>")
    .replace(/\(\?'(\w+)'/g, "(?<$1>")
    .replace(/(^|[^\\])((?:\\\\)*)\\A/g, "$1$2(?<![\\s\\S])")
    .replace(/(^|[^\\])((?:\\\\)*)\\z/g, "$1$2(?![\\s\\S])")
    // Python's \Z is the absolute end; elsewhere it allows one trailing newline
    .replace(/(^|[^\\])((?:\\\\)*)\\Z/g, flavor === "python" ? "$1$2(?![\\s\\S])" : "$1$2(?=\\n?(?![\\s\\S]))");
  // A final $ (without m) also matches before a trailing newline outside JavaScript and Go
  if (!/m/.test(f) && flavor !== "go" && /(^|[^\\])(\\\\)*\$$/.test(p)) p = `${p.slice(0, -1)}(?=\\n?(?![\\s\\S]))`;
  return { pattern: p, flags: f, changed: p !== pattern || f !== flags };
}

// ─── code snippets ───────────────────────────────────────────────────────────

const has_ = (flags: string, c: string) => flags.includes(c);

/** A ready-to-paste snippet for `flavor`, with the pattern in that language's string syntax */
export function regexSnippet(pattern: string, flags: string, flavor: FlavorId): string {
  const i = has_(flags, "i");
  const m = has_(flags, "m");
  const s = has_(flags, "s");
  switch (flavor) {
    case "javascript": {
      const f = flags.includes("g") ? flags : `${flags}g`;
      return `const regex = /${pattern.replace(/(^|[^\\])\//g, "$1\\/")}/${f};\nconst matches = [..."your string".matchAll(regex)];`;
    }
    case "python": {
      const opts = [i && "re.IGNORECASE", m && "re.MULTILINE", s && "re.DOTALL"].filter(Boolean);
      // A raw string keeps backslashes as written; it can't end in an odd backslash or contain its quote
      const endsOdd = /(^|[^\\])(\\\\)*\\$/.test(pattern);
      const lit = !endsOdd && !pattern.includes("'") ? `r'${pattern}'` : !endsOdd && !pattern.includes('"') ? `r"${pattern}"` : JSON.stringify(pattern);
      return `import re\n\npattern = re.compile(${lit}${opts.length ? `, ${opts.join(" | ")}` : ""})\nmatches = pattern.findall("your string")`;
    }
    case "java": {
      const opts = [i && "Pattern.CASE_INSENSITIVE", m && "Pattern.MULTILINE", s && "Pattern.DOTALL"].filter(Boolean);
      return `import java.util.regex.*;\n\nPattern pattern = Pattern.compile(${JSON.stringify(pattern)}${opts.length ? `, ${opts.join(" | ")}` : ""});\nMatcher matcher = pattern.matcher("your string");\nwhile (matcher.find()) {\n    System.out.println(matcher.group());\n}`;
    }
    case "dotnet": {
      const opts = [i && "RegexOptions.IgnoreCase", m && "RegexOptions.Multiline", s && "RegexOptions.Singleline"].filter(Boolean);
      return `using System.Text.RegularExpressions;\n\nvar regex = new Regex(@"${pattern.replace(/"/g, '""')}"${opts.length ? `, ${opts.join(" | ")}` : ""});\nforeach (Match match in regex.Matches("your string"))\n    Console.WriteLine(match.Value);`;
    }
    case "go": {
      const inline = [i && "i", m && "m", s && "s"].filter(Boolean).join("");
      const full = (inline ? `(?${inline})` : "") + pattern;
      const lit = full.includes("`") ? JSON.stringify(full) : `\`${full}\``;
      return `import "regexp"\n\nre := regexp.MustCompile(${lit})\nmatches := re.FindAllString("your string", -1)`;
    }
    case "pcre": {
      const body = pattern.replace(/(^|[^\\])\//g, "$1\\/");
      const lit = `'/${body}/${[i && "i", m && "m", s && "s"].filter(Boolean).join("")}u'`.replace(/^'(.*)'$/, (_, x: string) => `'${x.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`);
      return `<?php\n\npreg_match_all(${lit}, 'your string', $matches);\nprint_r($matches[0]);`;
    }
  }
}
