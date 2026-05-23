---
title: "TypeError: Cannot convert undefined or null to object ? JS Fix Guide"
description: "This error is thrown by Object.keys(), Object.values(), and Object.entries() when called on null or undefined. Learn the five root causes and the guards that fix each one."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "??"
tags: ["javascript", "typescript", "frontend", "api", "object error", "undefined null to object"]
relatedTools: ["json-to-typescript"]
faqs:
  - q: "Why do Object.keys() and Object.values() throw on null but Array.isArray() doesn't?"
    a: "Object.keys() calls ToObject() internally, which explicitly throws a TypeError for null and undefined per the ECMAScript specification. Array.isArray() is a type-checking function that returns false for any non-array value including null ? it never throws."
  - q: "What is the safest way to iterate over an object's properties when it might be null?"
    a: "Use Object.keys(obj ?? {}) to fall back to an empty object when obj is null or undefined. The nullish coalescing operator (??) returns the right side only when the left is null or undefined ? not for other falsy values like 0 or empty string."
  - q: "How can TypeScript prevent this error at compile time?"
    a: "TypeScript catches this when you type variables correctly. Enable strictNullChecks: true in tsconfig.json. If you declare type as Record<string, unknown> | undefined, TypeScript will error when you pass it to Object.keys() without a null check."
  - q: "Why does this error appear after an API call but not in testing?"
    a: "APIs can return different shapes depending on the response ? an empty result might return null, [], {}, or be omitted. Tests often use mocked data that always has the expected shape. The fix is to normalize API responses at ingestion time."
---

## The Exact Error

```
TypeError: Cannot convert undefined or null to object
```

Or:
```
TypeError: Cannot convert undefined to object (Object.keys called on non-object)
TypeError: null is not an object (evaluating 'Object.keys(data)')
```

> Quick summary: `Object.keys()`, `Object.values()`, or `Object.entries()` was called with `null` or `undefined`. These methods require an actual object. The data either hasn't loaded yet, the API returned null, or the object was accessed at the wrong nesting level.

---

## Why This Error Happens

`Object.keys(x)` converts `x` to an object internally. The ECMAScript `ToObject()` operation throws a `TypeError` for `null` and `undefined`.

Five root causes:

**1. Async timing** ? Calling `Object.keys(data)` before an API response arrives. Initial state is `null`.

**2. API returning null** ? Backend returns `null` instead of `{}` when a record doesn't exist.

**3. Wrong property access** ? `Object.keys(response.data)` when the actual data is at `response.body.data`.

**4. Optional chaining result** ? `Object.keys(user?.preferences)` ? if `user?.preferences` returns `undefined`, this throws.

**5. Destructuring with missing keys** ? `const { settings } = apiResponse` ? if `settings` doesn't exist, it's `undefined`.

---

## Step-by-Step Diagnosis

### Step 1 ? Log the value before the call

```javascript
console.log('data value:', data);
console.log('data type:', typeof data);
Object.keys(data);  // Error here
```

### Step 2 ? Check initial state

```javascript
const [userData, setUserData] = useState(null);  // null initial state!
Object.keys(userData)  // Throws on first render
```

### Step 3 ? Check optional chaining results

```javascript
const prefs = user?.preferences;  // undefined if user is null
Object.keys(prefs);  // TypeError!
```

---

## Solutions

### Solution 1 ? Use nullish coalescing fallback

```javascript
const keys = Object.keys(data ?? {});
const values = Object.values(data ?? {});
const entries = Object.entries(data ?? {});
```

### Solution 2 ? Add an explicit null check

```javascript
if (data != null) {
  const keys = Object.keys(data);
}
```

### Solution 3 ? Initialize state as an empty object

```javascript
const [config, setConfig] = useState({});
// Object.keys(config) always works
```

### Solution 4 ? Normalize API response at fetch time

```javascript
async function fetchUserConfig(userId) {
  const response = await fetch(`/api/users/${userId}/config`);
  const json = await response.json();
  return json?.config ?? {};  // Always returns an object
}
```

### Solution 5 ? TypeScript compile-time check

```typescript
// With strictNullChecks: true:
const [config, setConfig] = useState<UserConfig | null>(null);

if (config !== null) {
  Object.keys(config);  // TypeScript narrows to UserConfig
}
```

---

## Quick Reference

| Situation | Safe pattern |
|---|---|
| Maybe-null from API | `Object.keys(data ?? {})` |
| Initial state before load | `useState({})` |
| Optional chain result | `obj ? Object.keys(obj) : []` |
| Destructured missing property | `const { settings = {} } = response` |

---

## Prevent This Error in the Future

**1. Default destructured values at the source.** Use `const { settings = {} } = response`.

**2. Normalize every API response** before storing in state ? convert `null` to `{}`.

**3. Enable `strictNullChecks: true` in TypeScript.**

---

## Use ToolNinja to Debug Faster

When `Object.keys()` throws because the API returned an unexpected shape, the JSON to TypeScript converter shows exactly what type your API is returning ? including which fields can be `null`.

?? **[JSON to TypeScript ? toolninja.io/tools/json-to-typescript](https://toolninja.io/tools/json-to-typescript)**
