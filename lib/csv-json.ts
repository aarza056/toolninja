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
    if (char === '"') {
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
