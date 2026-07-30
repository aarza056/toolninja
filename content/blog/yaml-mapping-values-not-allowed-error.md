---
title: "YAML Error: 'Mapping Values Are Not Allowed in This Context' Explained"
description: "This cryptic YAML parser error almost always comes down to one of three things: an unquoted colon, a stray tab character, or inconsistent indentation. Here's how to spot which one you have."
date: "2026-08-06"
author: "ToolNinja"
coverEmoji: "📐"
tags: ["mapping values are not allowed in this context", "yaml syntax error", "yaml mapping values error", "yaml bad indentation", "github actions yaml error", "docker compose yaml error", "yaml tab character error", "fix yaml error", "yaml", "devops", "errors"]
relatedTools: ["config-validator"]
faqs:
  - q: "Why does my YAML error mention a line number that doesn't seem to be the problem?"
    a: "YAML parsers report the line where they finally realized something was wrong, which is often a few lines after the actual mistake. A missing quote or bad indentation on one line frequently doesn't become a hard error until the parser reaches the next line and can no longer make sense of the structure — check the reported line and the few lines directly above it, not just the exact line number."
  - q: "Can I use tabs for indentation in YAML if I'm careful about consistency?"
    a: "No — this isn't a style preference, it's a hard rule in the YAML specification. Tabs are forbidden for indentation entirely, even a single one, even if every other line uses tabs consistently. Configure your editor to insert spaces when you press Tab in .yml/.yaml files."
  - q: "Why does a step name like 'Build: production' break my GitHub Actions workflow?"
    a: "Because YAML interprets an unquoted colon followed by a space as the start of a new key-value mapping. 'Build: production' looks to the parser like a key named Build with a value of production, not a single string — which conflicts with the step name already being a value itself. Wrapping it in quotes, name: \"Build: production\", tells the parser it's one literal string."
  - q: "Is there a way to catch these errors before they fail in CI?"
    a: "Yes — use an editor with YAML validation built in (VS Code's YAML extension flags this in real time), and run a YAML linter locally before pushing. Catching this at write-time instead of after a CI run fails saves the full round-trip of push, wait, read the failure, fix, push again."
---

## The Error

```
yaml.scanner.ScannerError: mapping values are not allowed here
  in "config.yml", line 4, column 12
```

Or, from a different parser:

```
Error: (<unknown>): mapping values are not allowed in this context at line 2 column 15
```

Every variant says roughly the same thing: the YAML parser was reading along, expecting one kind of structure, and hit a colon (`:`) somewhere it didn't expect one. This shows up constantly in GitHub Actions workflows, `docker-compose.yml`, Kubernetes manifests, and Helm charts — anywhere YAML is used, which in modern DevOps is nearly everywhere.

There are three real causes behind almost every instance of this error.

---

## Cause 1: An Unquoted Value Containing a Colon

This is the most common cause, and the GitHub Actions version of it is especially frequent:

```yaml
steps:
  - name: Build: production
    run: npm run build
```

**Why it fails:** in YAML, a colon followed by a space (`: `) means "this is the start of a key-value mapping." The parser reads `name: Build: production` and gets confused — is `Build` a new nested key under `name`? YAML syntax doesn't allow a mapping value to itself contain an unquoted colon-space sequence, because that's structurally ambiguous.

**Fix:** wrap the whole value in quotes:

```yaml
steps:
  - name: "Build: production"
    run: npm run build
```

This applies to any value with a colon in it — a URL like `http://example.com`, a time like `14:30`, a Windows path like `C:\Users`. When in doubt, quote it.

---

## Cause 2: A Tab Character in the Indentation

```yaml
services:
	web:
	  image: nginx
```

That first line under `services:` might look correctly indented in your editor, but if it's a tab character rather than spaces, YAML rejects it outright.

**Why it fails:** this isn't a style guideline — it's a hard rule in the YAML specification. **Tabs are forbidden for indentation, full stop.** Not "discouraged," not "inconsistent with the rest of the file" — actually disallowed by the spec, and every compliant parser enforces it.

This is a very common copy-paste injury: you copy a snippet from a terminal, a PDF, or a chat message, and it carries an invisible tab character with it that looks identical to spaces in your editor.

**Fix:** configure your editor to insert spaces when you press Tab in `.yml`/`.yaml` files (in VS Code: `"[yaml]": { "editor.insertSpaces": true }` in settings), and if you suspect a pasted snippet, retype the indentation manually rather than trusting what was pasted.

---

## Cause 3: Inconsistent Indentation

```yaml
jobs:
  build:
    steps:
      - run: npm install
        - run: npm test
```

That extra two-space indent before the second `- run:` breaks the structure — it's no longer clear whether it's a sibling step or something nested inside the first one.

**Why it fails:** YAML uses indentation depth to represent nesting, the same way Python does. Mixing 2-space and 4-space indentation within the same block, or inconsistently indenting sibling list items, produces structure the parser can't resolve — sometimes as this exact error, sometimes as a different one, depending on exactly where the ambiguity occurs.

**Fix:** pick one indentation width (2 spaces is the near-universal convention for YAML) and apply it consistently throughout the file. A YAML-aware editor with visible indent guides makes inconsistencies easy to spot before they become a parse error.

---

## Why the Reported Line Number Sometimes Feels Wrong

A frustrating detail about all YAML parser errors: the line number reported is where the parser **finally** gave up, not necessarily where the actual mistake is. A missing quote on line 3 might not produce a hard error until line 4, when the parser tries to make sense of what should logically follow and can't. If the exact reported line looks fine, check the line or two directly above it before assuming the parser is wrong.

---

## Catching These Before CI Does

The slow way to find this bug is: push, wait for the pipeline to run, read the failure, fix one thing, push again. The fast way is to validate locally first.

**[ToolNinja's YAML / TOML / JSON Validator →](/tools/config-validator)** parses your YAML in the browser and reports syntax errors immediately, with the same class of detail the error message gives you but without a CI round-trip — paste a `docker-compose.yml`, a GitHub Actions workflow, or a Kubernetes manifest and catch mapping and indentation errors before they cost you a pipeline run.

---

Sources:
- [How Do I Resolve A "Mapping Values Are Not Allowed Here" Error In YAML? — GeeksforGeeks](https://www.geeksforgeeks.org/devops/how-do-i-resolve-a-mapping-values-are-not-allowed-here-error-in-yaml/)
- [Fix: YAML 'mapping values are not allowed here' and Other YAML Syntax Errors — FixDevs](https://fixdevs.com/blog/yaml-mapping-values-not-allowed-here/)
