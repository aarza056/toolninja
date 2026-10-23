---
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
curl -X OPTIONS https://api.example.com/endpoint   -H "Origin: http://localhost:3000"   -v
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
curl -X POST https://api.example.com/users   -H "Content-Type: application/json"   -d '{"name":"Alice"}'
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
