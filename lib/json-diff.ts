export type DiffType = "added" | "removed" | "changed";

export interface DiffEntry {
  path: string;
  type: DiffType;
  oldValue?: unknown;
  newValue?: unknown;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  return false;
}

export interface DiffOptions {
  ignoreArrayOrder?: boolean;
}

// Matches each element of `a` against an unused, deepEqual element of `b` regardless of position —
// multiset comparison, so [1,1,2] vs [1,2,2] correctly reports one 1 removed and one 2 added,
// not a confusing index-by-index "changed" at every position after the first reorder.
function diffArrayIgnoreOrder(a: unknown[], b: unknown[], path: string): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const bMatched = new Array(b.length).fill(false);
  const aUnmatched: { value: unknown; index: number }[] = [];

  for (let i = 0; i < a.length; i++) {
    let matched = false;
    for (let j = 0; j < b.length; j++) {
      if (!bMatched[j] && deepEqual(a[i], b[j])) {
        bMatched[j] = true;
        matched = true;
        break;
      }
    }
    if (!matched) aUnmatched.push({ value: a[i], index: i });
  }

  for (const { value, index } of aUnmatched) {
    entries.push({ path: `${path}[${index}]`, type: "removed", oldValue: value });
  }
  for (let j = 0; j < b.length; j++) {
    if (!bMatched[j]) entries.push({ path: `${path}[${j}]`, type: "added", newValue: b[j] });
  }
  return entries;
}

/** Structural, path-aware diff between two parsed JSON values. Keys are compared regardless of
 * order; arrays are compared index-by-index by default, or as an unordered multiset when
 * ignoreArrayOrder is set — so re-sorting an array isn't reported as every element changing. */
export function diffJson(a: unknown, b: unknown, path = "$", options: DiffOptions = {}): DiffEntry[] {
  const entries: DiffEntry[] = [];

  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort();
    for (const key of keys) {
      const childPath = `${path}.${key}`;
      const hasA = Object.prototype.hasOwnProperty.call(a, key);
      const hasB = Object.prototype.hasOwnProperty.call(b, key);
      if (!hasA) entries.push({ path: childPath, type: "added", newValue: b[key] });
      else if (!hasB) entries.push({ path: childPath, type: "removed", oldValue: a[key] });
      else entries.push(...diffJson(a[key], b[key], childPath, options));
    }
    return entries;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (options.ignoreArrayOrder) {
      return diffArrayIgnoreOrder(a, b, path);
    }
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      const childPath = `${path}[${i}]`;
      if (i >= a.length) entries.push({ path: childPath, type: "added", newValue: b[i] });
      else if (i >= b.length) entries.push({ path: childPath, type: "removed", oldValue: a[i] });
      else entries.push(...diffJson(a[i], b[i], childPath, options));
    }
    return entries;
  }

  if (!deepEqual(a, b)) {
    entries.push({ path, type: "changed", oldValue: a, newValue: b });
  }
  return entries;
}

export function formatValue(v: unknown): string {
  if (v === undefined) return "undefined";
  if (typeof v === "string") return JSON.stringify(v);
  return JSON.stringify(v);
}
