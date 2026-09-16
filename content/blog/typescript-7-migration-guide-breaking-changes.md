---
title: "TypeScript 7 Migration Guide: What Actually Breaks, and How to Fix It"
description: "TypeScript 7's Go-based compiler shipped in mid-2026 turning years of 6.0 deprecation warnings into hard errors. Here's exactly which compilerOptions get removed, which tools break, and the migration order that avoids debugging blind."
date: "2026-09-16"
author: "ToolNinja"
coverEmoji: "🟦"
tags: ["typescript 7", "tsgo", "go compiler", "typescript migration", "project corsa", "tsconfig breaking changes", "node.js type stripping", "typescript-eslint", "ts-morph"]
relatedTools: ["ts7-migration-checker", "node-type-stripping-checker"]
faqs:
  - q: "Do I need to rename tsc to tsgo in my scripts?"
    a: "No — from the TypeScript 7.0 release candidate onward, the command name reverted to the familiar tsc. The Go rewrite (codenamed Project Corsa, package typescript-go) powers it underneath, but your package.json scripts, CI commands, and editor integrations don't need to change just to pick up the new compiler."
  - q: "Will my build just silently produce different output on TypeScript 7?"
    a: "For options that were already deprecated in 6.0 with a warning, no — they now fail the build outright instead of silently changing behavior, which is arguably safer. The bigger silent-breakage risk is tooling that reaches into the compiler programmatically (ts-morph, older typescript-eslint versions) — those can fail in ways that aren't a clear tsc error message, which is why the recommended path is upgrading to 6.0 first to see every warning before they become 7.0 errors."
  - q: "Is Node's native TypeScript support related to TypeScript 7 at all?"
    a: "They're separate but complementary efforts that happened to mature around the same time in 2026. Node's built-in type stripping (on by default since Node 24) has nothing to do with the Go compiler — it just erases TypeScript syntax at runtime via the amaro/SWC transform, with zero type checking. TypeScript 7 is a real compiler doing real type checking. Many teams now use Node's stripping for fast local dev/scripts and still run tsc (now Go-powered) in CI for actual type safety."
  - q: "What's the single biggest gotcha people are hitting?"
    a: "The compiler API break. Any tool that does import * as ts from \"typescript\" and walks the AST programmatically — ts-morph being the most visible casualty — breaks under tsgo because there's no compatible Strada API yet (targeted for 7.1, not 7.0). If your build pipeline depends on a codegen tool, a custom lint rule, or a doc generator built on the TypeScript compiler API, check it explicitly before upgrading — a `tsc --version` bump can quietly break a completely different tool in your toolchain."
---

## A Decade of "Someday" Deprecations Just Became Hard Errors

TypeScript 6.0 spent a release quietly marking a long list of legacy options as deprecated — `target: "es5"`, the `amd`/`umd`/`systemjs`/`none` module formats, a handful of rarely-used compiler flags. Nothing broke. It just warned.

TypeScript 7.0 is the release where all of that warning becomes a hard build failure. The reason it matters more than a typical major version bump: 7.0 isn't just a version number increment, it's a full rewrite of the compiler itself — from TypeScript to Go, under the codename Project Corsa — shipped for the performance TypeScript's userbase has wanted for years. The removals piggyback on that rewrite as a clean break point.

## What's Actually Removed

If your `tsconfig.json` still has any of these, TypeScript 7 will refuse to build:

**`target` values:**
- `es3` and `es5` — gone. **ES2015 is now the minimum target.** If you genuinely need to support pre-ES2015 environments, you'll need a separate downleveling step (Babel) after TypeScript compiles, rather than relying on `tsc` to do it.

**`module` values:**
- `amd`, `umd`, `systemjs`, and `none` — gone. Supported values narrow to `ESNext`, `ES2022`, `NodeNext`, and `CommonJS`. If you're still shipping AMD or UMD bundles, that step now has to happen in your bundler (webpack, Rollup, esbuild), not in `tsc` itself.

**Compiler flags, now hard errors instead of warnings:**
- `keyofStringsOnly`
- `importsNotUsedAsValues`
- `out`
- `prepend`
- `charset`
- `noStrictGenericChecks`

None of these were doing much useful work by 2026 — they're mostly artifacts of TypeScript's early years — but if one is sitting in an inherited `tsconfig.json` you haven't touched in three years, it'll stop your build cold with no warning period. You can check a `tsconfig.json` against this exact list with the [TypeScript 7 Migration Checker](/tools/ts7-migration-checker).

## The Compiler API Is the Real Landmine

The options above are at least loud — your build fails with a clear message pointing at the offending config line. The more disruptive break is quieter: **anything that imports the TypeScript compiler as a library and walks the AST programmatically stops working**, because `tsgo` doesn't yet expose the full "Strada" compiler API that tools like this depend on.

The most visible casualty is **ts-morph** — there's no workaround, since every ts-morph call maps to a Strada API call underneath, and that API isn't there yet. **typescript-eslint** is affected too, though the ecosystem has been actively patching around it. A stable, tgso-compatible programmatic API is targeted for TypeScript 7.1, not 7.0 — meaning if your build depends on a codegen script, a custom ESLint rule, or a documentation generator built on `import * as ts from "typescript"`, budget time to find out whether that specific tool has caught up before you upgrade the compiler underneath it.

## The Migration Order That Doesn't Leave You Debugging Blind

The advice showing up consistently in migration writeups: **don't jump straight from 5.x to 7.0.**

1. **Upgrade to TypeScript 6.0 first**, on its own, and fix every deprecation warning it surfaces. This is the same list of removals above, but as warnings instead of silent hard failures — you get to see and fix them one at a time, with your existing 5.x compiler still working throughout.
2. **Audit your toolchain for compiler-API dependencies** — grep your `package.json` and lockfile for `ts-morph`, check your ESLint config's `typescript-eslint` version, and check any custom build scripts that `import * as ts from "typescript"` directly.
3. **Only then upgrade to 7.0.** By this point the removed options are already gone from your config (step 1 caught them), and you know in advance which tools in your pipeline need a compatible version or a temporary workaround.

Going straight from 5.x to 7.0 means every one of these removals surfaces as a hard failure with no prior warning to guide you — technically the same end state, but a much worse debugging experience getting there.

## Where This Leaves Node's Native TypeScript Support

Worth separating clearly, since the two shipped in the same rough window and get conflated: **Node's built-in TypeScript support is unrelated to the Go compiler rewrite.** Since Node 24 (current LTS as of late 2026), running `node file.ts` directly works out of the box via *type stripping* — a transform (powered by the `amaro` module, itself built on SWC) that erases TypeScript-only syntax and runs the resulting JavaScript, with **zero type checking**.

That means enums, parameter properties (a modifier directly on a constructor parameter), namespaces containing runtime values, and decorators don't work under plain type stripping — they need actual code generation, not just erasure, which type stripping by design doesn't do. Check a file against exactly that list with the [Node.js Type-Stripping Checker](/tools/node-type-stripping-checker).

The practical pattern most teams have landed on: use Node's native stripping for fast local iteration and one-off scripts, and still run `tsc` (now Go-powered, and considerably faster than before) in CI for the type checking that stripping deliberately skips.

## Sources

- [TypeScript 7.0 Migration Guide: Upgrade from TS 5.x to Corsa](https://codingdunia.com/blog/typescript-7-migration-guide/)
- [The TypeScript 7.0 Migration Recipe: Switching to the Go Compiler Without Breaking Your App](https://medium.com/@alexandre.mokni/the-typescript-7-0-migration-recipe-switching-to-the-go-compiler-without-breaking-your-app-9789a846502d)
- [TypeScript 7.0 RC: The Go Rewrite Migration Guide — SitePoint](https://www.sitepoint.com/typescript-70-rc-the-go-rewrite-migration-guide/)
- [Three things `tsgo --noEmit` won't catch in your TypeScript 7 migration — DEV Community](https://dev.to/fernforge/three-things-tsgo-noemit-wont-catch-in-your-typescript-7-migration-ilh)
- [Node.js Native TypeScript: The Complete Guide to Running .ts Files Without a Compiler — DEV Community](https://dev.to/pockit_tools/nodejs-native-typescript-the-complete-guide-to-running-ts-files-without-a-compiler-mpa)
- [TypeScript Without a Build Step: Native Type Stripping in Node.js](https://www.alexcloudstar.com/blog/typescript-without-a-build-step-native-type-stripping-in-nodejs/)
