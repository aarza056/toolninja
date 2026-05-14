---
title: "JSON Formatting and Validation: A Developer's Guide"
description: "Learn JSON syntax rules, common parsing errors, formatting best practices, JSON Schema validation, JSONPath queries, and tools for working with JSON in APIs, configs, and data pipelines."
date: "2026-05-08"
author: "ToolNinja"
coverEmoji: "📋"
tags: ["json formatter online", "json validator", "json vs yaml", "json syntax rules", "json parse error fix", "jsonpath tutorial", "json beautifier", "format json online free", "json schema validation", "json vs javascript object", "json trailing comma", "json editor online"]
relatedTools: ["json-formatter"]
faqs:
  - q: "What is the difference between JSON and JavaScript objects?"
    a: "JSON requires double-quoted string keys, no trailing commas, no comments, and no undefined values. JavaScript objects are more flexible runtime structures. JSON is a strict subset of JavaScript syntax."
  - q: "Why does my JSON have an unexpected token error?"
    a: "Common causes: trailing comma after the last item, single quotes instead of double quotes, comments in the JSON, or unquoted keys. Use a JSON formatter to highlight the exact line."
  - q: "What is the difference between JSON and YAML?"
    a: "JSON uses braces and brackets with quoted keys — verbose but unambiguous. YAML uses indentation and is more human-readable but whitespace-sensitive. JSON is better for APIs; YAML for config files."
  - q: "Can JSON have comments?"
    a: "No. Comments are not valid JSON. If you need commented config files, use YAML, TOML, or JSON5 instead."
---

## JSON Syntax Rules

JSON (JavaScript Object Notation) has six value types and a strict syntax. Getting any of these wrong causes a parse error:

| Type | Example |
|------|---------|
| String | `"hello"` |
| Number | `42`, `3.14`, `-7`, `1e10` |
| Boolean | `true`, `false` |
| Null | `null` |
| Array | `[1, 2, 3]` |
| Object | `{"key": "value"}` |

### The Three Most Common JSON Errors

**1. Trailing commas**
```json
// ❌ Not valid JSON (valid in JS and JSON5 though)
{
  "name": "Alice",
  "age": 30,
}

// ✅ Correct
{
  "name": "Alice",
  "age": 30
}
```

**2. Single-quoted strings**
```json
// ❌ JSON requires double quotes
{ 'name': 'Alice' }

// ✅ Correct
{ "name": "Alice" }
```

**3. Comments**
```json
// ❌ JSON has no comments
{
  // This is the user object
  "name": "Alice"
}

// ✅ JSON has no comment syntax — use a "__comment" key if needed
{
  "__comment": "This is the user object",
  "name": "Alice"
}
```

Other common issues:
- Unescaped control characters in strings (tab, newline must be `\t`, `\n`)
- Numbers with leading zeros (`01` is invalid; `1` is correct)
- `undefined` is not a valid JSON value (only `null` is)
- Keys must be strings — `{1: "one"}` is invalid

---

## Formatting Styles

### Compact (minified)

```json
{"name":"Alice","age":30,"roles":["admin","user"]}
```

Use for API responses and network transfer where size matters.

### Pretty-printed (2-space indent)

```json
{
  "name": "Alice",
  "age": 30,
  "roles": ["admin", "user"]
}
```

The standard for config files, stored data, and debugging.

### Command-line formatting

```bash
# Pretty-print with jq
cat data.json | jq .

# Pretty-print from curl
curl -s https://api.example.com/users | jq .

# Extract a specific field
jq '.users[0].email' data.json

# Filter array
jq '.users[] | select(.active == true) | .email' data.json

# Python one-liner
python3 -m json.tool data.json
```

---

## JSON in JavaScript

```javascript
// Parse JSON string to object
const obj = JSON.parse('{"name":"Alice","age":30}');

// Serialize object to JSON string
const str = JSON.stringify(obj);                    // compact
const pretty = JSON.stringify(obj, null, 2);        // 2-space indent

// Deep clone with JSON (simple objects only — loses functions, dates)
const clone = JSON.parse(JSON.stringify(original));

// Replacer: filter which keys to include
const filtered = JSON.stringify(user, ["name", "email"], 2);

// Replacer function
const sanitized = JSON.stringify(user, (key, value) => {
  if (key === "password") return undefined;
  return value;
});

// Reviver: transform values when parsing
const parsed = JSON.parse(str, (key, value) => {
  if (key === "createdAt") return new Date(value);
  return value;
});
```

---

## JSON Schema

JSON Schema is a vocabulary for validating JSON structure. It's widely used in API specs (OpenAPI), form validation, config files, and CI pipelines.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["name", "email", "age"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "roles": {
      "type": "array",
      "items": { "type": "string", "enum": ["admin", "user", "guest"] },
      "uniqueItems": true
    }
  },
  "additionalProperties": false
}
```

Validation libraries:
- **JavaScript**: `ajv` (fastest), `zod` (TypeScript-first)
- **Python**: `jsonschema`, `pydantic`
- **Go**: `gojsonschema`, `github.com/xeipuuv/gojsonschema`

---

## JSONPath Queries

JSONPath is the XPath for JSON — a query language for extracting data:

```
$.store.book[*].author        All book authors
$.store.book[0].title         First book title
$.store.book[-1].title        Last book title
$.store.book[?(@.price < 10)] Books under $10
$..author                     All authors anywhere in tree
$.store.book[0,1]             First two books
$.store.book[0:3]             Books 0, 1, 2 (slice)
```

Used in:
- AWS Step Functions and EventBridge rules
- Kubernetes `jsonpath` output (`kubectl get pods -o jsonpath=...`)
- REST-assured (Java testing)
- jq (though jq has its own syntax)

---

## JSONL (JSON Lines)

JSONL is one JSON value per line — useful for streaming and log files:

```jsonl
{"id":1,"event":"login","user":"alice","ts":1730000000}
{"id":2,"event":"purchase","user":"alice","amount":99.99,"ts":1730000060}
{"id":3,"event":"logout","user":"alice","ts":1730000120}
```

Processing JSONL with jq:
```bash
cat events.jsonl | jq -s '[.[] | select(.event == "purchase")]'
```

---

## JSON5 and JSONC

Two popular extensions that relax JSON's strictness:

**JSON5** (used in Babel, Webpack configs):
- Comments (`//` and `/* */`)
- Trailing commas
- Single-quoted strings
- Unquoted keys
- Multi-line strings

**JSONC** (used in VS Code settings, TypeScript `tsconfig.json`):
- Comments only, otherwise standard JSON

---

## Performance: Parsing Large JSON

For very large JSON files (100MB+):

```javascript
// Streaming parser (Node.js) — processes without loading everything into memory
import { createReadStream } from "fs";
import { chain } from "stream-chain";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";

const pipeline = chain([
  createReadStream("huge.json"),
  parser(),
  streamArray(),
]);

pipeline.on("data", ({ value }) => {
  // Process one item at a time
});
```

For Python: `ijson` library. For Go: `encoding/json` with `Decoder.Token()`.

---

## Try It: ToolNinja JSON Formatter

Paste messy JSON and instantly format, validate, and minify it with the **[ToolNinja JSON Formatter](/tools/json-formatter)**. Highlights syntax errors with line numbers. Runs 100% in your browser.
