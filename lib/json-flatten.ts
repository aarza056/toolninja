export function flattenJson(obj: unknown, prefix = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (obj !== null && typeof obj === "object") {
    const entries: [string, unknown][] = Array.isArray(obj)
      ? obj.map((v, i) => [String(i), v] as [string, unknown])
      : Object.entries(obj as Record<string, unknown>);

    if (entries.length === 0) {
      result[prefix || "$"] = obj;
      return result;
    }

    for (const [k, v] of entries) {
      const newKey = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === "object" && Object.keys(v as object).length > 0) {
        Object.assign(result, flattenJson(v, newKey));
      } else {
        result[newKey] = v;
      }
    }
  } else {
    result[prefix || "$"] = obj;
  }

  return result;
}

/** Converts any object whose keys are exactly "0","1","2",... back into a real array. */
function arrayify(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(arrayify);

  const rec = value as Record<string, unknown>;
  const keys = Object.keys(rec);
  const isArrayLike = keys.length > 0 && keys.every((k, i) => k === String(i));

  if (isArrayLike) return keys.map((k) => arrayify(rec[k]));

  const result: Record<string, unknown> = {};
  for (const k of keys) result[k] = arrayify(rec[k]);
  return result;
}

export function unflattenJson(flat: Record<string, unknown>): unknown {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flat)) {
    if (key === "$") return value;
    const parts = key.split(".");
    let cur: Record<string, unknown> = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (cur[part] === undefined || typeof cur[part] !== "object" || cur[part] === null) {
        cur[part] = {};
      }
      cur = cur[part] as Record<string, unknown>;
    }
    cur[parts[parts.length - 1]] = value;
  }

  return arrayify(result);
}
