---
title: "How to Convert Between px, rem, and em (And When It Actually Matters)"
description: "A practical guide to px, rem, and em — the actual math behind each conversion, why em compounds through nested elements and rem doesn't, and a clear rule for which unit to reach for in CSS you're writing today."
date: "2026-10-14"
author: "ToolNinja"
coverEmoji: "📐"
tags: ["px to rem", "rem vs em", "css units explained", "how to convert css units", "rem em px difference", "fluid typography", "css", "frontend"]
relatedTools: ["css-unit-converter", "fluid-typography-calculator"]
faqs:
  - q: "What's the actual formula to convert px to rem?"
    a: "rem = px ÷ root font-size. With the default 16px root font-size, 24px ÷ 16 = 1.5rem. If a project sets a different root font-size (some design systems use 10px specifically to make the math round — 1rem = 10px, so 24px = 2.4rem), use that value instead of 16."
  - q: "Does changing a parent element's font-size affect rem values inside it?"
    a: "No — that's the entire point of rem. It's always relative to the root (html) element's font-size, regardless of how deeply nested the element using it is. em, by contrast, is relative to each element's own (or inherited) font-size, so it does change based on where it's used."
  - q: "Should I ever use px directly in 2026?"
    a: "Yes, for things that genuinely shouldn't scale with user font-size preferences — a 1px border, a fixed-size icon, a specific breakpoint value. The accessibility argument for rem is specifically about text and spacing that should respect a user's browser font-size setting; a hairline border has no such requirement."
---

## Three Units, One Underlying Question

px, rem, and em all describe a length, but they answer a different question about *what that length is relative to*. Getting that distinction wrong is the single most common source of "why is this element a different size than I expected" in CSS.

```text
px   → an absolute length, period. 16px is 16px everywhere, always.
rem  → relative to the ROOT element's font-size. Always the same ratio, everywhere.
em   → relative to the CURRENT element's own (or inherited) font-size. Compounds through nesting.
```

---

## The Conversion Math

```text
rem = px ÷ root-font-size
px  = rem × root-font-size
```

With the browser default root font-size of 16px:

```text
24px  = 1.5rem   (24 ÷ 16)
8px   = 0.5rem   (8 ÷ 16)
1rem  = 16px     (1 × 16)
```

If a project sets `html { font-size: 62.5%; }` — a common trick making the root 10px instead of 16px — the same math applies with 10 as the divisor instead: `24px = 2.4rem`. Always check what the actual root font-size is before converting; assuming 16px when a project overrides it is the most common place this goes wrong.

---

## Why em Compounds and rem Doesn't

This is the part that actually causes bugs, not just conceptual confusion.

```css
.card { font-size: 1.2em; }       /* 1.2 × parent's font-size */
.card .title { font-size: 1.2em; } /* 1.2 × .card's font-size, NOT the root */
```

If `.card` sits inside an element that's already at 1.2em, and `.title` is 1.2em again, the actual rendered size is `1.2 × 1.2 × root-size` — each nested em multiplies against the one before it. This is called **compounding**, and it's the specific, well-documented reason em has a reputation for "unpredictable" sizing in deeply nested components: the same `1.2em` declaration produces a different actual pixel size depending on how deeply nested the element happens to be.

```css
.card { font-size: 1.2rem; }       /* 1.2 × ROOT font-size — always */
.card .title { font-size: 1.2rem; } /* 1.2 × ROOT font-size — still always */
```

rem sidesteps this entirely by always measuring against the root element, no matter how deep the nesting goes. That's why rem became the default recommendation for most sizing in modern CSS — not because em is "wrong," but because rem's behavior doesn't depend on where in the DOM tree a value happens to be used.

---

## When em Is Actually the Right Choice

em isn't a mistake to avoid entirely — it's the correct tool for one specific job: **sizing something relative to its own element's font-size, on purpose.**

```css
.button {
  font-size: 1rem;
  padding: 0.75em 1.5em; /* padding scales WITH the button's own text size */
}

.button.large {
  font-size: 1.5rem; /* padding automatically scales up too, no extra rule needed */
}
```

Here, em is exactly right: the padding should track the button's *own* font-size, whatever that happens to be set to — that's genuinely the relationship you want, not a bug to avoid. This pattern (padding/spacing in em, font-size in rem) is common in well-built component libraries specifically because it lets a single font-size change resize everything proportionally.

---

## pt and % — The Other Two

**pt (point)** is a fixed conversion from px, not relative to anything: `1pt = 96 ÷ 72 px ≈ 1.333px`, based on the universal 96px-per-inch, 72pt-per-inch CSS reference. It's mostly a holdover from print design — there's rarely a reason to use it in a screen stylesheet over px or rem directly.

**% (percent)** is relative to a parent property's value, and *which* property depends entirely on what you're setting — `width: 50%` is relative to the parent's width, `font-size: 150%` is relative to the parent's font-size (behaving exactly like em in that specific case). Useful for genuinely fluid, container-relative sizing; confusing as a general-purpose unit specifically because what it's "50% of" changes per property.

---

## Quick Reference

| Unit | Relative to | Use for |
|---|---|---|
| `px` | Nothing — absolute | Borders, fixed icons, anything that shouldn't scale with user preferences |
| `rem` | Root element's font-size | Font sizes, spacing, most layout values — the safe default |
| `em` | Current element's own font-size | Padding/spacing that should scale *with* that specific element's text |
| `pt` | Fixed ratio to px (96/72) | Rarely needed outside print stylesheets |
| `%` | Depends on the property | Fluid, parent-relative sizing where that's genuinely the goal |

---

## Try It

**[ToolNinja's CSS Unit Converter →](/tools/css-unit-converter)** converts instantly between all five units with a configurable base font size. For responsive type that scales smoothly across viewport sizes rather than jumping at breakpoints, **[the Fluid Typography Calculator →](/tools/fluid-typography-calculator)** builds the `clamp()` expression for you.

---

Sources:
- [CSS Values and Units Module Level 4 — W3C](https://www.w3.org/TR/css-values-4/)
- [CSS length units — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/length)
