---
title: "UUID v7 vs v4 vs ULID: Which One Should Actually Be Your Database Primary Key"
description: "Random UUIDv4 primary keys quietly wreck your index performance as tables grow. Here's why, and how UUIDv7 and ULID fix it without giving up the properties that made you choose a UUID in the first place."
date: "2026-09-15"
author: "ToolNinja"
coverEmoji: "🆔"
tags: ["uuid v7", "uuid vs ulid", "database primary key", "uuid v4 performance", "ulid", "database indexing", "postgres uuid", "mysql uuid primary key", "distributed id generation"]
relatedTools: ["uuid-generator", "uuid-parser"]
faqs:
  - q: "Is UUIDv7 a real, standardized format, or a convention people made up?"
    a: "It's a real IETF standard — UUID version 7 was formally standardized in RFC 9562 (May 2024), alongside version 6 and version 8. It's not a hack or a community convention; database drivers, ORMs, and UUID libraries across most major languages now ship native v7 support."
  - q: "Do I need to migrate my existing UUIDv4 primary keys to v7?"
    a: "Not urgently, and not all at once. UUIDv4's downside is a performance and storage cost that scales with table size and write volume — a small or low-write table won't notice it. Prioritize v7 (or ULID) for new tables, especially high-write ones, before spending effort migrating existing primary keys, which usually isn't worth the risk and downtime for tables that aren't experiencing the problem."
  - q: "Can I tell someone's account creation time just by looking at their v7 UUID?"
    a: "Yes, roughly — and that's the tradeoff. A v7 UUID's first 48 bits are a plain, readable Unix millisecond timestamp, so exposing raw v7 IDs (e.g., in a public URL) leaks approximately when that record was created, the same way an old auto-increment integer ID leaked its row's rough position. If that's a problem for your use case (e.g., hiding how many users you have, or exactly when a specific account signed up), use v4 or a separate public-facing slug instead of exposing the primary key directly."
  - q: "Does ULID work the same way as UUIDv7?"
    a: "Functionally, yes — both encode a 48-bit Unix millisecond timestamp as the leading bits, making both time-sortable, and both use trailing randomness for the rest. They differ mainly in text encoding: a UUID is 36 characters of hyphenated hex; a ULID is 26 characters of Crockford Base32, which is case-insensitive and URL-safe without extra encoding. Pick whichever your database/ORM/ecosystem supports more natively — the underlying idea is the same."
---

## The Primary Key Decision Nobody Revisits

Somewhere early in a project, someone picks a primary key strategy — auto-increment integer, or UUID — and it's rarely reconsidered until a table gets big enough for someone to notice the database is behaving strangely. If that someone picked UUIDv4 for its now-familiar benefits (no coordination needed across services, no collisions, no leaking a sequential row count), they also picked up a cost that doesn't show up in a quick benchmark on an empty table: **UUIDv4 primary keys get measurably worse as the table grows**, in a way sequential IDs never do.

The fix isn't giving up on UUIDs. It's picking a different version.

## Why Random UUIDs Hurt B-Tree Indexes

Almost every relational database — Postgres, MySQL/InnoDB, SQL Server — stores its primary key index as a B-tree, and B-trees like insertions to happen in roughly sorted order. An auto-increment integer is the ideal case: every new row's key is larger than every existing key, so it always gets appended to the rightmost leaf page of the tree. That page stays hot in cache, and there's no reshuffling.

A UUIDv4 is 122 bits of cryptographically random data. Its next value has no relationship to its previous value — it could land anywhere in the entire keyspace. Every insert has to find a essentially-random leaf page, which:

- **Defeats caching.** With a sequential key, recent inserts cluster on a small number of hot pages. With random UUIDv4, inserts scatter across the whole index, so far more of it needs to stay in memory (or gets pulled from disk) to serve writes efficiently.
- **Causes page splits.** A B-tree leaf page holds a fixed number of entries. Inserting into the *middle* of an already-full page (which random keys constantly do) forces the database to split that page in two, copy half its contents, and update the parent pointers — real, measurable write amplification that a purely-appending insert pattern never triggers.
- **Fragments the table on disk.** Related rows inserted around the same time end up scattered across unrelated physical locations, instead of sitting near each other the way naturally-ordered inserts would.

None of this is theoretical — it's the standard explanation database vendors themselves give for why "just use UUIDv4 for everything" quietly becomes a scaling problem, usually discovered around the time insert latency starts climbing and nobody can immediately explain why.

## What UUIDv7 and ULID Actually Change

UUIDv7 (standardized in [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html), May 2024) and ULID both solve this the same way: put a millisecond-precision timestamp in the **most significant bits**, and fill the rest with randomness.

```
UUIDv7:  018f4d2e-7b3a-7c21-8a4f-1e2d3c4b5a69
         └────┬────┘└─┬─┘
          48-bit ms    version + 74 bits of randomness
          timestamp

ULID:    01ARZ3ND EKTSV4RRFFQ69G5FAV
         └───┬───┘└────────┬───────┘
         48-bit ms      80 bits of
         timestamp      randomness
```

Because the timestamp occupies the leading bits, sorting these IDs as plain byte strings sorts them chronologically — which means new inserts land at (or very near) the right edge of the B-tree, same as an auto-increment integer. You keep every reason you wanted a UUID in the first place (client-generatable, no coordination, effectively zero collision probability) without the random-insert penalty.

You can decode either format back into its embedded timestamp with the [UUID Parser](/tools/uuid-parser) — useful for confirming a v7 ID's rough creation time without a separate `created_at` column, or for checking which version an ID actually is when you've inherited a schema and aren't sure.

## UUIDv4 vs UUIDv7 vs ULID

| | UUIDv4 | UUIDv7 | ULID |
|---|---|---|---|
| Sortable by creation time | No — fully random | Yes | Yes |
| Index-friendly for inserts | No | Yes | Yes |
| Encoding | 36-char hex + hyphens | 36-char hex + hyphens | 26-char Base32 |
| Case-sensitive | No (conventionally lowercase) | No | No — Base32 alphabet is case-insensitive |
| Leaks approximate creation time | No | Yes | Yes |
| Standardized | RFC 9562 | RFC 9562 | Community spec (not an IETF RFC) |
| Native DB/driver support (2026) | Universal | Common, growing | Requires a library in most stacks |

If you're deciding between v7 and ULID specifically, it usually comes down to ecosystem: if your database, ORM, or language's UUID library already has native v7 support, use v7 and stay in a standard 36-char UUID column type. If you're in an ecosystem where ULID libraries are more mature or you specifically want the shorter, case-insensitive, URL-friendly encoding, ULID is equally valid — the underlying time-ordering benefit is identical.

## The One Tradeoff: Timestamp Leakage

Putting a real, readable timestamp in the ID isn't free. A v7 UUID or ULID exposed in a public URL (`/orders/018f4d2e-7b3a-7c21-...`) tells anyone who looks at it roughly when that row was created — the same category of leak that sequential integer IDs always had (row count, creation order), just expressed as a timestamp instead of a count.

For most internal or moderately-sensitive data, this is a non-issue — it's genuinely no worse than what integer IDs already exposed for years. For cases where it matters (hiding total record counts, not revealing exactly when a specific high-profile account was created), the standard fix is the same one people already used for integer IDs: don't expose the primary key directly — expose a separate opaque public slug or hashid instead, and keep the sortable ID as an internal implementation detail.

## Practical Migration Advice

- **New tables, especially high-write ones:** default to v7 or ULID. There's essentially no downside versus v4 for a table that doesn't exist yet.
- **Existing UUIDv4 tables that aren't hurting:** leave them. A low-write or small table won't show the B-tree penalty in any way that matters, and a primary key migration is real, risky work for zero measured benefit.
- **Existing UUIDv4 tables that *are* hurting** (rising insert latency, index bloat you can't otherwise explain): this is a genuine "add a new v7/ULID column, backfill, cut over" migration — plan it like any other primary key change, with the standard caution that implies. It's not a quick find-and-replace.

The underlying lesson generalizes past UUIDs specifically: **a primary key's write pattern is a property of your storage engine, not just an identifier format choice** — and it's worth getting right before a table is too large to comfortably change.
