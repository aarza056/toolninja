---
title: "Linux 'No Space Left on Device' and 'Permission Denied': The Errors That Lie to You"
description: "df -h says you have gigabytes free but writes still fail. chmod 777 doesn't fix a permission error that isn't actually about Unix permissions. Here's what's really going on and the exact commands to find it."
date: "2026-08-04"
author: "ToolNinja"
coverEmoji: "💾"
tags: ["no space left on device", "linux disk full but df shows space", "inode exhaustion", "df -i", "permission denied linux", "systemd permission denied", "lsof deleted files", "chattr immutable file", "noexec mount permission denied", "linux troubleshooting", "linux errors explained", "sysadmin"]
relatedTools: ["chmod-calculator"]
faqs:
  - q: "I ran df -h and there's plenty of free space, so why do writes still fail with 'no space left on device'?"
    a: "df -h only shows block (byte) usage. Every filesystem also has a separate, fixed pool of inodes — one consumed per file, directory, or symlink — and if that pool is exhausted, the kernel refuses to create new files even with terabytes of block space free. Run df -i alongside df -h; if IUse% is at or near 100% while block usage is low, it's inode exhaustion, not a space problem in the way most people picture it."
  - q: "I deleted a huge log file but the disk usage didn't go down. Why?"
    a: "Deleting a file only removes its directory entry — if any running process still has that file open (a file descriptor pointed at it), the kernel keeps the actual data blocks allocated until the last process closes it. This is extremely common with log files: a service was writing to a log, you deleted the log file directly instead of rotating it properly, and the service keeps writing into space that df now considers 'used' but that no filename points to anymore."
  - q: "Why does a script work fine when I run it manually but fail with Permission denied under systemd?"
    a: "Manually running a script inherits your shell's environment, working directory, and (if run as root or via sudo) broad filesystem access. A systemd service unit often runs as a different, more restricted user by default, and modern unit files frequently set hardening directives like ProtectSystem=strict, ProtectHome=true, or an explicit ReadWritePaths= list — any of which will block writes that work fine interactively. Check systemctl show <service> -p User,ProtectSystem,ProtectHome,ReadWritePaths to see what the unit is actually restricted to."
  - q: "Does chmod 777 ever actually fix a stubborn Permission denied error?"
    a: "Only if the problem really is standard Unix read/write/execute permissions — and by the time someone reaches for 777, it usually isn't. SELinux/AppArmor mandatory access control, a noexec mount option, an immutable file attribute (chattr +i), or a systemd sandboxing directive all produce the identical 'Permission denied' message but are completely invisible to ls -l and unaffected by chmod. Treat repeated 777 attempts that don't work as a strong signal to check one of those instead."
---

## Same Error Message, Different Root Cause Every Time

"No space left on device" and "Permission denied" are two of the most common errors on any Linux system, and both are frustratingly generic — the exact same message can mean four or five completely different underlying problems, most of which the obvious first fix (delete some files; `chmod 777`) doesn't actually touch.

---

## "No Space Left on Device" When There's Clearly Space

```bash
$ cp bigfile.tar /var/lib/data/
cp: error writing '/var/lib/data/bigfile.tar': No space left on device

$ df -h /var/lib/data
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   12G   36G  25% /
```

25% used, 36GB free — and yet the write fails. There are two real causes, and they look identical from the application's point of view.

### Cause 1: Inode Exhaustion

Every filesystem has a fixed number of inodes decided at creation time — one is consumed per file, directory, or symlink, regardless of how small the file is. A directory full of millions of tiny files (session files, mail queue items, a runaway `node_modules` tree, cache fragments) can exhaust the inode pool while barely touching the actual block/byte usage.

```bash
df -i /var/lib/data
Filesystem      Inodes  IUsed   IFree IUse% Mounted on
/dev/sda1      3276800 3276800      0  100% /
```

**`df -h` and `df -i` can tell completely different stories — always check both**, because block exhaustion and inode exhaustion produce the exact same "no space left on device" error to every application.

**Find what's actually eating the inodes:**

```bash
find /var -xdev -printf '%h\n' | sort | uniq -c | sort -rn | head -20
```

This lists which directories contain the most files, which is almost always the fastest way to spot the culprit (a PHP session directory with millions of stale files is a classic case).

### Cause 2: Deleted Files Still Held Open

Deleting a file only removes its **directory entry** — the name pointing at the data. If a running process still has that file open, the kernel keeps the underlying blocks allocated until the last file descriptor referencing it is closed, even though `ls` can no longer see the file anywhere.

```bash
lsof +L1 | grep deleted
COMMAND    PID   USER   FD   TYPE DEVICE  SIZE/OFF NLINK    NODE NAME
rsyslogd   842   syslog  3w   REG   8,1  4294967296     0  131074 /var/log/syslog (deleted)
```

**Real case:** a log file was deleted directly (instead of properly rotated) to free space quickly, but the service writing to it — `rsyslogd`, an application logger, anything — kept its file handle open and kept writing into space `df` now shows as fully used, with no visible file to explain it.

**Fix without restarting the service:** truncate the file through its still-open file descriptor rather than deleting it again (it's already "deleted"):

```bash
: > /proc/842/fd/3
```

This immediately reclaims the space because the kernel truncates the underlying data while the process keeps its (now empty) file descriptor open. **The permanent fix** is using `logrotate`'s `copytruncate` option or sending the service a reload signal after rotation, so it reopens its log file properly instead of writing into a deleted one.

---

## "Permission Denied" That Isn't About chmod

```bash
$ ./deploy.sh
bash: ./deploy.sh: Permission denied
```

`chmod +x deploy.sh` and checking `ls -l` look fine — and it still fails. Standard Unix read/write/execute permissions are only one of several completely separate access-control layers on a modern Linux system, and they all produce the exact same error message.

**Cause 1 — SELinux or AppArmor context**, on RHEL-based or Ubuntu-based systems respectively. A file copied from elsewhere (scp'd, extracted from a tarball, restored from backup) often carries the wrong SELinux context even when its Unix permissions are completely correct:

```bash
ls -Z deploy.sh
# Wrong or missing context blocks execution even with +x set
restorecon -v deploy.sh
```

**Cause 2 — the immutable attribute**, set with `chattr`, which blocks writes and deletions regardless of ownership or Unix permissions — even root can't override it without first clearing the flag:

```bash
lsattr deploy.sh
----i--------- deploy.sh
chattr -i deploy.sh
```

**Cause 3 — a `noexec` mount option.** Scripts placed in `/tmp` or a mounted volume with `noexec` set fail to execute no matter what their permission bits say:

```bash
mount | grep /tmp
tmpfs on /tmp type tmpfs (rw,nosuid,nodev,noexec,relatime)
```

The fix here is moving the script to a location that isn't mounted `noexec`, not changing its permissions.

**Cause 4 — systemd service hardening.** A script that runs fine manually can fail under a `systemd` unit because the unit restricts the user it runs as, or the filesystem paths it's allowed to touch:

```bash
systemctl show myservice -p User,ProtectSystem,ProtectHome,ReadWritePaths
User=svc-deploy
ProtectSystem=strict
ReadWritePaths=/var/lib/myservice
```

`ProtectSystem=strict` makes the entire filesystem read-only to the service except for explicitly listed `ReadWritePaths` — a write that works fine at your interactive shell will fail under the service with the identical "Permission denied," because it's a completely different enforcement layer.

---

## Quick Reference

| Symptom | Real cause | Check with |
|---|---|---|
| "No space left on device," `df -h` shows plenty free | Inode exhaustion — too many small files | `df -i` |
| Disk usage doesn't drop after deleting a large file | A running process still has it open | `lsof +L1 \| grep deleted` |
| "Permission denied" despite correct `ls -l` output | SELinux/AppArmor context | `ls -Z`, `restorecon -v` |
| "Permission denied" writing/deleting a file you own | Immutable attribute set | `lsattr`, `chattr -i` |
| Script won't execute from `/tmp` or a mounted volume | `noexec` mount option | `mount \| grep <path>` |
| Works manually, fails under `systemd` | Service sandboxing (`ProtectSystem`, restricted `User`) | `systemctl show <svc> -p ProtectSystem,ProtectHome,ReadWritePaths` |

---

## Checking Permissions Before You Deploy

If you're setting explicit permissions on a deploy script, a shared directory, or anything going into a Dockerfile's `RUN chmod`, it's worth double-checking the octal value actually means what you think before it ships — a slightly-too-permissive `755` vs `750` is an easy typo to make under pressure. **[ToolNinja's Chmod Calculator →](/tools/chmod-calculator)** converts between symbolic (`rwxr-xr-x`) and octal (`755`) permissions visually, so you can verify the exact permission set before applying it.

---

Sources:
- [Fix: "No Space Left on Device" But df -h Shows Free Space — Owrbit](https://owrbit.com/hub/fix-no-space-left-on-device-but-df-h-shows-space/)
- [Disk Full but df Shows Space: Deleted-File Handles and inode Exhaustion — Penguin Gym Linux](https://penguin-gym-linux.com/en/articles/troubleshooting/disk-full-but-df-normal)
- [How to Fix 'No Space Left on Device' Errors — OneUptime](https://oneuptime.com/blog/post/2026-01-24-fix-no-space-left-on-device/view)
- [How to Fix 'Permission Denied' Errors in Linux — OneUptime](https://oneuptime.com/blog/post/2026-01-24-fix-permission-denied-errors-linux/view)
- [systemd logs "Permission denied" error about files under home directory — Red Hat Customer Portal](https://access.redhat.com/solutions/7077315)
