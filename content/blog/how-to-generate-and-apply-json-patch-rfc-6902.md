---
title: "How to Generate and Apply a JSON Patch (RFC 6902) — With Real Examples"
description: "A practical guide to JSON Patch: what the six operations actually do, how to write a real HTTP PATCH request body, and the mistakes that cause a patch to fail against a document that looks like it should accept it."
metaTitle: "JSON Patch (RFC 6902) with Real Examples"
metaDescription: "What the six JSON Patch operations do, how to write an HTTP PATCH body, and why a patch fails against a document that looks right."
date: "2026-10-07"
author: "ToolNinja"
coverEmoji: "🩹"
tags: ["json patch", "rfc 6902", "http patch request", "json pointer", "how to use json patch", "partial update api", "json merge patch vs json patch", "api", "rest"]
relatedTools: ["json-patch-tool", "json-diff"]
faqs:
  - q: "What's the difference between JSON Patch and JSON Merge Patch?"
    a: "JSON Patch (RFC 6902) is an explicit, ordered list of operations with JSON Pointer paths — precise, and able to target specific array elements or assert preconditions, but more verbose. JSON Merge Patch (RFC 7396) is just a partial object merged into the target — more compact, but it can't remove a key without a special null convention and can't address individual array elements at all. Use JSON Patch whenever arrays are involved or you need the 'test' operation's precondition check."
  - q: "What Content-Type does a JSON Patch HTTP request use?"
    a: "application/json-patch+json — a dedicated media type, distinct from plain application/json. Sending a JSON Patch body with the wrong Content-Type is a common cause of a server rejecting an otherwise well-formed request."
  - q: "Can a JSON Patch operation target an array index?"
    a: "Yes — a path like /items/2 targets the third element (zero-indexed) of the items array. The special index - (a literal hyphen) means 'append to the end of the array,' used specifically with the add operation."
  - q: "Why does my patch fail with a 'path does not exist' error?"
    a: "The document you're applying the patch to doesn't match what the patch expects to find at that path — almost always because the patch was generated against a different version of the document than the one it's being applied to. Operations other than add expect the target path to already exist."
---

## The Problem JSON Patch Solves

Updating part of a resource over HTTP has three common approaches, and two of them have real problems. Resending the entire resource (PUT) works but wastes bandwidth and risks clobbering a field someone else updated concurrently. A bespoke "partial update" JSON body works until every client and server has to agree on an undocumented convention for what a missing field means versus an explicit null. JSON Patch (RFC 6902) is the standardized middle ground: an explicit, ordered list of operations describing exactly what changed.

---

## The Six Operations

```json
[
  { "op": "add", "path": "/active", "value": true },
  { "op": "remove", "path": "/legacyField" },
  { "op": "replace", "path": "/role", "value": "senior engineer" },
  { "op": "move", "from": "/tempName", "path": "/name" },
  { "op": "copy", "from": "/address", "path": "/billingAddress" },
  { "op": "test", "path": "/version", "value": 3 }
]
```

| Operation | What it does |
|---|---|
| `add` | Inserts a value at `path`. On an object, creates or overwrites a key. On an array, inserts at that index (shifting later elements right). |
| `remove` | Deletes the value at `path`. |
| `replace` | Equivalent to a `remove` followed by an `add` at the same path — the target must already exist. |
| `move` | Removes the value at `from` and adds it at `path` — a single atomic operation, not two separate ones you write yourself. |
| `copy` | Like `move`, but leaves the original at `from` untouched. |
| `test` | Asserts the value at `path` equals the given `value` — if it doesn't match, the entire patch application fails before any further operations run. |

---

## Paths Are JSON Pointers (RFC 6901), Not JSONPath

This trips people up specifically because both look similar and both show up in JSON tooling. A JSON Patch `path` is a JSON Pointer:

```text
/user/address/city       → object property access, slash-separated
/items/2                 → array index (zero-based)
/items/-                 → "append" — only valid with add
/a~1b                     → the literal key "a/b" — ~1 escapes a literal slash
/m~0n                     → the literal key "m~n" — ~0 escapes a literal tilde
```

JSONPath (`$.user.address.city`, used by tools like the JSONPath Tester) is a separate, more expressive query language for *finding* values. JSON Pointer is deliberately simpler — it addresses exactly one location, with no wildcards or filtering — which is exactly the precision a patch operation needs.

---

## Writing the Actual HTTP Request

```http
PATCH /api/users/42 HTTP/1.1
Content-Type: application/json-patch+json

[
  { "op": "replace", "path": "/role", "value": "senior engineer" },
  { "op": "add", "path": "/tags/-", "value": "rust" }
]
```

The `Content-Type: application/json-patch+json` header matters — it's a distinct media type from `application/json`, and a server implementing RFC 6902 correctly may reject a patch body sent with the generic JSON content type, since that's conventionally reserved for a full-resource representation (what a PUT would send) or a JSON Merge Patch.

---

## Generating a Patch From a Before/After Example

Hand-writing operations for a large nested object is tedious and error-prone. The practical approach: take your "before" document, make the change you want in a copy, and diff the two into a patch automatically.

```text
before:  { "name": "Jane Doe", "role": "engineer", "tags": ["backend", "go"] }
after:   { "name": "Jane Doe", "role": "senior engineer", "tags": ["backend", "go", "rust"] }

generated patch:
[
  { "op": "replace", "path": "/role", "value": "senior engineer" },
  { "op": "add", "path": "/tags/2", "value": "rust" }
]
```

This is almost always faster and less error-prone than writing the operations by hand, especially for anything beyond a one-field change.

---

## Why a Patch Fails to Apply

The most common failure mode: the patch was generated against (or hand-written assuming) a different version of the document than the one it's actually being applied to.

```text
Error: Path "/role" does not exist — cannot replace.
```

Every operation except `add` expects its target path to already exist in the document. If a field was renamed, removed, or the document structure otherwise drifted between when the patch was created and when it's applied, the operation at that path fails — and a well-implemented patch applier should name the exact path and what it expected to find there, not fail silently or apply a partial, inconsistent result.

This is exactly what the `test` operation is for in a concurrent-update scenario: assert the document is still at the version you expect *before* making changes, so a conflicting concurrent update causes a clean, explicit failure instead of silently overwriting someone else's change.

---

## Quick Reference

| Question | Answer |
|---|---|
| Which media type for the HTTP body? | `application/json-patch+json` |
| How do I target an array element? | `/arrayName/2` (zero-indexed) |
| How do I append to an array? | `/arrayName/-` with `op: "add"` |
| How do I escape a `/` or `~` in a key name? | `~1` for `/`, `~0` for `~` |
| How do I guard against a stale/concurrent update? | A `test` operation asserting the expected current value, before your real changes |

---

## Try It

**[ToolNinja's JSON Patch Tool →](/tools/json-patch-tool)** generates a patch from two example documents, or applies an existing patch to a document and shows the resulting output — with a specific error naming the exact path when a patch doesn't apply cleanly. **[JSON Diff Checker →](/tools/json-diff)** also exports its comparison as a JSON Patch directly, if you just need the diff in that format.

---

Sources:
- [RFC 6902 — JavaScript Object Notation (JSON) Patch](https://www.rfc-editor.org/rfc/rfc6902)
- [RFC 6901 — JavaScript Object Notation (JSON) Pointer](https://www.rfc-editor.org/rfc/rfc6901)
- [RFC 7396 — JSON Merge Patch](https://www.rfc-editor.org/rfc/rfc7396)
