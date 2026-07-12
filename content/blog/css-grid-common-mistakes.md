---
title: "Common CSS Grid Mistakes and How to Fix Them"
description: "The most common CSS Grid mistakes developers make — forgetting display: grid, sizing unit confusion, overflow bugs, typo'd grid-template-areas, and more — each with broken and fixed code."
date: "2026-07-13"
author: "ToolNinja"
coverEmoji: "🎨"
tags: ["css grid not working", "css grid mistakes", "grid-template-columns not working", "css grid overflow", "css grid gap not working", "css grid item not aligning", "css grid vs flexbox", "common css grid errors", "css grid debugging", "grid-template-areas not working", "css grid implicit vs explicit", "css", "frontend", "grid", "layout"]
relatedTools: ["css-gradient", "css-animations"]
faqs:
  - q: "Why isn't my CSS Grid working at all?"
    a: "The most common cause is a missing display: grid (or display: inline-grid) on the parent container. Without it, grid-template-columns, gap, and every other grid property are silently ignored and the children lay out as normal block elements."
  - q: "What's the difference between CSS Grid and Flexbox?"
    a: "Flexbox is one-dimensional — it lays items out along a single row or column and excels at distributing space between them. Grid is two-dimensional — it lets you define rows and columns together and place items precisely in a layout. Use Flexbox for a nav bar or a row of buttons; use Grid for a page layout or a card gallery with rows and columns."
  - q: "Why does my grid item overflow its column?"
    a: "Grid items have a default min-width (and min-height) of auto, which means they refuse to shrink smaller than their content — a long unbroken string or a wide image will blow out the column. Set min-width: 0 on the item to let it shrink to fit the track."
  - q: "Why did my grid-template-areas layout silently break?"
    a: "grid-template-areas has no error reporting — a typo in an area name, a missing cell, or unequal row lengths just makes the browser ignore the property or place items in unexpected default positions. Double-check every named area appears in both the CSS grid-area declarations and the template-areas string, with matching quotes per row."
---

## Why CSS Grid Feels Harder Than It Should Be

CSS Grid is the most powerful layout system in CSS, but it's also the one where small mistakes produce confusing, silent failures — no console error, no red squiggly line, just a layout that doesn't look right. Unlike JavaScript, a broken grid property doesn't throw; it just gets ignored or falls back to a default.

Here are the seven mistakes that account for almost every "why isn't my grid working" question, each with the broken code, why it fails, and the fix.

---

## 1. Forgetting `display: grid` on the Parent

This is, by far, the most common mistake — and the easiest to miss because everything else about your CSS can be correct.

**Broken:**

```css
.container {
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}
```

**Why it fails:** `grid-template-columns`, `gap`, `grid-template-areas` — none of these do anything unless the element is actually a grid container. Without `display: grid`, the browser treats `.container` as a normal block element and every grid property is simply invalid-and-ignored on that element.

**Fixed:**

```css
.container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}
```

---

## 2. Confusing `fr`, `px`, and `%` in `grid-template-columns`

**Broken:**

```css
.container {
  display: grid;
  grid-template-columns: 100% 100% 100%;
}
```

**Why it fails:** Percentages in `grid-template-columns` are relative to the size of the grid container itself — not divided evenly among tracks. Three columns of `100%` each ask for 300% of the container's width, which the browser can't satisfy, so columns overflow or collapse unpredictably.

**Fixed:**

```css
.container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}
```

`fr` (a "fraction unit") divides the *remaining free space* after fixed-size tracks are subtracted — which is what people actually mean when they reach for a percentage. Mix units freely: `grid-template-columns: 200px 1fr 2fr` gives you a fixed 200px sidebar, then splits the rest 1:2 between the remaining two columns.

---

## 3. Grid Items Overflowing Because of `min-width: auto`

**Broken:**

```css
.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.card {
  overflow: hidden;
}
```

A card with a long unbroken URL or a wide `<pre>` block still blows out of its column, even with `overflow: hidden` set.

**Why it fails:** Grid (and Flex) items have an implicit `min-width: auto` and `min-height: auto`. That means the browser refuses to shrink the item below its *content's* intrinsic minimum size — a long word or a wide image — no matter how narrow the track is. `overflow: hidden` only clips visually; it doesn't change the sizing calculation that caused the overflow in the first place.

**Fixed:**

```css
.card {
  min-width: 0;
  overflow: hidden;
}
```

Setting `min-width: 0` (and `min-height: 0` for row overflow) tells the browser it's allowed to shrink the item below its content's natural size, letting `overflow` and `text-overflow: ellipsis` actually do their job.

---

## 4. `grid-gap` vs `gap` — Old vs New Syntax

**Broken (not actually broken, just outdated):**

```css
.container {
  display: grid;
  grid-gap: 16px;
  grid-column-gap: 8px;
}
```

**Why it's a problem:** `grid-gap`, `grid-column-gap`, and `grid-row-gap` were the original Grid-specific property names. They still work in every modern browser via an alias, but the spec renamed them to the unprefixed `gap`, `column-gap`, and `row-gap` — which now also work in Flexbox, not just Grid. Mixing both forms in one codebase is a common source of "wait, which one actually applies?" confusion, and some linters flag the old names as deprecated.

**Fixed:**

```css
.container {
  display: grid;
  gap: 16px;
  column-gap: 8px;
}
```

Use the unprefixed `gap` shorthand (`gap: row column`) everywhere — it's supported in every browser still receiving updates and works identically in Grid and Flexbox.

---

## 5. Typos in `grid-template-areas` (Silent Failure)

**Broken:**

```css
.container {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-areas:
    "sidebar header"
    "sidebar main"
    "sidebar footer";
}
.header  { grid-area: header; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
.sidebar { grid-area: sidebar; }
.nav     { grid-area: nagivation; } /* typo */
```

**Why it fails:** `grid-template-areas` is pure string matching. There's no validation step — a misspelled area name (`nagivation` instead of `navigation`), a row with a different number of cells than the others, or an area referenced in `grid-area` that never appears in the template just gets silently ignored. The element falls back to being auto-placed, which often looks like it "disappeared" from where you expected it.

**Fixed:** Keep every area name consistent between the `grid-template-areas` string and each element's `grid-area` declaration, and make sure every row in the template string has the same number of quoted cells:

```css
.nav { grid-area: navigation; }
```

Tip: name every area only once in the CSS, right next to `grid-template-areas`, as a comment — it makes mismatches easy to spot on review.

---

## 6. Implicit vs Explicit Grid Rows Causing Unexpected Layout

**Broken:**

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 100px 100px;
}
```

If you render 9 items into this grid, the 7th, 8th, and 9th land in rows sized by the browser's default `auto` height, not the fixed `100px` you defined — often producing a visually inconsistent grid where the last row is a different height than the rest.

**Why it happens:** `grid-template-rows` only defines the **explicit** grid — the rows you named up front. Any content that doesn't fit inside that explicit grid spills into the **implicit** grid, which by default sizes rows to `auto` (fit-content).

**Fixed:**

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 100px;
}
```

`grid-auto-rows` sets the size for every row the browser creates implicitly — so overflow rows stay consistent with the rest of the grid. Use `grid-template-rows` for a fixed, known number of rows; use `grid-auto-rows` when the row count depends on dynamic content.

---

## 7. Nested Grids Not Inheriting Parent Sizing

**Broken:**

```css
.outer {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
.inner {
  display: grid;
  grid-template-columns: subgrid; /* used without checking support */
}
```

Or, more commonly, developers expect an `.inner` grid item to automatically line up its own columns with the outer grid's columns — and it doesn't, because a nested grid creates a completely new, independent formatting context by default.

**Why it happens:** A grid item that is itself `display: grid` starts a brand-new grid from scratch. Its rows and columns have no relationship to the parent grid's tracks unless you explicitly opt in.

**Fixed:** Use `subgrid` (supported in all current evergreen browsers as of 2026) to have a nested grid inherit its parent's track sizing directly:

```css
.inner {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / 5;
}
```

If you need to support an older engine without `subgrid`, the fallback is to manually re-declare matching `fr` values on the inner grid, though this breaks the moment the outer grid's tracks change.

---

## Quick Reference

| Mistake | Symptom | Fix |
|---|---|---|
| No `display: grid` | Grid properties do nothing | Add `display: grid` to the parent |
| `%` instead of `fr` | Columns overflow or collapse | Use `fr` units for proportional tracks |
| Content overflows its track | `overflow: hidden` doesn't help | Set `min-width: 0` / `min-height: 0` on the item |
| Mixed `grid-gap` / `gap` | Inconsistent, deprecated syntax | Standardize on `gap` / `column-gap` / `row-gap` |
| Typo in `grid-template-areas` | Item vanishes or misplaces | Match area names exactly, equal cells per row |
| No `grid-auto-rows` | Overflow rows are inconsistent size | Set `grid-auto-rows` for implicit rows |
| Nested grid ignores parent tracks | Inner columns don't line up | Use `subgrid` or manually match `fr` values |

---

## Build Your Layout Visually

ToolNinja doesn't have a dedicated Grid Builder yet, but you can prototype the visual side of a layout right now with the [CSS Gradient Generator](/tools/css-gradient) for backgrounds and panel treatments, and [CSS Animations](/tools/css-animations) for copy-paste transition and hover effects to drop into your grid items. A dedicated visual Grid Builder is on our radar as a future tool — if that's something you'd use, it's a good sign CSS Grid tooling is worth investing in further.
