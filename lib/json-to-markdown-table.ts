function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Escapes pipe characters and collapses newlines so a value can't break the table's row
 * structure when dropped into a Markdown table cell. */
function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export interface JsonToTableResult {
  markdown: string;
  columns: string[];
  rowCount: number;
  /** Raw (unescaped) cell values per row, in column order — for rendering an accurate HTML
   * preview without having to re-parse the escaped Markdown string. */
  rows: string[][];
}

/** Converts a JSON array of flat objects into a GitHub-Flavored Markdown table. The column
 * set is the union of keys across every row (in first-seen order), so rows with missing
 * fields just render an empty cell rather than breaking the conversion. */
export function jsonToMarkdownTable(json: string): JsonToTableResult {
  const parsed = JSON.parse(json);

  const rows: Record<string, unknown>[] = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null
      ? [parsed as Record<string, unknown>]
      : (() => {
          throw new Error("Input must be a JSON array of objects, or a single JSON object.");
        })();

  if (rows.length === 0) {
    throw new Error("The JSON array is empty — nothing to convert.");
  }
  for (const row of rows) {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new Error("Every array element must be a plain JSON object (key/value pairs).");
    }
  }

  const columns: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }

  const headerRow = `| ${columns.map((c) => escapeCell(c)).join(" | ")} |`;
  const separatorRow = `| ${columns.map(() => "---").join(" | ")} |`;
  const dataRows = rows.map(
    (row) => `| ${columns.map((c) => escapeCell(cellToString(row[c]))).join(" | ")} |`
  );

  return {
    markdown: [headerRow, separatorRow, ...dataRows].join("\n"),
    columns,
    rowCount: rows.length,
    rows: rows.map((row) => columns.map((c) => cellToString(row[c]))),
  };
}
