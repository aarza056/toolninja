---
title: "UUIDs Explained: v1 vs v4 vs v7 and When to Use Each"
description: "Understand UUID versions — v1 (time + MAC), v4 (random), v5 (name + hash), and the new v7 (sortable). When to use each, database implications, and alternatives like NanoID and ULID."
date: "2026-05-06"
author: "ToolNinja"
coverEmoji: "🎲"
tags: ["uuid generator online", "uuid v4 vs v7", "uuid explained", "guid vs uuid difference", "uuid primary key database", "uuid v4 random generation", "uuid v7 sortable", "ulid vs uuid", "nanoid vs uuid", "uuid collision probability", "generate uuid free", "uuid format explained"]
relatedTools: ["uuid-generator"]
faqs:
  - q: "What is the difference between UUID v4 and UUID v7?"
    a: "UUID v4 is randomly generated with no ordering — great for privacy but poor for database indexing. UUID v7 is time-ordered while still random enough to avoid collisions, making it better for database primary keys."
  - q: "Can two UUID v4s ever be the same?"
    a: "Theoretically yes, but practically impossible. The probability of a duplicate among 1 trillion UUIDs is about 1 in a billion."
  - q: "Should I use UUID as a database primary key?"
    a: "UUID v4 has trade-offs: no sequential enumeration attacks and easy distributed data merging, but larger storage and slower indexing. UUID v7 or ULID solve most performance issues."
  - q: "What is the difference between UUID and GUID?"
    a: "They are the same thing. GUID is Microsoft's term for UUID. Both follow the same RFC 4122 standard and are interchangeable."
---

## What Is a UUID?

A **UUID** (Universally Unique Identifier) is a 128-bit value, formatted as 32 hex digits in groups of 8-4-4-4-12:

```
550e8400-e29b-41d4-a716-446655440000
xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
```

- `M` = version digit
- `N` = variant bits (always 8, 9, a, or b in standard UUIDs)

The RFC 4122 standard defines several versions. Each serves a different purpose.

---

## UUID Versions

### v1 — Time + MAC Address

```
6ba7b810-9dad-11d1-80b4-00c04fd430c8
         ^^^^  Version 1
```

Generated from the current timestamp (100-nanosecond intervals since Oct 15, 1582) and the machine's MAC address.

**Pros:**
- Monotonically increasing (good for B-tree indexes)
- Theoretically unique across all machines without coordination

**Cons:**
- Exposes the generating machine's MAC address (privacy concern)
- Timestamp encoding is non-obvious (the time fields are shuffled)
- Not practical for most applications today

### v4 — Random

```
550e8400-e29b-41d4-a716-446655440000
               ^ Version 4
```

122 bits of cryptographically random data. The most common UUID type.

**Pros:**
- No information leakage
- Simple to generate
- Practically guaranteed unique (the collision probability for 1 trillion v4 UUIDs is ~1 in a billion)

**Cons:**
- Random, so poor for database index locality (causes B-tree page splits)
- Not sortable by creation time

### v5 — Name-Based (SHA-1)

Generated deterministically from a namespace UUID and a name string, using SHA-1. For the same namespace + name, you always get the same UUID.

```javascript
// Same inputs always produce the same UUID
uuidv5("example.com", uuidv5.DNS) // deterministic
```

**Use case:** Generating a stable ID from a known identifier (URL, email, username). Great for idempotent systems.

**v3** is identical but uses MD5 instead of SHA-1. Prefer v5.

### v7 — Unix Time-Ordered (New in 2022)

```
018c4b5c-e3a0-7000-a8b4-c8a6b9d51b8e
         ^^^^  Version 7
```

UUID v7 uses the current Unix timestamp in milliseconds in the first 48 bits, followed by random bits. This makes v7 UUIDs **lexicographically sortable by creation time** while remaining random enough to be unique.

**Pros:**
- Sortable by time (great for database indexes)
- No MAC address exposure
- Replaces most v1 use cases

**Cons:**
- Newer — not in all libraries yet (but support is rapidly growing)

**UUID v7 is the recommended choice for new database primary keys.**

---

## UUIDs in Databases

The biggest practical concern with UUIDs is database performance.

### The Problem with v4 in SQL Databases

Random UUIDs fragment B-tree indexes. Every new row inserts at a random position, causing page splits and poor cache utilization. On a table with millions of rows, this is a real performance issue.

```sql
-- v4 UUID primary keys cause index fragmentation
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);
```

### Better Options for Database IDs

**UUID v7** — sortable by time, standard UUID format:
```sql
-- PostgreSQL with pg_uuidv7 extension
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  ...
);
```

**ULID** — 26-character base32 string, sortable, URL-safe:
```
01ARZ3NDEKTSV4RRFFQ69G5FAV
```

**NanoID** — configurable length, URL-safe, 21 chars by default:
```
V1StGXR8_Z5jdHi6B-myT
```

**Auto-increment + UUID hybrid** — use auto-increment for internal ordering, UUID for public-facing identifiers:
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,        -- internal, sorted
  public_id UUID UNIQUE DEFAULT gen_random_uuid()  -- external, random
);
```

---

## Generating UUIDs in Code

### JavaScript / TypeScript

```javascript
// Node.js 14.17+ and modern browsers
import { randomUUID } from "crypto";
const id = randomUUID(); // UUID v4

// npm: uuid
import { v4 as uuidv4, v7 as uuidv7 } from "uuid";
const id4 = uuidv4();
const id7 = uuidv7();
```

### Python

```python
import uuid

id4 = str(uuid.uuid4())                          # v4 random
id5 = str(uuid.uuid5(uuid.NAMESPACE_DNS, "example.com"))  # v5 deterministic
```

### Go

```go
import "github.com/google/uuid"

id := uuid.New()         // v4
id7 := uuid.New()        // v7 (google/uuid v1.6+)
```

### PostgreSQL

```sql
-- Built-in (v4)
SELECT gen_random_uuid();

-- UUID v1 (requires uuid-ossp extension)
SELECT uuid_generate_v1();
```

---

## UUID vs Other ID Schemes

| Scheme | Length | Sortable | URL-Safe | Collision Resistance |
|--------|--------|----------|----------|---------------------|
| UUID v4 | 36 chars | ❌ | ❌ (has hyphens) | Excellent |
| UUID v7 | 36 chars | ✅ | ❌ (has hyphens) | Excellent |
| ULID | 26 chars | ✅ | ✅ | Excellent |
| NanoID (21) | 21 chars | ❌ | ✅ | Very good |
| NanoID (12) | 12 chars | ❌ | ✅ | Good (casual use) |
| Snowflake ID | 18 digits | ✅ | ✅ | Excellent (requires coordination) |
| MongoDB ObjectId | 24 hex | ✅ | ✅ | Good |

---

## Choosing the Right ID

- **New DB primary key** → UUID v7 or ULID
- **Existing system using UUID v4** → keep it, the performance cost is usually acceptable
- **Idempotent/deterministic ID from a known value** → UUID v5
- **Short, URL-safe, human-readable-ish** → NanoID
- **Distributed system with strict ordering** → Snowflake or similar
- **Public-facing ID you don't want guessed** → anything random (v4, NanoID)

---

## Try It: ToolNinja UUID Generator

Generate cryptographically secure UUID v4s (and v7s) instantly with the **[ToolNinja UUID Generator](/tools/uuid-generator)**. Generate in bulk, copy with one click, runs in your browser.
