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

export interface ValidationError {
  path: string;
  message: string;
}

function dataType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

function typeMatches(actual: string, expected: string): boolean {
  // A schema that says "number" also accepts an integer value — every integer is a number.
  if (expected === "number") return actual === "number" || actual === "integer";
  return actual === expected;
}

/** Validates data against a (draft-07-flavored) JSON Schema — supports the subset most
 * hand-written and generated schemas actually use: type, properties/required, items,
 * enum, and the min/max numeric and string-length keywords. Not a full draft-07
 * implementation (no $ref, allOf/oneOf, pattern, format, etc.). */
export function validateAgainstSchema(data: unknown, schema: unknown, path = "$"): ValidationError[] {
  const errors: ValidationError[] = [];
  if (schema === null || typeof schema !== "object") return errors;
  const s = schema as Record<string, unknown>;

  if (s.type) {
    const types = (Array.isArray(s.type) ? s.type : [s.type]) as string[];
    const actual = dataType(data);
    if (!types.some((t) => typeMatches(actual, t))) {
      errors.push({ path, message: `Expected type "${types.join(" | ")}" but got "${actual}".` });
      return errors; // a type mismatch makes deeper property/item checks meaningless
    }
  }

  if (Array.isArray(s.enum)) {
    const match = s.enum.some((v) => JSON.stringify(v) === JSON.stringify(data));
    if (!match) {
      errors.push({ path, message: `Value is not one of the allowed enum values: ${JSON.stringify(s.enum)}.` });
    }
  }

  if (s.properties && typeof data === "object" && data !== null && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(s.required)) {
      for (const key of s.required as string[]) {
        if (!(key in obj)) errors.push({ path: `${path}.${key}`, message: "Missing required property." });
      }
    }
    for (const [key, subSchema] of Object.entries(s.properties as Record<string, unknown>)) {
      if (key in obj) errors.push(...validateAgainstSchema(obj[key], subSchema, `${path}.${key}`));
    }
  }

  if (s.items && Array.isArray(data)) {
    if (Array.isArray(s.items)) {
      data.forEach((item, i) => {
        const itemSchema = (s.items as unknown[])[i];
        if (itemSchema) errors.push(...validateAgainstSchema(item, itemSchema, `${path}[${i}]`));
      });
    } else {
      data.forEach((item, i) => errors.push(...validateAgainstSchema(item, s.items, `${path}[${i}]`)));
    }
  }

  if (typeof s.minimum === "number" && typeof data === "number" && data < s.minimum) {
    errors.push({ path, message: `${data} is less than the minimum of ${s.minimum}.` });
  }
  if (typeof s.maximum === "number" && typeof data === "number" && data > s.maximum) {
    errors.push({ path, message: `${data} is greater than the maximum of ${s.maximum}.` });
  }
  if (typeof s.minLength === "number" && typeof data === "string" && data.length < s.minLength) {
    errors.push({ path, message: `String length ${data.length} is less than minLength ${s.minLength}.` });
  }
  if (typeof s.maxLength === "number" && typeof data === "string" && data.length > s.maxLength) {
    errors.push({ path, message: `String length ${data.length} is greater than maxLength ${s.maxLength}.` });
  }

  return errors;
}
