---
title: "CORS Error: 'No Access-Control-Allow-Origin Header' — What It Means and How to Fix It"
description: "The most universally hated error in web development, explained properly: why it happens, why it's a server problem even though it shows up in your browser console, and the exact fix for each common variant."
date: "2026-08-02"
author: "ToolNinja"
coverEmoji: "🚫"
tags: ["cors error", "no access-control-allow-origin header", "cors error fix", "cross-origin resource sharing error", "cors policy blocked", "access-control-allow-origin missing", "cors preflight error", "how to fix cors error", "javascript", "api", "errors"]
relatedTools: ["http-request"]
faqs:
  - q: "Can I fix a CORS error by changing my frontend code?"
    a: "Not in production. CORS is enforced by the browser based on headers the server sends — no amount of frontend JavaScript can make a server that hasn't opted in to your origin suddenly allow the request. Frontend-only 'fixes' like disabling web security in your browser only work for you, locally, and break for every real user."
  - q: "Why does the CORS error appear in the browser console instead of as an HTTP error I can catch?"
    a: "Because the browser, not your server, is the one blocking the response. The request often actually succeeds at the network level — the server responds — but the browser refuses to hand that response to your JavaScript because it didn't include the right Access-Control-Allow-Origin header. This is why you can see the response in your Network tab but still get a CORS error in the console: the response arrived, the browser just won't let your code read it."
  - q: "Do I need CORS headers for a same-origin request?"
    a: "No. CORS only applies to cross-origin requests — a request from a page loaded at one origin (scheme + domain + port) to a different origin. A request from https://example.com to https://example.com/api is same-origin and never triggers CORS. It's specifically requests to a different domain, subdomain, or port that need explicit server permission."
  - q: "Why does adding Access-Control-Allow-Origin: * sometimes not fix it?"
    a: "The wildcard * is disallowed by the CORS spec whenever the request includes credentials (cookies, HTTP auth) — the browser will still block the response even with the wildcard present. If your request sends credentials, the server must respond with your exact origin in Access-Control-Allow-Origin, not the wildcard, plus Access-Control-Allow-Credentials: true."
---

## The Error Everyone Hits, and Almost Nobody Understands the First Time

If you've built anything that calls an API from a browser, you've hit this:

```
Access to fetch at 'https://api.example.com/data' from origin 'https://myapp.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is
present on the requested resource.
```

It's red, it's in the console, and the natural instinct is to assume something is broken in your JavaScript. It isn't. CORS errors are almost always a **server configuration issue** — your frontend code is usually doing exactly what it should.

---

## What's Actually Happening

Browsers enforce a security rule called the **same-origin policy**: a page loaded from one origin (scheme + domain + port) can't read the response of a request it makes to a different origin, unless that other origin explicitly grants permission via response headers. Cross-Origin Resource Sharing (CORS) is the mechanism for granting that permission.

Here's the part that trips people up: **the request often actually succeeds**. Your server receives it, processes it, and sends back a response — you can often see this response sitting right there in your browser's Network tab. The browser just refuses to let your JavaScript *read* that response, because the server's headers didn't say it was allowed to. The failure isn't in the network — it's in what the browser lets your code access after the network call already completed.

This is exactly why CORS errors feel so confusing: everything looks like it worked, except your `.then()` or `await` never resolves with the data.

---

## The Most Common Variants, and the Fix for Each

### 1. "No 'Access-Control-Allow-Origin' header is present"

The server didn't send the header at all. This is the single most common CORS error.

**Fix (server-side):** the server needs to include `Access-Control-Allow-Origin` in its response, set to either your specific origin or `*` for public, credential-free APIs:

```
Access-Control-Allow-Origin: https://myapp.com
```

In Express (Node.js), the fastest fix is the `cors` middleware:

```js
const cors = require('cors');
app.use(cors({ origin: 'https://myapp.com' }));
```

### 2. "The value of the 'Access-Control-Allow-Origin' header ... must not be the wildcard '*' when the request's credentials mode is 'include'"

You're sending cookies or HTTP auth (`credentials: 'include'` in `fetch`, or `withCredentials: true` in older XHR/Axios setups), but the server responded with the wildcard `*`.

**Fix:** the server must echo back your **exact** origin, not `*`, and must also send `Access-Control-Allow-Credentials: true`:

```
Access-Control-Allow-Origin: https://myapp.com
Access-Control-Allow-Credentials: true
```

### 3. "Method ... is not allowed by Access-Control-Allow-Methods in preflight response"

For requests beyond simple `GET`/`POST` with standard headers, the browser first sends an automatic `OPTIONS` preflight request to ask permission before the real request. If the server's response to that `OPTIONS` request doesn't list your method (`PUT`, `DELETE`, `PATCH`), the browser blocks the real request before it's even sent.

**Fix:** make sure your server explicitly handles `OPTIONS` requests and responds with the methods it actually supports:

```
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 4. It works in Postman/curl but not in the browser

This one confuses people the most, but it's expected behavior, not a bug. **CORS is a browser-enforced restriction — it does not apply to non-browser HTTP clients.** curl, Postman, and server-to-server requests never trigger CORS checks because there's no browser same-origin policy involved. Seeing a request succeed in Postman tells you the server and endpoint are fine; it tells you nothing about whether the server's CORS headers are configured correctly for browser access.

---

## What You Cannot Fix From the Frontend

It's worth being blunt about this because it's the most common wrong turn: **there is no frontend code change that fixes a CORS error in production.** Things that seem like fixes but aren't:

- Launching Chrome with `--disable-web-security` — works only on your machine, breaks for every real user
- Browser extensions that "add CORS headers" — same problem, local-only
- Switching `fetch` to `axios` or vice versa — the HTTP client doesn't matter, the browser enforcement is identical
- Adding a `no-cors` mode to `fetch` — this doesn't fix anything; it makes the browser silently return an opaque response your JavaScript can't read at all, which is usually worse

The only real fixes are: configure the server's CORS headers correctly, or route the request through a same-origin proxy (a backend endpoint on your own domain that forwards the request server-to-server, where CORS doesn't apply).

---

## Debugging It Faster

The fastest way to isolate whether a failure is really CORS or something else: hit the same endpoint from a tool that isn't a browser. If it works there and fails only in the browser console with the specific CORS wording above, you've confirmed it's a CORS header issue, not an auth or network problem.

**[ToolNinja's HTTP Request Builder →](/tools/http-request)** lets you fire the exact same request and inspect the raw response headers directly — useful for checking whether `Access-Control-Allow-Origin` is present at all before you go digging through server config.

---

Sources:
- [Common CORS errors and how to fix them — WorkOS](https://workos.com/blog/common-cors-errors-and-how-to-fix-them)
- [Fixing CORS Errors: What They Are and How to Resolve Them — SuperTokens](https://supertokens.com/blog/cors-errors)
