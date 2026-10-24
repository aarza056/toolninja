// Checks a JSON Schema against what each LLM provider's structured-output mode accepts, and fixes it.
// Rules from the providers' docs (October 2026):
// • OpenAI Structured Outputs (strict: true): root must be an object (not anyOf); every object needs
//   additionalProperties: false and every property listed in required (optional = union with null);
//   no allOf / not / if-then-else / dependentRequired / dependentSchemas; formats limited to
//   date-time, time, date, duration, email, hostname, ipv4, ipv6, uuid; ≤5000 properties, ≤10 levels
//   of nesting, ≤1000 enum values. $defs, $ref and recursion are allowed.
// • Claude structured outputs (output_config.format / strict tools): additionalProperties: false on
//   every object; enum, const, anyOf, allOf, $ref/$defs supported; no recursive schemas, no numeric
//   (minimum/maximum/multipleOf) or string length constraints, no complex array constraints. The
//   Python/TypeScript SDKs strip those and validate them client-side. Optional properties are fine.
// • Gemini (responseJsonSchema): supports additionalProperties, anyOf, $ref (incl. recursion),
//   minimum/maximum, minItems/maxItems, prefixItems; minLength/maxLength, min/maxProperties,
//   uniqueItems and contains are silently ignored.

export type Provider = "openai" | "anthropic" | "gemini";
export type Level = "error" | "warning" | "info";

export interface SchemaIssue {
  level: Level;
  path: string;
  message: string;
}

type S = Record<string, unknown>;
const isObj = (v: unknown): v is S => typeof v === "object" && v !== null && !Array.isArray(v);

const OPENAI_FORMATS = new Set(["date-time", "time", "date", "duration", "email", "hostname", "ipv4", "ipv6", "uuid"]);
const CLAUDE_FORMATS = new Set(["date-time", "time", "date", "duration", "email", "hostname", "uri", "ipv4", "ipv6", "uuid"]);

const OPENAI_UNSUPPORTED = ["allOf", "not", "if", "then", "else", "dependentRequired", "dependentSchemas", "patternProperties", "unevaluatedProperties", "unevaluatedItems", "propertyNames", "minProperties", "maxProperties", "contains", "minContains", "maxContains", "uniqueItems"];
const CLAUDE_STRIPPED = ["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "minLength", "maxLength"];
const CLAUDE_UNSUPPORTED = ["not", "if", "then", "else", "patternProperties", "dependentRequired", "dependentSchemas", "unevaluatedProperties", "propertyNames", "minProperties", "maxProperties", "maxItems", "uniqueItems", "contains", "minContains", "maxContains", "prefixItems"];
const GEMINI_IGNORED = ["minProperties", "maxProperties", "minLength", "maxLength", "uniqueItems", "contains", "minContains", "maxContains"];

/** Accepts a bare schema or the request wrappers people paste (response_format, tools). */
export function unwrapSchema(doc: unknown): { schema: S; wrapper?: string } {
  if (!isObj(doc)) throw new Error("The schema must be a JSON object.");
  if (isObj(doc.json_schema) && isObj((doc.json_schema as S).schema)) return { schema: (doc.json_schema as S).schema as S, wrapper: "response_format.json_schema.schema" };
  if (doc.type === "json_schema" && isObj(doc.schema)) return { schema: doc.schema as S, wrapper: "format.schema" };
  if (isObj(doc.function) && isObj((doc.function as S).parameters)) return { schema: (doc.function as S).parameters as S, wrapper: "function.parameters" };
  if (isObj(doc.input_schema)) return { schema: doc.input_schema as S, wrapper: "input_schema" };
  if (isObj(doc.parameters) && typeof doc.name === "string") return { schema: doc.parameters as S, wrapper: "parameters" };
  if (isObj(doc.schema) && typeof doc.name === "string") return { schema: doc.schema as S, wrapper: "schema" };
  return { schema: doc };
}

const isObjectSchema = (s: S) => s.type === "object" || (Array.isArray(s.type) && s.type.includes("object")) || (s.type === undefined && isObj(s.properties));

interface Walk {
  schema: S;
  path: string;
  depth: number;
}

/** Every sub-schema with its path and object-nesting depth. */
function walk(root: S): Walk[] {
  const out: Walk[] = [];
  const visit = (s: unknown, path: string, depth: number) => {
    if (!isObj(s)) return;
    const d = isObjectSchema(s) ? depth + 1 : depth;
    out.push({ schema: s, path, depth: d });
    if (isObj(s.properties)) for (const [k, v] of Object.entries(s.properties)) visit(v, `${path}/properties/${k}`, d);
    if (isObj(s.items)) visit(s.items, `${path}/items`, d);
    if (Array.isArray(s.items)) s.items.forEach((v, i) => visit(v, `${path}/items/${i}`, d));
    if (Array.isArray(s.prefixItems)) s.prefixItems.forEach((v, i) => visit(v, `${path}/prefixItems/${i}`, d));
    for (const key of ["anyOf", "oneOf", "allOf"]) if (Array.isArray(s[key])) (s[key] as unknown[]).forEach((v, i) => visit(v, `${path}/${key}/${i}`, d));
    if (isObj(s.additionalProperties)) visit(s.additionalProperties, `${path}/additionalProperties`, d);
    for (const key of ["$defs", "definitions"]) if (isObj(s[key])) for (const [k, v] of Object.entries(s[key] as S)) visit(v, `${path}/${key}/${k}`, 0);
  };
  visit(root, "#", 0);
  return out;
}

function isRecursive(root: S): boolean {
  // A $ref to the root, or a definition that (directly or indirectly) refers back to itself
  const defs = { ...(isObj(root.$defs) ? root.$defs : {}), ...(isObj(root.definitions) ? root.definitions : {}) } as S;
  const refsIn = (s: unknown): string[] => {
    const found: string[] = [];
    const visit = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(visit);
      else if (isObj(v)) {
        for (const [k, x] of Object.entries(v)) {
          if (k === "$ref" && typeof x === "string") found.push(x);
          else visit(x);
        }
      }
    };
    visit(s);
    return found;
  };
  if (refsIn({ ...root, $defs: undefined, definitions: undefined }).includes("#")) return true;
  const nameOf = (ref: string) => ref.replace(/^#\/(\$defs|definitions)\//, "");
  for (const start of Object.keys(defs)) {
    const seen = new Set<string>();
    const stack = refsIn(defs[start]).map(nameOf);
    while (stack.length) {
      const n = stack.pop()!;
      if (n === "#" || n === start) return true;
      if (seen.has(n) || !defs[n]) continue;
      seen.add(n);
      stack.push(...refsIn(defs[n]).map(nameOf));
    }
  }
  return false;
}

export function checkSchema(schema: S, provider: Provider): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const add = (level: Level, path: string, message: string) => issues.push({ level, path, message });
  const nodes = walk(schema);

  if (provider === "openai") {
    if (!isObjectSchema(schema)) add("error", "#", "The root must be a { \"type\": \"object\" } schema. Wrap other types in an object with a single property.");
    if (schema.anyOf) add("error", "#", "The root can't use anyOf. Put the alternatives inside a property instead.");
  }

  let properties = 0;
  let enumValues = 0;
  let maxDepth = 0;

  for (const { schema: s, path, depth } of nodes) {
    maxDepth = Math.max(maxDepth, depth);
    if (Array.isArray(s.enum)) enumValues += s.enum.length;
    if (s.nullable === true) add(provider === "gemini" ? "info" : "error", path, '"nullable": true is OpenAPI syntax, not JSON Schema. Use "type": ["string", "null"] instead.');
    if (s.oneOf && provider !== "gemini") add(provider === "openai" ? "error" : "warning", path, "oneOf isn't supported — use anyOf (the alternatives should not overlap anyway).");

    if (isObjectSchema(s)) {
      const props = isObj(s.properties) ? Object.keys(s.properties) : [];
      properties += props.length;
      const required = Array.isArray(s.required) ? (s.required as string[]) : [];
      if (provider !== "gemini") {
        if (s.additionalProperties === undefined) add("error", path, 'Missing "additionalProperties": false — required on every object.');
        else if (s.additionalProperties !== false) add("error", path, `"additionalProperties" must be false (it's ${JSON.stringify(s.additionalProperties)}). Free-form maps aren't supported; use an array of { key, value } objects instead.`);
      }
      if (provider === "openai") {
        const missing = props.filter((p) => !required.includes(p));
        if (missing.length) add("error", path, `Every property must be in "required" — missing: ${missing.join(", ")}. To keep a field optional, make its type nullable (e.g. ["string", "null"]).`);
      }
      const unknownRequired = required.filter((r) => !props.includes(r));
      if (unknownRequired.length) add("error", path, `"required" lists properties that don't exist: ${unknownRequired.join(", ")}.`);
      if (!props.length && provider !== "gemini" && s.additionalProperties === false) add("warning", path, "An object with no properties can only ever be {}.");
    }

    if (typeof s.format === "string") {
      const allowed = provider === "openai" ? OPENAI_FORMATS : provider === "anthropic" ? CLAUDE_FORMATS : null;
      if (allowed && !allowed.has(s.format)) add(provider === "openai" ? "error" : "warning", path, `format "${s.format}" isn't supported. Supported: ${Array.from(allowed).join(", ")}.`);
    }

    if (provider === "openai") {
      for (const k of OPENAI_UNSUPPORTED) if (s[k] !== undefined) add("error", path, `"${k}" isn't supported in strict mode — the request is rejected.`);
      for (const k of ["minLength", "maxLength"]) if (s[k] !== undefined) add("warning", path, `"${k}" isn't listed as supported for strings — check the string in your code instead.`);
      if (s.default !== undefined) add("warning", path, '"default" isn\'t used by the model — every field is generated.');
    }
    if (provider === "anthropic") {
      for (const k of CLAUDE_STRIPPED) if (s[k] !== undefined) add("warning", path, `"${k}" isn't supported by the API. The Python/TypeScript SDKs remove it and check it after the response; with raw HTTP, remove it yourself.`);
      for (const k of CLAUDE_UNSUPPORTED) if (s[k] !== undefined) add("error", path, `"${k}" isn't supported in Claude structured outputs.`);
      if (typeof s.minItems === "number" && s.minItems > 1) add("warning", path, `minItems: ${s.minItems} — only 0 and 1 are supported; check the length in your code.`);
    }
    if (provider === "gemini") {
      for (const k of GEMINI_IGNORED) if (s[k] !== undefined) add("info", path, `"${k}" is accepted but ignored — Gemini won't enforce it, so validate it after the response.`);
      if (s.oneOf) add("info", path, "oneOf isn't documented for Gemini — anyOf is the supported way to express alternatives.");
    }
  }

  if (provider === "anthropic" && isRecursive(schema)) add("error", "#", "Recursive schemas (a $ref that points back to itself) aren't supported by Claude. Flatten the structure to a fixed depth.");
  if (provider === "openai") {
    if (properties > 5000) add("error", "#", `${properties} object properties in total — the limit is 5,000.`);
    if (maxDepth > 10) add("error", "#", `Objects are nested ${maxDepth} levels deep — the limit is 10.`);
    if (enumValues > 1000) add("error", "#", `${enumValues} enum values in total — the limit is 1,000.`);
  }
  if (provider === "gemini" && (maxDepth > 8 || enumValues > 500)) add("info", "#", "Large or deeply nested schemas can be rejected with 400 INVALID_ARGUMENT (too many states). Simplify if that happens.");

  const order: Record<Level, number> = { error: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => order[a.level] - order[b.level]);
}

// ─── auto-fix ────────────────────────────────────────────────────────────────

function makeNullable(s: S): S {
  if (Array.isArray(s.type)) return s.type.includes("null") ? s : { ...s, type: [...s.type, "null"], ...(Array.isArray(s.enum) && !s.enum.includes(null) ? { enum: [...s.enum, null] } : {}) };
  if (typeof s.type === "string") {
    if (s.type === "null") return s;
    return { ...s, type: [s.type, "null"], ...(Array.isArray(s.enum) && !s.enum.includes(null) ? { enum: [...s.enum, null] } : {}) };
  }
  if (s.$ref || s.anyOf) {
    const alts = Array.isArray(s.anyOf) ? (s.anyOf as S[]) : [{ $ref: s.$ref }];
    if (alts.some((a) => isObj(a) && a.type === "null")) return s;
    const rest = { ...s };
    delete rest.$ref;
    delete rest.anyOf;
    return { ...rest, anyOf: [...alts, { type: "null" }] };
  }
  return s;
}

export interface FixResult {
  schema: S;
  changes: string[];
}

export function fixSchema(input: S, target: "openai" | "anthropic"): FixResult {
  const changes: string[] = [];
  const removed = new Map<string, number>();
  const strip = target === "openai" ? OPENAI_UNSUPPORTED : [...CLAUDE_UNSUPPORTED, ...CLAUDE_STRIPPED];

  const fix = (raw: unknown, path: string): unknown => {
    if (Array.isArray(raw)) return raw.map((v, i) => fix(v, `${path}/${i}`));
    if (!isObj(raw)) return raw;
    let s: S = { ...raw };

    if (s.nullable === true) {
      delete s.nullable;
      s = makeNullable(s);
      changes.push(`${path}: "nullable": true → type with "null"`);
    }
    if (s.oneOf) {
      s.anyOf = s.oneOf;
      delete s.oneOf;
      changes.push(`${path}: oneOf → anyOf`);
    }
    if (Array.isArray(s.allOf) && s.allOf.length === 1 && isObj(s.allOf[0]) && target === "openai") {
      const [only] = s.allOf as S[];
      delete s.allOf;
      s = { ...only, ...s };
      changes.push(`${path}: inlined a single-item allOf`);
    }
    for (const k of strip) {
      if (s[k] !== undefined) {
        delete s[k];
        removed.set(k, (removed.get(k) ?? 0) + 1);
      }
    }
    if (target === "openai" && typeof s.format === "string" && !OPENAI_FORMATS.has(s.format)) {
      changes.push(`${path}: removed unsupported format "${s.format}"`);
      delete s.format;
    }
    if (target === "anthropic" && typeof s.minItems === "number" && s.minItems > 1) {
      removed.set("minItems > 1", (removed.get("minItems > 1") ?? 0) + 1);
      s.minItems = 1;
    }

    // Recurse first, so nested objects are fixed before we look at this one's properties
    for (const key of Object.keys(s)) {
      if (key === "properties" && isObj(s.properties)) {
        s.properties = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, fix(v, `${path}/properties/${k}`)]));
      } else if (["items", "prefixItems", "anyOf", "allOf", "$defs", "definitions"].includes(key)) {
        const v = s[key];
        s[key] = isObj(v) && (key === "$defs" || key === "definitions") ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x, `${path}/${key}/${k}`)])) : fix(v, `${path}/${key}`);
      }
    }

    if (isObjectSchema(s)) {
      if (s.additionalProperties !== false) {
        changes.push(`${path}: set "additionalProperties": false${s.additionalProperties !== undefined ? ` (was ${JSON.stringify(s.additionalProperties)} — free-form maps aren't allowed)` : ""}`);
        s.additionalProperties = false;
      }
      if (target === "openai" && isObj(s.properties)) {
        const required = new Set(Array.isArray(s.required) ? (s.required as string[]) : []);
        const optional = Object.keys(s.properties).filter((k) => !required.has(k));
        if (optional.length) {
          const props = s.properties as S;
          for (const k of optional) props[k] = makeNullable(isObj(props[k]) ? (props[k] as S) : {});
          changes.push(`${path}: made ${optional.join(", ")} required but nullable (the model sends null instead of leaving them out)`);
        }
        s.required = Object.keys(s.properties);
      }
    }
    return s;
  };

  let schema = fix(input, "#") as S;
  if (target === "openai" && !isObjectSchema(schema)) {
    schema = { type: "object", properties: { result: schema }, required: ["result"], additionalProperties: false };
    changes.push('#: wrapped the root in { "result": … } — strict mode needs an object at the top level');
  }
  for (const [k, n] of Array.from(removed)) changes.push(`removed "${k}" (${n}×) — not supported here; check it in your code after parsing`);
  return { schema, changes };
}
