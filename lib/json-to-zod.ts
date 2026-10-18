type StringFormat = "email" | "url" | "uuid" | "datetime" | null;

type Shape =
  | { kind: "string"; format: StringFormat }
  | { kind: "number"; int: boolean }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "unknown" }
  | { kind: "array"; item: Shape }
  | { kind: "object"; fields: Map<string, { shape: Shape; optional: boolean }> }
  | { kind: "union"; options: Shape[] };

export interface ZodOptions {
  schemaName: string;
  detectFormats: boolean;
  exportType: boolean;
}

function detectFormat(value: string): StringFormat {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return "uuid";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value)) return "datetime";
  if (/^https?:\/\/\S+$/.test(value)) return "url";
  return null;
}

function infer(value: unknown, detectFormats: boolean): Shape {
  if (value === null) return { kind: "null" };
  if (typeof value === "string") return { kind: "string", format: detectFormats ? detectFormat(value) : null };
  if (typeof value === "number") return { kind: "number", int: Number.isInteger(value) };
  if (typeof value === "boolean") return { kind: "boolean" };
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "array", item: { kind: "unknown" } };
    return { kind: "array", item: value.map((v) => infer(v, detectFormats)).reduce(merge) };
  }
  if (typeof value === "object") {
    const fields = new Map<string, { shape: Shape; optional: boolean }>();
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields.set(k, { shape: infer(v, detectFormats), optional: false });
    }
    return { kind: "object", fields };
  }
  return { kind: "unknown" };
}

function mergeIntoUnion(options: Shape[], next: Shape): Shape[] {
  const idx = options.findIndex((o) => o.kind === next.kind);
  if (idx === -1) return [...options, next];
  const copy = options.slice();
  copy[idx] = merge(copy[idx], next);
  return copy;
}

function merge(a: Shape, b: Shape): Shape {
  if (a.kind === "unknown") return b;
  if (b.kind === "unknown") return a;
  if (a.kind === "union") return { kind: "union", options: b.kind === "union" ? b.options.reduce(mergeIntoUnion, a.options) : mergeIntoUnion(a.options, b) };
  if (b.kind === "union") return merge(b, a);
  if (a.kind !== b.kind) return { kind: "union", options: [a, b] };

  if (a.kind === "string" && b.kind === "string") return { kind: "string", format: a.format === b.format ? a.format : null };
  if (a.kind === "number" && b.kind === "number") return { kind: "number", int: a.int && b.int };
  if (a.kind === "array" && b.kind === "array") return { kind: "array", item: merge(a.item, b.item) };
  if (a.kind === "object" && b.kind === "object") {
    const fields = new Map<string, { shape: Shape; optional: boolean }>();
    const keys = Array.from(new Set([...Array.from(a.fields.keys()), ...Array.from(b.fields.keys())]));
    for (const k of keys) {
      const fa = a.fields.get(k);
      const fb = b.fields.get(k);
      if (fa && fb) fields.set(k, { shape: merge(fa.shape, fb.shape), optional: fa.optional || fb.optional });
      else fields.set(k, { shape: (fa ?? fb)!.shape, optional: true });
    }
    return { kind: "object", fields };
  }
  return a;
}

function propKey(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

function render(shape: Shape, indent: number): string {
  const pad = "  ".repeat(indent);
  switch (shape.kind) {
    case "string":
      return shape.format ? `z.string().${shape.format}()` : "z.string()";
    case "number":
      return shape.int ? "z.number().int()" : "z.number()";
    case "boolean":
      return "z.boolean()";
    case "null":
      return "z.null()";
    case "unknown":
      return "z.unknown()";
    case "array":
      return `z.array(${render(shape.item, indent)})`;
    case "union": {
      const nonNull = shape.options.filter((o) => o.kind !== "null");
      const hasNull = nonNull.length !== shape.options.length;
      const base =
        nonNull.length === 1 ? render(nonNull[0], indent) : `z.union([${nonNull.map((o) => render(o, indent)).join(", ")}])`;
      return hasNull ? `${base}.nullable()` : base;
    }
    case "object": {
      if (shape.fields.size === 0) return "z.object({})";
      const lines = Array.from(shape.fields.entries()).map(
        ([k, f]) => `${pad}  ${propKey(k)}: ${render(f.shape, indent + 1)}${f.optional ? ".optional()" : ""},`
      );
      return `z.object({\n${lines.join("\n")}\n${pad}})`;
    }
  }
}

function toPascal(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ""));
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function jsonToZod(json: string, opts: ZodOptions): string {
  const parsed = JSON.parse(json);
  const shape = infer(parsed, opts.detectFormats);
  const base = opts.schemaName.trim() || "schema";
  const schemaVar = /schema$/i.test(base) ? base : `${base}Schema`;
  const typeName = toPascal(base.replace(/schema$/i, "") || "Data");

  let out = `import { z } from "zod";\n\nexport const ${schemaVar} = ${render(shape, 0)};\n`;
  if (opts.exportType) out += `\nexport type ${typeName} = z.infer<typeof ${schemaVar}>;\n`;
  return out;
}
