---
title: "Active Directory Errors Explained: Replication Failures, Account Lockouts, and Group Policy Not Applying"
description: "Replication error 8606, Group Policy silently failing to apply, and accounts that keep locking out for no visible reason — these three account for most of the AD tickets that eat a sysadmin's week. Here's what's really going on and the exact commands to fix them."
date: "2026-08-04"
author: "ToolNinja"
coverEmoji: "🗂️"
tags: ["active directory replication error", "ad replication error 8606", "event id 1058", "event id 1030", "group policy not applying", "account lockout active directory", "dcdiag", "repadmin", "lingering objects", "active directory troubleshooting", "windows server", "sysadmin"]
relatedTools: []
faqs:
  - q: "What's the difference between replication error 8606 and 8524?"
    a: "8606 (\"insufficient attributes were given to create an object\") means a source DC is trying to replicate an update for an object that the destination DC has already garbage-collected as a lingering object — it's a data-consistency error. 8524 (\"the DSA operation is unable to proceed because of a DNS lookup failure\") is purely a DNS problem — the destination DC can't resolve the source DC's CNAME record, so replication never even starts. Always rule out 8524's DNS cause before assuming you have lingering objects."
  - q: "Why does gpresult show a GPO as applied when the settings clearly aren't taking effect?"
    a: "gpresult /h shows what Group Policy processing believes it applied, based on the last successful run — it won't catch cases where the actual setting inside the GPO conflicts with a higher-precedence GPO (OU-linked policies win over domain-linked ones, and Enforced + Block Inheritance interact in ways that surprise people), or where a security filter silently excludes the computer/user from that GPO entirely. Check the modeling in gpresult /h against the GPO's actual security filtering and link order, not just whether it's listed as applied."
  - q: "Why does an account keep locking out right after I unlock it?"
    a: "This is almost always a cached credential somewhere still retrying with the old password — a mapped network drive, a scheduled task running as that user, a phone's Exchange/ActiveSync profile, or a service running under that account. The lockout event on the DC (Event ID 4740) logs a Caller Computer Name field showing where the bad attempt came from; that's your starting point instead of guessing."
  - q: "Do I need third-party tools to find lockout sources, or does Windows have this built in?"
    a: "Windows Server has repadmin and the Account Lockout and Management Tools (LockoutStatus.exe, ALTools) built for exactly this, and they're usually enough — the standard workflow is finding which DC processed the lockout via Event ID 4740, then checking that DC's security log for the preceding 4625 events to identify the source device. For environments where lockouts are frequent and hard to pin down, more detailed auditing (enabling verbose Kerberos logging) narrows it further."
---

## The Three Tickets That Never Stop

Every Active Directory environment eventually generates the same three categories of pain, over and over: replication silently breaking between domain controllers, Group Policy that Event Viewer swears applied but clearly didn't, and accounts that lock out for reasons nobody can immediately explain. Here's what's actually happening in each, and the specific commands to find and fix the real cause.

---

## Replication Error 8606: Lingering Objects

```
DC=example,DC=com
Naming Context: CN=Configuration,DC=example,DC=com
Source DC: CN=NTDS Settings,CN=DC02,CN=Servers,...
******* 1 CONSECUTIVE FAILURES since ...
Last error: 8606 (0x21a6):
Insufficient attributes were given to create an object.
```

**What it means:** a source DC sends an update for an object that the destination DC already deleted and permanently garbage-collected — because that DC had been offline (or unreachable via replication) for longer than the domain's tombstone lifetime. The destination DC now holds a **lingering object**: something the rest of the forest agrees no longer exists, but which this one DC still has, and the mismatch blocks replication of that naming context.

**Check replication health across all DCs first:**

```powershell
repadmin /showrepl * /csv > replhealth.csv
```

Open it in Excel/a spreadsheet and filter for non-zero failure counts — this tells you exactly which DC pairs are broken and since when, rather than guessing from one DC's perspective.

**The fix is removing the lingering object from the DC that still has it**, not fixing "replication" in the abstract:

```powershell
repadmin /removelingeringobjects <DestinationDC> <SourceDC-GUID> <NamingContext> /advisory_mode
```

Run with `/advisory_mode` first — it logs what *would* be removed (Event ID 1946) without actually deleting anything, so you can verify the list before committing. Microsoft's Lingering Object Liquidator (LoL) automates this across multiple DCs if you have more than a couple affected.

**Before chasing lingering objects, rule out error 8524** — a DNS lookup failure that looks similar in symptoms but has nothing to do with tombstones. Destination DCs resolve source DCs by their fully qualified CNAME record; test it directly:

```powershell
nslookup <source-dc-guid>._msdcs.example.com
```

If that fails, fix DNS (a missing `_msdcs` zone, a stale record, or a DC pointing at the wrong DNS server in its own NIC settings) before touching replication metadata at all.

---

## Group Policy That "Applied" But Didn't (Event ID 1058 / 1030)

```
Event ID: 1058
Source: Group Policy
The processing of Group Policy failed. Windows attempted to read the file
\\example.com\SysVol\example.com\Policies\{31B2F340-016D-11D2-...}\gpt.ini
from a domain controller and was not successful.
```

```
Event ID: 1030
Source: Group Policy
Windows cannot query for the list of Group Policy objects. Check the event
log for possible errors. This system will retry group policy processing
at the next processing cycle.
```

**What it means:** both point at the client being unable to reach or read the **SYSVOL** share on a domain controller — usually a DNS resolution problem to the DC, a network path/firewall issue, or (less often) permissions on the SYSVOL folder itself getting corrupted after an FRS-to-DFSR migration that didn't fully complete.

**Start with `gpresult`** on the affected machine to see what Group Policy processing actually believes happened:

```powershell
gpresult /h gpresult.html /f
```

**Then confirm the machine can actually reach and resolve a DC's SYSVOL path directly:**

```powershell
nslookup example.com
Test-Path \\example.com\SysVol\example.com\Policies
```

If DNS resolves but the path is unreachable, check DFSR replication health for SYSVOL specifically (`dfsrdiag replicationstate`) — a common cause is DFSR silently stuck in a "journal wrap" or backlog state on one DC, so that DC keeps advertising SYSVOL but serves a stale or inaccessible copy.

**If a specific policy setting isn't taking effect even though gpresult shows the GPO as applied**, the problem usually isn't connectivity at all — check GPO **link order and security filtering**: OU-linked GPOs win over domain-linked ones by default, `Enforced` overrides `Block Inheritance`, and a GPO can be linked correctly but security-filtered to exclude the exact computer or user you're testing with.

---

## Account Lockouts That Keep Coming Back

**What it means:** the account is locking out because *something* is repeatedly authenticating with a stale or wrong password — and it's very rarely the user typing it wrong at their desk. The usual suspects, in order of how often they're the actual cause: a mapped network drive with saved (old) credentials, a scheduled task or Windows service running as that user, and a phone's mail profile still configured with the pre-change password.

**Find which DC processed the lockout** (in multi-DC environments, this matters — the lockout event lives on the DC that handled the failed authentication attempts, not necessarily the PDC emulator):

```powershell
Get-ADDomainController -Filter * | ForEach-Object {
    Get-WinEvent -ComputerName $_.HostName -FilterHashtable @{
        LogName='Security'; Id=4740
    } -MaxEvents 5 -ErrorAction SilentlyContinue
}
```

**Event ID 4740** includes a **Caller Computer Name** field — that's your starting point. Cross-reference it against **Event ID 4625** (failed logon) entries on the same DC in the minutes before the lockout to see exactly which service or device is retrying with a bad credential.

```powershell
# On the DC that logged the 4740, check for preceding 4625 events from the same account
Get-WinEvent -FilterHashtable @{ LogName='Security'; Id=4625 } |
    Where-Object { $_.Message -match 'TargetUserName:\s*jdoe' }
```

Once you've identified the source (a drive mapping, a scheduled task, a service, a phone), update the credential there — clearing the lockout without fixing the source just means it locks out again on the same interval as whatever's retrying.

---

## Quick Reference

| Problem | Real cause | Where to look first |
|---|---|---|
| Replication error 8606 | Lingering object — a DC was offline past the tombstone lifetime | `repadmin /showrepl * /csv`, then `/removelingeringobjects /advisory_mode` |
| Replication error 8524 | DNS lookup failure to the source DC's CNAME | `nslookup <dc-guid>._msdcs.<domain>` |
| Event ID 1058 / 1030 | Client can't reach or read SYSVOL on a DC | `gpresult /h`, confirm DNS + `\\domain\SysVol` path is reachable |
| GPO shows "applied" but setting isn't active | Link order or security filtering excludes the target | Check GPO link precedence and security filtering, not just gpresult |
| Repeated account lockouts | A stale credential somewhere is retrying automatically | Event ID 4740's Caller Computer Name, cross-referenced with preceding 4625s |

---

Sources:
- [Troubleshoot replication error 8606 — Microsoft Learn](https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/replication-error-8606)
- [Troubleshoot Active Directory replication error 8524 — Microsoft Learn](https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/replication-error-8524)
- [Resolution of Active Directory Replication Error 8606 & 1988 — Justin Henson](https://justin-henson.medium.com/resolution-of-active-directory-replication-error-8606-1988-9837eed6d83)
- [Guide to Fixing Common Active Directory Problems — Site24x7](https://www.site24x7.com/learn/ad-issues-troubleshooting.html)
- [Active Directory Troubleshooting: Common Errors and Fixes — cagricaliskan.com](https://cagricaliskan.com/microsoft/active-directory-troubleshooting-common-errors-and-fixes/)
