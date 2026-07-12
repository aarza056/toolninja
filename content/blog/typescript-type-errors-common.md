---
title: "TypeScript Type Errors: The Ones Every Developer Hits"
description: "A deep dive into the five TypeScript type errors every developer runs into — TS2322, TS2339, TS2345, TS2532, and TS2304 — with root causes, diagnosis steps, fixes, and when to use a type assertion instead."
date: "2026-07-17"
author: "ToolNinja"
coverEmoji: "🔷"
tags: ["type is not assignable to type", "typescript type error", "property does not exist on type", "typescript object is possibly undefined", "typescript argument of type not assignable", "typescript cannot find name", "ts2322", "ts2339", "ts2345", "typescript common errors explained", "typescript", "javascript", "frontend", "errors"]
relatedTools: ["json-to-typescript"]
faqs:
  - q: "What's the fastest way to fix 'Property does not exist on type' (TS2339)?"
    a: "First check for a typo — it's the most common cause. If the property genuinely exists at runtime but TypeScript doesn't know about it, the real fix is correcting or extending the type definition, not silencing the error with `any`. Generate the interface from a real API response with a JSON-to-TypeScript tool if the type was hand-written and drifted out of sync."
  - q: "Is it ever okay to use a type assertion (`as Type`) instead of fixing the underlying type?"
    a: "Yes, in narrow cases: when you have information TypeScript's control-flow analysis can't infer (e.g., you've already validated a value with a runtime check the compiler doesn't recognize), or when working with a third-party type that's genuinely wrong. But an assertion is a promise to the compiler, not a runtime check — if you're wrong, you get a runtime error instead of a compile-time one. Prefer narrowing (if-checks, type guards) over assertions whenever the compiler can be taught the truth instead of just told to trust you."
  - q: "Why does TypeScript say a variable is 'possibly undefined' even though I just checked it?"
    a: "Usually because the check happened on a different reference than the one being used — for example, checking `obj.prop` but then accessing it inside a callback, where TypeScript can no longer guarantee the object wasn't mutated in between. Assign the checked value to a new local `const` before using it in a nested scope, since `const` bindings can't be reassigned and TypeScript trusts the narrowing."
  - q: "What's the real difference between 'not assignable to type' errors on function arguments vs. general assignments?"
    a: "TS2322 (assignment) and TS2345 (argument) are the same underlying type-compatibility check, just triggered at different syntax positions — one on `=`, the other on a function call. The fix is identical in both cases: either the source value's type is genuinely wrong for its destination, or the destination's type is too narrow and needs to be widened, made optional, or turned into a union."
---

## Why These Five Errors Cover Most of TypeScript

TypeScript's error messages are precise but terse, and the same handful of error codes account for the overwhelming majority of "wait, why won't this compile" moments. These five — TS2322, TS2339, TS2345, TS2532, and TS2304 — are all variations on one underlying question the compiler is asking: **does the value you're using actually match the shape you told me it would have?**

For each one: the exact error, the root cause, how to diagnose it, the fix, and when reaching for a type assertion is legitimate versus when it's papering over a real bug.

---

## 1. `Type 'X' is not assignable to type 'Y'` (TS2322)

**The exact error:**

```
Type 'string' is not assignable to type 'number'.
```

**Root cause:** You're assigning a value to a variable, property, or return position whose declared type doesn't accept it. This is TypeScript's core job — catching the moment a value's actual type diverges from its expected type.

```typescript
interface User {
  age: number;
}

const user: User = {
  age: "30", // TS2322: Type 'string' is not assignable to type 'number'
};
```

**Diagnosis:** Hover the flagged value in your editor — TypeScript shows both the actual and expected type. Trace where the value originated: is it coming from an API response (often typed as `any` or `unknown` until parsed), a form input (`string` by default), or a miscast literal?

**Fix:**

```typescript
const user: User = {
  age: 30, // number literal, not a string
};

// Or, if the source is genuinely a string you control (e.g. form input):
const user: User = {
  age: Number(ageInput),
};
```

**When it's a real bug vs. an assertion:** If the value is coming from a form, URL param, or `JSON.parse`, it's genuinely a string at runtime and needs an actual conversion (`Number()`, `parseInt`) — not an assertion. An assertion (`age as number`) would compile but crash or silently misbehave downstream, because the string `"30"` doesn't become a number just because you told the compiler it is.

---

## 2. `Property 'X' does not exist on type 'Y'` (TS2339)

**The exact error:**

```
Property 'firstName' does not exist on type 'User'.
```

**Root cause:** You're accessing a property the compiler doesn't believe exists on that type — either it's a typo, the interface is out of date, or you're accessing a property that only exists on one branch of a union type.

```typescript
interface User {
  name: string;
}

function greet(user: User) {
  console.log(user.firstName); // TS2339: no such property on User
}
```

**Diagnosis:** Check for a typo first (`name` vs. `firstName`) — this is the single most common cause. If there's no typo, check whether the interface was hand-written and has drifted out of sync with the actual API response shape.

**Fix:**

```typescript
interface User {
  name: string;
  firstName?: string; // add the field if it's genuinely part of the shape
}
```

If the type comes from an external API, regenerate it from a real response rather than patching by hand — this is exactly what the [JSON to TypeScript tool](/tools/json-to-typescript) is for: paste a real API response, get an accurate interface, and avoid this class of error at the source.

**When it's a union type issue:**

```typescript
type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };

function area(s: Shape) {
  return s.radius * s.radius; // TS2339: radius doesn't exist on the 'square' branch
}
```

Here the fix is narrowing, not an assertion:

```typescript
function area(s: Shape) {
  if (s.kind === "circle") return s.radius * s.radius;
  return s.side * s.side;
}
```

---

## 3. `Argument of type 'X' is not assignable to parameter of type 'Y'` (TS2345)

**The exact error:**

```
Argument of type 'string' is not assignable to parameter of type 'number'.
```

**Root cause:** Same underlying check as TS2322, but triggered at a function call instead of a variable assignment — the value you're passing doesn't match the parameter's declared type.

```typescript
function double(n: number): number {
  return n * 2;
}

double("5"); // TS2345
```

**Diagnosis:** Check the function's signature and trace where the argument value comes from. This is extremely common when passing `event.target.value` (always a `string`) into a function expecting a `number`.

**Fix:**

```typescript
double(Number("5"));

// Or widen the function to accept both, if that's genuinely valid:
function double(n: number | string): number {
  return Number(n) * 2;
}
```

**When it's a real bug vs. an assertion:** If the caller genuinely has a string that represents a number, convert it — don't assert. An assertion here (`"5" as unknown as number`) would compile but `"5" * 2` behaves correctly in JS due to coercion, while more complex string values would silently produce `NaN` instead of a compile error. Converting explicitly keeps the failure visible.

---

## 4. `Object is possibly 'undefined'` (TS2532)

**The exact error:**

```
Object is possibly 'undefined'.
```

**Root cause:** You're accessing a property or calling a method on a value whose type includes `undefined` — from an optional property, an array `.find()` result, or a function that can return `undefined`.

```typescript
interface Config {
  timeout?: number;
}

function getTimeout(config: Config) {
  return config.timeout.toFixed(2); // TS2532: timeout might be undefined
}
```

**Diagnosis:** Look at the type — is it `T | undefined` or does it have a `?` optional modifier? TypeScript is correctly flagging that the value might not be there at runtime.

**Fix — narrow before use:**

```typescript
function getTimeout(config: Config) {
  if (config.timeout === undefined) return "default";
  return config.timeout.toFixed(2); // narrowed to number here
}

// Or with optional chaining + nullish coalescing:
function getTimeout(config: Config) {
  return config.timeout?.toFixed(2) ?? "default";
}
```

**The nested-scope trap:** narrowing doesn't survive into a callback, because TypeScript can't prove the value wasn't mutated in between:

```typescript
function process(config: Config) {
  if (config.timeout !== undefined) {
    setTimeout(() => {
      console.log(config.timeout.toFixed(2)); // still TS2532 — narrowing lost inside the callback
    }, 100);
  }
}
```

Fix by capturing the narrowed value in a `const` before entering the nested scope:

```typescript
function process(config: Config) {
  if (config.timeout !== undefined) {
    const timeout = config.timeout; // const — TypeScript trusts this won't be reassigned
    setTimeout(() => {
      console.log(timeout.toFixed(2)); // fine
    }, 100);
  }
}
```

**When an assertion (`!`) is legitimate:** the non-null assertion operator (`config.timeout!`) is reasonable only when you have external knowledge the compiler can't — e.g., you validated this earlier in a code path TypeScript can't see across (a separate function call). If you're just trying to silence the error without actually knowing the value is present, you're converting a compile-time error into a runtime crash.

---

## 5. `Cannot find name 'X'` (TS2304)

**The exact error:**

```
Cannot find name 'useState'.
```

**Root cause:** TypeScript has no declaration for this identifier anywhere in scope — it's not imported, not declared, or the `@types` package for a library is missing.

```typescript
function Counter() {
  const [count, setCount] = useState(0); // TS2304 if useState isn't imported
  return count;
}
```

**Diagnosis:** Almost always a missing import. Less commonly: a missing `@types/*` package for an untyped third-party library, or a global you expect to exist (like a browser API in a Node-targeted `tsconfig.json`) that isn't included in your `lib` compiler option.

**Fix — the common case:**

```typescript
import { useState } from "react";
```

**Fix — missing type declarations for a library:**

```bash
npm install --save-dev @types/some-library
```

**Fix — missing lib in tsconfig for browser globals in a Node-configured project:**

```json
{
  "compilerOptions": {
    "lib": ["ES2022", "DOM"]
  }
}
```

There's no legitimate case for an assertion here — `Cannot find name` isn't a type mismatch, it's a missing declaration. The fix is always to make the identifier actually resolve (import, install types, or adjust `lib`), never to cast around it.

---

## Prevent These at the Source

Several of these errors — especially TS2339 and TS2322 — trace back to hand-written or stale type definitions that no longer match the real data shape. The most reliable fix isn't a better assertion, it's generating the type from the actual data:

**[Try the JSON to TypeScript tool →](/tools/json-to-typescript)** — paste a real API response and get an accurate TypeScript interface instantly, so your types match reality instead of a guess from three sprints ago.
