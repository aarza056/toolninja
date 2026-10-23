---
title: "nginx 502, 504, and 403 Errors Explained (and How to Actually Fix Them)"
description: "502 means nginx never got a valid response. 504 means it got one too slowly. 403 means nginx itself is blocking you before your app ever sees the request. Here's how to tell them apart and fix the real cause of each."
date: "2026-08-04"
author: "ToolNinja"
coverEmoji: "🌐"
tags: ["nginx 502 bad gateway", "nginx 504 gateway timeout", "nginx 403 forbidden", "proxy_read_timeout", "nginx errors explained", "bad gateway fix", "gateway timeout fix", "nginx troubleshooting", "reverse proxy errors", "php-fpm socket", "devops", "nginx"]
relatedTools: ["http-status-codes", "http-request"]
faqs:
  - q: "Is raising proxy_read_timeout a real fix for a 504?"
    a: "Rarely. proxy_read_timeout controls the maximum gap between reads from the upstream, not the total request time — raising it globally just makes every request wait longer before nginx gives up, and it does nothing about why the upstream is slow in the first place. It's a reasonable stopgap for one genuinely slow endpoint (set in that location block specifically), but if requests are timing out across the board, the real fix is finding the slow query, the exhausted worker pool, or the saturated connection limit on the upstream."
  - q: "Why do I get a 502 from nginx but the app works fine when I hit it directly?"
    a: "This almost always means nginx is pointed at the wrong place, or the upstream isn't there anymore from nginx's point of view. The most common causes: the upstream process (PHP-FPM, Node, Gunicorn) crashed or was never started, the proxy_pass address or socket path in the config doesn't match where the app is actually listening, or a firewall/SELinux rule allows direct access but blocks nginx's connection specifically."
  - q: "Why does nginx return 403 instead of passing the request to my backend at all?"
    a: "A 403 straight from nginx (check the response headers — it'll say 'Server: nginx' with no trace of your app) means nginx refused to serve the request before it ever reached proxy_pass or your application code. That's a filesystem-permission, indexing, or nginx-config problem, not an application bug — which is why restarting your app or checking its logs won't show anything relevant."
  - q: "How do I know if it's actually nginx's fault or my application's?"
    a: "Check nginx's error log first (/var/log/nginx/error.log by default) — it logs the specific reason for every 502/504/403 it generates, including which upstream it tried to reach and why the connection failed. If the error log shows nginx successfully got a response and is just passing through your app's own 500, that's an application bug, not an nginx problem, and you should look at your app's logs instead."
---

## Three Errors, Three Different Failures

502, 504, and 403 all sound like generic "something's wrong" errors, but each one tells you something specific about *where* the failure happened — and confusing them wastes time looking in the wrong place.

- **502 Bad Gateway** — nginx tried to talk to your app and the connection itself failed or returned garbage.
- **504 Gateway Timeout** — nginx connected fine, but your app took too long to respond.
- **403 Forbidden** (from nginx itself) — nginx refused to even try, usually before your app was ever involved.

Here's what actually causes each one, with the fastest real fix.

---

## 502 Bad Gateway

```
502 Bad Gateway
nginx/1.25.3
```

```
[error] 12345#0: *1 connect() failed (111: Connection refused) while connecting
to upstream, client: 203.0.113.7, server: example.com,
upstream: "fastcgi://unix:/run/php/php8.3-fpm.sock:"
```

**What it means:** nginx made a connection attempt to the upstream (your app, PHP-FPM, or another proxy) and it failed outright — refused, unreachable, or returned a response nginx couldn't parse. This is a connection-level failure, not a slow-response failure.

**The single most common real-world cause:** PHP-FPM (or whatever process should be listening) isn't running, or its socket file is gone. Check first:

```bash
systemctl status php8.3-fpm
ls -la /run/php/php8.3-fpm.sock
```

If the socket file doesn't exist, PHP-FPM either crashed or was never started — start it and watch `journalctl -u php8.3-fpm -f` for why it died (a bad pool config or a fatal PHP error on startup are the usual reasons).

**If the process is running but nginx still can't reach it**, check that `proxy_pass` / `fastcgi_pass` actually matches where it's listening:

```nginx
# Socket path or host:port must match exactly
fastcgi_pass unix:/run/php/php8.3-fpm.sock;
# or
proxy_pass http://127.0.0.1:3000;
```

A mismatched port after a config change (app moved from 3000 to 3001, nginx config wasn't updated) is a close second on the list of real causes — always diff what the app is actually bound to (`ss -tlnp`) against what nginx is configured to hit.

---

## 504 Gateway Timeout

```
504 Gateway Time-out
nginx/1.25.3
```

```
[error] 12345#0: *1 upstream timed out (110: Connection timed out) while reading
response header from upstream, client: 203.0.113.7,
upstream: "http://127.0.0.1:3000/api/report"
```

**What it means:** unlike a 502, nginx *did* successfully connect to your upstream — it just didn't get a full response back within `proxy_read_timeout` (default 60 seconds). The connection succeeded; the response didn't finish in time.

**The real fix is almost never just raising the timeout.** A global `proxy_read_timeout 600s;` just means every stalled request now hangs for 10 minutes before failing instead of 1 — it hides the actual problem, which is usually one of:

- A slow database query or N+1 query pattern on that specific endpoint
- The upstream's worker/connection pool is exhausted, so requests queue instead of processing
- A downstream call the upstream itself makes (a third-party API, another internal service) is what's actually slow

**If you've confirmed one specific endpoint is genuinely slow by design** (a large report export, a bulk import), scope the timeout increase to just that location instead of the whole server:

```nginx
location /api/report {
    proxy_pass http://127.0.0.1:3000;
    proxy_read_timeout 120s;
}
```

Check the upstream's own logs for how long it actually took to respond — if it's consistently near or past the timeout, that's your app's performance problem to fix, not nginx's config to paper over.

---

## 403 Forbidden (Straight From nginx)

```
403 Forbidden
nginx/1.25.3
```

**What it means:** this is the one case where your application never sees the request at all — nginx blocked it at the web-server level, before `proxy_pass` or any backend logic runs. If you check the response headers and see no trace of your app (no custom headers, no app-specific error page), that's the tell.

**Cause 1 — no index file and directory listing disabled** (the default). Requesting `/some-folder/` with no `index.html` inside it and no explicit file requested returns 403 rather than a directory listing, by design.

**Cause 2 — the nginx worker process can't read the file**, most often because a *parent directory* is missing execute permission for the nginx user (`www-data` or `nginx`), even if the file itself is readable:

```bash
# nginx needs execute (traverse) permission on every directory in the path,
# not just read permission on the final file
namei -l /var/www/example.com/public/index.html
```

**Cause 3 — SELinux, on RHEL/CentOS/Alma/Rocky.** A freshly deployed file often has the wrong SELinux context even when standard Unix permissions look correct:

```bash
ls -Z /var/www/example.com/public/index.html
# Should show httpd_sys_content_t — if it doesn't, restore it:
restorecon -Rv /var/www/example.com/public
```

If SELinux is silently blocking something, `sealert -a /var/log/audit/audit.log` will usually spell out exactly what rule fired and suggest the exact `semanage`/`restorecon` fix.

---

## Quick Reference

| Error | What actually happened | Fastest fix |
|---|---|---|
| 502 Bad Gateway | Connection to upstream failed or returned garbage | Check the upstream is running and `proxy_pass`/socket path matches where it's actually listening |
| 504 Gateway Timeout | Connected fine, response didn't finish in time | Find why the *upstream* is slow — don't just raise `proxy_read_timeout` globally |
| 403 Forbidden (from nginx) | nginx blocked it before your app saw the request | Check directory execute permissions and, on RHEL-based systems, SELinux context |

---

## Testing the Actual Response, Not Just the Symptom

Once you suspect which layer is failing, it helps to hit the upstream directly and compare — bypass nginx entirely and send the request straight to the app's port to confirm whether the app itself is healthy. **[ToolNinja's HTTP Request Builder →](/tools/http-request)** lets you send that request with custom headers and see the raw status, timing, and response body without needing curl flags memorized. And when you just need to double-check what a status code actually means before you go debugging the wrong thing, **[the HTTP Status Codes reference →](/tools/http-status-codes)** has the full list with plain-English explanations.

---

Sources:
- [NGINX 502 Bad Gateway: Every Cause and Fix — GetPageSpeed](https://www.getpagespeed.com/server-setup/nginx/nginx-502-bad-gateway)
- [502 Bad Gateway NGINX Fix: Common Causes and Diagnosis — CloudPanel](https://www.cloudpanel.io/blog/502-bad-gateway-nginx-fix/)
- [504 Gateway Time-out in Nginx: Your Upstream Was Too Slow, Not Nginx — RunXBuild](https://www.runxbuild.com/blog/504-gateway-time-out-nginx/)
- [504 Gateway Timeout in NGINX: Fix It in 5 Minutes — GetPageSpeed](https://www.getpagespeed.com/server-setup/nginx/fix-504-gateway-timeout-nginx)
- [How To Fix 504 Gateway Timeout Errors In NGINX — Netdata](https://www.netdata.cloud/academy/how-to-diagnose-and-fix-504-gateway-timeout-errors-in-nginx/)
