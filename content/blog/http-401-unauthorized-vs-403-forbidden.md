---
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
