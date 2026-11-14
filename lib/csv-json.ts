export function parseCsv(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }
    // A quote opens a quoted field only at the start of a field (RFC 4180). Mid-field it's a
    // literal character — e.g. inch marks in `5" screen` — instead of swallowing the rest of the row.
    if (char === '"' && field.length === 0) {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === delimiter) {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (char === "\r") {
      i++;
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += char;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

export function csvToJson(text: string, delimiter = ","): Record<string, string>[] {
  const rows = parseCsv(text, delimiter);
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] ?? "";
    });
    return obj;
  });
}

function csvEscape(value: string, delimiter: string): string {
  if (value.includes(delimiter) || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export function jsonToCsv(data: unknown[], delimiter = ","): string {
  if (data.length === 0) return "";

  const headers: string[] = [];
  const seen = new Set<string>();
  data.forEach((row) => {
    if (row && typeof row === "object" && !Array.isArray(row)) {
      Object.keys(row as object).forEach((k) => {
        if (!seen.has(k)) {
          seen.add(k);
          headers.push(k);
        }
      });
    }
  });

  const lines = [headers.map((h) => csvEscape(h, delimiter)).join(delimiter)];
  data.forEach((row) => {
    const obj = row && typeof row === "object" && !Array.isArray(row) ? (row as Record<string, unknown>) : {};
    const line = headers
      .map((h) => {
        const v = obj[h];
        if (v === undefined || v === null) return "";
        if (typeof v === "object") return csvEscape(JSON.stringify(v), delimiter);
        return csvEscape(String(v), delimiter);
      })
      .join(delimiter);
    lines.push(line);
  });
  return lines.join("\n");
}

// ── Typed, nested conversion and delimiter detection ──────────────────────────────

const CANDIDATES = [",", ";", "\t", "|"];

/** The delimiter that splits the first lines into the most consistent number of columns */
export function detectDelimiter(text: string): string {
  const sample = text.replace(/^\uFEFF/, "").slice(0, 20000);
  let best = ",";
  let bestScore = 0;
  for (const d of CANDIDATES) {
    const rows = parseCsv(sample, d).slice(0, 20);
    if (rows.length === 0) continue;
    // A truncated last row in the sample shouldn't count against a delimiter
    const counted = rows.length > 2 ? rows.slice(0, -1) : rows;
    const widths = counted.map((r) => r.length);
    const first = widths[0];
    if (first < 2) continue;
    const consistent = widths.filter((w) => w === first).length / widths.length;
    const score = consistent * 100 + Math.min(first, 50);
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

const NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/;

/** A CSV cell as the JSON value it most likely is. Leading zeros and huge integers stay strings (zip codes, IDs) */
export function inferValue(s: string): unknown {
  const t = s.trim();
  if (t === "") return null;
  if (t === "true" || t === "TRUE" || t === "True") return true;
  if (t === "false" || t === "FALSE" || t === "False") return false;
  if (t === "null" || t === "NULL") return null;
  if (NUMBER.test(t)) {
    const n = Number(t);
    if (!Number.isFinite(n)) return s;
    if (!/[.eE]/.test(t) && !Number.isSafeInteger(n)) return s;
    return n;
  }
  return s;
}

export interface CsvToJsonOptions {
  /** Turn numbers, true/false and empty cells into real JSON types */
  types?: boolean;
  /** Build nested objects and arrays from headers like address.city or tags.0 */
  nested?: boolean;
  /** The first row holds the column names (otherwise column1, column2, …) */
  header?: boolean;
}

export function csvToJsonAdvanced(text: string, delimiter: string, opts: CsvToJsonOptions = {}): unknown[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""), delimiter);
  if (!rows.length) return [];
  const header = opts.header !== false;
  const width = rows.reduce((w, r) => Math.max(w, r.length), 0);
  const names = header ? rows[0].map((h, i) => h.trim() || `column${i + 1}`) : Array.from({ length: width }, (_, i) => `column${i + 1}`);
  // Repeated header names get a suffix instead of overwriting each other
  const seen = new Map<string, number>();
  const keys = names.map((n) => {
    const c = seen.get(n) ?? 0;
    seen.set(n, c + 1);
    return c ? `${n}_${c + 1}` : n;
  });
  const body = rows.slice(header ? 1 : 0);
  // A column with any leading-zero number (zip codes, IDs like 007) stays text throughout, so its
  // values don't come out as a mix of strings and numbers
  const textColumn = keys.map((_, i) => body.some((r) => /^-?0\d/.test((r[i] ?? "").trim())));
  return body.map((r) => {
    const obj: Record<string, unknown> = {};
    keys.forEach((k, i) => {
      const raw = r[i] ?? "";
      obj[k] = opts.types && !textColumn[i] ? inferValue(raw) : raw;
    });
    return opts.nested && keys.some((k) => k.includes(".")) ? unflattenJsonRow(obj) : obj;
  });
}

function unflattenJsonRow(flat: Record<string, unknown>): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const key of Object.keys(flat)) {
    const parts = key.split(".");
    let node: Record<string, unknown> = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (typeof node[p] !== "object" || node[p] === null) node[p] = {};
      node = node[p] as Record<string, unknown>;
    }
    node[parts[parts.length - 1]] = flat[key];
  }
  return arrayifyKeys(root) as Record<string, unknown>;
}

/** Objects whose keys are exactly 0, 1, 2 … become arrays */
function arrayifyKeys(v: unknown): unknown {
  if (!v || typeof v !== "object") return v;
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o);
  keys.forEach((k) => {
    o[k] = arrayifyKeys(o[k]);
  });
  if (keys.length && keys.every((k, i) => k === String(i))) return keys.map((k) => o[k]);
  return o;
}

/** Nested objects and arrays as dot-path columns (address.city, tags.0) instead of JSON in one cell */
export function flattenRow(v: unknown, prefix = "", out: Record<string, unknown> = {}): Record<string, unknown> {
  if (v && typeof v === "object" && (Array.isArray(v) ? v.length : Object.keys(v).length)) {
    const entries: [string, unknown][] = Array.isArray(v) ? v.map((x, i) => [String(i), x] as [string, unknown]) : Object.entries(v as Record<string, unknown>);
    entries.forEach(([k, x]) => flattenRow(x, prefix ? `${prefix}.${k}` : k, out));
  } else out[prefix || "value"] = v;
  return out;
}

/** The rows in parsed JSON: an array, NDJSON lines, or the one array inside a wrapper like {"data": [...]} */
export function rowsFromJson(text: string): { rows: unknown[]; from?: string } {
  const t = text.trim();
  try {
    const parsed = JSON.parse(t);
    if (Array.isArray(parsed)) return { rows: parsed };
    if (parsed && typeof parsed === "object") {
      const arrays = Object.entries(parsed as Record<string, unknown>).filter(([, x]) => Array.isArray(x));
      if (arrays.length === 1) return { rows: arrays[0][1] as unknown[], from: arrays[0][0] };
      return { rows: [parsed] };
    }
    throw new Error("JSON must be an array of objects");
  } catch (e) {
    // NDJSON: one JSON value per line
    const lines = t.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length > 1) {
      try {
        return { rows: lines.map((l) => JSON.parse(l)), from: "NDJSON lines" };
      } catch {}
    }
    throw e;
  }
}
