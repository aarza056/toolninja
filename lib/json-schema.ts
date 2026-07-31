type JsonSchemaType = "string" | "number" | "integer" | "boolean" | "null" | "object" | "array";

interface JsonSchemaNode {
  type?: JsonSchemaType;
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  items?: JsonSchemaNode | JsonSchemaNode[];
}

function inferSchema(value: unknown): JsonSchemaNode {
  if (value === null) return { type: "null" };

  if (Array.isArray(value)) {
    if (value.length === 0) return { type: "array", items: {} };
    const itemSchemas = value.map(inferSchema);
    const first = JSON.stringify(itemSchemas[0]);
    const homogeneous = itemSchemas.every((s) => JSON.stringify(s) === first);
    return { type: "array", items: homogeneous ? itemSchemas[0] : itemSchemas };
  }

  switch (typeof value) {
    case "string":
      return { type: "string" };
    case "boolean":
      return { type: "boolean" };
    case "number":
      return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
    case "object": {
      const obj = value as Record<string, unknown>;
      const properties: Record<string, JsonSchemaNode> = {};
      const required: string[] = [];
      Object.entries(obj).forEach(([k, v]) => {
        properties[k] = inferSchema(v);
        required.push(k);
      });
      return { type: "object", properties, required };
    }
    default:
      return {};
  }
}

function stripRequired(node: unknown): void {
  if (!node || typeof node !== "object") return;
  const n = node as Record<string, unknown>;
  delete n.required;
  if (n.properties && typeof n.properties === "object") {
    Object.values(n.properties as Record<string, unknown>).forEach(stripRequired);
  }
  if (n.items) {
    if (Array.isArray(n.items)) n.items.forEach(stripRequired);
    else stripRequired(n.items);
  }
}

export interface JsonSchemaOptions {
  title?: string;
  includeRequired?: boolean;
}

export function generateJsonSchema(json: string, options: JsonSchemaOptions = {}): string {
  const parsed = JSON.parse(json);
  const schema = inferSchema(parsed);
  const full: Record<string, unknown> = {
    $schema: "http://json-schema.org/draft-07/schema#",
    ...(options.title ? { title: options.title } : {}),
    ...schema,
  };
  if (options.includeRequired === false) stripRequired(full);
  return JSON.stringify(full, null, 2);
}
