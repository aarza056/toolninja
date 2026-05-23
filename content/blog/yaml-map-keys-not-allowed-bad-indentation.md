---
title: "YAML: Mapping Values Are Not Allowed / Bad Indentation Fix"
description: "YAML errors like 'mapping values are not allowed here' and 'bad indentation' are caused by specific structural mistakes. Learn the exact rules and how to fix common YAML errors."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "📋"
tags: ["yaml", "yaml error", "indentation", "devops", "configuration", "mapping values not allowed"]
relatedTools: ["json-yaml"]
faqs:
  - q: "What does 'mapping values are not allowed here' mean in YAML?"
    a: "It means a colon was found in a position where a YAML key-value mapping is not valid — typically inside a plain scalar value that should be quoted, or because the indentation created an ambiguous structure."
  - q: "Does YAML allow tabs for indentation?"
    a: "No. YAML explicitly prohibits tab characters for indentation. Use spaces only. Most editors can be configured to expand tabs to spaces."
  - q: "How do I write a multiline string in YAML?"
    a: "Use the literal block scalar (|) for a string that preserves newlines, or the folded block scalar (>) for a string that collapses newlines into spaces. Both start after the key colon and the content is indented."
---

## The Exact Error

```
YAMLException: bad indentation of a mapping entry at line 4, column 3
YAMLException: mapping values are not allowed here at line 7, column 10
Error: YAML parse error — unexpected token ':'
```

> Quick summary: YAML is indentation-sensitive and uses `:` as a key-value separator. A `:` inside an unquoted value, a tab character used for indentation, or inconsistent indentation levels all cause parse failures.

---

## Why This Error Happens

**1. Unquoted value containing a colon** — `message: Hello: World` — the second `:` is misread as a mapping

**2. Tab characters in indentation** — YAML requires spaces; tabs cause parse errors

**3. Inconsistent indentation** — mixing 2-space and 4-space indentation in the same block

**4. Colon in flow mapping without quotes** — `{key: value: extra}` is invalid

**5. Missing space after colon** — `key:value` instead of `key: value`

---

## Step-by-Step Diagnosis

### Step 1 — Check for colons in unquoted values

```yaml
# WRONG:
title: My App: The Sequel

# RIGHT:
title: "My App: The Sequel"
title: 'My App: The Sequel'
```

### Step 2 — Check for tabs

```bash
# Find tabs in a YAML file
grep -P "\t" config.yaml
# Or in editors: show whitespace characters
```

### Step 3 — Validate indentation consistency

```yaml
# WRONG — mixed 2 and 4 spaces:
parent:
  child1: value1
    child2: value2  # This is 4 spaces — inconsistent!

# RIGHT — consistent 2-space indentation:
parent:
  child1: value1
  child2: value2
```

---

## Solutions

### Solution 1 — Quote strings that contain special characters

```yaml
# These all need quoting:
message: "Error: connection refused"
url: "https://example.com/path?key=value"
regex: "[a-z]+: \d+"
version: "1.0"  # Numbers that should be strings
```

### Solution 2 — Replace tabs with spaces

```bash
# Replace all tabs with 2 spaces
sed -i 's/\t/  /g' config.yaml

# Or in VS Code: Edit > Convert Indentation to Spaces
```

### Solution 3 — Use block scalars for multiline strings

```yaml
# Literal block (| preserves newlines):
script: |
  #!/bin/bash
  echo "Hello"
  exit 0

# Folded block (> collapses newlines):
description: >
  This is a long description that
  will be joined into one line.
```

### Solution 4 — Use a YAML linter

```bash
pip install yamllint
yamllint config.yaml
```

---

## Real-World Examples

**Docker Compose — environment variable with URL:**

```yaml
# WRONG:
environment:
  DATABASE_URL: postgresql://user:pass@host:5432/db

# RIGHT (URL contains colons):
environment:
  DATABASE_URL: "postgresql://user:pass@host:5432/db"
```

**GitHub Actions — step name with colon:**

```yaml
# WRONG:
- name: Build: production
  run: npm run build

# RIGHT:
- name: "Build: production"
  run: npm run build
```

---

## Quick Reference — YAML Special Characters That Need Quoting

| Character | Example value | When to quote |
|---|---|---|
| `:` | `"http://example.com"` | Always if followed by space |
| `#` | `"value # not a comment"` | If after a space |
| `{` `}` | `"{ inline: map }"` | In plain scalars |
| `[` `]` | `"[a, b, c]"` | In plain scalars |
| `>` `|` | `"> text"` | At start of value |

---

## Prevent This Error in the Future

**1. Use a YAML-aware editor** with syntax highlighting and validation (VS Code with the YAML extension).

**2. Quote anything that looks like a URL, path, or sentence** — when in doubt, quote it.

**3. Run `yamllint` in CI** to catch YAML errors before deployment.

---

## Use ToolNinja to Debug Faster

The JSON-YAML converter validates YAML and converts between formats — paste your YAML to instantly see if it parses correctly and what the resulting structure looks like.

🔧 **[JSON/YAML Converter — toolninja.io/tools/json-yaml](https://toolninja.io/tools/json-yaml)**
