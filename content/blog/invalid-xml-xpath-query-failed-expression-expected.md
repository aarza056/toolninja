---
title: "Invalid XML / XPath Query Failed: Expression Expected Fix"
description: "XPath errors like 'expression expected' or 'invalid token' appear when XPath syntax is wrong or the XML is malformed. Learn the exact causes and fixes with examples."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "📄"
tags: ["xml", "xpath", "parsing", "xml error", "xpath error", "expression expected"]
relatedTools: ["xpath-tester"]
faqs:
  - q: "What causes 'expression expected' in an XPath query?"
    a: "It means the XPath parser hit a position where an expression was required but found something invalid — typically a typo, an unclosed bracket, or a missing axis specifier."
  - q: "How do I test an XPath expression without writing code?"
    a: "Use an online XPath tester — paste your XML and expression, and it shows matching nodes and any errors immediately."
  - q: "Can a well-formed XML document still fail XPath queries?"
    a: "Yes. The XML can be valid while the XPath expression itself is syntactically wrong. Fix the XPath independent of the XML validity."
---

## The Exact Error

```
XPathException: expression expected
XPathResult Error: Invalid XPath expression
Error: Failed to execute 'evaluate' on 'Document': The string '//div[@class=active]' is not a valid XPath expression.
```

Or in Java:
```
javax.xml.xpath.XPathExpressionException: Invalid XPath expression
```

> Quick summary: The XPath engine found a token it could not parse — missing quotes around an attribute value, unclosed predicates, or an invalid axis name.

---

## Why This Error Happens

XPath is strict about syntax. Common causes:

**1. Missing quotes around attribute value** — `[@class=active]` instead of `[@class='active']`

**2. Unclosed predicate bracket** — `//div[@id='main'` missing the closing `]`

**3. Invalid axis name** — `//div/child:span` instead of `//div/child::span`

**4. Using CSS selector syntax in XPath** — `.class-name` or `#id` are CSS, not XPath

**5. Malformed XML** — unclosed tags cause the document parse to fail before XPath runs

---

## Step-by-Step Diagnosis

### Step 1 — Validate the XML first

```javascript
const parser = new DOMParser();
const doc = parser.parseFromString(xmlString, 'application/xml');
const error = doc.querySelector('parsererror');
if (error) {
  console.error('XML parse error:', error.textContent);
}
```

### Step 2 — Check the XPath expression for missing quotes

```javascript
// WRONG — attribute value without quotes
const bad = "//div[@class=active]";

// RIGHT
const good = "//div[@class='active']";
```

### Step 3 — Try the expression in isolation

```javascript
try {
  const result = doc.evaluate(
    xpathExpr,
    doc,
    null,
    XPathResult.ANY_TYPE,
    null
  );
} catch (e) {
  console.error('XPath error:', e.message);
}
```

---

## Solutions

### Solution 1 — Add quotes around attribute values

```xpath
// WRONG:
//input[@type=text]

// RIGHT:
//input[@type='text']
//input[@type="text"]
```

### Solution 2 — Fix unclosed brackets

```xpath
// WRONG:
//ul[@id='nav']/li[contains(@class,'active'

// RIGHT:
//ul[@id='nav']/li[contains(@class,'active')]
```

### Solution 3 — Use correct axis syntax

```xpath
// WRONG (CSS-style):
div.container > span

// RIGHT (XPath):
//div[@class='container']/span
```

### Solution 4 — Wrap XPath evaluation in try-catch

```javascript
function safeXPath(doc, expression) {
  try {
    return doc.evaluate(
      expression,
      doc,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
  } catch (e) {
    console.error(`Invalid XPath "${expression}":`, e.message);
    return null;
  }
}
```

---

## Real-World Examples

**Scraping with Node.js + xpath package:**

```javascript
// WRONG:
const nodes = xpath.select('//a[@href=https://example.com]', doc);

// RIGHT:
const nodes = xpath.select('//a[@href="https://example.com"]', doc);
```

**Java XPath:**

```java
XPathFactory xpathFactory = XPathFactory.newInstance();
XPath xpath = xpathFactory.newXPath();
XPathExpression expr = xpath.compile("//item[price > 10]");
NodeList nodes = (NodeList) expr.evaluate(doc, XPathConstants.NODESET);
```

---

## Quick Reference — XPath Syntax Cheat Sheet

| Construct | Correct Syntax | Wrong Syntax |
|---|---|---|
| Attribute value | `[@attr='value']` | `[@attr=value]` |
| Contains function | `contains(@class,'name')` | `contains(@class, name)` |
| Child axis | `child::span` | `child:span` |
| Position | `//li[1]` | `//li[0]` (XPath is 1-indexed) |
| And/or | `and` / `or` | `&&` / `||` |

---

## Prevent This Error in the Future

**1. Always quote string values** in predicates: `[@attr='value']`.

**2. Use an XPath tester** to validate before embedding in code.

**3. Validate XML separately** — fix parse errors before debugging XPath.

---

## Use ToolNinja to Debug Faster

The XPath Tester lets you paste XML and test expressions interactively — it highlights matching nodes and shows the exact error position.

🔧 **[XPath Tester — toolninja.io/tools/xpath-tester](https://toolninja.io/tools/xpath-tester)**
