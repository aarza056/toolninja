---
title: "DNS Error Codes Explained: NXDOMAIN, SERVFAIL, and REFUSED"
description: "\"It's probably still propagating\" is wrong more often than it's right. NXDOMAIN, SERVFAIL, and REFUSED each mean something specific and diagnosable — here's how to tell them apart with dig and fix the actual cause."
date: "2026-08-04"
author: "ToolNinja"
coverEmoji: "🧭"
tags: ["nxdomain error", "servfail dns error", "dns refused error", "dns resolution failure", "dig troubleshooting", "nslookup errors", "dns propagation myth", "dns error codes explained", "domain not resolving", "dnssec servfail", "networking", "dns"]
relatedTools: ["url-parser"]
faqs:
  - q: "I just added a DNS record and it still isn't resolving. Is this just propagation?"
    a: "Often not — 'propagation' gets blamed for what's actually negative caching. When a resolver queries a name that doesn't exist yet, it caches that NXDOMAIN answer for a period defined by the zone's SOA minimum TTL (commonly a few hours), separate from the record's own TTL. If you added the record after a resolver already cached a negative answer, that resolver won't re-check until its cached negative answer expires, no matter how long you wait in the usual sense. Query an authoritative nameserver directly with dig @<authoritative-ns> to confirm the record exists there right now, bypassing every cache in between."
  - q: "What's the practical difference between SERVFAIL and a connection timeout?"
    a: "SERVFAIL is an explicit answer — some server actually responded and told you it failed (commonly a DNSSEC validation failure, a misconfigured zone, or an authoritative server error). A timeout means no server responded at all within the resolver's wait window, which points at network connectivity or a firewall blocking DNS traffic (UDP/TCP port 53) rather than anything about the zone's configuration. dig shows this distinction clearly — a SERVFAIL response has a status line; a timeout just says 'connection timed out; no servers could be reached.'"
  - q: "Can DNSSEC actually break a domain that used to work fine?"
    a: "Yes, and it's one of the more common causes of a sudden SERVFAIL on a domain that was resolving fine the day before — a DNSSEC key rotation, an expired RRSIG signature, or a registrar change that didn't update the DS record at the parent zone all produce validation failures on any resolver that enforces DNSSEC. Testing with dig +cd (checking-disabled) skips validation; if that returns a normal answer while a regular dig returns SERVFAIL, DNSSEC is confirmed as the cause."
  - q: "Why do I get REFUSED when I query my own company's internal DNS server from home?"
    a: "REFUSED almost always means an access-control decision, not a broken server — the server received your query and deliberately declined to answer it, typically because recursive queries from outside its configured trusted network ranges are blocked. This is standard, correct behavior for an internal-only DNS server; the fix is querying it through the VPN or network it's actually meant to serve, not treating it as a fault to work around."
---

## Three Different Answers, Three Different Problems

When a domain won't resolve, "check DNS propagation" is the reflexive answer — and it's frequently the wrong diagnosis. DNS failures come back with specific, meaningful status codes, and each one points at a genuinely different layer of the problem. `dig` shows you exactly which one you're dealing with; here's what each means and how to actually fix it.

---

## NXDOMAIN — "This Name Does Not Exist"

```
$ dig app.example.com

;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 41230
;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 0
```

**What it means:** this is a *definitive, completed* answer from an authoritative source — the zone exists, but no record exists for this exact name. It is not a failure to reach a server; the server that authoritatively knows about `example.com` responded and confirmed `app.example.com` isn't in it.

**The real-world causes, roughly in order of frequency:**
- A typo in the record name (`aap.example.com` vs `app.example.com`)
- The record genuinely hasn't been created yet on the authoritative nameserver
- **Negative caching** of an earlier NXDOMAIN — you added the record *after* a resolver already cached a "doesn't exist" answer for it. Per the DNS spec, negative answers get cached too, for a duration set by the zone's SOA minimum TTL — commonly a few hours, independent of the record's own TTL once it exists.

**Diagnose by bypassing every cache and asking the authoritative server directly:**

```bash
dig @ns1.example.com app.example.com
```

If that returns a real answer while your normal resolver still returns NXDOMAIN, it's cached negative data waiting to expire — not a configuration problem. If the authoritative server *itself* returns NXDOMAIN, the record genuinely doesn't exist there yet and needs to be added.

---

## SERVFAIL — "Something Failed While I Was Trying to Answer"

```
$ dig broken.example.com

;; ->>HEADER<<- opcode: QUERY, status: SERVFAIL, id: 58821
;; flags: qr rd ra;
```

**What it means:** the name may well exist, but the resolver hit a failure trying to get a valid answer — this is fundamentally different from NXDOMAIN, which is a clean "it doesn't exist." SERVFAIL says "something broke while I was looking."

**Common real causes:**
- **DNSSEC validation failure** — an expired signature (RRSIG), a key rollover that didn't propagate correctly, or a DS record at the parent zone that no longer matches the child zone's keys
- All authoritative nameservers for the zone are unreachable or returning errors
- A malformed zone file on the authoritative server

**Test the DNSSEC hypothesis directly** — `+cd` (checking-disabled) tells the resolver to skip DNSSEC validation entirely:

```bash
dig +cd broken.example.com
```

**If `+cd` returns a normal answer while a regular query returns SERVFAIL, DNSSEC validation is confirmed as the cause** — check for an expired RRSIG or a DS/DNSKEY mismatch, which commonly happens after a registrar or DNS-provider migration that didn't carry over signing keys correctly.

**If it still fails even with validation disabled**, the authoritative servers themselves are the problem — check they're actually reachable and check the zone file for syntax errors on the primary.

---

## REFUSED — "I Won't Answer That"

```
$ dig internal.corp.local @10.0.0.53

;; ->>HEADER<<- opcode: QUERY, status: REFUSED, id: 9012
```

**What it means:** unlike NXDOMAIN (name doesn't exist) or SERVFAIL (tried and failed), REFUSED is a deliberate policy decision — the server received the query and explicitly declined to process it, almost always because of access control.

**Real case:** querying an internal, company-only DNS server from a home network (outside the VPN) returns REFUSED — not because the record or zone is broken, but because that server is correctly configured to only answer recursive queries from its trusted internal network ranges. This is expected, correct behavior, not a bug to route around.

**Other common causes:**
- Querying a nameserver that's authoritative-only and doesn't perform recursion, using standard resolver-style query flags it isn't configured to accept
- An ACL or firewall rule blocking your specific source IP from that DNS server

**Diagnose:** if REFUSED only happens from certain networks (home, a specific office, mobile data) and not others (the corporate VPN), that confirms it's an access-control decision rather than anything wrong with the zone itself — connect through the network the server is actually meant to serve.

---

## Quick Reference

| Status | What actually happened | Where to look |
|---|---|---|
| NXDOMAIN | Authoritative server confirmed the name doesn't exist | Typo, missing record, or negative-cache TTL not yet expired |
| SERVFAIL | A server tried to answer and failed | DNSSEC validation (`dig +cd` to test), or unreachable/broken authoritative servers |
| REFUSED | The server deliberately declined to answer | Access control / ACL — wrong network, not a broken zone |
| Timeout (no status) | No server responded at all | Network/firewall blocking DNS (UDP/TCP port 53), not a DNS configuration issue |

---

## Confirming Exactly What You're Querying

A surprising number of "DNS is broken" reports turn out to be querying the wrong host entirely — a copy-pasted URL with an unexpected subdomain, a stray port, or a typo that's easy to miss by eye. **[ToolNinja's URL Parser →](/tools/url-parser)** breaks a full URL down into its exact host, port, and path components, so you can confirm precisely which hostname you're actually asking DNS about before spending time debugging the wrong record.

---

Sources:
- [The top four DNS response codes and what they mean — BlueCat Networks](https://bluecatnetworks.com/blog/the-top-four-dns-response-codes-and-what-they-mean/)
- [NXDOMAIN vs SERVFAIL: What Each DNS Error Means — DNSRadar](https://dnsradar.net/blog/nxdomain-vs-servfail)
- [Troubleshooting DNS Resolution Failures: Understanding and Resolving "NXDOMAIN" Errors — Broadcom Knowledge Base](https://knowledge.broadcom.com/external/article/429265/troubleshooting-dns-resolution-failures.html)
- [How to Troubleshoot DNS NXDOMAIN Errors — OneUptime](https://oneuptime.com/blog/post/2026-03-20-troubleshoot-dns-nxdomain/view)
- [Troubleshooting DNS issues with dig — Keet Malin Sugathadasa](https://keetmalin.medium.com/troubleshooting-dns-issues-with-dig-b90ae7885d1f)
