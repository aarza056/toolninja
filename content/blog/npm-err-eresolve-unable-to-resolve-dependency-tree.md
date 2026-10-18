---
title: "npm ERR! code ERESOLVE unable to resolve dependency tree — How to Fix It"
description: "What npm's ERESOLVE error actually means, how to read the Found / Could not resolve lines, and the right fix for each case — upgrading, overrides, or (carefully) --legacy-peer-deps."
date: "2026-10-18"
author: "ToolNinja"
coverEmoji: "🧶"
tags: ["npm", "eresolve", "peer dependencies", "node", "javascript", "package.json"]
relatedTools: ["semver-calculator", "package-json-inspector"]
faqs:
  - q: "What's the difference between --legacy-peer-deps and --force?"
    a: "--legacy-peer-deps tells npm to ignore peer dependencies entirely, the way npm 6 did, so conflicting peer ranges are simply skipped. --force goes further: it accepts conflicting resolutions and can overwrite packages in ways that leave the tree inconsistent. If you must bypass the check, --legacy-peer-deps is the narrower, more predictable option of the two."
  - q: "Is it safe to put legacy-peer-deps=true in .npmrc?"
    a: "It makes every install skip peer-dependency checks, for everyone on the project and in CI, which hides future conflicts as well as the current one. It's reasonable as a temporary unblock with a comment explaining why, but a targeted overrides entry in package.json is the better long-term fix because it only affects the one package you've verified."
  - q: "Why did this start happening after I upgraded npm?"
    a: "npm 7 started installing peer dependencies automatically and treating unsatisfiable peer ranges as errors. npm 6 only printed a warning and carried on. Projects that installed fine for years on npm 6 often hit ERESOLVE the first time they run npm 7 or later, even though the dependency conflict was always there."
  - q: "Will deleting node_modules and package-lock.json fix ERESOLVE?"
    a: "Occasionally, when a stale lockfile pins an old version that conflicts with something you just upgraded. But if two packages genuinely declare incompatible peer ranges, a fresh install fails the same way. Read the error's 'Could not resolve dependency' section first; it tells you which of the two cases you're in."
---

## The Exact Error

```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR!
npm ERR! While resolving: my-app@0.1.0
npm ERR! Found: react@19.1.0
npm ERR! node_modules/react
npm ERR!   react@"^19.1.0" from the root project
npm ERR!
npm ERR! Could not resolve dependency:
npm ERR! peer react@"^16.8.0 || ^17.0.0 || ^18.0.0" from some-chart-lib@2.3.1
npm ERR! node_modules/some-chart-lib
npm ERR!   some-chart-lib@"^2.3.1" from the root project
npm ERR!
npm ERR! Fix the upstream dependency conflict, or retry
npm ERR! this command with --force or --legacy-peer-deps
npm ERR! to accept an incorrect (and potentially broken) dependency resolution.
```

Recent npm versions print the same thing with `npm error` instead of `npm ERR!`. You may also see a close variant, `ERESOLVE could not resolve`, which usually appears when you update one package and it conflicts with something already installed.

> Quick summary: one of your dependencies declares a **peer dependency**: "I need the host project to have react in this version range." The version you actually have falls outside that range, and since npm 7, that's an error rather than a warning.

---

## How to Read It

The error has two halves, and together they answer every question you need:

**`Found:`** is what you actually have: `react@19.1.0`, required by your own project (`from the root project`).

**`Could not resolve dependency:`** is what some package demands: `some-chart-lib@2.3.1` declares `peer react@"^16.8.0 || ^17.0.0 || ^18.0.0"`.

Now check whether the found version fits the demanded range. `^18.0.0` means `>=18.0.0 <19.0.0`, so 19.1.0 is outside every alternative in that range. That's the whole conflict: **a library hasn't declared support for the major version you're on.** Paste the range into a semver checker if a range is less obvious (`~`, `||`, prerelease tags) and you're not sure whether your version is in it.

---

## Why This Error Happens

**1. You upgraded a framework before its ecosystem caught up.** Upgrading to a new React, Angular, ESLint, or TypeScript major version is the most common trigger. Libraries take weeks or months to widen their peer ranges.

**2. A library is unmaintained.** Its peer range was written years ago and will never be updated.

**3. Two libraries want incompatible versions of the same peer.** Library A wants `react@^17` and library B wants `react@^19`. There's no version that satisfies both.

**4. You moved from npm 6 to npm 7+.** npm 6 never installed peer dependencies and only warned about conflicts. The conflict was always there; npm just started enforcing it.

---

## Solutions — In Order of Preference

### Solution 1 — Upgrade the package with the peer dependency

Check whether a newer version supports your setup:

```bash
npm view some-chart-lib versions --json        # all published versions
npm view some-chart-lib@latest peerDependencies # what the latest one requires
```

If the latest release's peer range includes your version, upgrade it:

```bash
npm install some-chart-lib@latest
```

This is the real fix. Nothing is bypassed, and the library author has actually declared support.

### Solution 2 — Use `overrides` for one specific package

If no compatible release exists yet, but you've tested that the library works fine with your version (very common, since peer ranges are often just conservative), tell npm explicitly. In `package.json` (npm 8.3+):

```json
{
  "overrides": {
    "some-chart-lib": {
      "react": "$react"
    }
  }
}
```

`"$react"` means "use the same version the root project depends on." This bypasses the check **for that one package only**, and it's written down in `package.json` where reviewers can see it.

### Solution 3 — Hold back the root dependency

If the library is essential and genuinely breaks on the new major version, stay on the previous major until it catches up:

```bash
npm install react@18 react-dom@18
```

### Solution 4 — `--legacy-peer-deps` (the escape hatch)

```bash
npm install --legacy-peer-deps
```

This skips peer-dependency resolution entirely, the way npm 6 behaved. It works, but it skips **every** peer check, not just this one, including future conflicts you'd want to know about. If you use it, you need it on every install, in CI too, which is why people end up adding `legacy-peer-deps=true` to `.npmrc`. Treat that as temporary, with a comment saying why.

### Avoid: `--force`

`--force` accepts conflicting resolutions and can leave `node_modules` inconsistent. It's broader and less predictable than `--legacy-peer-deps`. If you need to bypass the check at all, use the narrower tool.

---

## Find Out Who Wants What

When the conflict involves a transitive dependency (something your dependency depends on), these commands show the chain:

```bash
npm explain react     # every package that depends on react, and why
npm ls react          # the installed react versions in the tree
```

---

## Quick Reference

| Situation | Fix |
|---|---|
| Newer library version supports your setup | `npm install the-lib@latest` |
| No compatible release, but it works in practice | `overrides` in package.json for that one package |
| Library genuinely breaks on your version | Pin the root dependency to the previous major |
| Need to unblock right now | `--legacy-peer-deps`, temporarily, with a note |
| Two libraries need incompatible versions | Replace or upgrade one of them; no flag truly fixes this |

---

## Prevent This Error in the Future

**1. Check peer ranges before a major upgrade.** Before moving to a new framework major version, run `npm view <lib> peerDependencies` for the libraries that depend on it.

**2. Prefer `overrides` over global flags.** A scoped override documents exactly which conflict you accepted; a global flag hides all of them.

**3. Keep the lockfile committed** so every machine and CI run resolves the same tree, instead of each one rediscovering the conflict differently.

---

## Use ToolNinja to Debug Faster

Not sure whether your version actually falls inside a peer range like `^16.8.0 || ^17.0.0 || ^18.0.0`? Paste the range and your version into the SemVer Calculator. It uses npm's own semver logic and shows the expanded form of the range.

🔧 **[SemVer Calculator & Range Checker — toolninja.io/tools/semver-calculator](https://toolninja.io/tools/semver-calculator)**

And to see which dependencies in a package.json aren't version-pinned, or which ones run install scripts:

🔧 **[package.json Inspector — toolninja.io/tools/package-json-inspector](https://toolninja.io/tools/package-json-inspector)**
