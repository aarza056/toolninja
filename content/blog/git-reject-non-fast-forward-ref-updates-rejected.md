---
title: "Git Error: Updates Were Rejected (Non-Fast-Forward) Fix"
description: "The 'updates were rejected because the tip of your current branch is behind' git error means your local branch is out of sync with the remote. Learn the safe fix and when to use each approach."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "🔀"
tags: ["git", "git push", "git error", "non-fast-forward", "rejected push", "git pull", "git rebase"]
relatedTools: ["git-command-generator"]
faqs:
  - q: "What does 'non-fast-forward' mean in git?"
    a: "A fast-forward push is when the remote branch can be updated by simply moving the pointer forward to your new commit — there is no divergence. Non-fast-forward means the remote has commits your local branch doesn't have, so git refuses to overwrite them."
  - q: "When is it safe to use git push --force?"
    a: "Only on branches you own exclusively, like a personal feature branch that no one else has cloned or based work on. Never force push to main, master, or shared branches. Use --force-with-lease as a safer alternative."
  - q: "What is the difference between git pull --rebase and git pull --merge?"
    a: "git pull --merge creates a merge commit, preserving branch history. git pull --rebase replays your commits on top of the fetched commits, creating a linear history. Both result in the same final code, but rebase produces cleaner history for feature branches."
---

## The Exact Error

```
 ! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/user/repo.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. Integrate the remote changes (e.g.
hint: 'git pull ...') before pushing again.
```

> Quick summary: The remote branch has commits that your local branch doesn't have. Git refuses to push because it would overwrite those commits. Pull the remote changes, resolve any conflicts, then push again.

---

## Why This Error Happens

**1. Someone else pushed to the same branch** while you were working on it

**2. You pushed from a different machine** and the other machine's work is now ahead

**3. You reset or rewrote history locally** making your branch diverge from the remote

**4. You force-pushed previously** and are now trying to push normally from an old clone

---

## Step-by-Step Diagnosis

### Step 1 — See how the branches have diverged

```bash
git fetch origin
git log --oneline --graph HEAD origin/main
# Shows both branches and where they diverged
```

### Step 2 — Identify which commits are only on remote

```bash
git log HEAD..origin/main --oneline
# These are commits on remote that you don't have locally
```

### Step 3 — Identify which commits are only local

```bash
git log origin/main..HEAD --oneline
# These are your local commits that haven't been pushed yet
```

---

## Solutions

### Solution 1 — Pull with rebase (recommended for feature branches)

```bash
git pull --rebase origin main
# Resolves any conflicts, then:
git push origin main
```

Rebase replays your commits on top of the remote commits, resulting in a clean linear history.

### Solution 2 — Pull with merge (preserves branch history)

```bash
git pull origin main
# Creates a merge commit if there are divergent changes
git push origin main
```

### Solution 3 — Force push (only for branches you own exclusively)

```bash
# Safer force push — fails if remote was updated since your last fetch
git push --force-with-lease origin feature/my-branch

# Plain force (use with caution):
git push --force origin feature/my-branch
```

**Never force push to main, master, or shared branches.**

### Solution 4 — If you pushed to the wrong branch

```bash
# Move your commits to a new branch and reset the wrong branch
git branch my-work  # save current commits
git reset --hard origin/main  # reset to match remote
git checkout my-work  # continue on the correct branch
```

---

## Real-World Examples

**Team workflow — someone else pushed while you were working:**

```bash
git fetch origin
git rebase origin/main
# Fix any conflicts in each commit
# git add . && git rebase --continue for each
git push origin feature/my-feature
```

**Squash and force push a PR branch:**

```bash
git rebase -i origin/main  # squash commits
git push --force-with-lease origin feature/my-feature
# Safe because this is your own PR branch
```

---

## Quick Reference — Push Rejection Solutions

| Situation | Solution |
|---|---|
| Remote has new commits, clean local | `git pull --rebase && git push` |
| Remote has new commits, local conflicts | `git pull --rebase`, resolve, `git push` |
| Own feature branch, want linear history | `git push --force-with-lease` |
| Shared branch, preserve all history | `git pull --merge && git push` |
| Accidentally diverged, want remote state | `git reset --hard origin/branch` |

---

## Prevent This Error in the Future

**1. Pull before you start working** — `git pull --rebase` at the start of each session.

**2. Use short-lived feature branches** — the longer a branch lives, the more it diverges.

**3. Set rebase as the default pull strategy:**

```bash
git config --global pull.rebase true
```

---

## Use ToolNinja to Debug Faster

The Git Command Generator helps you build the right git commands for common scenarios — branching, merging, rebasing, and force pushing — with explanations of what each flag does.

🔧 **[Git Command Generator — toolninja.io/tools/git-command-generator](https://toolninja.io/tools/git-command-generator)**
