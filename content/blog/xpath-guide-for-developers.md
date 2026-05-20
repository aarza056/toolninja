---
title: "XPath for Developers: The Complete Guide to XML and HTML Selection"
description: "Master XPath expressions for web scraping, browser automation, and XML parsing. Covers axes, predicates, functions, and real-world patterns with examples for Selenium, Python, and XSLT."
date: "2026-05-18"
author: "ToolNinja"
coverEmoji: "🔍"
tags: ["xpath tester online", "xpath tutorial", "xpath expressions explained", "xpath cheat sheet", "xpath for web scraping", "xpath selenium", "xpath vs css selectors", "xpath predicates", "xpath axes", "xml xpath guide", "xpath evaluator", "html xpath examples"]
relatedTools: ["xpath-tester"]
faqs:
  - q: "What is the difference between / and // in XPath?"
    a: "A single / selects a direct child — /root/child means child must be a direct child of root. Double // selects descendants at any depth — //child finds all child elements anywhere in the document tree."
  - q: "How do I select an element by its text content in XPath?"
    a: "Use the text() node test with a predicate: //h1[text()='Welcome'] selects h1 elements whose text is exactly 'Welcome'. For partial matches use contains(): //h1[contains(text(), 'Welcome')]."
  - q: "Why does my XPath work in the browser console but not in Selenium?"
    a: "Selenium uses XPath 1.0 evaluated against the live DOM. Common causes of mismatch: dynamic content loaded after page load, iframes that require switching context, shadow DOM elements, or namespace differences in XML vs HTML mode."
  - q: "What is the difference between XPath and CSS selectors?"
    a: "CSS selectors can only traverse downward (parent to child). XPath navigates in any direction — upward to parents and ancestors, sideways to siblings, and downward to children. XPath also supports text content matching and works natively with XML documents."
---

## XPath Fundamentals

XPath (XML Path Language) is the standard query language for selecting nodes from XML and HTML document trees. It's the engine behind XSLT transformations, Selenium locators, web scraping libraries like lxml, and XML parsing in virtually every programming language.

### The Document Tree Model

XPath treats every document as a tree of nodes:

| Node Type | Example | XPath to select |
|-----------|---------|-----------------|
| Element | `<h1>Title</h1>` | `//h1` |
| Attribute | `class="nav"` | `//@class` or `//div/@class` |
| Text | The text inside a tag | `//h1/text()` |
| Comment | `<!-- note -->` | `//comment()` |
| Processing instruction | `<?xml version="1.0"?>` | `//processing-instruction()` |
| Root | The document itself | `/` |

### Basic Path Expressions

```xpath
/root                    # root element
/root/child              # direct child
//element               # element anywhere in document
/root/child[1]           # first child (1-indexed, not 0)
/root/*                  # all child elements
/root/child/@attr        # attribute value
//element/text()         # text content of element
```

---

## The Seven XPath Axes

Axes are the most powerful part of XPath — they define the direction you travel through the tree. Understanding axes is what separates basic XPath from expert-level selectors.

| Axis | Selects | Example |
|------|---------|---------|
| `child::` | Direct children | `child::div` (same as `div`) |
| `parent::` | Parent element | `parent::div` |
| `ancestor::` | All ancestors | `ancestor::table` |
| `descendant::` | All descendants | `descendant::td` |
| `following-sibling::` | Siblings after current | `following-sibling::li` |
| `preceding-sibling::` | Siblings before current | `preceding-sibling::li` |
| `self::` | Current node | `self::div` |
| `ancestor-or-self::` | Ancestors including self | `ancestor-or-self::form` |

### Practical Axis Examples

```xpath
# Find the table that contains a specific cell
//td[text()='Total']/ancestor::table

# Get the label for a form input (the label before it)
//input[@id='email']/preceding-sibling::label

# All list items after the active one
//li[@class='active']/following-sibling::li

# The parent form of a submit button
//button[@type='submit']/parent::form
```

---

## Predicates

Predicates narrow down which nodes to select. They appear in square brackets after a node test.

### Position Predicates

```xpath
//li[1]                  # first li
//li[last()]             # last li
//li[last()-1]           # second to last
//li[position() < 4]     # first three lis
//tr[position() mod 2=0] # even rows
```

### Attribute Predicates

```xpath
//div[@class='active']         # exact class match
//a[@href]                     # any a with an href
//input[@type='checkbox']      # checkboxes
//div[@data-id]                # has data-id attribute
//img[not(@alt)]               # images missing alt text
```

### Text Predicates

```xpath
//button[text()='Submit']                    # exact text
//p[contains(text(), 'error')]               # partial text
//h2[starts-with(text(), 'Chapter')]         # text prefix
//td[normalize-space(text())='Active']       # ignores whitespace
```

### Multi-Condition Predicates

```xpath
//input[@type='text' and @required]          # and
//div[@class='note' or @class='warning']     # or
//tr[td[1]='Admin' and td[2]='Active']       # row where cols match
```

---

## XPath Functions Reference

XPath 1.0 includes a set of built-in functions for strings, numbers, and node sets.

### String Functions

| Function | Description | Example |
|----------|-------------|---------|
| `contains(str, sub)` | True if str contains sub | `contains(@class, 'active')` |
| `starts-with(str, pre)` | True if str starts with pre | `starts-with(@id, 'btn-')` |
| `normalize-space(str)` | Strips leading/trailing whitespace, collapses internal | `normalize-space(text())` |
| `string-length(str)` | Length of string | `string-length(@id) > 5` |
| `substring(str, start, len)` | Extract substring | `substring(@class, 1, 4)` |
| `translate(str, chars, replace)` | Character substitution | Case-insensitive matching |
| `concat(s1, s2, ...)` | String concatenation | `concat('http://', @href)` |

### Number Functions

| Function | Description | Example |
|----------|-------------|---------|
| `count(nodeset)` | Count of nodes | `count(//li)` |
| `sum(nodeset)` | Sum of node values | `sum(//td[@class='price'])` |
| `round(n)` | Round to nearest integer | `round(3.7)` = 4 |
| `floor(n)` | Round down | `floor(3.9)` = 3 |
| `ceiling(n)` | Round up | `ceiling(3.1)` = 4 |

### Node Functions

| Function | Description | Example |
|----------|-------------|---------|
| `name()` | Tag name of current node | `name() = 'input'` |
| `local-name()` | Tag name without namespace | Useful for namespaced XML |
| `position()` | Position in node set | `position() = 1` |
| `last()` | Last position | `position() = last()` |
| `not(expr)` | Boolean negation | `not(@disabled)` |

---

## Web Scraping Patterns

These are the XPath patterns that come up most often in real scraping projects.

### Extracting Structured Data

```xpath
# All product names on a page
//h2[@class='product-title']/text()

# All prices (normalize strips whitespace)
//span[@class='price']/normalize-space(text())

# All links in main navigation
//nav//a/@href

# Table rows (skip header)
//table[@id='results']//tr[position() > 1]

# Second column of every data row
//tbody/tr/td[2]/text()
```

### Finding Elements by Partial Match

```xpath
# Elements where class contains a word (like CSS class contains)
//div[contains(concat(' ', @class, ' '), ' active ')]

# IDs that follow a pattern
//div[starts-with(@id, 'product-')]

# Links to external sites
//a[starts-with(@href, 'http') and not(contains(@href, 'mysite.com'))]

# Inputs of any type except hidden
//input[not(@type='hidden')]
```

### Navigating Relationships

```xpath
# The price that follows a product heading
//h3[text()='Widget Pro']/following-sibling::span[@class='price']

# The form that contains a specific button
//button[contains(text(),'Checkout')]/ancestor::form

# The row where the first cell says "Admin"
//tr[td[1][text()='Admin']]

# All cells in the same row as the selected cell
//td[text()='Target']/parent::tr/td
```

---

## XPath in Browser Automation

### Selenium (Python)

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://example.com")

# Find by XPath
element = driver.find_element(By.XPATH, "//button[@type='submit']")
element.click()

# Wait for element
wait = WebDriverWait(driver, 10)
el = wait.until(EC.presence_of_element_located(
    (By.XPATH, "//div[@id='results']")
))

# Find multiple elements
rows = driver.find_elements(By.XPATH, "//table[@id='data']//tr")
for row in rows:
    cells = row.find_elements(By.XPATH, ".//td")
    print([c.text for c in cells])
```

Note the `.//td` — starting with `.` means "relative to the current element", not the document root.

### Playwright (Python)

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://example.com")
    
    # XPath locator
    page.locator("xpath=//button[@type='submit']").click()
    
    # Get all matching texts
    titles = page.locator("xpath=//h2[@class='title']").all_text_contents()
    
    browser.close()
```

### Python lxml (XML/HTML parsing)

```python
from lxml import etree, html

# XML
tree = etree.fromstring(xml_string)
nodes = tree.xpath("//product[@active='true']/name/text()")

# HTML
doc = html.fromstring(html_string)
prices = doc.xpath("//span[@class='price']/text()")

# With namespace
ns = {"ns": "http://example.com/schema"}
results = tree.xpath("//ns:item", namespaces=ns)
```

### JavaScript (Browser / Node)

```javascript
// Browser: document.evaluate()
const result = document.evaluate(
  "//div[@class='price']",
  document,
  null,
  XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
  null
);

for (let i = 0; i < result.snapshotLength; i++) {
  console.log(result.snapshotItem(i).textContent);
}

// Single node
const node = document.evaluate(
  "//h1",
  document,
  null,
  XPathResult.FIRST_ORDERED_NODE_TYPE,
  null
).singleNodeValue;
```

---

## XPath for XML with Namespaces

Working with namespaced XML (like SOAP, RSS, Atom, SVG) requires namespace declaration in your XPath context.

### The Namespace Problem

```xml
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>My Post</title>
  </entry>
</feed>
```

This XPath fails because `title` is in the Atom namespace:
```xpath
//title           # finds nothing
//entry/title     # finds nothing
```

### The Solution: Register Namespaces

```python
# lxml — register namespace prefixes
ns = {"atom": "http://www.w3.org/2005/Atom"}
titles = tree.xpath("//atom:title/text()", namespaces=ns)

# Multiple namespaces
ns = {
    "soap": "http://schemas.xmlsoap.org/soap/envelope/",
    "ns1": "http://example.com/service"
}
body = tree.xpath("//soap:Body/ns1:GetResponse", namespaces=ns)
```

### local-name() Workaround

When you can't register namespaces, use `local-name()` to ignore the namespace entirely:

```xpath
//*[local-name()='title']           # any title regardless of namespace
//*[local-name()='Body']/*          # children of any Body element
```

This is a practical workaround but select all namespaces — use registered namespaces when possible for correctness.

---

## XPath vs CSS Selectors

Knowing when to use each tool saves debugging time.

| Feature | XPath | CSS |
|---------|-------|-----|
| Navigate up to parent | Yes (`parent::`, `ancestor::`) | No |
| Select by text content | Yes (`text()`, `contains()`) | No (in standard CSS) |
| Sibling traversal | Both directions | Forward only (`~`, `+`) |
| Attribute selection | Yes (`@attr`) | Yes (`[attr]`) |
| Position-based selection | Yes (`[1]`, `[last()]`) | Yes (`:nth-child()`) |
| Works with XML namespaces | Yes | No |
| Browser support | Universal (via `evaluate()`) | Universal |
| Readability | Verbose | Concise |
| Performance in browsers | Slightly slower | Faster |

**Rule of thumb:** use CSS selectors for simple forward-only HTML selection in browsers. Use XPath when you need upward navigation, text content matching, namespace handling, or work with XML (not HTML).

---

## XPath Cheat Sheet

### Quick Reference

```xpath
# Document root
/

# Any element anywhere
//*

# Element by tag
//div

# Element by ID
//div[@id='main']

# Element by class (exact)
//div[@class='container']

# Element by class (contains)
//div[contains(@class, 'btn')]

# Element by text
//button[text()='Submit']

# Element containing text
//p[contains(text(), 'error')]

# First / last / nth
//li[1]   //li[last()]   //li[3]

# All attributes
//@*

# Specific attribute value
//a/@href

# Parent
//span/parent::div

# Ancestor
//td/ancestor::table

# Following sibling
//dt/following-sibling::dd[1]

# Count
count(//input[@required])

# Exists check
boolean(//div[@id='error'])
```

---

## Common Mistakes

**Off-by-one errors** — XPath is 1-indexed, not 0-indexed. `//li[1]` is the first element, `//li[0]` returns nothing.

**Greedy descendant axis** — `//tr` searches the entire document every time. Inside a loop, use relative paths (`.//td`) relative to each row element.

**Text node vs element content** — `//h1/text()` returns the text node as a string. `//h1` returns the element node — use `.text_content()` in lxml or `.textContent` in JavaScript to get the text.

**Whitespace in text()** — HTML frequently includes leading/trailing whitespace in text nodes. Use `normalize-space(text())='Target'` instead of `text()='Target'` for reliable matching.

**Namespace forgetting** — A namespace declaration on the root element affects all descendants. If your XPath finds nothing on namespaced XML, that's almost always the cause.

**Dynamic attributes** — Generated class names or IDs change on every build. Prefer stable semantic attributes like `data-testid`, `name`, `role`, or structural positions over dynamic ones.
