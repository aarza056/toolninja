function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sanitizeName(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase())
    .replace(/^[0-9]/, "_$&");
}

// ── Zod schemas ───────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// ISO 8601 date-time, e.g. 2026-08-11T09:30:00Z or with an offset
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function inferZodStringSchema(value: string): string {
  if (EMAIL_RE.test(value)) return "z.string().email()";
  if (URL_RE.test(value)) return "z.string().url()";
  if (UUID_RE.test(value)) return "z.string().uuid()";
  if (DATETIME_RE.test(value)) return "z.string().datetime()";
  if (DATE_RE.test(value)) return "z.string()"; // plain date strings have no dedicated zod format validator
  return "z.string()";
}

function inferZodType(
  value: unknown,
  name: string,
  schemas: Map<string, string>,
  optional: boolean
): string {
  if (value === null) return "z.null()";
  if (typeof value === "boolean") return "z.boolean()";
  if (typeof value === "number") return Number.isInteger(value) ? "z.number().int()" : "z.number()";
  if (typeof value === "string") return inferZodStringSchema(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "z.array(z.unknown())";
    const elementTypes = value.map((item) => inferZodType(item, `${name}Item`, schemas, optional));
    const unique = Array.from(new Set(elementTypes));
    const element = unique.length === 1 ? unique[0] : `z.union([${unique.join(", ")}])`;
    return `z.array(${element})`;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const schemaName = capitalize(sanitizeName(name)) + "Schema";
    const lines: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      const propName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      const childName = schemaName + capitalize(sanitizeName(key));
      let propType = inferZodType(val, childName, schemas, optional);
      if (optional) propType += ".optional()";
      lines.push(`  ${propName}: ${propType},`);
    }
    const decl = `export const ${schemaName} = z.object({\n${lines.join("\n")}\n});`;
    if (!schemas.has(schemaName)) schemas.set(schemaName, decl);
    return schemaName;
  }

  return "z.unknown()";
}

export function jsonToZodSchema(json: string, rootName: string, optional = false): string {
  const parsed = JSON.parse(json);
  const schemas = new Map<string, string>();
  const rootSchemaRef = inferZodType(parsed, rootName || "Root", schemas, optional);

  const declarations = Array.from(schemas.values());
  const header = 'import { z } from "zod";';

  if (declarations.length === 0) {
    const safeName = capitalize(sanitizeName(rootName || "Root"));
    return `${header}\n\nexport const ${safeName}Schema = ${rootSchemaRef};\nexport type ${safeName} = z.infer<typeof ${safeName}Schema>;`;
  }

  const typeExports = declarations
    .map((d) => {
      const match = d.match(/^export const (\w+) =/);
      if (!match) return "";
      const name = match[1];
      const typeName = name.endsWith("Schema") ? name.slice(0, -6) : name;
      return `export type ${typeName} = z.infer<typeof ${name}>;`;
    })
    .filter(Boolean);

  return `${header}\n\n${declarations.join("\n\n")}\n\n${typeExports.join("\n")}`;
}
