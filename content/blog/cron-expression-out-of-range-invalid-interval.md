---
title: "Cron Expression Out of Range / Invalid Interval ? Fix Guide"
description: "Cron expression errors happen when field values fall outside allowed ranges or use invalid syntax. Learn the exact ranges for each field, common mistakes with day-of-week numbering, and how to validate before deploying."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "?"
tags: ["cron", "scheduling", "linux", "devops", "cron expression", "cron syntax", "invalid cron"]
relatedTools: ["cron-tester"]
faqs:
  - q: "What are the valid ranges for each cron field?"
    a: "Standard cron has 5 fields: minute (0-59), hour (0-23), day-of-month (1-31), month (1-12), day-of-week (0-7, where both 0 and 7 = Sunday). Extended cron (AWS, Quartz) adds a 6th field for seconds at the beginning."
  - q: "Is day-of-week 0 or 1 for Monday?"
    a: "It depends on the implementation. In standard Unix cron, Sunday=0 (or 7), Monday=1. In Quartz Scheduler and AWS EventBridge, Sunday=1, Monday=2. This is the #1 source of off-by-one errors in cron schedules ? always verify using a cron tester for your specific platform."
  - q: "Why does my cron job run at the wrong time?"
    a: "The most common causes are timezone confusion (cron runs in the server's timezone, not yours), day-of-week numbering differences between platforms, and forgetting that cron month is 1-12 (not 0-11 like JavaScript's Date object)."
  - q: "What does * mean in cron and when should I use a specific value?"
    a: "An asterisk (*) means 'every valid value' for that field. '* * * * *' runs every minute. Use * when the field doesn't constrain the schedule. Replace * only for fields you want to restrict."
---

## The Exact Error

```
Error: value 60 out of range [0..59] for minutes field
```

Or:
```
Invalid cron expression: '0 25 * * *'
QuartzException: '8' is not a valid value for hour
```

> Quick summary: A value in one of the cron fields exceeds the allowed range ? 60 in minutes, 25 in hours, 8 in day-of-week for standard cron. Each field has a strict numeric range.

---

## Why This Error Happens

A cron expression has 5 (or 6) fields, each with a specific allowed range. If any value falls outside its range, the expression is invalid.

Common causes:

**1. Wrong range** ? 60 for minutes (valid: 0-59), 24 for hours (valid: 0-23).

**2. Day-of-week off-by-one** ? Standard cron: 0=Sunday. Quartz/AWS: 1=Sunday. If you use 8, all implementations reject it.

**3. Month confusion** ? Month is 1-12 in cron (January=1), not 0-11 like JavaScript's `Date.getMonth()`.

**4. Step value errors** ? `*/0` (zero step) is meaningless.

---

## Step-by-Step Diagnosis

### Step 1 ? Map fields to positions

```
Standard cron (5 fields):
???? minute (0-59)
? ???? hour (0-23)
? ? ???? day of month (1-31)
? ? ? ???? month (1-12)
? ? ? ? ???? day of week (0-7)
* * * * *

Quartz/AWS (6 fields):
???? seconds (0-59)
? ???? minutes (0-59)
? ? ???? hours (0-23)
? ? ? ???? day of month (1-31)
? ? ? ? ???? month (1-12)
? ? ? ? ? ???? day of week (1-7)
* * * * * *
```

### Step 2 ? Validate each field

```bash
# 0 25 * * *
# hour=25 ? INVALID! Valid: 0-23

# 0 12 * * 8
# day-of-week=8 ? INVALID! Valid: 0-7
```

---

## Solutions

### Solution 1 ? Fix out-of-range values

```bash
# WRONG:
60 * * * *    # 60 minutes doesn't exist
0 25 * * *    # hour 25 doesn't exist
0 9 1 0 *     # month 0 doesn't exist

# RIGHT:
0 * * * *     # top of every hour
0 23 * * *    # 11 PM
0 9 1 1 *     # 9 AM on January 1st
```

### Solution 2 ? Use named days to avoid platform confusion

```bash
# Platform-safe: use names instead of numbers
0 9 ? * MON     # Every Monday (AWS EventBridge)
@Scheduled("0 0 9 * * MON")  # Spring
```

### Solution 3 ? Common correct schedules

```bash
*/5 * * * *      # Every 5 minutes
30 * * * *       # Every hour at :30
0 9 * * *        # Every day at 9 AM UTC
0 9 * * 1-5      # Every weekday at 9 AM
0 0 1 * *        # First day of every month at midnight
*/15 9-17 * * 1-5  # Every 15 min during business hours
```

---

## Quick Reference

| Field | Standard Linux | Quartz/AWS | Notes |
|---|---|---|---|
| Minute | 0-59 | 0-59 | |
| Hour | 0-23 | 0-23 | |
| Day of month | 1-31 | 1-31 | |
| Month | 1-12 | 1-12 | Not 0-11! |
| Day of week | 0-7 (0,7=Sun) | 1-7 (1=Sun) | Biggest source of bugs |

---

## Prevent This Error in the Future

**1. Use named days and months** when supported ? `MON`, `TUE`, `JAN` are harder to get wrong than numbers.

**2. Always test expressions before deploying.** A cron tester shows the next 10 execution times.

**3. Store cron schedules in UTC** and comment the local time equivalent.

---

## Use ToolNinja to Debug Faster

The Cron Tester lets you paste any cron expression and instantly see the next 10 scheduled run times in both UTC and your local timezone.

?? **[Cron Tester ? toolninja.io/tools/cron-tester](https://toolninja.io/tools/cron-tester)**
