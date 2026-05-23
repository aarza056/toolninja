import os
d = r"d:\Projects\toolninja.io\content\blog"

def w(name, content):
    with open(os.path.join(d, name), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"wrote {name}")

w("invalid-xml-xpath-query-failed-expression-expected.md", """---
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
""")

w("bcrypt-hash-verification-error-salt-password.md", """---
title: "bcrypt Hash Verification Error: Invalid Salt / Password Fix"
description: "bcrypt errors like 'Invalid salt version', 'data and hash arguments required', and 'Invalid hash provided' happen for specific reasons. Learn exactly why and how to fix them."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "🔐"
tags: ["bcrypt", "password hashing", "nodejs", "security", "hash error", "invalid salt"]
relatedTools: ["hash-generator"]
faqs:
  - q: "What does 'Invalid salt version' mean in bcrypt?"
    a: "The stored hash does not start with a recognized bcrypt prefix ($2a$, $2b$, or $2y$). This usually means the hash was truncated, stored incorrectly in the database, or is not a bcrypt hash at all."
  - q: "Why does bcrypt.compare() return false even when the password is correct?"
    a: "The most common cause is that the hash was hashed twice — once when saving and once before comparing. Only hash passwords on the write path; on the read path, pass the plain password to compare()."
  - q: "Can I use bcrypt to hash things other than passwords?"
    a: "Technically yes, but bcrypt truncates input at 72 bytes. Long strings beyond 72 bytes produce the same hash, which can be a security issue. For arbitrary data hashing, use SHA-256 or similar."
---

## The Exact Error

```
Error: Invalid salt version
Error: data and hash arguments required
Error: Invalid hash provided to bcrypt
Error: data must not be empty
```

Or the silent failure:
```javascript
const match = await bcrypt.compare(password, hash);
// match === false  (even though the password is correct)
```

> Quick summary: bcrypt errors come from passing the wrong arguments — an empty string, a non-bcrypt hash, or comparing an already-hashed password against a stored hash.

---

## Why This Error Happens

**1. Hash stored incorrectly** — truncated column, encoding mismatch, or the stored value is not a bcrypt hash

**2. Double hashing** — password hashed before being passed to `bcrypt.compare()`, comparing hash-vs-hash

**3. Empty input** — `bcrypt.hash(undefined)` or `bcrypt.hash('')` depending on version

**4. Wrong library** — mixing `bcryptjs` (pure JS) and `bcrypt` (native) hashes

**5. Hash truncation** — database column too short (e.g., `VARCHAR(50)` instead of `VARCHAR(60)`)

---

## Step-by-Step Diagnosis

### Step 1 — Inspect the stored hash

```javascript
console.log(hash);
// Valid bcrypt hash looks like:
// $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
// Must be exactly 60 characters, start with $2a$, $2b$, or $2y$
console.log(hash.length); // Should be 60
console.log(hash.startsWith('$2'));
```

### Step 2 — Check the registration code for double hashing

```javascript
// WRONG — hashing the password before storage AND before compare
app.post('/login', async (req, res) => {
  const inputHash = await bcrypt.hash(req.body.password, 10); // Don't do this!
  const match = await bcrypt.compare(inputHash, user.hash);
});

// RIGHT
app.post('/login', async (req, res) => {
  const match = await bcrypt.compare(req.body.password, user.hash);
});
```

### Step 3 — Check for empty values

```javascript
if (!password) throw new Error('Password is required');
if (!hash) throw new Error('Hash is required');
const match = await bcrypt.compare(password, hash);
```

---

## Solutions

### Solution 1 — Fix database column length

```sql
-- bcrypt hashes are always 60 characters
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(60) NOT NULL;
```

### Solution 2 — Only hash on write, compare plain on read

```javascript
// Registration (write path) — hash once
const hash = await bcrypt.hash(plainPassword, 10);
await db.query('INSERT INTO users (password_hash) VALUES (?)', [hash]);

// Login (read path) — compare plain password
const storedHash = user.password_hash;
const match = await bcrypt.compare(plainPassword, storedHash);
```

### Solution 3 — Validate before hashing

```javascript
async function hashPassword(plain) {
  if (!plain || typeof plain !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hash(plain, 10);
}

async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  if (!hash.startsWith('$2')) return false;
  return bcrypt.compare(plain, hash);
}
```

---

## Real-World Examples

**Express + Mongoose registration:**

```javascript
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// On login — do NOT hash again
userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};
```

---

## Quick Reference — bcrypt Error Causes

| Error | Most Likely Cause |
|---|---|
| Invalid salt version | Hash is not bcrypt (wrong prefix) |
| data and hash required | Passing undefined/null |
| match === false (unexpectedly) | Double-hashing the password |
| Invalid hash provided | Hash is truncated or corrupted |
| Hash too long | Input exceeds 72 bytes (bcrypt limit) |

---

## Prevent This Error in the Future

**1. Use `VARCHAR(60)` for hash columns** — bcrypt output is always exactly 60 characters.

**2. Never pre-hash before compare()** — only the plain password goes into `compare()`.

**3. Log the hash on registration** during development to confirm it looks correct.

---

## Use ToolNinja to Debug Faster

The Hash Generator lets you create bcrypt hashes and verify them interactively — useful for testing the correct round count and verifying that a known password matches a stored hash.

🔧 **[Hash Generator — toolninja.io/tools/hash-generator](https://toolninja.io/tools/hash-generator)**
""")

w("jwt-invalid-key-size-too-short.md", """---
title: "JWT Error: Invalid Key Size / Key Too Short Fix"
description: "The 'invalid key size' JWT error appears when the secret used to sign or verify a token is shorter than the algorithm requires. Learn the minimum key sizes and how to fix them."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "🔑"
tags: ["jwt", "json web token", "nodejs", "security", "jwt error", "invalid key size", "key too short"]
relatedTools: ["jwt-generator"]
faqs:
  - q: "What is the minimum key size for HS256?"
    a: "HS256 (HMAC-SHA256) requires a secret of at least 256 bits (32 bytes). HS384 requires 384 bits (48 bytes). HS512 requires 512 bits (64 bytes). Using a shorter secret will cause a 'key too short' error in strict libraries."
  - q: "Does JWT key size affect security?"
    a: "Yes. Using a key shorter than the hash output size reduces security. The secret should be at least as long as the hash output — 32 bytes for HS256, 48 for HS384, 64 for HS512."
  - q: "How do I generate a secure JWT secret?"
    a: "Use a cryptographically random generator: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\" — generates a 512-bit (64-byte) hex secret suitable for HS512."
---

## The Exact Error

```
Error: secretOrPrivateKey must have a value
JsonWebTokenError: invalid key size
Error: The secret length must be >= 32 bytes for HS256
io.jsonwebtoken.security.WeakKeyException: The signing key's size is 120 bits which is not secure enough for the HS256 algorithm
```

> Quick summary: The JWT signing secret is too short for the algorithm being used. HS256 needs at least 32 bytes; using `'secret'` (6 bytes) violates this requirement.

---

## Why This Error Happens

HMAC-based JWT algorithms have minimum key size requirements defined in RFC 7518:

| Algorithm | Minimum key length |
|---|---|
| HS256 | 256 bits (32 bytes) |
| HS384 | 384 bits (48 bytes) |
| HS512 | 512 bits (64 bytes) |

Common causes:

**1. Short development secret** — using `'secret'`, `'mysecret'`, or any string under 32 bytes

**2. Environment variable not set** — `process.env.JWT_SECRET` is `undefined`

**3. Wrong algorithm for key type** — using RSA public key with HS256

---

## Step-by-Step Diagnosis

### Step 1 — Check the secret length

```javascript
const secret = process.env.JWT_SECRET;
console.log('Secret length (bytes):', Buffer.byteLength(secret, 'utf8'));
// Must be >= 32 for HS256
```

### Step 2 — Check for undefined

```javascript
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}
```

### Step 3 — Check algorithm compatibility

```javascript
// RS256 requires RSA private key, not a string secret
// HS256 requires a string/buffer secret
const algorithm = 'HS256'; // or RS256, ES256
```

---

## Solutions

### Solution 1 — Generate a proper secret

```bash
# Node.js — generate 64 random bytes as hex (128 hex chars = 512 bits)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or base64
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Add to `.env`:
```
JWT_SECRET=your-generated-64-byte-hex-string-here
```

### Solution 2 — Validate the secret at startup

```javascript
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

if (Buffer.byteLength(JWT_SECRET, 'utf8') < 32) {
  throw new Error('JWT_SECRET must be at least 32 bytes for HS256');
}
```

### Solution 3 — Use RS256 with proper key pair (recommended for production)

```javascript
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const token = jwt.sign({ userId: 1 }, privateKey, { algorithm: 'RS256' });
const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
```

---

## Real-World Examples

**Express JWT middleware:**

```javascript
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;
if (Buffer.byteLength(secret, 'utf8') < 32) {
  throw new Error('JWT_SECRET too short — minimum 32 bytes for HS256');
}

export function signToken(payload) {
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '1h' });
}

export function verifyToken(token) {
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}
```

---

## Quick Reference — Key Size Requirements

| Algorithm | Type | Min Key Size | Use Case |
|---|---|---|---|
| HS256 | Symmetric | 32 bytes | Internal services |
| HS384 | Symmetric | 48 bytes | Internal services |
| HS512 | Symmetric | 64 bytes | Internal services |
| RS256 | Asymmetric | 2048-bit RSA | Public APIs |
| ES256 | Asymmetric | P-256 curve | Public APIs |

---

## Prevent This Error in the Future

**1. Generate secrets programmatically** — never type a JWT secret by hand.

**2. Validate secret length at app startup** — fail fast rather than discovering the error at runtime.

**3. Use RS256 for APIs** that will have multiple consumers or public key distribution.

---

## Use ToolNinja to Debug Faster

The JWT Generator lets you create and inspect JWTs interactively — useful for verifying token structure and testing signing with different algorithms.

🔧 **[JWT Generator — toolninja.io/tools/jwt-generator](https://toolninja.io/tools/jwt-generator)**
""")

w("uri-malformed-error-javascript-url-parsing.md", """---
title: "URIError: URI Malformed — JavaScript URL Parsing Fix"
description: "The 'URI malformed' error in JavaScript happens when decodeURIComponent() or decodeURI() receives a string with invalid percent-encoding. Learn the exact causes and safe decoding patterns."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "🔗"
tags: ["javascript", "url", "uri", "encoding", "uriError", "malformed uri", "decodeURIComponent"]
relatedTools: ["url-encoder"]
faqs:
  - q: "What is the difference between decodeURI and decodeURIComponent?"
    a: "decodeURI() decodes a complete URI and leaves reserved characters (; , / ? : @ & = + $ #) encoded. decodeURIComponent() decodes every percent-encoded character including reserved ones. Use decodeURIComponent for query parameter values."
  - q: "Why does '%' in a URL cause a URIError?"
    a: "A bare % sign that is not followed by two hex digits is invalid percent-encoding. The decoder throws URIError: URI malformed instead of guessing what it means."
  - q: "How do I safely decode a URL that might be malformed?"
    a: "Wrap decodeURIComponent in a try-catch and fall back to the raw string, or use a URL-parsing library that handles malformed input gracefully."
---

## The Exact Error

```
URIError: URI malformed
URIError: malformed URI sequence
URIError: The URI to be decoded is not a valid encoding
```

> Quick summary: `decodeURIComponent()` or `decodeURI()` received a string containing a `%` not followed by two valid hex digits. The most common source is user-supplied URLs or improperly encoded query strings.

---

## Why This Error Happens

Percent-encoding requires `%` followed by exactly two hexadecimal characters (`0-9`, `A-F`). Any other sequence throws:

**1. Bare % in the string** — `hello%world` — `%wo` is not valid hex

**2. Truncated encoding** — `value%2` — incomplete sequence

**3. Decoding twice** — calling `decodeURIComponent` on an already-decoded string that contains `%` as a literal character

**4. User input** — a user pastes a URL with `%` not meant as an escape character

---

## Step-by-Step Diagnosis

### Step 1 — Identify where the malformed input comes from

```javascript
const raw = req.query.redirect; // User-supplied
console.log('Raw value:', raw);
// Check for invalid % sequences
console.log('Has bare %:', /%(?![0-9A-Fa-f]{2})/.test(raw));
```

### Step 2 — Check for double decoding

```javascript
// If the string was already decoded, it may contain literal % signs
// that are not valid percent-encoding
const alreadyDecoded = 'hello 50% done';
decodeURIComponent(alreadyDecoded); // URIError: % is followed by ' d'
```

### Step 3 — Verify the encoding at the source

```javascript
// Always encode before sending
const param = encodeURIComponent('value with % and spaces');
// Use this in the URL, then decode on the receiving end
```

---

## Solutions

### Solution 1 — Wrap in try-catch

```javascript
function safeDecode(str) {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}
```

### Solution 2 — Sanitize % signs before decoding

```javascript
function decodeSafe(str) {
  // Replace bare % (not followed by two hex digits) with %25
  const sanitized = str.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
  return decodeURIComponent(sanitized);
}
```

### Solution 3 — Use the URL API instead of manual decoding

```javascript
try {
  const url = new URL(input);
  // url.searchParams automatically handles decoding
  const value = url.searchParams.get('redirect');
} catch (e) {
  console.error('Invalid URL:', e.message);
}
```

### Solution 4 — Encode properly at the source

```javascript
// Building a URL with query parameters
const base = 'https://example.com/search';
const params = new URLSearchParams({ q: 'hello world & more', page: '2' });
const fullUrl = `${base}?${params.toString()}`;
// All values are properly encoded automatically
```

---

## Real-World Examples

**Express.js route handling:**

```javascript
app.get('/redirect', (req, res) => {
  let target;
  try {
    target = decodeURIComponent(req.query.to || '');
  } catch {
    return res.status(400).json({ error: 'Invalid redirect URL' });
  }

  if (!target.startsWith('/')) {
    return res.status(400).json({ error: 'Invalid redirect target' });
  }

  res.redirect(target);
});
```

---

## Quick Reference — URL Encoding Functions

| Function | Encodes | Leaves unencoded |
|---|---|---|
| `encodeURIComponent(s)` | All except `A-Z a-z 0-9 - _ . ! ~ * ' ( )` | Unreserved chars |
| `encodeURI(s)` | Special chars except `;,/?:@&=+$#` | URI structure chars |
| `decodeURIComponent(s)` | Decodes all `%XX` sequences | — |
| `decodeURI(s)` | Decodes all except `;,/?:@&=+$#` | — |

---

## Prevent This Error in the Future

**1. Always use `encodeURIComponent`** for individual query parameter values.

**2. Use `URLSearchParams`** to build query strings — it handles encoding automatically.

**3. Wrap `decodeURIComponent` in try-catch** when handling any user-supplied input.

---

## Use ToolNinja to Debug Faster

The URL Encoder lets you encode and decode URL components interactively — paste any string to see the correct percent-encoded form or decode a malformed URL fragment.

🔧 **[URL Encoder — toolninja.io/tools/url-encoder](https://toolninja.io/tools/url-encoder)**
""")

w("yaml-map-keys-not-allowed-bad-indentation.md", """---
title: "YAML: Mapping Values Are Not Allowed / Bad Indentation Fix"
description: "YAML errors like 'mapping values are not allowed here' and 'bad indentation' are caused by specific structural mistakes. Learn the exact rules and how to fix common YAML errors."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "📋"
tags: ["yaml", "yaml error", "indentation", "devops", "configuration", "mapping values not allowed"]
relatedTools: ["json-yaml"]
faqs:
  - q: "What does 'mapping values are not allowed here' mean in YAML?"
    a: "It means a colon was found in a position where a YAML key-value mapping is not valid — typically inside a plain scalar value that should be quoted, or because the indentation created an ambiguous structure."
  - q: "Does YAML allow tabs for indentation?"
    a: "No. YAML explicitly prohibits tab characters for indentation. Use spaces only. Most editors can be configured to expand tabs to spaces."
  - q: "How do I write a multiline string in YAML?"
    a: "Use the literal block scalar (|) for a string that preserves newlines, or the folded block scalar (>) for a string that collapses newlines into spaces. Both start after the key colon and the content is indented."
---

## The Exact Error

```
YAMLException: bad indentation of a mapping entry at line 4, column 3
YAMLException: mapping values are not allowed here at line 7, column 10
Error: YAML parse error — unexpected token ':'
```

> Quick summary: YAML is indentation-sensitive and uses `:` as a key-value separator. A `:` inside an unquoted value, a tab character used for indentation, or inconsistent indentation levels all cause parse failures.

---

## Why This Error Happens

**1. Unquoted value containing a colon** — `message: Hello: World` — the second `:` is misread as a mapping

**2. Tab characters in indentation** — YAML requires spaces; tabs cause parse errors

**3. Inconsistent indentation** — mixing 2-space and 4-space indentation in the same block

**4. Colon in flow mapping without quotes** — `{key: value: extra}` is invalid

**5. Missing space after colon** — `key:value` instead of `key: value`

---

## Step-by-Step Diagnosis

### Step 1 — Check for colons in unquoted values

```yaml
# WRONG:
title: My App: The Sequel

# RIGHT:
title: "My App: The Sequel"
title: 'My App: The Sequel'
```

### Step 2 — Check for tabs

```bash
# Find tabs in a YAML file
grep -P "\\t" config.yaml
# Or in editors: show whitespace characters
```

### Step 3 — Validate indentation consistency

```yaml
# WRONG — mixed 2 and 4 spaces:
parent:
  child1: value1
    child2: value2  # This is 4 spaces — inconsistent!

# RIGHT — consistent 2-space indentation:
parent:
  child1: value1
  child2: value2
```

---

## Solutions

### Solution 1 — Quote strings that contain special characters

```yaml
# These all need quoting:
message: "Error: connection refused"
url: "https://example.com/path?key=value"
regex: "[a-z]+: \\d+"
version: "1.0"  # Numbers that should be strings
```

### Solution 2 — Replace tabs with spaces

```bash
# Replace all tabs with 2 spaces
sed -i 's/\\t/  /g' config.yaml

# Or in VS Code: Edit > Convert Indentation to Spaces
```

### Solution 3 — Use block scalars for multiline strings

```yaml
# Literal block (| preserves newlines):
script: |
  #!/bin/bash
  echo "Hello"
  exit 0

# Folded block (> collapses newlines):
description: >
  This is a long description that
  will be joined into one line.
```

### Solution 4 — Use a YAML linter

```bash
pip install yamllint
yamllint config.yaml
```

---

## Real-World Examples

**Docker Compose — environment variable with URL:**

```yaml
# WRONG:
environment:
  DATABASE_URL: postgresql://user:pass@host:5432/db

# RIGHT (URL contains colons):
environment:
  DATABASE_URL: "postgresql://user:pass@host:5432/db"
```

**GitHub Actions — step name with colon:**

```yaml
# WRONG:
- name: Build: production
  run: npm run build

# RIGHT:
- name: "Build: production"
  run: npm run build
```

---

## Quick Reference — YAML Special Characters That Need Quoting

| Character | Example value | When to quote |
|---|---|---|
| `:` | `"http://example.com"` | Always if followed by space |
| `#` | `"value # not a comment"` | If after a space |
| `{` `}` | `"{ inline: map }"` | In plain scalars |
| `[` `]` | `"[a, b, c]"` | In plain scalars |
| `>` `|` | `"> text"` | At start of value |

---

## Prevent This Error in the Future

**1. Use a YAML-aware editor** with syntax highlighting and validation (VS Code with the YAML extension).

**2. Quote anything that looks like a URL, path, or sentence** — when in doubt, quote it.

**3. Run `yamllint` in CI** to catch YAML errors before deployment.

---

## Use ToolNinja to Debug Faster

The JSON-YAML converter validates YAML and converts between formats — paste your YAML to instantly see if it parses correctly and what the resulting structure looks like.

🔧 **[JSON/YAML Converter — toolninja.io/tools/json-yaml](https://toolninja.io/tools/json-yaml)**
""")

print("Batch 4 done")
