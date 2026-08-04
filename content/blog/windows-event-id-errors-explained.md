---
title: "Windows Event IDs You'll Actually See: 4625, 1000, 7000, and 41 Explained"
description: "Event Viewer logs thousands of entries a day and almost none of them matter. These four — failed logon, application crash, service start failure, and unexpected shutdown — are the ones that actually mean something. Here's how to read each one."
date: "2026-08-04"
author: "ToolNinja"
coverEmoji: "🪟"
tags: ["event id 4625", "event id 1000 application error", "event id 7000 service control manager", "event id 41 kernel-power", "windows event log errors", "event viewer troubleshooting", "failed logon event id", "service failed to start", "unexpected shutdown windows", "windows server logs", "sysadmin", "windows"]
relatedTools: []
faqs:
  - q: "What's the difference between Event ID 4624 and 4625?"
    a: "4624 is a successful logon; 4625 is a failed one. They share the same set of fields (Logon Type, Workstation Name, Source Network Address), which is what makes them useful together — a 4625 immediately followed by a 4624 from the same source often just means someone mistyped their password once, while a long unbroken run of 4625s from an external IP with no matching successful logon is the pattern that indicates a brute-force or credential-stuffing attempt."
  - q: "Does Event ID 1000 always mean the application itself has a bug?"
    a: "Not necessarily. The Faulting module name field is the key detail — if it names your application's own .exe or .dll, the bug is in your code. If it names a shared runtime or system component (a specific .NET, VC++ redistributable, or a third-party driver DLL), the more likely fix is updating or repairing that dependency rather than debugging your application, since the same faulting module often crashes multiple unrelated applications that happen to share it."
  - q: "Why does a service fail with Event ID 7000 right after I change its password?"
    a: "Event ID 7000 with error 1069 (\"the service did not start due to a logon failure\") almost always means the service's configured credentials no longer match — either its dedicated service account had its password rotated (by policy or by IT) without updating the service's stored credential in services.msc, or an account lockout/policy change silently revoked its logon-as-a-service right. Re-entering the current password in the service's Log On tab resolves it immediately if that's the cause."
  - q: "How do I know if Event ID 41 was caused by a power loss or something else?"
    a: "Check what immediately precedes it in the System log. A clean shutdown always logs Event ID 6006 followed by 6005 on the next boot; if the log jumps straight from normal operation to Event ID 41 with no 6006 beforehand, that confirms it was an unexpected/dirty shutdown rather than something Windows chose to log after a graceful restart. From there, distinguish actual power loss (check UPS/PSU logs, or ask if there was a physical outage) from a hard system hang or crash (check for driver-related Event IDs like 219 or Bug Check codes logged around the same timestamp)."
---

## Event Viewer Has Thousands of Entries. Four of Them Matter Most.

Windows logs an enormous volume of routine noise by default, and the temptation is to grep for "error" or "critical" and drown in false leads. In practice, a small set of Event IDs account for the vast majority of real, actionable problems — and each one tells you something specific if you know what to look for beyond just the ID number.

---

## Event ID 4625 — Failed Logon

**Log:** Security

```
An account failed to log on.

Subject:
    Security ID:        SYSTEM
    Account Name:        WIN-SRV01$
Logon Type:              3
Account For Which Logon Failed:
    Account Name:        jdoe
Failure Reason:          Unknown user name or bad password
Status:                  0xC000006D
Sub Status:               0xC000006A
Network Information:
    Workstation Name:    KALI-BOX
    Source Network Address: 198.51.100.23
```

**What it means:** exactly what it says — a logon attempt failed. The fields that actually matter are **Logon Type** (3 = network logon, 10 = RDP, 2 = interactive at the console) and **Source Network Address**. A handful of 4625s from a known IP is a typo. A sustained stream from an unfamiliar external address, especially with Logon Type 10 (RDP), is a brute-force attempt against an exposed remote desktop port.

**Real case:** a server with RDP exposed directly to the internet accumulates thousands of 4625 events per day from rotating IP addresses, all attempting common usernames. This is one of the most common ways servers get compromised — not through a sophisticated exploit, but through a weak or reused password eventually succeeding against an exposed RDP port.

**Fix / mitigation:**
- Don't expose RDP directly to the internet — put it behind a VPN or Remote Desktop Gateway.
- Enable account lockout policy so repeated failures actually lock the account after N attempts.
- If you must keep RDP reachable, restrict it by source IP at the firewall and consider changing the listening port as a minor speed bump (not a real defense on its own).

---

## Event ID 1000 — Application Error

**Log:** Application

```
Faulting application name: myapp.exe, version: 2.4.1.0
Faulting module name: KERNELBASE.dll, version: 10.0.19041.1
Exception code: 0xc0000005
Fault offset: 0x000000000004f5b0
Faulting process id: 0x1a3c
```

**What it means:** an application crashed. The **Faulting module name** is the field to actually read — if it names your application's own executable, the bug is in your code. If it names a shared component (a .NET runtime DLL, a Visual C++ redistributable, a specific third-party or driver DLL), that shared component is where to look, since it's often crashing other unrelated applications too.

**Real case:** an app starts crash-looping immediately after a Windows Update or after a shared runtime gets silently updated by another installer. The faulting module points at a `.NET` or `msvcrt` DLL rather than the app's own binary — the fix is repairing or reinstalling that specific runtime, not debugging application code that hasn't changed.

**Fix:**
- If the faulting module is your own app, get a crash dump and check exception code `0xc0000005` (access violation) against the fault offset in a debugger.
- If it's a shared runtime, reinstall/repair that specific redistributable rather than reinstalling the whole application.
- Check Event ID 1001 (Windows Error Reporting), which often logs immediately after and includes more detail than the 1000 entry alone.

---

## Event ID 7000 / 7009 / 7011 — Service Control Manager

**Log:** System

```
The MyCompanyService service failed to start due to the following error:
The service did not respond to the start or control request in a timely fashion.
```

```
Error 1069: The service did not start due to a logon failure.
```

**What it means:** the Service Control Manager tried to start a service and it failed — 7009 specifically means it timed out, and error 1069 specifically means the credentials configured for the service are wrong.

**Real case:** a service running under a dedicated domain service account fails to start with error 1069 shortly after a scheduled password rotation policy runs — the service's *stored* password in its configuration wasn't updated when the actual account password changed, so every start attempt fails a logon before the service code even runs.

**Fix:**
1. Open `services.msc`, find the service, check its **Log On** tab.
2. Re-enter the current, correct password for the service account.
3. If the account's password was just rotated, coordinate service credential updates with whatever process rotates the password — this is the recurring root cause, not a one-off fix.
4. For a genuine 7009 timeout (not a credential issue), check what the service does on startup — a dependency it waits on (a database, another service) that isn't ready yet is the usual cause.

---

## Event ID 41 — Kernel-Power (Unexpected Shutdown)

**Log:** System

```
The system has rebooted without cleanly shutting down first. This error could
be caused if the system stopped responding, crashed, or lost power unexpectedly.
```

**What it means:** Windows didn't get a chance to shut down cleanly — this is logged on the *next boot* after the fact, since the system obviously couldn't log anything at the moment it lost power or hard-hung.

**How to tell what actually caused it:** a normal, clean shutdown always logs Event ID **6006** (Event Log service stopped) followed by **6005** on the next startup. If the log jumps straight from normal activity into Event ID 41 with no 6006 beforehand, that confirms the shutdown really was unexpected rather than something that happened to get logged as 41 after a graceful restart.

**Real case:** a desktop reports random reboots. Checking the System log shows repeated Event ID 41 entries with no preceding 6006 — ruling out anything Windows itself initiated. Correlating timestamps against a UPS's own event log confirms brief power drops at the exact same times, pointing at a failing PSU or an overloaded circuit rather than a software or driver issue.

**Fix approach:**
- Confirm there's no preceding 6006 (rules out a normal restart being misread as this).
- Check for genuine power loss — UPS logs, or ask whether there was a building-wide outage.
- If power is ruled out, look for a hard hang or crash instead: check for Bug Check / driver-related events (Event ID 219, or a memory dump if one was configured) around the same timestamp — a failing driver causing a hard freeze is the next most common cause after power loss.

---

## Quick Reference

| Event ID | Log | Meaning | Where to look next |
|---|---|---|---|
| 4625 | Security | Failed logon attempt | Logon Type + Source Network Address — pattern of many = brute force |
| 1000 | Application | Application crashed | Faulting module name — your app's binary, or a shared runtime? |
| 7000 / 7009 / 7011 | System | Service failed to start | Error 1069 = wrong credentials; 7009 = startup timeout |
| 41 | System | Unexpected/dirty shutdown | Check for a preceding 6006 to rule out a normal restart; then power vs. hard hang |

---

Sources:
- [Windows Security Log Event ID 4625 — Ultimate Windows Security](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventID=4625)
- [Event ID 4625: Failed Logon Attempt — Huntress](https://www.huntress.com/cybersecurity-education/event-ids/event-id-4625)
- [Fix Service Control Manager Errors Event ID 7000 — Windows Report](https://windowsreport.com/fix-service-control-manager-error/)
- [Analyzing Windows System Event Logs for Troubleshooting — Motadata](https://www.motadata.com/blog/windows-system-event-logs)
- [Windows Event Log: How to troubleshoot issues in Windows Servers — Site24x7](https://www.site24x7.com/solutions/windows-event-log-troubleshooting.html)
