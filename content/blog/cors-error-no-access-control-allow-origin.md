---
title: "CORS Error: 'No Access-Control-Allow-Origin Header' — What It Means and How to Fix It"
description: "The most universally hated error in web development, explained properly: why it happens, why it's a server problem even though it shows up in your browser console, and the exact fix for each common variant."
metaTitle: "Fix \"No Access-Control-Allow-Origin\" CORS Errors"
metaDescription: "Why the CORS \"No Access-Control-Allow-Origin\" error happens, why it's a server fix, and how to debug preflight, credentials and header issues."
date: "2026-08-02"
updated: "2026-10-08"
author: "ToolNinja"
coverEmoji: "🚫"
tags: ["cors error", "no access-control-allow-origin header", "cors error fix", "cross-origin resource sharing error", "cors policy blocked", "access-control-allow-origin missing", "cors preflight error", "how to fix cors error", "javascript", "api", "errors"]
faqs:
  - q: "Can I fix a CORS error by changing my frontend code?"
    a: "Not in production. CORS is enforced by the browser based on headers the server sends — no amount of frontend JavaScript can make a server that hasn't opted in to your origin suddenly allow the request. Frontend-only 'fixes' like disabling web security in your browser only work for you, locally, and break for every real user."
  - q: "Why does the CORS error appear in the browser console instead of as an HTTP error I can catch?"
    a: "Because the browser, not your server, is the one blocking it, and it deliberately hides the details from your JavaScript. What actually happened depends on the request. For a simple request (a plain GET, or a POST with a form or text content type) the request is sent and the server handles it; the browser only refuses to hand the response to your code. For a preflighted request (PUT, DELETE, JSON bodies, custom headers like Authorization) the browser first sends an OPTIONS request, and if that preflight fails, the real request is never sent at all. Either way, fetch() just rejects with a TypeError, so the Network tab and console are where you find out which case you're in."
  - q: "Do I need CORS headers for a same-origin request?"
    a: "No. CORS only applies to cross-origin requests — a request from a page loaded at one origin (scheme + domain + port) to a different origin. A request from https://example.com to https://example.com/api is same-origin and never triggers CORS. It's specifically requests to a different domain, subdomain, or port that need explicit server permission."
  - q: "Why does adding Access-Control-Allow-Origin: * sometimes not fix it?"
    a: "The wildcard * is disallowed by the CORS spec whenever the request includes credentials (cookies, HTTP auth) — the browser will still block the response even with the wildcard present. If your request sends credentials, the server must respond with your exact origin in Access-Control-Allow-Origin, not the wildcard, plus Access-Control-Allow-Credentials: true."
---

## The Error Everyone Hits, and Almost Nobody Understands the First Time

If you've built anything that calls an API from a browser, you've hit this:

```text
Access to fetch at 'https://api.example.com/data' from origin 'https://myapp.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is
present on the requested resource.
```

It's red, it's in the console, and the natural instinct is to assume something is broken in your JavaScript. It isn't. CORS errors are almost always a **server configuration issue** — your frontend code is usually doing exactly what it should.

---

## What's Actually Happening

Browsers enforce the **same-origin policy**: a page loaded from one origin (scheme + domain + port) can't read the response of a request it makes to a different origin, unless that other origin explicitly grants permission via response headers. Cross-Origin Resource Sharing (CORS), defined in the [Fetch Standard](https://fetch.spec.whatwg.org/#http-cors-protocol), is the mechanism for granting that permission.

What happens next depends on whether the browser needs a **preflight**:

- **Simple requests** (`GET`, `HEAD`, or `POST` with a form or `text/plain` body and no custom headers) are sent straight away. The server receives the request, processes it, and responds. If the response lacks the right `Access-Control-Allow-Origin`, the browser refuses to let your JavaScript read it. You'll see the response in the Network tab, but your code gets nothing. Note that any side effects (a row inserted, an email sent) **already happened**.
- **Preflighted requests** (`PUT`, `PATCH`, `DELETE`, a `Content-Type: application/json` body, or headers like `Authorization`) start with an automatic `OPTIONS` request asking for permission. If that preflight fails, because the `OPTIONS` response is an error, a redirect, or is missing the right headers, **the real request is never sent**. Your server never processes it; only the `OPTIONS` request reaches it.

That distinction matters when debugging. "The request succeeded, the browser just hid it" is only true for simple requests. For anything preflighted, a CORS failure usually means your endpoint never ran.

---

## The Most Common Variants, and the Fix for Each

### 1. "No 'Access-Control-Allow-Origin' header is present"

The server didn't send the header at all. This is the single most common CORS error.

**Fix (server-side):** include `Access-Control-Allow-Origin` in the response, set to either your specific origin or `*` for public, credential-free APIs:

```http
Access-Control-Allow-Origin: https://myapp.com
```

In Express (Node.js), the usual fix is the `cors` middleware, registered before your routes:

```js
const cors = require('cors');
app.use(cors({ origin: 'https://myapp.com' }));
```

### 2. "The value of the 'Access-Control-Allow-Origin' header ... must not be the wildcard '*' when the request's credentials mode is 'include'"

You're sending cookies or HTTP auth (`credentials: 'include'` in `fetch`, or `withCredentials: true` in XHR/Axios), but the server responded with the wildcard `*`.

**Fix:** the server must echo back your **exact** origin, not `*`, and must also send `Access-Control-Allow-Credentials: true`:

```http
Access-Control-Allow-Origin: https://myapp.com
Access-Control-Allow-Credentials: true
```

### 3. "Method ... is not allowed by Access-Control-Allow-Methods in preflight response"

The preflight `OPTIONS` response didn't list the method you're using (`PUT`, `DELETE`, `PATCH`), so the browser stops before sending the real request.

**Fix:** handle `OPTIONS` explicitly and list the methods you support:

```http
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### 4. "Request header field X is not allowed by Access-Control-Allow-Headers in preflight response"

Your request sends a header the preflight response didn't approve. The usual culprits are `Authorization`, `Content-Type` (when it's `application/json`), and custom headers like `X-Request-Id` or `X-API-Key`.

**Fix:** add every non-safelisted request header to `Access-Control-Allow-Headers`, by name:

```http
Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-Id
```

`Access-Control-Allow-Headers: *` is only honored for requests without credentials, and even then it does not cover `Authorization`, which always has to be listed explicitly.

### 5. It works in Postman/curl but not in the browser

This is expected, not a bug. **CORS is enforced by browsers; it does not apply to non-browser HTTP clients.** curl, Postman, and server-to-server requests never run CORS checks. A request succeeding in Postman tells you the endpoint works; it tells you nothing about whether the server's CORS headers are right for browser access.

---

## Pitfalls That Look Like "My CORS Config Is Correct, but It Still Fails"

### CORS headers missing on 4xx and 5xx responses

Many setups only add CORS headers to successful responses. When the API returns a 401, 404, 413 or 500 without them, the browser reports a CORS error and **hides the real status code** from your JavaScript. Common causes:

- Authentication or rate-limiting middleware that runs before the CORS middleware and returns early
- A reverse proxy generating the error itself (nginx returning 413 for a large body, or 502 when the app is down)
- nginx `add_header` without the `always` parameter, which only applies to success and redirect status codes

The fix is to send CORS headers on every response, errors included. When you see a CORS error, always check the actual status code of the request in the Network tab before touching your CORS config.

### Dynamic origins without `Vary: Origin`

If you allow several origins by reflecting the request's `Origin` header back in `Access-Control-Allow-Origin`, you must also send:

```http
Vary: Origin
```

Without it, a CDN or browser cache can store the response generated for `https://app.example.com` and serve it to `https://admin.example.com`, whose request then fails the origin check. The symptom is an intermittent CORS error that "fixes itself" when the cache expires or you clear it.

### Proxies, CDNs and redirects

- **Stripped headers:** a CDN, API gateway, load balancer or corporate proxy between the browser and your app can drop or overwrite CORS headers, or answer `OPTIONS` itself without them. Compare the headers your app sends locally with what the browser receives through the full chain.
- **Cached preflights:** a CDN that caches `OPTIONS` responses can keep serving an old, wrong preflight after you've fixed the origin server.
- **Redirects:** a preflight that gets a redirect (for example `http` to `https`, or `/api/data` to `/api/data/`) fails, and Chrome reports "Redirect is not allowed for a preflight request". Call the final URL directly.

---

## What You Cannot Fix From the Frontend

There is no frontend code change that fixes a CORS error in production. Things that seem like fixes but aren't:

- Launching Chrome with `--disable-web-security`: works only on your machine, breaks for every real user
- Browser extensions that "add CORS headers": same problem, local-only
- Switching `fetch` to `axios` or vice versa: the HTTP client doesn't matter, the browser enforcement is identical
- Adding `mode: 'no-cors'` to `fetch`: this doesn't fix anything; the browser returns an opaque response your JavaScript can't read at all, which is usually worse

The only real fixes are to configure the server's CORS headers correctly, or to route the request through a same-origin proxy (a backend endpoint on your own domain that forwards the request server-to-server, where CORS doesn't apply).

---

## Debugging It in the DevTools Network Tab

The console message tells you *which* check failed; the Network tab tells you *why*. In Chrome or Edge (Firefox is similar):

1. Open DevTools, go to the **Network** tab, make sure the filter is set to **All** (or Fetch/XHR), and reproduce the request.
2. Find the failed request. Its Status column shows **CORS error**. If the request needed a preflight, look for a separate `OPTIONS` row for the same URL (Chrome labels its type **preflight**; in some versions you reach it from the failed request's details).
3. Click the `OPTIONS` row first. Check its **status code** (it should be 2xx, not 401, 404, 405 or a 3xx redirect) and its **Response Headers**: `Access-Control-Allow-Origin`, `-Methods` and `-Headers` must cover what the browser asked for.
4. Compare those with the preflight's **Request Headers**: `Origin`, `Access-Control-Request-Method` and `Access-Control-Request-Headers` list exactly what the browser needs approved.
5. Then check the real request's status code. A 4xx or 5xx there means the CORS error is hiding an application error (see the first pitfall above).
6. Right-click the request and choose **Copy as cURL** to replay it outside the browser, where you can see every header the server sends.

To replay a preflight by hand and see the raw headers the server returns:

```bash
curl -i -X OPTIONS https://api.example.com/data \
  -H "Origin: https://myapp.com" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: content-type, authorization"
```

---

## A Non-Express Example: nginx

If nginx sits in front of your API, you can handle CORS there. This allows two origins, answers preflights, and adds the headers to error responses too:

```nginx
# In the http {} block: only these origins are echoed back.
map $http_origin $cors_origin {
    default                     "";
    "https://myapp.com"         $http_origin;
    "https://staging.myapp.com" $http_origin;
}

server {
    # ...
    location /api/ {
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin  $cors_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 600 always;
            add_header Vary Origin always;
            return 204;
        }

        add_header Access-Control-Allow-Origin  $cors_origin always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Vary Origin always;

        proxy_pass http://app_backend;
    }
}
```

Two nginx details matter here. `always` makes nginx add the headers to 4xx and 5xx responses as well. And `add_header` directives are not inherited into a block that defines its own, which is why the `OPTIONS` branch repeats them. If your application also sets CORS headers, set them in one place only: duplicate `Access-Control-Allow-Origin` headers are themselves a CORS error.

---

## Tools That Help

The [CORS Error Debugger](/tools/cors-debugger) takes your request details and the response headers you received (from the Network tab or the curl command above) and walks through the preflight and actual-request checks a browser makes, telling you which one fails. The [HTTP Header Inspector](/tools/http-header-inspector) explains any other header in the response.

The [HTTP Request Builder](/tools/http-request) is useful once CORS is configured, to send the request with the same headers your app uses. Keep in mind that it runs in your browser, so it is subject to CORS itself: a misconfigured endpoint fails there exactly as it does in your app, and even on success browser JavaScript can only read response headers the server exposes with `Access-Control-Expose-Headers` plus a short safelist. To see the raw headers of a failing request, use the Network tab or curl.

---

Sources:
- [Fetch Standard: CORS protocol — WHATWG](https://fetch.spec.whatwg.org/#http-cors-protocol)
- [Cross-Origin Resource Sharing (CORS) — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [ngx_http_headers_module: add_header — nginx documentation](https://nginx.org/en/docs/http/ngx_http_headers_module.html#add_header)
- [Common CORS errors and how to fix them — WorkOS](https://workos.com/blog/common-cors-errors-and-how-to-fix-them)
- [Fixing CORS Errors: What They Are and How to Resolve Them — SuperTokens](https://supertokens.com/blog/cors-errors)
