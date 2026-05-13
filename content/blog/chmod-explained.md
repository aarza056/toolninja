---
title: "chmod Explained: Linux File Permissions for Developers"
description: "Master Linux file permissions with chmod. Understand octal notation, symbolic mode, chmod 755 vs 777 vs 644, and real-world examples for web servers and scripts."
date: "2025-11-01"
author: "ToolNinja"
coverEmoji: "🔐"
tags: ["linux", "chmod", "permissions", "devops", "security"]
relatedTools: ["chmod-calculator"]
---

## What Is chmod?

`chmod` (change mode) is the Linux command for setting **file and directory permissions**. Every file on a Unix-like system has three permission sets — owner, group, and others — and three permission types: **read (r)**, **write (w)**, and **execute (x)**.

Getting permissions right is fundamental to security. Too permissive (`chmod 777`) and you expose yourself to attacks; too restrictive and your application breaks at 3 AM.

---

## Understanding the Octal System

Each permission set maps to a 3-bit binary number:

| Permission | Binary | Octal |
|-----------|--------|-------|
| `---` | 000 | 0 |
| `--x` | 001 | 1 |
| `-w-` | 010 | 2 |
| `-wx` | 011 | 3 |
| `r--` | 100 | 4 |
| `r-x` | 101 | 5 |
| `rw-` | 110 | 6 |
| `rwx` | 111 | 7 |

A three-digit octal like **755** means:
- **7** (rwx) — owner can read, write, execute
- **5** (r-x) — group can read and execute
- **5** (r-x) — others can read and execute

---

## The Most Common chmod Values

### chmod 755 — Standard executable / directory

```bash
chmod 755 /var/www/html
chmod 755 deploy.sh
```

Use this for directories and scripts that need to be readable and executable by everyone, but writable only by the owner. This is the standard for web server document roots.

### chmod 644 — Standard file

```bash
chmod 644 index.html
chmod 644 config.ini
```

The default for regular files: owner can read and write, everyone else can only read. Perfect for web content files, config files, and logs.

### chmod 600 — Private files

```bash
chmod 600 ~/.ssh/id_rsa
chmod 600 .env
```

Owner read/write only. **Required** for SSH private keys — SSH will refuse to use a key file that's too permissive. Also good practice for `.env` files and credentials.

### chmod 777 — Avoid in production

```bash
# ⚠️ Everyone can read, write, and execute
chmod 777 uploads/
```

`chmod 777` makes a file or directory fully open to every user on the system. Only use this for temporary debugging or in local dev environments where security doesn't matter. Never on a production server.

### chmod 700 — Private directory

```bash
chmod 700 ~/.ssh
```

Owner-only access. Standard for the `~/.ssh` directory itself.

---

## Symbolic Mode vs Octal Mode

You don't have to memorize octal. Symbolic mode uses letters:

```bash
# Add execute permission for owner
chmod u+x script.sh

# Remove write permission from group and others
chmod go-w sensitive.conf

# Set read for all
chmod a+r public.html

# Set exact permissions symbolically
chmod u=rwx,g=rx,o=rx /usr/local/bin/app
```

Symbolic mode is great for **adding or removing** a specific bit without affecting the others.

---

## Recursive chmod with -R

To apply permissions to a directory and everything inside it:

```bash
chmod -R 755 /var/www/html
```

**Warning:** Be careful with `-R` — applying execute permission recursively to a directory of HTML files doesn't hurt, but it's sloppy. A more precise approach:

```bash
# Directories get 755, files get 644
find /var/www/html -type d -exec chmod 755 {} \;
find /var/www/html -type f -exec chmod 644 {} \;
```

---

## Special Permission Bits

Beyond the standard rwx, there are three special bits:

### Setuid (4xxx)

```bash
chmod 4755 /usr/bin/passwd
```

When set on an executable, it runs as the file **owner** rather than the user who launched it. Used by `passwd`, `sudo`, and similar system tools.

### Setgid (2xxx)

```bash
chmod 2775 /shared/project
```

On a directory, new files inherit the directory's group rather than the creator's primary group. Useful for shared project folders.

### Sticky bit (1xxx)

```bash
chmod 1777 /tmp
```

On a directory, only the file owner (and root) can delete their own files — even if others have write permission. This is how `/tmp` works.

---

## Reading Permissions with ls -l

```bash
ls -la ~/.ssh
# -rw------- 1 user user 3.4K May  1 09:00 id_rsa
# -rw-r--r-- 1 user user  742 May  1 09:00 id_rsa.pub
# drwx------ 2 user user 4.0K May  1 09:00 .
```

The first character indicates type (`-` = file, `d` = directory, `l` = symlink), then three groups of three permission characters.

---

## Common Real-World Setups

| Context | Path | chmod |
|---------|------|-------|
| Web root directory | `/var/www/html` | `755` |
| Web content files | `/var/www/html/*.html` | `644` |
| PHP/script files | `/var/www/html/*.php` | `644` |
| SSH private key | `~/.ssh/id_rsa` | `600` |
| SSH directory | `~/.ssh` | `700` |
| Environment file | `.env` | `600` |
| Shell script | `deploy.sh` | `755` |
| Upload directory | `uploads/` | `775` |
| Shared config | `/etc/app.conf` | `644` |

---

## Quick Reference: Octal to Symbolic

| Octal | Symbolic | Meaning |
|-------|----------|---------|
| 777 | rwxrwxrwx | Full access for everyone (avoid) |
| 755 | rwxr-xr-x | Owner full, others read/exec |
| 750 | rwxr-x--- | Owner full, group read/exec, no others |
| 644 | rw-r--r-- | Owner read/write, others read |
| 640 | rw-r----- | Owner read/write, group read |
| 600 | rw------- | Owner read/write only |
| 700 | rwx------ | Owner full, no others |
| 444 | r--r--r-- | Read-only for everyone |

---

## Try It: ToolNinja Chmod Calculator

Calculating octal values by hand is error-prone. Use the **[ToolNinja Chmod Calculator](/tools/chmod-calculator)** to click checkboxes and instantly see the octal value, symbolic notation, and a ready-to-run `chmod` command.

No login, no tracking — runs 100% in your browser.
