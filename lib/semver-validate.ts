import semver from "semver";

// Validating and sorting version lists for the SemVer Calculator: strict SemVer 2.0.0 (semver.org's
// own regex), what npm's node-semver accepts on top of that, why a version is invalid, and the
// nearest valid version.

/** The official SemVer 2.0.0 regular expression from semver.org */
export const SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export interface VersionCheck {
  input: string;
  /** Exactly SemVer 2.0.0 */
  strict: boolean;
  /** Accepted by npm (node-semver), which also allows a leading v or = */
  npm: boolean;
  /** The normalized version when npm accepts it */
  normalized: string | null;
  problem?: string;
  /** The closest valid version, for invalid input */
  suggestion?: string;
  parts?: { major: number; minor: number; patch: number; prerelease: string; build: string };
}

function whyInvalid(v: string): string {
  if (/^\s|\s$/.test(v)) return "Has spaces around it.";
  if (/^[vV]/.test(v)) return "Starts with “v”. Tags often do, but the version itself doesn't.";
  if (/^=/.test(v)) return "Starts with “=”.";
  const core = v.split(/[-+]/)[0];
  const nums = core.split(".");
  if (nums.length < 3) return `Has ${nums.length === 1 ? "one number" : "two numbers"}; SemVer needs three: MAJOR.MINOR.PATCH.`;
  if (nums.length > 3) return `Has ${nums.length} numbers; SemVer allows three (use a prerelease or build suffix for more).`;
  if (nums.some((n) => !/^\d+$/.test(n))) return "MAJOR, MINOR and PATCH must be numbers.";
  if (nums.some((n) => /^0\d/.test(n))) return "Numbers can't have leading zeros (01 should be 1).";
  const pre = /^[^-+]*-([^+]*)/.exec(v)?.[1];
  if (pre !== undefined) {
    if (!pre) return "Has a “-” with no prerelease after it.";
    const ids = pre.split(".");
    if (ids.some((i) => !i)) return "The prerelease has an empty part (two dots in a row, or a trailing dot).";
    if (ids.some((i) => /[^0-9A-Za-z-]/.test(i))) return "Prerelease parts may only use letters, digits and hyphens.";
    if (ids.some((i) => /^0\d+$/.test(i))) return "Numeric prerelease parts can't have leading zeros (rc.01 should be rc.1).";
  }
  const build = /\+(.*)$/.exec(v)?.[1];
  if (build !== undefined) {
    if (!build || build.split(".").some((i) => !i)) return "The build metadata after “+” has an empty part.";
    if (/[^0-9A-Za-z.-]/.test(build)) return "Build metadata may only use letters, digits, hyphens and dots.";
  }
  return "Doesn't match the SemVer 2.0.0 format.";
}

export function checkVersion(input: string): VersionCheck {
  const strict = SEMVER_REGEX.test(input);
  const normalized = semver.valid(input);
  const out: VersionCheck = { input, strict, npm: !!normalized, normalized };
  const parsed = normalized ? semver.parse(normalized) : null;
  if (parsed) out.parts = { major: parsed.major, minor: parsed.minor, patch: parsed.patch, prerelease: parsed.prerelease.join("."), build: parsed.build.join(".") };
  if (!strict) {
    out.problem = whyInvalid(input);
    const fixed = normalized ?? semver.coerce(input, { includePrerelease: true })?.version ?? null;
    if (fixed && fixed !== input) out.suggestion = fixed;
  }
  return out;
}

/** Splits a pasted list: one per line, or separated by commas or spaces */
export function splitVersions(text: string): string[] {
  return text
    .split(/[\n,;]+|\s+(?=\S)/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export interface SortedVersions {
  sorted: string[];
  invalid: string[];
  duplicates: number;
  latest: string | null;
  latestStable: string | null;
}

/** Valid versions in SemVer precedence order (prereleases before their release; build metadata ignored) */
export function sortVersions(list: string[], desc = false, dedupe = true): SortedVersions {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const v of list) {
    const n = semver.valid(v);
    if (n) valid.push(n);
    else invalid.push(v);
  }
  const unique = dedupe ? Array.from(new Set(valid)) : valid;
  const sorted = (desc ? semver.rsort : semver.sort)(unique.slice());
  const stable = sorted.filter((v) => !semver.prerelease(v));
  const pick = (arr: string[]) => (arr.length ? (desc ? arr[0] : arr[arr.length - 1]) : null);
  return { sorted, invalid, duplicates: valid.length - unique.length, latest: pick(sorted), latestStable: pick(stable) };
}
