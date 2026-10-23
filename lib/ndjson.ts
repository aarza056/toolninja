export interface NdjsonLineResult {
  line: number;
  raw: string;
  value?: unknown;
  error?: string;
}

export function parseNdjson(text: string): NdjsonLineResult[] {
  const lines = text.split("\n");
  const results: NdjsonLineResult[] = [];
  lines.forEach((raw, i) => {
    if (raw.trim() === "") return;
    try {
      results.push({ line: i + 1, raw, value: JSON.parse(raw) });
    } catch (e) {
      results.push({ line: i + 1, raw, error: e instanceof Error ? e.message : "Invalid JSON" });
    }
  });
  return results;
}

export function formatNdjson(text: string, pretty: boolean): { output: string; results: NdjsonLineResult[] } {
  const results = parseNdjson(text);
  const output = results
    .map((r) => (r.error ? `// Line ${r.line}: ${r.error}` : JSON.stringify(r.value, null, pretty ? 2 : undefined)))
    .join(pretty ? "\n\n" : "\n");
  return { output, results };
}

export function ndjsonToJsonArray(text: string): { output: string; results: NdjsonLineResult[] } {
  const results = parseNdjson(text);
  const hasErrors = results.some((r) => r.error);
  if (hasErrors) return { output: "", results };
  return { output: JSON.stringify(results.map((r) => r.value), null, 2), results };
}

export function jsonArrayToNdjson(text: string): { output: string; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { output: "", error: e instanceof Error ? e.message : "Invalid JSON" };
  }
  if (!Array.isArray(parsed)) {
    return { output: "", error: "Top-level JSON must be an array to convert to NDJSON — each array element becomes one line." };
  }
  return { output: parsed.map((item) => JSON.stringify(item)).join("\n") };
}
