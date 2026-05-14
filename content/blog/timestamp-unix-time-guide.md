---
title: "Unix Timestamps and Time Zones: A Developer's Reference"
description: "Everything you need to know about Unix timestamps, UTC vs local time, ISO 8601 format, daylight saving pitfalls, and how to work with dates correctly in JavaScript, Python, and Go."
date: "2026-05-11"
author: "ToolNinja"
coverEmoji: "⏱️"
tags: ["unix timestamp converter", "epoch time explained", "unix time tutorial", "timestamp to date online", "year 2038 problem", "utc vs gmt difference", "javascript date now", "convert timestamp free", "milliseconds vs seconds timestamp", "unix epoch time", "datetime programming guide"]
relatedTools: ["timestamp-converter"]
faqs:
  - q: "What is Unix time / epoch time?"
    a: "Unix time is the number of seconds elapsed since January 1, 1970 at 00:00:00 UTC. It's timezone-independent making it ideal for storing timestamps across distributed systems."
  - q: "How do I tell if a timestamp is in seconds or milliseconds?"
    a: "A Unix timestamp in seconds is 10 digits (e.g. 1715000000). In milliseconds it's 13 digits (e.g. 1715000000000). JavaScript's Date.now() returns milliseconds; most Unix systems return seconds."
  - q: "What is the Year 2038 problem?"
    a: "Many older systems store Unix timestamps as 32-bit integers, which max out on January 19, 2038. After that, 32-bit systems overflow and roll back to 1901. Modern 64-bit systems are unaffected."
  - q: "What is the difference between UTC and GMT?"
    a: "For everyday purposes they are the same. GMT is based on Earth's rotation; UTC is an atomic time standard. In programming, always use UTC for storing timestamps."
---

## What Is a Unix Timestamp?

A Unix timestamp (also called epoch time) is the number of **seconds since January 1, 1970 00:00:00 UTC**. This "epoch" was chosen somewhat arbitrarily when Unix was designed.

```
1730000000   →   2024-10-27 07:33:20 UTC
0            →   1970-01-01 00:00:00 UTC
-86400       →   1969-12-31 00:00:00 UTC (negative timestamps are valid)
```

Unix timestamps are **timezone-agnostic** — they always represent a point in time in UTC. This makes them ideal for storing, comparing, and transmitting time values across systems.

---

## Milliseconds vs Seconds

JavaScript uses **milliseconds** since epoch. Most other languages and systems use **seconds**. This is the source of countless bugs.

```javascript
Date.now()                    // 1730000000000 (milliseconds)
Math.floor(Date.now() / 1000) // 1730000000    (seconds)
new Date(1730000000)          // 1970-01-21... (WRONG — treated as ms)
new Date(1730000000 * 1000)   // 2024-10-27... (correct)
new Date(1730000000000)       // 2024-10-27... (also correct)
```

**Quick check:** If a timestamp is 13 digits, it's milliseconds. If 10 digits, it's seconds.

---

## ISO 8601 Format

ISO 8601 is the international standard for date/time strings:

```
2024-10-27T07:33:20Z          UTC (Z = Zulu = UTC)
2024-10-27T07:33:20+00:00     UTC with explicit offset
2024-10-27T10:33:20+03:00     UTC+3 (same moment)
2024-10-27                    Date only
2024-10-27T10:33:20.123Z      With milliseconds
```

**Always use ISO 8601 for:**
- API request/response bodies
- Log timestamps
- Database string columns (if not using a native datetime type)
- User-facing dates where precision and timezone matter

**Avoid locale-specific formats** in APIs: `10/27/2024` is ambiguous (MM/DD or DD/MM?).

---

## UTC vs Local Time

The golden rule of server-side development:

> **Store and compare in UTC. Display in local time.**

```javascript
// ✅ Store in UTC
const createdAt = new Date().toISOString(); // "2024-10-27T07:33:20.000Z"

// ✅ Display in user's timezone
const display = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  dateStyle: "full",
  timeStyle: "short",
}).format(new Date(createdAt));
// "Sunday, October 27, 2024 at 3:33 AM"
```

---

## Daylight Saving Time Pitfalls

DST is responsible for more date/time bugs than anything else. Key rules:

1. **Don't store local times** — store UTC
2. **Don't add 86400 seconds to get "tomorrow"** — on DST transition days, a day can be 23 or 25 hours
3. **Don't assume timezones have fixed offsets** — `America/New_York` is UTC-5 in winter and UTC-4 in summer
4. **Don't compare times without timezone context**

```javascript
// ❌ Wrong: assumes a day is always 86400 seconds
const tomorrow = now + 86400;

// ✅ Correct: use a proper library
import { add } from "date-fns";
const tomorrow = add(now, { days: 1 });
// date-fns handles DST transitions correctly
```

---

## The Year 2038 Problem

Unix timestamps stored as a 32-bit signed integer overflow on **January 19, 2038 at 03:14:07 UTC**. After that, the value wraps to a large negative number representing 1901.

Most modern systems use 64-bit integers for timestamps, making this a non-issue. But embedded systems, legacy databases, and old applications may still use 32-bit storage.

---

## Working with Dates in JavaScript

### Modern approach: `Temporal` (TC39 proposal, landing in 2025)

```javascript
// Temporal is the modern replacement for Date
const now = Temporal.Now.instant();
const zonedNow = Temporal.Now.zonedDateTimeISO("America/New_York");

const tomorrow = zonedNow.add({ days: 1 });
const diff = laterDate.since(earlierDate, { largestUnit: "hours" });
```

### Current approach: `date-fns` or `dayjs`

```javascript
import { format, add, differenceInDays, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const date = parseISO("2024-10-27T07:33:20Z");
format(date, "MMM d, yyyy");                    // "Oct 27, 2024"
formatInTimeZone(date, "America/New_York", "h:mm a zzz");  // "3:33 AM EDT"
add(date, { days: 7, hours: 2 });               // one week and 2 hours later
differenceInDays(endDate, startDate);            // integer days between
```

### Unix timestamp conversions

```javascript
// Current timestamp
const nowSeconds = Math.floor(Date.now() / 1000);
const nowMs = Date.now();

// From timestamp
const date = new Date(1730000000 * 1000);       // seconds → ms
const dateFromMs = new Date(1730000000000);      // ms directly

// To timestamp
const ts = Math.floor(date.getTime() / 1000);   // → seconds
```

---

## Working with Dates in Python

```python
from datetime import datetime, timezone, timedelta

# Current UTC time
now = datetime.now(timezone.utc)

# From Unix timestamp
dt = datetime.fromtimestamp(1730000000, tz=timezone.utc)

# To Unix timestamp
ts = int(dt.timestamp())

# ISO 8601 format
iso = dt.isoformat()           # "2024-10-27T07:33:20+00:00"
dt2 = datetime.fromisoformat("2024-10-27T07:33:20+00:00")

# Timezones with pytz or zoneinfo (Python 3.9+)
from zoneinfo import ZoneInfo
ny = dt.astimezone(ZoneInfo("America/New_York"))
```

---

## Working with Dates in Go

```go
import "time"

// Current UTC time
now := time.Now().UTC()

// From Unix timestamp
t := time.Unix(1730000000, 0).UTC()

// To Unix timestamp
ts := t.Unix()         // seconds
tsMs := t.UnixMilli()  // milliseconds

// Format (Go uses a reference time: Mon Jan 2 15:04:05 MST 2006)
formatted := t.Format(time.RFC3339)           // "2024-10-27T07:33:20Z"
display := t.In(time.LoadLocation("America/New_York")).
  Format("Jan 2, 2006 3:04 PM")

// Parse
parsed, _ := time.Parse(time.RFC3339, "2024-10-27T07:33:20Z")
```

---

## Database Timestamps

| Database | Recommended Type | Notes |
|----------|-----------------|-------|
| PostgreSQL | `TIMESTAMPTZ` | Stores UTC, displays in session timezone |
| MySQL | `DATETIME` | No timezone support; store in UTC explicitly |
| SQLite | `INTEGER` | Store Unix epoch seconds |
| MongoDB | `Date` | Milliseconds since epoch |

**Always use `TIMESTAMPTZ` over `TIMESTAMP` in PostgreSQL** — the latter ignores timezone information.

---

## Try It: ToolNinja Timestamp Converter

Convert between Unix timestamps and human-readable dates with the **[ToolNinja Timestamp Converter](/tools/timestamp-converter)**. Supports seconds and milliseconds, converts to any timezone, shows ISO 8601 format. Runs in your browser.
