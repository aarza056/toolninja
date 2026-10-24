// JSON sample → typed models for Go, Python (Pydantic / dataclasses), Rust (serde), C# (System.Text.Json),
// Kotlin (kotlinx.serialization) and Swift (Codable).
//
// Every element of an array is merged into one shape, so a field that's missing from some items
// becomes optional and a field that's sometimes null becomes nullable — one sample object is
// rarely the whole story.

export type CodeLanguage = "go" | "pydantic" | "dataclass" | "rust" | "csharp" | "kotlin" | "swift";

type Prim = "string" | "int" | "float" | "bool" | "datetime";

type Shape =
  | { kind: "unknown"; nullable?: boolean } // only null / empty arrays seen
  | { kind: "any"; nullable?: boolean } // conflicting types
  | { kind: "prim"; prim: Prim; nullable?: boolean; big?: boolean }
  | { kind: "array"; item: Shape; nullable?: boolean }
  | { kind: "object"; fields: Map<string, Field>; nullable?: boolean };

interface Field {
  shape: Shape;
  optional: boolean;
}

const DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/;

function infer(v: unknown): Shape {
  if (v === null) return { kind: "unknown", nullable: true };
  if (typeof v === "boolean") return { kind: "prim", prim: "bool" };
  if (typeof v === "number") {
    if (!Number.isInteger(v)) return { kind: "prim", prim: "float" };
    return { kind: "prim", prim: "int", big: Math.abs(v) > 2147483647 };
  }
  if (typeof v === "string") return { kind: "prim", prim: DATETIME.test(v) ? "datetime" : "string" };
  if (Array.isArray(v)) {
    let item: Shape = { kind: "unknown" };
    for (const el of v) item = merge(item, infer(el));
    return { kind: "array", item };
  }
  if (typeof v === "object") {
    const fields = new Map<string, Field>();
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) fields.set(k, { shape: infer(val), optional: false });
    return { kind: "object", fields };
  }
  return { kind: "any" };
}

function merge(a: Shape, b: Shape): Shape {
  const nullable = Boolean(a.nullable || b.nullable);
  if (a.kind === "unknown") return { ...b, nullable };
  if (b.kind === "unknown") return { ...a, nullable };
  if (a.kind === "any" || b.kind === "any") return { kind: "any", nullable };
  if (a.kind === "prim" && b.kind === "prim") {
    if (a.prim === b.prim) return { ...a, nullable, big: a.big || b.big };
    const nums = new Set([a.prim, b.prim]);
    if (nums.has("int") && nums.has("float") && nums.size === 2) return { kind: "prim", prim: "float", nullable };
    if (nums.has("string") && nums.has("datetime") && nums.size === 2) return { kind: "prim", prim: "string", nullable };
    return { kind: "any", nullable };
  }
  if (a.kind === "array" && b.kind === "array") return { kind: "array", item: merge(a.item, b.item), nullable };
  if (a.kind === "object" && b.kind === "object") {
    const fields = new Map<string, Field>();
    for (const [k, f] of Array.from(a.fields)) {
      const other = b.fields.get(k);
      fields.set(k, other ? { shape: merge(f.shape, other.shape), optional: f.optional || other.optional } : { ...f, optional: true });
    }
    for (const [k, f] of Array.from(b.fields)) if (!a.fields.has(k)) fields.set(k, { ...f, optional: true });
    return { kind: "object", fields, nullable };
  }
  return { kind: "any", nullable };
}

// ─── naming ──────────────────────────────────────────────────────────────────

function words(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
}
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
export function pascal(s: string): string {
  const out = words(s).map(cap).join("");
  return !out ? "Field" : /^\d/.test(out) ? `N${out}` : out;
}
function camel(s: string): string {
  const p = pascal(s);
  return p.charAt(0).toLowerCase() + p.slice(1);
}
function snake(s: string): string {
  const out = words(s).map((w) => w.toLowerCase()).join("_");
  return !out ? "field" : /^\d/.test(out) ? `n_${out}` : out;
}
function singular(name: string): string {
  if (/ies$/i.test(name)) return name.replace(/ies$/i, "y");
  if (/(ss|us|is)$/i.test(name)) return `${name}Item`;
  if (/(ch|sh|x|ses)es$/i.test(name)) return name.replace(/es$/i, "");
  if (/s$/i.test(name)) return name.replace(/s$/i, "");
  return `${name}Item`;
}

// Object shapes get class names from their key; nested ones are prefixed by the parent if the
// short name is already taken by a different shape.
interface Named {
  name: string;
  shape: Extract<Shape, { kind: "object" }>;
}

function nameObjects(root: Shape, rootName: string): { named: Named[]; nameOf: Map<Shape, string> } {
  const named: Named[] = [];
  const nameOf = new Map<Shape, string>();
  const used = new Set<string>();
  const unique = (n: string) => {
    let name = n;
    for (let i = 2; used.has(name); i++) name = `${n}${i}`;
    used.add(name);
    return name;
  };
  const visit = (s: Shape, hint: string, parent: string) => {
    if (s.kind === "array") return visit(s.item, singular(hint), parent);
    if (s.kind !== "object") return;
    const base = pascal(hint);
    const name = unique(used.has(base) && parent ? `${parent}${base}` : base);
    nameOf.set(s, name);
    for (const [k, f] of Array.from(s.fields)) visit(f.shape, k, name);
    named.push({ name, shape: s }); // children first: definition order works for Python/Swift too
  };
  visit(root, rootName, "");
  return { named, nameOf };
}

// ─── per-language emitters ───────────────────────────────────────────────────

const RESERVED: Record<string, Set<string>> = {
  go: new Set(["break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var"]),
  python: new Set(["False", "None", "True", "and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield", "model_config", "json", "copy", "dict", "schema"]),
  rust: new Set(["as", "async", "await", "break", "const", "continue", "crate", "dyn", "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self", "static", "struct", "super", "trait", "true", "type", "unsafe", "use", "where", "while"]),
  csharp: new Set(["class", "event", "object", "string", "namespace", "operator", "params", "base", "checked", "default", "fixed", "lock", "out", "ref", "internal", "public", "private", "static", "this", "true", "false", "null"]),
  kotlin: new Set(["as", "break", "class", "continue", "do", "else", "false", "for", "fun", "if", "in", "interface", "is", "null", "object", "package", "return", "super", "this", "throw", "true", "try", "typealias", "typeof", "val", "var", "when", "while"]),
  swift: new Set(["class", "deinit", "enum", "extension", "func", "import", "init", "let", "operator", "protocol", "self", "static", "struct", "subscript", "typealias", "var", "break", "case", "continue", "default", "defer", "do", "else", "for", "guard", "if", "in", "repeat", "return", "switch", "where", "while", "as", "is", "nil", "true", "false", "Type"]),
};

const isOptional = (f: Field) => f.optional || Boolean(f.shape.nullable);

interface Ctx {
  nameOf: Map<Shape, string>;
  needs: Set<string>;
}

function goType(s: Shape, c: Ctx): string {
  if (s.kind === "prim") {
    if (s.prim === "datetime") return c.needs.add("time"), "time.Time";
    return { string: "string", int: s.big ? "int64" : "int", float: "float64", bool: "bool" }[s.prim];
  }
  if (s.kind === "array") return `[]${goType(s.item, c)}`;
  if (s.kind === "object") return c.nameOf.get(s)!;
  return "any";
}

function emitGo(named: Named[], c: Ctx, rootShape: Shape, rootName: string): string {
  const blocks = named
    .slice()
    .reverse() // parent first reads better in Go
    .map(({ name, shape }) => {
      const rows = Array.from(shape.fields).map(([key, f]) => {
        let field = pascal(key);
        if (RESERVED.go.has(field.toLowerCase()) && field === field.toLowerCase()) field = `${field}_`;
        let t = goType(f.shape, c);
        // Pointers let you tell "missing/null" apart from the zero value
        if (isOptional(f) && (f.shape.kind === "prim" || f.shape.kind === "object")) t = `*${t}`;
        const tag = `\`json:"${key}${isOptional(f) ? ",omitempty" : ""}"\``;
        return [field, t, tag];
      });
      const w1 = Math.max(0, ...rows.map((r) => r[0].length));
      const w2 = Math.max(0, ...rows.map((r) => r[1].length));
      return `type ${name} struct {\n${rows.map((r) => `\t${r[0].padEnd(w1)} ${r[1].padEnd(w2)} ${r[2]}`).join("\n")}\n}`;
    });
  if (rootShape.kind !== "object") blocks.unshift(`type ${pascal(rootName)} ${goType(rootShape, c)}`);
  const imports = c.needs.has("time") ? `import "time"\n\n` : "";
  return `package main\n\n${imports}${blocks.join("\n\n")}\n`;
}

function pyType(s: Shape, c: Ctx): string {
  if (s.kind === "prim") {
    if (s.prim === "datetime") return c.needs.add("datetime"), "datetime";
    return { string: "str", int: "int", float: "float", bool: "bool" }[s.prim];
  }
  if (s.kind === "array") return `list[${pyType(s.item, c)}]`;
  if (s.kind === "object") return c.nameOf.get(s)!;
  return c.needs.add("Any"), "Any";
}

function pyName(key: string): string {
  const n = snake(key);
  return RESERVED.python.has(n) ? `${n}_` : n;
}

function emitPydantic(named: Named[], c: Ctx, rootShape: Shape, rootName: string): string {
  let aliases = false;
  const classes = named.map(({ name, shape }) => {
    const lines = Array.from(shape.fields).map(([key, f]) => {
      const field = pyName(key);
      const t = pyType(f.shape, c);
      const alias = field !== key;
      if (alias) aliases = true;
      if (isOptional(f)) return `    ${field}: ${t} | None = ${alias ? `Field(default=None, alias="${key}")` : "None"}`;
      return `    ${field}: ${t}${alias ? ` = Field(alias="${key}")` : ""}`;
    });
    return `class ${name}(BaseModel):\n${lines.length ? lines.join("\n") : "    pass"}`;
  });
  if (aliases) classes.forEach((_, i) => (classes[i] = classes[i].replace(/\(BaseModel\):\n/, "(BaseModel):\n    model_config = ConfigDict(populate_by_name=True)\n\n")));
  const head: string[] = [];
  if (c.needs.has("datetime")) head.push("from datetime import datetime");
  if (c.needs.has("Any")) head.push("from typing import Any");
  head.push(`from pydantic import BaseModel${aliases ? ", ConfigDict, Field" : ""}`);
  if (rootShape.kind !== "object") classes.push(`${pascal(rootName)} = ${pyType(rootShape, c)}\n# Parse with: TypeAdapter(${pascal(rootName)}).validate_json(data)`);
  return `${head.join("\n")}\n\n\n${classes.join("\n\n\n")}\n`;
}

function emitDataclass(named: Named[], c: Ctx, rootShape: Shape, rootName: string): string {
  const classes = named.map(({ name, shape }) => {
    // Fields with defaults must come after the ones without
    const entries = Array.from(shape.fields).sort((a, b) => Number(isOptional(a[1])) - Number(isOptional(b[1])));
    const lines = entries.map(([key, f]) => {
      const field = pyName(key);
      const note = field !== key ? `  # JSON key: "${key}"` : "";
      return isOptional(f) ? `    ${field}: ${pyType(f.shape, c)} | None = None${note}` : `    ${field}: ${pyType(f.shape, c)}${note}`;
    });
    return `@dataclass\nclass ${name}:\n${lines.length ? lines.join("\n") : "    pass"}`;
  });
  const head = ["from dataclasses import dataclass"];
  if (c.needs.has("datetime")) head.push("from datetime import datetime");
  if (c.needs.has("Any")) head.push("from typing import Any");
  if (rootShape.kind !== "object") classes.push(`${pascal(rootName)} = ${pyType(rootShape, c)}`);
  const caveat = "# Note: dataclasses don't convert nested dicts or rename keys for you — use the Pydantic output for parsing.";
  return `${head.join("\n")}\n\n${caveat}\n\n\n${classes.join("\n\n\n")}\n`;
}

function rustType(s: Shape, c: Ctx): string {
  if (s.kind === "prim") {
    if (s.prim === "datetime") return "String"; // chrono is opt-in; keep the dependency list short
    return { string: "String", int: "i64", float: "f64", bool: "bool" }[s.prim];
  }
  if (s.kind === "array") return `Vec<${rustType(s.item, c)}>`;
  if (s.kind === "object") return c.nameOf.get(s)!;
  return c.needs.add("Value"), "Value";
}

function emitRust(named: Named[], c: Ctx, rootShape: Shape, rootName: string): string {
  const blocks = named
    .slice()
    .reverse()
    .map(({ name, shape }) => {
      const lines = Array.from(shape.fields).flatMap(([key, f]) => {
        let field = snake(key);
        const out: string[] = [];
        if (field !== key) out.push(`    #[serde(rename = "${key}")]`);
        if (RESERVED.rust.has(field)) field = `r#${field}`;
        let t = rustType(f.shape, c);
        if (isOptional(f)) {
          t = `Option<${t}>`;
          out.push(`    #[serde(default, skip_serializing_if = "Option::is_none")]`);
        }
        out.push(`    pub ${field}: ${t},`);
        return out;
      });
      return `#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct ${name} {\n${lines.join("\n")}\n}`;
    });
  if (rootShape.kind !== "object") blocks.unshift(`pub type ${pascal(rootName)} = ${rustType(rootShape, c)};`);
  const use = `use serde::{Deserialize, Serialize};${c.needs.has("Value") ? "\nuse serde_json::Value;" : ""}`;
  return `${use}\n\n${blocks.join("\n\n")}\n`;
}

function csType(s: Shape, c: Ctx): string {
  if (s.kind === "prim") return { string: "string", int: s.big ? "long" : "int", float: "double", bool: "bool", datetime: "DateTimeOffset" }[s.prim];
  if (s.kind === "array") return `List<${csType(s.item, c)}>`;
  if (s.kind === "object") return c.nameOf.get(s)!;
  return c.needs.add("JsonElement"), "JsonElement";
}

function emitCSharp(named: Named[], c: Ctx, rootShape: Shape): string {
  const blocks = named
    .slice()
    .reverse()
    .map(({ name, shape }) => {
      const props = Array.from(shape.fields).map(([key, f]) => {
        let prop = pascal(key);
        if (prop === name) prop = `${prop}Value`; // member can't share the class name
        if (RESERVED.csharp.has(prop.toLowerCase()) && prop === prop.toLowerCase()) prop = `@${prop}`;
        const t = csType(f.shape, c);
        const decl = isOptional(f) ? `public ${t}? ${prop} { get; set; }` : `public required ${t} ${prop} { get; set; }`;
        return `    [JsonPropertyName("${key}")]\n    ${decl}`;
      });
      return `public sealed class ${name}\n{\n${props.join("\n\n")}\n}`;
    });
  if (rootShape.kind !== "object") blocks.unshift(`// Deserialize with: JsonSerializer.Deserialize<${csType(rootShape, c)}>(json)`);
  const usings = ["using System.Text.Json.Serialization;"];
  if (c.needs.has("JsonElement")) usings.unshift("using System.Text.Json;");
  return `${usings.join("\n")}\n\n${blocks.join("\n\n")}\n`;
}

function ktType(s: Shape, c: Ctx): string {
  if (s.kind === "prim") return { string: "String", int: s.big ? "Long" : "Int", float: "Double", bool: "Boolean", datetime: "String" }[s.prim];
  if (s.kind === "array") return `List<${ktType(s.item, c)}>`;
  if (s.kind === "object") return c.nameOf.get(s)!;
  return c.needs.add("JsonElement"), "JsonElement";
}

function emitKotlin(named: Named[], c: Ctx, rootShape: Shape, rootName: string): string {
  const blocks = named
    .slice()
    .reverse()
    .map(({ name, shape }) => {
      const params = Array.from(shape.fields).map(([key, f]) => {
        let prop = camel(key);
        if (RESERVED.kotlin.has(prop)) prop = `\`${prop}\``;
        const ann = prop !== key ? `@SerialName("${key}") ` : "";
        const t = ktType(f.shape, c);
        return `    ${ann}val ${prop}: ${t}${isOptional(f) ? "? = null" : ""},`;
      });
      return `@Serializable\ndata class ${name}(\n${params.join("\n")}\n)`;
    });
  if (rootShape.kind !== "object") blocks.unshift(`typealias ${pascal(rootName)} = ${ktType(rootShape, c)}`);
  const imports = ["import kotlinx.serialization.SerialName", "import kotlinx.serialization.Serializable"];
  if (c.needs.has("JsonElement")) imports.push("import kotlinx.serialization.json.JsonElement");
  return `${imports.join("\n")}\n\n${blocks.join("\n\n")}\n`;
}

function swiftType(s: Shape, c: Ctx): string {
  if (s.kind === "prim") return { string: "String", int: "Int", float: "Double", bool: "Bool", datetime: "String" }[s.prim];
  if (s.kind === "array") return `[${swiftType(s.item, c)}]`;
  if (s.kind === "object") return c.nameOf.get(s)!;
  return c.needs.add("JSONValue"), "JSONValue";
}

const SWIFT_JSON_VALUE = `/// Holds a value whose type varies between samples.
enum JSONValue: Codable {
    case string(String), number(Double), bool(Bool), object([String: JSONValue]), array([JSONValue]), null

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null }
        else if let v = try? c.decode(Bool.self) { self = .bool(v) }
        else if let v = try? c.decode(Double.self) { self = .number(v) }
        else if let v = try? c.decode(String.self) { self = .string(v) }
        else if let v = try? c.decode([JSONValue].self) { self = .array(v) }
        else { self = .object(try c.decode([String: JSONValue].self)) }
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let v): try c.encode(v)
        case .number(let v): try c.encode(v)
        case .bool(let v): try c.encode(v)
        case .object(let v): try c.encode(v)
        case .array(let v): try c.encode(v)
        case .null: try c.encodeNil()
        }
    }
}`;

function emitSwift(named: Named[], c: Ctx, rootShape: Shape, rootName: string): string {
  const blocks = named
    .slice()
    .reverse()
    .map(({ name, shape }) => {
      const entries = Array.from(shape.fields).map(([key, f]) => {
        let prop = camel(key);
        if (RESERVED.swift.has(prop)) prop = `\`${prop}\``;
        return { key, prop, line: `    let ${prop}: ${swiftType(f.shape, c)}${isOptional(f) ? "?" : ""}` };
      });
      let body = entries.map((e) => e.line).join("\n");
      // CodingKeys must list every property once any of them is renamed
      if (entries.some((e) => e.prop.replace(/`/g, "") !== e.key)) {
        const cases = entries.map((e) => (e.prop.replace(/`/g, "") === e.key ? `        case ${e.prop}` : `        case ${e.prop} = "${e.key}"`));
        body += `\n\n    enum CodingKeys: String, CodingKey {\n${cases.join("\n")}\n    }`;
      }
      return `struct ${name}: Codable {\n${body}\n}`;
    });
  if (rootShape.kind !== "object") blocks.unshift(`typealias ${pascal(rootName)} = ${swiftType(rootShape, c)}`);
  if (c.needs.has("JSONValue")) blocks.push(SWIFT_JSON_VALUE);
  return `import Foundation\n\n${blocks.join("\n\n")}\n`;
}

const EMITTERS: Record<CodeLanguage, (named: Named[], c: Ctx, root: Shape, rootName: string) => string> = {
  go: emitGo,
  pydantic: emitPydantic,
  dataclass: emitDataclass,
  rust: emitRust,
  csharp: emitCSharp,
  kotlin: emitKotlin,
  swift: emitSwift,
};

/** Throws SyntaxError for invalid JSON. */
export function jsonToCode(json: string, language: CodeLanguage, rootName = "Root"): string {
  const root = infer(JSON.parse(json));
  const name = pascal(rootName || "Root");
  const { named, nameOf } = nameObjects(root, root.kind === "array" ? `${name}Items` : name);
  const ctx: Ctx = { nameOf, needs: new Set() };
  return EMITTERS[language](named, ctx, root, name);
}
