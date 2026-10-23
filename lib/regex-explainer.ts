export interface ExplainToken {
  token: string;
  explanation: string;
  depth: number;
}

const ESCAPE_MEANINGS: Record<string, string> = {
  d: "any digit (0-9)",
  D: "any character that is NOT a digit",
  w: "any word character (letter, digit, or underscore)",
  W: "any character that is NOT a word character",
  s: "any whitespace character (space, tab, newline)",
  S: "any character that is NOT whitespace",
  b: "a word boundary (position between a word character and a non-word character)",
  B: "a position that is NOT a word boundary",
  n: "a newline character",
  t: "a tab character",
  r: "a carriage return character",
  "0": "a NUL character",
};

function describeQuantifier(q: string): string {
  const lazy = q.endsWith("?") && q !== "?";
  const base = lazy ? q.slice(0, -1) : q;
  let desc: string;
  if (base === "*") desc = "0 or more times";
  else if (base === "+") desc = "1 or more times";
  else if (base === "?") desc = "0 or 1 time (optional)";
  else {
    const m = base.match(/^\{(\d+)(,)?(\d+)?\}$/);
    if (m) {
      const [, min, comma, max] = m;
      if (!comma) desc = `exactly ${min} time${min === "1" ? "" : "s"}`;
      else if (!max) desc = `${min} or more times`;
      else desc = `between ${min} and ${max} times`;
    } else {
      desc = base;
    }
  }
  return lazy ? `${desc}, as few times as possible (lazy)` : `${desc}${base === "*" || base === "+" ? ", as many as possible (greedy)" : ""}`;
}

/** Walks a regex pattern left-to-right and produces a plain-English breakdown,
 * grouped by nesting depth for groups. Not a full regex parser — covers the
 * constructs developers actually use day-to-day. */
export function explainRegex(pattern: string): ExplainToken[] {
  const tokens: ExplainToken[] = [];
  let i = 0;
  let depth = 0;
  let literalBuf = "";

  const flushLiteral = () => {
    if (literalBuf) {
      tokens.push({
        token: literalBuf,
        explanation: `literal text "${literalBuf}"`,
        depth,
      });
      literalBuf = "";
    }
  };

  while (i < pattern.length) {
    const ch = pattern[i];

    // Anchors
    if (ch === "^") {
      flushLiteral();
      tokens.push({ token: "^", explanation: "start of the string (or line, with the m flag)", depth });
      i++;
      continue;
    }
    if (ch === "$") {
      flushLiteral();
      tokens.push({ token: "$", explanation: "end of the string (or line, with the m flag)", depth });
      i++;
      continue;
    }

    // Any character
    if (ch === ".") {
      flushLiteral();
      tokens.push({ token: ".", explanation: "any character except a newline (unless the s flag is set)", depth });
      i++;
      continue;
    }

    // Alternation
    if (ch === "|") {
      flushLiteral();
      tokens.push({ token: "|", explanation: "OR — matches whatever is on either side", depth });
      i++;
      continue;
    }

    // Escape sequences
    if (ch === "\\" && i + 1 < pattern.length) {
      flushLiteral();
      const next = pattern[i + 1];
      if (/[1-9]/.test(next)) {
        let j = i + 1;
        while (j < pattern.length && /[0-9]/.test(pattern[j])) j++;
        const num = pattern.slice(i + 1, j);
        tokens.push({ token: `\\${num}`, explanation: `backreference to capture group ${num}`, depth });
        i = j;
        continue;
      }
      if (ESCAPE_MEANINGS[next]) {
        tokens.push({ token: `\\${next}`, explanation: ESCAPE_MEANINGS[next], depth });
      } else {
        tokens.push({ token: `\\${next}`, explanation: `a literal "${next}" character (escaped)`, depth });
      }
      i += 2;
      continue;
    }

    // Character class [...]
    if (ch === "[") {
      flushLiteral();
      let j = i + 1;
      if (pattern[j] === "^") j++;
      if (pattern[j] === "]") j++; // a ] right after [ or [^ is a literal
      while (j < pattern.length && pattern[j] !== "]") {
        if (pattern[j] === "\\") j++;
        j++;
      }
      const full = pattern.slice(i, j + 1);
      const negated = full.startsWith("[^");
      const inner = full.slice(negated ? 2 : 1, -1);
      tokens.push({
        token: full,
        explanation: `${negated ? "any character NOT in" : "any one character in"} the set: ${inner || "(empty)"}`,
        depth,
      });
      i = j + 1;
      continue;
    }

    // Groups
    if (ch === "(") {
      flushLiteral();
      if (pattern.startsWith("(?:", i)) {
        tokens.push({ token: "(?:", explanation: "start of a non-capturing group", depth });
        i += 3;
      } else if (pattern.startsWith("(?=", i)) {
        tokens.push({ token: "(?=", explanation: "start of a positive lookahead (must be followed by this, but it's not part of the match)", depth });
        i += 3;
      } else if (pattern.startsWith("(?!", i)) {
        tokens.push({ token: "(?!", explanation: "start of a negative lookahead (must NOT be followed by this)", depth });
        i += 3;
      } else if (pattern.startsWith("(?<=", i)) {
        tokens.push({ token: "(?<=", explanation: "start of a positive lookbehind (must be preceded by this, but it's not part of the match)", depth });
        i += 4;
      } else if (pattern.startsWith("(?<!", i)) {
        tokens.push({ token: "(?<!", explanation: "start of a negative lookbehind (must NOT be preceded by this)", depth });
        i += 4;
      } else if (pattern.startsWith("(?<", i)) {
        const end = pattern.indexOf(">", i);
        const name = pattern.slice(i + 3, end);
        tokens.push({ token: `(?<${name}>`, explanation: `start of a capturing group named "${name}"`, depth });
        i = end + 1;
      } else {
        tokens.push({ token: "(", explanation: "start of a capturing group", depth });
        i++;
      }
      depth++;
      continue;
    }
    if (ch === ")") {
      flushLiteral();
      depth = Math.max(0, depth - 1);
      tokens.push({ token: ")", explanation: "end of the group", depth });
      i++;
      continue;
    }

    // Quantifiers
    if (ch === "*" || ch === "+" || ch === "?") {
      flushLiteral();
      let q = ch;
      i++;
      if (pattern[i] === "?") {
        q += "?";
        i++;
      }
      tokens.push({ token: q, explanation: describeQuantifier(q), depth });
      continue;
    }
    if (ch === "{") {
      const end = pattern.indexOf("}", i);
      if (end !== -1 && /^\{\d+(,\d*)?\}$/.test(pattern.slice(i, end + 1))) {
        flushLiteral();
        let q = pattern.slice(i, end + 1);
        let j = end + 1;
        if (pattern[j] === "?") {
          q += "?";
          j++;
        }
        tokens.push({ token: q, explanation: describeQuantifier(q), depth });
        i = j;
        continue;
      }
    }

    // Plain literal character
    literalBuf += ch;
    i++;
  }

  flushLiteral();
  return tokens;
}
