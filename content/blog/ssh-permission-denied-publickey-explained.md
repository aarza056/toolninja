---
title: "SSH \"Permission Denied (publickey)\": The Real Causes and How to Fix Each One"
description: "This error hides at least six different root causes behind one generic message. Here's how to tell which one you're actually looking at, with the exact commands to diagnose and fix each."
date: "2026-09-01"
author: "ToolNinja"
coverEmoji: "🔑"
tags: ["ssh permission denied publickey", "ssh permission denied", "ssh key authentication failed", "too many authentication failures ssh", "ssh authorized_keys not working", "ssh-add no identities", "ssh strictmodes", "ssh troubleshooting", "ssh key errors explained", "devops", "linux", "ssh"]
relatedTools: ["ssh-key-generator"]
faqs:
  - q: "How do I see exactly which key SSH is trying, instead of just getting the generic denial?"
    a: "Run ssh -v user@host (or -vvv for maximum detail). Verbose mode prints every key SSH offers to the server and the server's response to each one, which is the single most useful piece of information for narrowing down which of the several possible causes you're actually hitting — a permissions problem and a wrong-key problem produce the identical final error message, but look completely different in verbose output."
  - q: "Why does adding -i /path/to/key sometimes fix it when the key is already in ~/.ssh?"
    a: "By default, ssh offers every key it can find (in ~/.ssh and loaded in ssh-agent) until one works or it runs out of attempts. If you have several keys and the server's MaxAuthTries is set low (commonly 6), ssh can exhaust its attempts on the wrong keys before ever offering the right one, and you'll see 'Too many authentication failures' instead of a normal denial. Passing -i explicitly (or setting IdentitiesOnly yes in your SSH config for that host) forces ssh to offer only that one key."
  - q: "The permissions on my authorized_keys file look fine — could the problem still be permissions?"
    a: "Check every directory in the path, not just the file. OpenSSH's StrictModes setting (on by default) also rejects pubkey authentication if your home directory or ~/.ssh directory itself is group- or world-writable, even when authorized_keys itself has correct permissions. This is one of the most commonly missed causes precisely because people check the file and stop there."
  - q: "How do I check what the server itself thinks went wrong, instead of guessing from the client side?"
    a: "The server-side auth log usually states the exact reason. On Debian/Ubuntu check /var/log/auth.log, on RHEL/CentOS/Fedora check /var/log/secure or journalctl -u sshd. A permissions problem specifically shows up as something like \"Authentication refused: bad ownership or modes for directory /home/user\" — a message you'll never see on the client side at all."
---

## One Error Message, At Least Six Different Causes

`Permission denied (publickey)` is one of the most-searched SSH errors that exists, and the frustrating part is that the message itself gives you almost no information about *which* of several unrelated problems you're actually facing. A permissions issue, a wrong key, an unloaded agent, and a server-side config restriction all produce the exact same line. Here's how to tell them apart and fix each one.

```
user@host: Permission denied (publickey).
```

---

## Step Zero: Always Start With Verbose Mode

Before guessing, get more information:

```bash
ssh -v user@host
```

This prints every key `ssh` offers and the server's response to each — it's the fastest way to know whether the problem is "no key was offered," "the right key was offered and rejected," or "ssh gave up before trying the right key at all." Everything below assumes you've looked at this output.

---

## Cause 1: Server-Side Directory/File Permissions (StrictModes)

```
# in the server's auth log, not on your client:
Authentication refused: bad ownership or modes for directory /home/user
```

**What it means:** OpenSSH's `StrictModes` setting (on by default) refuses public-key authentication if the permissions on your home directory, `~/.ssh`, or `~/.ssh/authorized_keys` are too permissive — specifically, writable by anyone other than the owner. This is one of the most commonly missed causes, because people check `authorized_keys` itself and stop there, missing that the *directories* above it matter just as much.

**Fix — on the server:**

```bash
chmod 700 ~
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

## Cause 2: The Public Key Isn't Actually in `authorized_keys`

The most direct cause: the key genuinely isn't there, or was corrupted in transit — a common one is copy-pasting a public key and accidentally splitting it across two lines, or missing the trailing part of the key entirely.

**Check on the server:**

```bash
cat ~/.ssh/authorized_keys
```

Confirm it's a single unbroken line starting with `ssh-ed25519` or `ssh-rsa`, matching your local public key file (`~/.ssh/id_ed25519.pub` or similar) exactly.

---

## Cause 3: SSH Is Offering the Wrong Key

```
debug1: Offering public key: /home/user/.ssh/id_rsa_old RSA SHA256:...
debug1: Authentications that can continue: publickey
...
Received disconnect from host: Too many authentication failures
```

**What it means:** if you have multiple keys in `~/.ssh` or loaded in `ssh-agent`, `ssh` tries them in order until one works — but the server's `MaxAuthTries` (commonly 6) caps how many attempts it'll accept per connection. With several keys loaded, `ssh` can burn through that limit on the wrong ones before ever offering the correct key, producing "Too many authentication failures" instead of a normal denial.

**Fix — force the specific key:**

```bash
ssh -i ~/.ssh/id_ed25519 user@host
```

Or make it permanent for that host in `~/.ssh/config`:

```
Host myserver
    HostName host.example.com
    User user
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

`IdentitiesOnly yes` is the important part — it stops `ssh` from also offering every other key it can find.

---

## Cause 4: The Agent Doesn't Have the Key Loaded

```bash
ssh-add -l
# The agent has no identities.
```

**What it means:** if you're relying on `ssh-agent` (rather than a key file passed explicitly), an empty agent means no key gets offered at all — this looks identical to a wrong-key problem in the final error message, but `ssh-add -l` makes it obvious immediately.

**Fix:**

```bash
eval "$(ssh-agent -s)"   # start the agent if it isn't running
ssh-add ~/.ssh/id_ed25519
```

---

## Cause 5: Server-Side Config Is Blocking You

Even a perfectly valid key fails if the server itself is configured to reject it — check `/etc/ssh/sshd_config` for:

```
PubkeyAuthentication no
```

or an `AllowUsers`/`AllowGroups` directive that doesn't include your account. Both produce the same client-side denial with no indication of *why* — this is exactly why checking the server's own auth log (below) matters more than staring at the client output.

---

## Cause 6: Wrong Username, Especially on Cloud Instances

A perfectly valid key still fails if you're connecting as the wrong user — this is especially common on cloud VMs, where the default SSH username varies by image: `ec2-user` (Amazon Linux), `ubuntu` (Ubuntu AMIs), `admin` or `centos` depending on provider and distro. Connecting as `root` with a correctly configured key still fails if `root` login is disabled and your key is actually authorized under a different username.

---

## Check the Server's Own Logs — It Usually Just Tells You

The client-side error is deliberately vague for security reasons (so an attacker can't tell *why* auth failed). The server's own log is not:

```bash
# Debian / Ubuntu
tail -f /var/log/auth.log

# RHEL / CentOS / Fedora
tail -f /var/log/secure
# or
journalctl -u sshd -f
```

Watch this while you attempt to connect — it will usually state the exact reason (bad permissions, key not found, user not allowed) far more directly than anything visible on the client.

---

## Quick Reference

| Symptom | Likely cause | Fix |
|---|---|---|
| Denied immediately, no keys tried | Agent empty or key not found | `ssh-add -l`, then `ssh-add <key>` |
| "Too many authentication failures" | Wrong key offered first, too many keys loaded | `ssh -i <key>` or `IdentitiesOnly yes` in config |
| Denied, key looks correct | authorized_keys missing/corrupted, or permissions | Check `authorized_keys` content and `chmod 700 ~/.ssh` |
| Works for one user, not another | Wrong username, especially on cloud VMs | Confirm the image's default SSH user |
| Nothing client-side explains it | Server-side sshd_config restriction | Check `/etc/ssh/sshd_config` and the server's auth log |

---

## Generating a Fresh Key the Right Way

If you're setting up a new key from scratch rather than debugging an existing one, it's worth generating it in the current recommended format from the start — Ed25519 rather than RSA, in genuine OpenSSH format. **[ToolNinja's SSH Key Generator →](/tools/ssh-key-generator)** creates Ed25519 or RSA key pairs directly in your browser, verified byte-for-byte against real `ssh-keygen` output, so the public key you copy into `authorized_keys` is guaranteed to be in exactly the format the server expects.

---

Sources:
- [OpenSSH sshd_config manual — StrictModes](https://man.openbsd.org/sshd_config)
- [OpenSSH ssh_config manual — IdentitiesOnly, IdentityFile](https://man.openbsd.org/ssh_config)
