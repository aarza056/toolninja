function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sanitizeName(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase())
    .replace(/^[0-9]/, "_$&");
}

// ── Python (dataclasses) ─────────────────────────────────────────────────

function inferPythonType(value: unknown, name: string, classes: Map<string, string>): string {
  if (value === null) return "Optional[Any]";
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "float";
  if (typeof value === "string") return "str";

  if (Array.isArray(value)) {
    if (value.length === 0) return "List[Any]";
    const elementTypes = value.map((item) => inferPythonType(item, `${name}Item`, classes));
    const unique = Array.from(new Set(elementTypes));
    return `List[${unique.join(", ")}]`;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const className = capitalize(sanitizeName(name));
    const lines: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      const propType = inferPythonType(val, className + capitalize(sanitizeName(key)), classes);
      lines.push(`    ${key}: ${propType}`);
    }
    const decl = `@dataclass\nclass ${className}:\n${lines.length ? lines.join("\n") : "    pass"}`;
    if (!classes.has(className)) classes.set(className, decl);
    return className;
  }

  return "Any";
}

export function jsonToPythonDataclasses(json: string, rootName: string): string {
  const parsed = JSON.parse(json);
  const classes = new Map<string, string>();
  const rootType = inferPythonType(parsed, rootName || "Root", classes);

  const declarations = Array.from(classes.values());
  const header = "from dataclasses import dataclass\nfrom typing import Optional, List, Any";

  if (declarations.length === 0) {
    return `${header}\n\n# Root value is a ${rootType}, not an object — no dataclass generated.`;
  }
  return `${header}\n\n${declarations.join("\n\n\n")}`;
}

// ── Go (structs) ──────────────────────────────────────────────────────────

function goFieldName(key: string): string {
  const clean = sanitizeName(key);
  return capitalize(clean);
}

function inferGoType(value: unknown, name: string, structs: Map<string, string>): string {
  if (value === null) return "interface{}";
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number") return Number.isInteger(value) ? "int" : "float64";
  if (typeof value === "string") return "string";

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]interface{}";
    const elementTypes = value.map((item) => inferGoType(item, `${name}Item`, structs));
    const unique = Array.from(new Set(elementTypes));
    return unique.length === 1 ? `[]${unique[0]}` : "[]interface{}";
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const structName = capitalize(sanitizeName(name));
    const fieldLines: string[] = [];
    let maxFieldLen = 0;
    let maxTypeLen = 0;
    const rows: { field: string; type: string; tag: string }[] = [];

    for (const [key, val] of Object.entries(obj)) {
      const fieldName = goFieldName(key);
      const fieldType = inferGoType(val, structName + fieldName, structs);
      const tag = `\`json:"${key}"\``;
      rows.push({ field: fieldName, type: fieldType, tag });
      maxFieldLen = Math.max(maxFieldLen, fieldName.length);
      maxTypeLen = Math.max(maxTypeLen, fieldType.length);
    }
    rows.forEach((r) => {
      fieldLines.push(
        `\t${r.field.padEnd(maxFieldLen)} ${r.type.padEnd(maxTypeLen)} ${r.tag}`
      );
    });

    const decl = `type ${structName} struct {\n${fieldLines.length ? fieldLines.join("\n") : ""}\n}`;
    if (!structs.has(structName)) structs.set(structName, decl);
    return structName;
  }

  return "interface{}";
}

export function jsonToGoStructs(json: string, rootName: string): string {
  const parsed = JSON.parse(json);
  const structs = new Map<string, string>();
  const rootType = inferGoType(parsed, rootName || "Root", structs);

  const declarations = Array.from(structs.values());
  if (declarations.length === 0) {
    return `package main\n\n// Root value is a ${rootType}, not an object — no struct generated.`;
  }
  return `package main\n\n${declarations.join("\n\n")}`;
}
