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

/** Structural, path-aware diff between two parsed JSON values. Keys are compared
 * regardless of order; arrays are compared index-by-index. */
export function diffJson(a: unknown, b: unknown, path = "$"): DiffEntry[] {
  const entries: DiffEntry[] = [];

  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort();
    for (const key of keys) {
      const childPath = `${path}.${key}`;
      const hasA = Object.prototype.hasOwnProperty.call(a, key);
      const hasB = Object.prototype.hasOwnProperty.call(b, key);
      if (!hasA) entries.push({ path: childPath, type: "added", newValue: b[key] });
      else if (!hasB) entries.push({ path: childPath, type: "removed", oldValue: a[key] });
      else entries.push(...diffJson(a[key], b[key], childPath));
    }
    return entries;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      const childPath = `${path}[${i}]`;
      if (i >= a.length) entries.push({ path: childPath, type: "added", newValue: b[i] });
      else if (i >= b.length) entries.push({ path: childPath, type: "removed", oldValue: a[i] });
      else entries.push(...diffJson(a[i], b[i], childPath));
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
