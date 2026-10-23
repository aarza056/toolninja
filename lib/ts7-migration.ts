export interface MigrationFinding {
  option: string;
  value: string;
  message: string;
}

// tsconfig.json is JSONC (comments + trailing commas allowed) — strip both before JSON.parse,
// tracking string state so a "//" inside a string value (a URL, a glob) is never mistaken for a comment.
function stripJsonComments(text: string): string {
  let result = "";
  let inString = false;
  let inSingleLineComment = false;
  let inMultiLineComment = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inSingleLineComment) {
      if (c === "\n") {
        inSingleLineComment = false;
        result += c;
      }
      continue;
    }
    if (inMultiLineComment) {
      if (c === "*" && next === "/") {
        inMultiLineComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      result += c;
      if (escapeNext) escapeNext = false;
      else if (c === "\\") escapeNext = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      result += c;
      continue;
    }
    if (c === "/" && next === "/") {
      inSingleLineComment = true;
      i++;
      continue;
    }
    if (c === "/" && next === "*") {
      inMultiLineComment = true;
      i++;
      continue;
    }
    result += c;
  }

  return result.replace(/,(\s*[}\]])/g, "$1");
}

// Removed in TypeScript 7.0 (Project Corsa / the Go-based tsgo compiler) — these were merely
// deprecated with a warning under 5.x/6.0 and now fail the build outright.
const REMOVED_TARGETS = ["es3", "es5"];
const REMOVED_MODULES = ["amd", "umd", "systemjs", "none"];
const REMOVED_FLAG_OPTIONS = [
  "keyofStringsOnly",
  "importsNotUsedAsValues",
  "out",
  "prepend",
  "charset",
  "noStrictGenericChecks",
];

export function checkTs7Migration(tsconfigText: string): {
  findings: MigrationFinding[];
  parseError: string | null;
} {
  const trimmed = tsconfigText.trim();
  if (!trimmed) return { findings: [], parseError: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonComments(trimmed));
  } catch (e) {
    return {
      findings: [],
      parseError: e instanceof Error ? `Couldn't parse this as JSON: ${e.message}` : "Couldn't parse this as JSON.",
    };
  }

  const opts = (parsed as { compilerOptions?: Record<string, unknown> })?.compilerOptions ?? {};
  const findings: MigrationFinding[] = [];

  if (typeof opts.target === "string" && REMOVED_TARGETS.includes(opts.target.toLowerCase())) {
    findings.push({
      option: "target",
      value: opts.target,
      message: `"${opts.target}" is removed in TypeScript 7 — ES2015 is now the minimum target. Update to "ES2015" or a later target.`,
    });
  }

  if (typeof opts.module === "string" && REMOVED_MODULES.includes(opts.module.toLowerCase())) {
    findings.push({
      option: "module",
      value: opts.module,
      message: `"${opts.module}" is removed in TypeScript 7 — supported module values are ESNext, ES2022, NodeNext, and CommonJS.`,
    });
  }

  for (const key of REMOVED_FLAG_OPTIONS) {
    if (key in opts) {
      findings.push({
        option: key,
        value: String(opts[key]),
        message: `"${key}" is removed in TypeScript 7 and now causes a hard compile error rather than a warning.`,
      });
    }
  }

  return { findings, parseError: null };
}
