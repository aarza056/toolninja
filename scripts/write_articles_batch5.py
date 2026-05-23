import os
d = r"d:\Projects\toolninja.io\content\blog"

def w(name, content):
    with open(os.path.join(d, name), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"wrote {name}")

w("http-415-unsupported-media-type.md", """---
title: "HTTP 415 Unsupported Media Type: Causes and Fix"
description: "HTTP 415 Unsupported Media Type means the server rejected the request body because the Content-Type header doesn't match what it accepts. Learn how to diagnose and fix it."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "📡"
tags: ["http", "http 415", "content-type", "api", "rest api", "unsupported media type"]
relatedTools: ["http-request"]
faqs:
  - q: "What is HTTP 415 Unsupported Media Type?"
    a: "It means the server understands the request method but refuses to process it because the payload is in a format it does not support. The client needs to change the Content-Type header to match what the server accepts."
  - q: "What is the most common cause of HTTP 415?"
    a: "Sending JSON with Content-Type: text/plain or no Content-Type header at all. The server expects application/json but receives no declaration of what the body format is."
  - q: "How do I find out what Content-Type a server accepts?"
    a: "Check the API documentation, or send an OPTIONS request to the endpoint. Some APIs also return an Accept header in error responses indicating what they support."
---

## The Exact Error

```
HTTP/1.1 415 Unsupported Media Type
{
  "error": "Unsupported Media Type",
  "message": "Content type 'text/plain' not supported"
}
```

Or in frameworks:
```
org.springframework.web.HttpMediaTypeNotSupportedException: Content type 'application/x-www-form-urlencoded' not supported
```

> Quick summary: The request body format declared in `Content-Type` doesn't match what the server accepts. Set `Content-Type: application/json` when sending JSON, or `multipart/form-data` for file uploads.

---

## Why This Error Happens

**1. Missing Content-Type header** — sending a JSON body without declaring `Content-Type: application/json`

**2. Wrong Content-Type for the body** — sending JSON but declaring `Content-Type: text/plain` or `application/x-www-form-urlencoded`

**3. File upload without multipart** — sending a file with `Content-Type: application/json` instead of `multipart/form-data`

**4. Charset mismatch** — some servers require `application/json; charset=utf-8` not just `application/json`

---

## Step-by-Step Diagnosis

### Step 1 — Check what Content-Type you're sending

```javascript
// In fetch:
fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json', // <-- this must match the body format
  },
  body: JSON.stringify({ name: 'Alice' }),
});
```

### Step 2 — Check what the server expects

```bash
# Send an OPTIONS request to check CORS and accepted types
curl -X OPTIONS https://api.example.com/endpoint \
  -H "Origin: http://localhost:3000" \
  -v
```

### Step 3 — Inspect the full request in browser DevTools

Open Network tab, click the request, and look at the Request Headers section. Confirm `Content-Type` is set correctly.

---

## Solutions

### Solution 1 — Set correct Content-Type for JSON

```javascript
// fetch
const response = await fetch('/api/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// axios — sets Content-Type automatically for objects
const response = await axios.post('/api/data', data);
```

### Solution 2 — Set correct Content-Type for form data

```javascript
// For HTML form data
const formData = new URLSearchParams({ username: 'alice', password: 'pass' });
const response = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: formData.toString(),
});
```

### Solution 3 — Set correct Content-Type for file uploads

```javascript
// Do NOT set Content-Type manually for FormData — the browser sets it
// automatically with the correct boundary parameter
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('name', 'upload');

const response = await fetch('/api/upload', {
  method: 'POST',
  // No Content-Type header here — let the browser set it
  body: formData,
});
```

### Solution 4 — Server side: accept additional media types (Express)

```javascript
// If you control the server and want to accept both formats:
app.use(express.json());                          // application/json
app.use(express.urlencoded({ extended: true }));  // application/x-www-form-urlencoded
```

---

## Real-World Examples

**curl command with correct Content-Type:**

```bash
# WRONG:
curl -X POST https://api.example.com/users -d '{"name":"Alice"}'

# RIGHT:
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}'
```

---

## Quick Reference — Content-Type by Body Format

| Body format | Correct Content-Type |
|---|---|
| JSON object | `application/json` |
| HTML form fields | `application/x-www-form-urlencoded` |
| File upload | `multipart/form-data` (set by browser) |
| Plain text | `text/plain` |
| XML | `application/xml` or `text/xml` |
| Binary/blob | `application/octet-stream` |

---

## Prevent This Error in the Future

**1. Use a typed HTTP client** like axios that sets `Content-Type` automatically for object bodies.

**2. Never manually set Content-Type for FormData** — the browser must add the boundary parameter.

**3. Add Content-Type validation in API tests** to catch mismatches early.

---

## Use ToolNinja to Debug Faster

The HTTP Request tool lets you build and send requests with full control over headers and body format — test your Content-Type against real APIs directly in the browser.

🔧 **[HTTP Request Tool — toolninja.io/tools/http-request](https://toolninja.io/tools/http-request)**
""")

w("http-401-unauthorized-vs-403-forbidden.md", """---
title: "HTTP 401 vs 403: Unauthorized vs Forbidden Explained"
description: "HTTP 401 Unauthorized and 403 Forbidden are both auth-related errors but mean different things. Learn the exact difference and how to fix each one."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "🚫"
tags: ["http", "http 401", "http 403", "unauthorized", "forbidden", "authentication", "authorization"]
relatedTools: ["http-status-codes"]
faqs:
  - q: "What is the difference between 401 and 403?"
    a: "401 Unauthorized means you are not authenticated — the server does not know who you are. 403 Forbidden means you are authenticated but not authorized — the server knows who you are but you don't have permission."
  - q: "Why is 401 called 'Unauthorized' if it's really about authentication?"
    a: "Historical naming confusion in RFC 2616. The HTTP spec uses 'Authorization' to mean 'provide credentials', not 'check permissions'. The name stuck even though the semantic meaning is about authentication."
  - q: "Should I use 401 or 403 when a user is logged in but lacks a role?"
    a: "Use 403 Forbidden. The user is authenticated (you know who they are) but not authorized (they don't have the required role or permission). Reserve 401 for 'I don't know who you are — send credentials'."
---

## The Exact Error

```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api"
{
  "error": "Unauthorized",
  "message": "No authentication token provided"
}
```

```
HTTP/1.1 403 Forbidden
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

> Quick summary: **401** = "who are you? send credentials." **403** = "I know who you are, but you can't do this."

---

## Why This Matters

Using the wrong status code causes client-side bugs:

- A 401 response should include a `WWW-Authenticate` header so the client knows how to authenticate
- An HTTP client or browser that receives 401 may automatically prompt for credentials or retry with stored credentials
- A 403 signals that retrying with different credentials won't help — the user needs elevated permissions

---

## The Key Distinction

| Scenario | Correct code | Reason |
|---|---|---|
| No token in request | 401 | Not authenticated |
| Expired JWT token | 401 | Authentication failed |
| Invalid API key | 401 | Authentication failed |
| Token valid but role insufficient | 403 | Authenticated, not authorized |
| Resource belongs to another user | 403 | Authenticated, not authorized |
| IP not whitelisted | 403 | Access denied regardless of auth |
| Resource does not exist (security) | 404 | Hide existence from unauthorized user |

---

## Step-by-Step Diagnosis

### Step 1 — Check if you're sending credentials at all

```javascript
const response = await fetch('/api/admin', {
  headers: {
    Authorization: `Bearer ${token}`, // Is this set?
  },
});

if (response.status === 401) {
  // No valid credentials — redirect to login
  router.push('/login');
}
```

### Step 2 — Check token validity

```javascript
function isTokenExpired(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.exp * 1000 < Date.now();
}

if (isTokenExpired(token)) {
  // Refresh the token or redirect to login
}
```

### Step 3 — Check user permissions

```javascript
if (response.status === 403) {
  // User is logged in but lacks permission
  // Show "Access Denied" UI, not login page
  showAccessDenied();
}
```

---

## Solutions

### Solution 1 — Return the right code on the server (Express)

```javascript
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user.roles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

### Solution 2 — Handle both on the client

```javascript
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    return;
  }

  if (response.status === 403) {
    throw new Error('Access denied — insufficient permissions');
  }

  return response.json();
}
```

---

## Real-World Examples

**AWS API Gateway:**
- Returns 401 when the JWT is missing or invalid
- Returns 403 when the JWT is valid but the IAM policy denies the action

**GitHub API:**
- Returns 401 when no token or bad token
- Returns 403 when rate limited or accessing a private resource without the correct scope

---

## Quick Reference — Auth Error Status Codes

| Code | Name | When to use | Client action |
|---|---|---|---|
| 401 | Unauthorized | No or invalid credentials | Prompt login / refresh token |
| 403 | Forbidden | Valid credentials, no permission | Show access denied UI |
| 404 | Not Found | Hide sensitive resource existence | Treat as not found |
| 407 | Proxy Auth Required | Proxy needs credentials | Authenticate with proxy |

---

## Prevent This Error in the Future

**1. Use 401 only when authentication is the issue** — missing, expired, or invalid credentials.

**2. Use 403 when the identity is known but access is denied** — wrong role, wrong scope, resource belongs to someone else.

**3. Include `WWW-Authenticate` in 401 responses** — it tells the client which auth scheme to use.

---

## Use ToolNinja to Debug Faster

The HTTP Status Codes reference gives you the full definition, typical causes, and fix strategies for every HTTP status code.

🔧 **[HTTP Status Codes — toolninja.io/tools/http-status-codes](https://toolninja.io/tools/http-status-codes)**
""")

w("cors-error-no-access-control-allow-origin.md", """---
title: "CORS Error: No 'Access-Control-Allow-Origin' Header Fix"
description: "The CORS error 'No Access-Control-Allow-Origin header is present' blocks browser requests to different origins. Learn exactly why it happens and how to fix it on the server, in development, and in production."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "🌐"
tags: ["cors", "http", "browser", "api", "access-control-allow-origin", "cors error", "preflight"]
relatedTools: ["http-request"]
faqs:
  - q: "Why does CORS only happen in the browser, not in curl or Postman?"
    a: "CORS is a browser security policy. curl and Postman are not browsers — they send requests directly without enforcing the same-origin policy. If a request works in Postman but fails in the browser, it is almost certainly a CORS issue on the server."
  - q: "What is a preflight request?"
    a: "For 'non-simple' requests (custom headers, JSON body, DELETE/PUT/PATCH methods), the browser sends an OPTIONS request first to ask the server if the actual request is allowed. If the server doesn't respond correctly to the OPTIONS request, the browser blocks the real request."
  - q: "Is CORS a server-side or client-side problem?"
    a: "It is always fixed on the server. The server must include the correct Access-Control-Allow-Origin header in its responses. There is nothing the frontend JavaScript can do to bypass CORS (and that's the point — it's a security feature)."
---

## The Exact Error

```
Access to fetch at 'https://api.example.com/data' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
on the requested resource.
```

Or for preflight:
```
Access to fetch at 'https://api.example.com/users' from origin 'http://localhost:3000'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

> Quick summary: The server did not include `Access-Control-Allow-Origin` in its response. The browser blocks the response from reaching JavaScript as a security measure. Fix it on the server by adding CORS headers.

---

## Why This Error Happens

**1. Server returns no CORS headers** — the API wasn't configured to allow cross-origin requests

**2. Preflight fails** — the OPTIONS request handler is missing or returns the wrong headers

**3. Wrong origin whitelisted** — `Access-Control-Allow-Origin: https://app.example.com` but request comes from `http://localhost:3000`

**4. Credentials issue** — using `credentials: 'include'` but server returns `Access-Control-Allow-Origin: *` (wildcards and credentials are incompatible)

---

## Step-by-Step Diagnosis

### Step 1 — Confirm it's a CORS error

Open Browser DevTools > Network tab > click the failed request > look for:
- Response headers: Is `Access-Control-Allow-Origin` missing?
- Request headers: Is `Origin` present? (browser adds it automatically for cross-origin requests)

### Step 2 — Check for preflight

```bash
# Does your request send a preflight?
curl -X OPTIONS https://api.example.com/endpoint \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

The OPTIONS response must include:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### Step 3 — Check credentials

```javascript
// If you're sending cookies/credentials:
fetch(url, { credentials: 'include' });
// Server CANNOT use wildcard — must specify exact origin:
// Access-Control-Allow-Origin: http://localhost:3000
// Access-Control-Allow-Credentials: true
```

---

## Solutions

### Solution 1 — Express: add CORS headers

```javascript
// Install: npm install cors
import cors from 'cors';

// Allow all origins (development only):
app.use(cors());

// Allow specific origins (production):
app.use(cors({
  origin: ['https://app.example.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // if using cookies
}));
```

### Solution 2 — Manual headers (any Node.js framework)

```javascript
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});
```

### Solution 3 — Next.js API routes

```javascript
// app/api/data/route.ts
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://app.example.com',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

### Solution 4 — Development proxy (Vite / CRA)

```javascript
// vite.config.ts — proxy to avoid CORS in development
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
};
```

---

## Real-World Examples

**AWS API Gateway CORS:**
Enable CORS in the API Gateway console under each method's Method Response, or use the built-in "Enable CORS" button which sets the required headers.

**nginx reverse proxy:**
```nginx
location /api/ {
    add_header 'Access-Control-Allow-Origin' $http_origin always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

    if ($request_method = OPTIONS) {
        add_header 'Access-Control-Max-Age' 1728000;
        return 204;
    }

    proxy_pass http://backend;
}
```

---

## Quick Reference — CORS Headers

| Header | Direction | Purpose |
|---|---|---|
| `Access-Control-Allow-Origin` | Response | Which origins are allowed |
| `Access-Control-Allow-Methods` | Response | Which HTTP methods are allowed |
| `Access-Control-Allow-Headers` | Response | Which request headers are allowed |
| `Access-Control-Allow-Credentials` | Response | Allow cookies/credentials |
| `Access-Control-Max-Age` | Response | Cache preflight for N seconds |
| `Origin` | Request | Browser sends automatically |

---

## Prevent This Error in the Future

**1. Set CORS headers on every response**, including error responses — a 500 with no CORS headers still triggers a CORS error in the browser.

**2. Handle OPTIONS preflight explicitly** — many frameworks don't handle it automatically.

**3. Never use `Access-Control-Allow-Origin: *` with `credentials: true`** — browsers reject this combination.

---

## Use ToolNinja to Debug Faster

The HTTP Request tool lets you send requests with custom headers and inspect responses — useful for testing CORS headers outside the browser before debugging in the browser network tab.

🔧 **[HTTP Request Tool — toolninja.io/tools/http-request](https://toolninja.io/tools/http-request)**
""")

w("mysql-error-1064-sql-syntax.md", """---
title: "MySQL Error 1064: You Have an Error in Your SQL Syntax Fix"
description: "MySQL Error 1064 means the SQL parser hit something it didn't expect. Learn the most common causes — reserved words, quoting mistakes, missing commas — and how to fix them fast."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "🗄️"
tags: ["mysql", "sql", "database", "sql error", "error 1064", "sql syntax"]
relatedTools: ["sql-formatter"]
faqs:
  - q: "What does MySQL Error 1064 mean?"
    a: "It means the MySQL parser encountered a token it did not expect at a specific position in your SQL statement. The error message points to the part of the query near the problem, though the actual mistake may be one token earlier."
  - q: "Why does MySQL say 'near' a word that looks correct?"
    a: "MySQL reports the position where the parser got confused, not necessarily where you made the mistake. If you have a missing comma before a column, MySQL will report an error 'near' the next column name, not at the missing comma."
  - q: "How do I use reserved words as column names in MySQL?"
    a: "Wrap them in backticks: `order`, `select`, `from`, `group`, `key`, `index`. Avoid naming columns after reserved words if possible."
---

## The Exact Error

```
ERROR 1064 (42000): You have an error in your SQL syntax;
check the manual that corresponds to your MySQL server version
for the right syntax to use near 'order FROM users WHERE id = 1' at line 1
```

> Quick summary: The parser hit an unexpected token. The word shown in `near '...'` is where parsing failed — but the actual bug is usually just before it: a missing comma, unquoted reserved word, or unclosed string.

---

## Why This Error Happens

**1. Using a reserved word as a column or table name** — `order`, `group`, `key`, `index`, `select`, `from`

**2. Missing comma in column list** — `SELECT id name FROM users` (missing `,` between `id` and `name`)

**3. Single quotes vs backticks confusion** — using single quotes for identifiers instead of backticks

**4. Unclosed string literal** — `WHERE name = 'O'Brien'` — apostrophe breaks the string

**5. Wrong MySQL version syntax** — features available in MySQL 8 but not 5.7

---

## Step-by-Step Diagnosis

### Step 1 — Read what's in `near '...'`

```
near 'order FROM users' at line 1
```

The word `order` is a MySQL reserved word. It needs backticks.

### Step 2 — Count your commas

```sql
-- WRONG — missing comma after created_at:
SELECT id, name, email created_at FROM users;

-- RIGHT:
SELECT id, name, email, created_at FROM users;
```

### Step 3 — Check for unescaped quotes in strings

```sql
-- WRONG — apostrophe ends the string early:
SELECT * FROM users WHERE last_name = 'O'Brien';

-- RIGHT — escape the apostrophe:
SELECT * FROM users WHERE last_name = 'O\'Brien';
-- Or use double quotes inside single-quoted string (MySQL allows this):
SELECT * FROM users WHERE last_name = "O'Brien";
```

---

## Solutions

### Solution 1 — Backtick reserved words

```sql
-- WRONG:
SELECT order, group, key FROM orders;

-- RIGHT:
SELECT `order`, `group`, `key` FROM orders;
```

Common reserved words to watch for: `order`, `group`, `key`, `index`, `select`, `from`, `where`, `join`, `table`, `column`, `database`, `schema`, `status`, `type`, `value`

### Solution 2 — Fix the comma list

```sql
-- Use a formatter or lint: every column after the first needs a comma before it
SELECT
  id,
  name,
  email,
  created_at
FROM users;
```

### Solution 3 — Escape special characters in strings

```sql
-- Escape apostrophe:
INSERT INTO users (bio) VALUES ('It\'s a great day');

-- Or use parameterized queries (best practice):
-- Node.js with mysql2:
connection.execute(
  'INSERT INTO users (bio) VALUES (?)',
  ["It's a great day"]
);
```

### Solution 4 — Use parameterized queries to avoid all quoting issues

```javascript
// mysql2 — never build SQL with string concatenation
const [rows] = await pool.execute(
  'SELECT * FROM users WHERE email = ? AND status = ?',
  [email, 'active']
);
```

---

## Real-World Examples

**ORM-generated query with reserved word column:**

```sql
-- If your ORM generates: SELECT order FROM purchases
-- You need to alias or quote the column in your schema definition

-- Sequelize — use field option to map to a reserved word
status: {
  type: DataTypes.STRING,
  field: '`order`'  // Map JS property to backtick-quoted column
}
```

---

## Quick Reference — MySQL Error 1064 Causes

| Pattern in `near '...'` | Likely cause |
|---|---|
| Reserved word | Missing backticks around identifier |
| Column name | Missing comma before this column |
| `)` or `FROM` | Unclosed parenthesis in subquery |
| Empty string `''` | Statement ends unexpectedly |
| `'string` | Unclosed string literal |

---

## Prevent This Error in the Future

**1. Use a SQL formatter** to catch missing commas and syntax issues before running.

**2. Use parameterized queries** — never concatenate user input into SQL strings.

**3. Avoid naming columns after reserved words** — `type`, `order`, `key`, `status` are common traps.

---

## Use ToolNinja to Debug Faster

The SQL Formatter formats and highlights your SQL, making missing commas, mismatched parentheses, and unquoted reserved words immediately visible.

🔧 **[SQL Formatter — toolninja.io/tools/sql-formatter](https://toolninja.io/tools/sql-formatter)**
""")

w("git-reject-non-fast-forward-ref-updates-rejected.md", """---
title: "Git Error: Updates Were Rejected (Non-Fast-Forward) Fix"
description: "The 'updates were rejected because the tip of your current branch is behind' git error means your local branch is out of sync with the remote. Learn the safe fix and when to use each approach."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "🔀"
tags: ["git", "git push", "git error", "non-fast-forward", "rejected push", "git pull", "git rebase"]
relatedTools: ["git-command-generator"]
faqs:
  - q: "What does 'non-fast-forward' mean in git?"
    a: "A fast-forward push is when the remote branch can be updated by simply moving the pointer forward to your new commit — there is no divergence. Non-fast-forward means the remote has commits your local branch doesn't have, so git refuses to overwrite them."
  - q: "When is it safe to use git push --force?"
    a: "Only on branches you own exclusively, like a personal feature branch that no one else has cloned or based work on. Never force push to main, master, or shared branches. Use --force-with-lease as a safer alternative."
  - q: "What is the difference between git pull --rebase and git pull --merge?"
    a: "git pull --merge creates a merge commit, preserving branch history. git pull --rebase replays your commits on top of the fetched commits, creating a linear history. Both result in the same final code, but rebase produces cleaner history for feature branches."
---

## The Exact Error

```
 ! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/user/repo.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. Integrate the remote changes (e.g.
hint: 'git pull ...') before pushing again.
```

> Quick summary: The remote branch has commits that your local branch doesn't have. Git refuses to push because it would overwrite those commits. Pull the remote changes, resolve any conflicts, then push again.

---

## Why This Error Happens

**1. Someone else pushed to the same branch** while you were working on it

**2. You pushed from a different machine** and the other machine's work is now ahead

**3. You reset or rewrote history locally** making your branch diverge from the remote

**4. You force-pushed previously** and are now trying to push normally from an old clone

---

## Step-by-Step Diagnosis

### Step 1 — See how the branches have diverged

```bash
git fetch origin
git log --oneline --graph HEAD origin/main
# Shows both branches and where they diverged
```

### Step 2 — Identify which commits are only on remote

```bash
git log HEAD..origin/main --oneline
# These are commits on remote that you don't have locally
```

### Step 3 — Identify which commits are only local

```bash
git log origin/main..HEAD --oneline
# These are your local commits that haven't been pushed yet
```

---

## Solutions

### Solution 1 — Pull with rebase (recommended for feature branches)

```bash
git pull --rebase origin main
# Resolves any conflicts, then:
git push origin main
```

Rebase replays your commits on top of the remote commits, resulting in a clean linear history.

### Solution 2 — Pull with merge (preserves branch history)

```bash
git pull origin main
# Creates a merge commit if there are divergent changes
git push origin main
```

### Solution 3 — Force push (only for branches you own exclusively)

```bash
# Safer force push — fails if remote was updated since your last fetch
git push --force-with-lease origin feature/my-branch

# Plain force (use with caution):
git push --force origin feature/my-branch
```

**Never force push to main, master, or shared branches.**

### Solution 4 — If you pushed to the wrong branch

```bash
# Move your commits to a new branch and reset the wrong branch
git branch my-work  # save current commits
git reset --hard origin/main  # reset to match remote
git checkout my-work  # continue on the correct branch
```

---

## Real-World Examples

**Team workflow — someone else pushed while you were working:**

```bash
git fetch origin
git rebase origin/main
# Fix any conflicts in each commit
# git add . && git rebase --continue for each
git push origin feature/my-feature
```

**Squash and force push a PR branch:**

```bash
git rebase -i origin/main  # squash commits
git push --force-with-lease origin feature/my-feature
# Safe because this is your own PR branch
```

---

## Quick Reference — Push Rejection Solutions

| Situation | Solution |
|---|---|
| Remote has new commits, clean local | `git pull --rebase && git push` |
| Remote has new commits, local conflicts | `git pull --rebase`, resolve, `git push` |
| Own feature branch, want linear history | `git push --force-with-lease` |
| Shared branch, preserve all history | `git pull --merge && git push` |
| Accidentally diverged, want remote state | `git reset --hard origin/branch` |

---

## Prevent This Error in the Future

**1. Pull before you start working** — `git pull --rebase` at the start of each session.

**2. Use short-lived feature branches** — the longer a branch lives, the more it diverges.

**3. Set rebase as the default pull strategy:**

```bash
git config --global pull.rebase true
```

---

## Use ToolNinja to Debug Faster

The Git Command Generator helps you build the right git commands for common scenarios — branching, merging, rebasing, and force pushing — with explanations of what each flag does.

🔧 **[Git Command Generator — toolninja.io/tools/git-command-generator](https://toolninja.io/tools/git-command-generator)**
""")

print("Batch 5 done — all 10 remaining articles written")
