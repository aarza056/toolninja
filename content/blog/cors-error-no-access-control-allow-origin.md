---
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
curl -X OPTIONS https://api.example.com/endpoint   -H "Origin: http://localhost:3000"   -H "Access-Control-Request-Method: POST"   -H "Access-Control-Request-Headers: Content-Type"   -v
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
