export interface GitignoreRule {
  raw: string;
  regex: RegExp;
  negate: boolean;
  dirOnly: boolean;
}

function escapeRegexChar(c: string): string {
  return /[.+^$()[\]{}|\\]/.test(c) ? "\\" + c : c;
}

/** Converts one gitignore glob body (no leading/trailing slash handling — that's done by the
 * caller) into an equivalent regex source string: * = any run of non-slash chars, ** = any
 * run including slashes, ? = one non-slash char, everything else is escaped and matched literally. */
function patternBodyToRegexSource(pattern: string): string {
  let i = 0;
  let out = "";
  while (i < pattern.length) {
    if (pattern[i] === "*" && pattern[i + 1] === "*") {
      if (pattern[i + 2] === "/") {
        out += "(?:[^/]+/)*";
        i += 3;
      } else {
        out += ".*";
        i += 2;
      }
    } else if (pattern[i] === "*") {
      out += "[^/]*";
      i++;
    } else if (pattern[i] === "?") {
      out += "[^/]";
      i++;
    } else {
      out += escapeRegexChar(pattern[i]);
      i++;
    }
  }
  return out;
}

/** Parses a .gitignore file's contents into an ordered list of rules. This covers the common,
 * documented gitignore syntax (*, **, ?, /-anchoring, trailing-/ for directories, ! negation)
 * but is not a byte-for-byte reimplementation of every edge case in git's own matcher. */
export function parseGitignoreRules(content: string): GitignoreRule[] {
  const rules: GitignoreRule[] = [];

  for (const rawLine of content.split("\n")) {
    let line = rawLine.replace(/\r$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;

    let negate = false;
    if (line.startsWith("!")) {
      negate = true;
      line = line.slice(1);
    } else if (line.startsWith("\\#") || line.startsWith("\\!")) {
      line = line.slice(1);
    }

    line = line.replace(/\s+$/, "");
    if (!line) continue;

    const dirOnly = line.endsWith("/");
    if (dirOnly) line = line.slice(0, -1);
    if (!line) continue;

    // Per git's documented rule: a "/" anywhere in the pattern (after removing a trailing
    // directory slash) anchors it to the .gitignore's own directory level; with no "/" at all,
    // it can match at any depth.
    const isAnchored = line.includes("/");
    const pat = line.startsWith("/") ? line.slice(1) : line;
    const bodySource = patternBodyToRegexSource(pat);

    const fullSource = isAnchored ? `^${bodySource}(/.*)?$` : `(^|.*/)${bodySource}(/.*)?$`;

    rules.push({ raw: rawLine, regex: new RegExp(fullSource), negate, dirOnly });
  }

  return rules;
}

export interface PathTestResult {
  ignored: boolean;
  matchedRule: string | null;
}

/** Tests a single path against a full .gitignore's rules. Rules are evaluated in order and
 * the last matching rule wins (git's actual precedence — a later rule, including a negation,
 * overrides an earlier one), matching real-world .gitignore behavior for the common case. */
export function testPathAgainstGitignore(path: string, gitignoreContent: string): PathTestResult {
  const rules = parseGitignoreRules(gitignoreContent);
  const cleanPath = path.trim().replace(/^\/+/, "").replace(/\/+$/, "");

  let ignored = false;
  let matchedRule: string | null = null;

  for (const rule of rules) {
    if (rule.regex.test(cleanPath)) {
      ignored = !rule.negate;
      matchedRule = rule.raw.trim();
    }
  }

  return { ignored, matchedRule };
}
