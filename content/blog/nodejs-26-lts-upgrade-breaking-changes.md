---
title: "Node.js 26 LTS Upgrade: Every Breaking Change and the Error It Causes"
description: "Node 26 becomes LTS on 28 October 2026. Here's what it removes, the exact error each removal produces, and an upgrade order from Node 20, 22 or 24 that avoids surprises in production."
date: "2026-10-24"
author: "ToolNinja"
coverEmoji: "🟩"
tags: ["node 26", "node.js 26 lts", "node 26 breaking changes", "upgrade node 22 to 26", "_stream_readable", "cannot find module '_stream_readable'", "writeheader is not a function", "was compiled against a different node.js version", "node_module_version 147", "module.register", "dep0205", "experimental-transform-types", "util.isstring is not a function", "temporal api node"]
relatedTools: ["node-26-upgrade-checker", "node-type-stripping-checker", "package-json-inspector"]
faqs:
  - q: "When does Node 26 become LTS, and do I have to upgrade now?"
    a: "Node 26 enters Active LTS on 28 October 2026. Node 22 and Node 24 are still supported LTS lines, so there's no emergency — but Node 20 reached end-of-life in April 2026, and Node 21, 23 and 25 get no fixes at all. If you're on any of those, move to 24 or 26 soon."
  - q: "Can I jump from Node 20 or 22 straight to 26?"
    a: "Yes, and most teams do. Just be aware you inherit every removal from Node 23, 24 and 25 as well as 26 — util.isString(), util.log(), SlowBuffer, fs.F_OK, fs.rmdir with recursive and tls.createSecurePair() among them. The Node.js 26 Upgrade Checker covers that whole range."
  - q: "Why does my app crash with 'was compiled against a different Node.js version'?"
    a: "A native addon in node_modules was built for your old Node version. Node 26 uses NODE_MODULE_VERSION 147, so the binary no longer loads. Delete node_modules and run npm ci on Node 26 — and make sure CI caches and Docker layers don't reuse the old install."
  - q: "Does node file.ts still work on Node 26?"
    a: "Yes — type stripping is on by default, so files that only use erasable TypeScript syntax run directly. What was removed is --experimental-transform-types, the flag that also transformed enums, namespaces and parameter properties. Without it those files fail; rewrite them or keep using tsx or tsc."
---

## Why this upgrade is mostly boring — and where it isn't

Node 26 becomes the Active LTS on **28 October 2026**, and most applications will move to it without changing a line of code. The release is mostly additions: V8 14.6, the **Temporal API enabled by default**, `Map.prototype.getOrInsert()`, `Iterator.concat()` and Undici 8 behind `fetch()`.

The breaking part is a short list of removals — old APIs that printed deprecation warnings for years and are now simply gone — plus a new native-addon ABI. They don't fail quietly: each produces a specific error at startup or the first time the code path runs. Below is each one with the message you'll actually see, so you can match a crash to its cause in seconds. You can also paste your `package.json` and code into the [Node.js 26 Upgrade Checker](/tools/node-26-upgrade-checker) to find them before you upgrade.

## 1. `node:_stream_*` modules are gone (DEP0193)

```text
Error: Cannot find module '_stream_readable'
Error [ERR_UNKNOWN_BUILTIN_MODULE]: No such built-in module: node:_stream_readable
```

The internal modules `_stream_readable`, `_stream_writable`, `_stream_duplex`, `_stream_transform`, `_stream_passthrough` and `_stream_wrap` were never meant to be public. They printed a runtime deprecation since Node 22.17 / 24.2 and are now removed.

**Fix:** import from `node:stream` instead:

```js
// before
const Transform = require("_stream_transform");
// after
const { Transform } = require("node:stream");
```

If the stack trace points into `node_modules`, the culprit is an old dependency — update it rather than patching it.

## 2. `response.writeHeader()` is gone (DEP0063)

```text
TypeError: res.writeHeader is not a function
```

`writeHeader()` was an undocumented alias of `writeHead()` that survived from the very early days of Node. Rename the call — the arguments are identical. Old middleware and hand-rolled HTTP servers are the usual places it hides.

## 3. Native addons need a rebuild (NODE_MODULE_VERSION 147)

```text
Error: The module '/app/node_modules/better-sqlite3/build/Release/better_sqlite3.node'
was compiled against a different Node.js version using NODE_MODULE_VERSION 137.
This version of Node.js requires NODE_MODULE_VERSION 147.
```

Every major Node version changes the ABI for addons that compile against V8 directly. Packages built on Node-API (sharp, sqlite3, most modern addons) keep working; packages that ship one binary per Node version (better-sqlite3, canvas, isolated-vm, re2…) need a release that supports Node 26.

**Fix:** a clean install on the new version — locally, in CI and in Docker:

```bash
rm -rf node_modules
npm ci
```

The trap is caching. A CI cache keyed only on the lockfile, or a Docker layer that copies `node_modules` from a build stage on a different Node version, will happily restore the old binaries. Include the Node version in cache keys.

## 4. `--experimental-transform-types` is removed

```text
node: bad option: --experimental-transform-types
```

Node runs `.ts` files by **stripping** types — that's on by default and stays. The removed flag also *transformed* the TypeScript features that generate runtime code: `enum`, `namespace` with values, and constructor parameter properties. Without it, those features stop working.

**Fix:** either rewrite them into erasable syntax (a union type plus an object instead of an `enum`, explicit fields instead of `constructor(private x: number)`), or run those files through `tsx` or a `tsc` build. The [Type-Stripping Checker](/tools/node-type-stripping-checker) lists every line that needs it.

## 5. New runtime deprecations — warnings now, errors later

These still work in Node 26 but print a warning at runtime, and they're scheduled to be removed:

| Warning | What to do |
|---|---|
| `[DEP0205]` `module.register()` | Move loader hooks to `module.registerHooks()` — synchronous, in-thread, and it works for CommonJS too. Loader tools (ts-node/esm, esmock and similar) need a release that uses it. |
| `[DEP0203]` passing a `CryptoKey` to `node:crypto` | Use WebCrypto (`crypto.subtle`) with CryptoKeys, or convert extractable keys with `KeyObject.from()`. |
| `[DEP0204]` `KeyObject.from()` with a non-extractable key | Keep non-extractable keys inside WebCrypto. |
| `[DEP0201]` `Duplex.toWeb(stream, { type })` | Rename the option to `readableType`. |

To find where a warning comes from, run your tests once with `node --throw-deprecation`: every deprecation becomes an exception with a full stack trace.

Two quieter changes: decrypting AES-GCM with an authentication tag shorter than 16 bytes now requires an explicit `authTagLength` option (DEP0182, end-of-life), and `localStorage` is `undefined` on the server unless you start Node with `--localstorage-file=<path>`.

## 6. Coming from Node 20 or 22? You also inherit these

Removals from Node 23, 24 and 25 hit everyone jumping more than one LTS:

- **`util.isString()`, `util.isFunction()`, `util.isDate()`…** — `TypeError: util.isString is not a function`. Use `typeof`, `Array.isArray()`, `Buffer.isBuffer()` or `instanceof`. (DEP0044–58, removed in 23)
- **`util.log()`** — use `console.log()` or a logger. (DEP0059, 23)
- **`SlowBuffer`** — use `Buffer.allocUnsafeSlow(size)`. (DEP0030, 25)
- **`fs.F_OK`, `fs.R_OK`, `fs.W_OK`, `fs.X_OK`** — these are now `undefined`, so `fs.accessSync(file, fs.R_OK)` silently checks only that the file exists. Use `fs.constants.R_OK`. (DEP0176, 25)
- **`fs.rmdir(path, { recursive: true })`** — the option is gone; use `fs.rm(path, { recursive: true, force: true })`. (DEP0147, 25)
- **`tls.createSecurePair()`** — use `new tls.TLSSocket()`. (DEP0064, 24)
- **`res._headers` / `res._headerNames`** — use `res.getHeaders()` and `res.getHeaderNames()`. (DEP0066, 24)
- **`assert.CallTracker`** — use `mock.fn()` from `node:test`. (DEP0173, 25)
- **`worker.terminate(callback)`** — use the returned promise. (DEP0132, 25)

## 7. Temporal is on — mostly good news

`Temporal` is now a global, just like in current Chrome and Firefox. Server code can drop `@js-temporal/polyfill`, and date math that used to need a library becomes built-in:

```js
const meeting = Temporal.ZonedDateTime.from("2026-10-24T09:00[Europe/Berlin]");
meeting.add({ days: 7 }).toString(); // still 09:00 local time, across the DST change
```

The only things that break are code that defines its own global `Temporal`, and tests that assume it doesn't exist. To see a timestamp in Temporal (and ten other languages), use the [Timestamp Converter](/tools/timestamp-converter).

## The upgrade order that avoids surprises

1. **Check before you switch.** Paste `package.json` and your entry points into the [Node.js 26 Upgrade Checker](/tools/node-26-upgrade-checker). Fix the removed APIs and widen `engines.node` (`"^20 || ^22"` excludes 26 — npm warns, and engine-strict setups refuse to install).
2. **Run the test suite on Node 26 with `--throw-deprecation`.** It turns every deprecation into a stack trace while you still have a working Node 22 or 24 to fall back on.
3. **Clean-install everywhere.** Locally, in CI (`actions/setup-node` with `node-version: 26`, and the Node version in the cache key) and in Docker (`FROM node:26-slim`, with no copied `node_modules`).
4. **Bump `@types/node` to `^26`** so the compiler flags removed APIs too.
5. **Roll out gradually.** Deploy one service or one instance first and watch for deprecation warnings in the logs before moving everything.

For most codebases, steps 1 and 3 are the whole job — the removals are small and loud, and the new ABI is solved by a clean install.
