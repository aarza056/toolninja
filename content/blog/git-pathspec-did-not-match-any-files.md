---
title: "error: pathspec did not match any file(s) known to git ? Fix Guide"
description: "This Git error means the branch, file, or path you specified doesn't exist or isn't tracked. Learn how to detect the exact cause ? wrong branch name, unstaged file, detached HEAD ? and fix each case."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "??"
tags: ["git", "version control", "devops", "git checkout", "git branch", "pathspec error"]
relatedTools: ["git-command-generator"]
faqs:
  - q: "Why does 'git checkout branch-name' say path doesn't match when the branch exists on GitHub?"
    a: "A remote branch exists on the remote but not locally until you fetch it. Run 'git fetch origin' first to download the branch reference, then 'git checkout branch-name'. Git will automatically create a local tracking branch."
  - q: "Why does git checkout say a file doesn't match when I can see it with ls?"
    a: "A file that exists on disk but hasn't been added with 'git add' is 'untracked'. Git checkout restores tracked files ? it can't check out a file Git doesn't know about. Also check for typos and case sensitivity issues."
  - q: "What is a detached HEAD state and how does it cause this error?"
    a: "Detached HEAD means Git's HEAD points directly to a commit hash instead of a branch name. This happens after 'git checkout <commit-hash>'. In detached HEAD state, 'git checkout branch-name' may fail if Git interprets the name ambiguously."
  - q: "How do I check whether a branch exists locally vs remotely?"
    a: "List local branches: 'git branch'. List remote branches: 'git branch -r'. List all: 'git branch -a'. If a branch appears in remote but not local, use 'git fetch' then 'git checkout branch-name'."
---

## The Exact Error

```
error: pathspec 'feature/my-branch' did not match any file(s) known to git
```

> Quick summary: Git can't find what you specified ? either the branch name doesn't exist locally (needs a `git fetch`), the file path is wrong or untracked, or there's a typo. The phrase "known to git" is the key ? Git only knows about branches it has fetched and files it has tracked.

---

## Why This Error Happens

Git looks through local branches, tags, remote-tracking refs, and paths in the working tree. If none match, you get this error.

Five common causes:

**1. Branch exists on remote but not fetched locally** ? Someone created it and you haven't run `git fetch`.

**2. Typo in branch or file name** ? Single character difference or wrong case.

**3. Untracked file** ? `git checkout -- file.js` when `file.js` was never `git add`ed.

**4. Wrong path separator** ? Using backslash on Windows instead of forward slashes.

**5. Stale remote ref** ? Branch was deleted on the remote but your local refs are outdated.

---

## Step-by-Step Diagnosis

### Step 1 ? Check if the branch exists locally

```bash
git branch              # List all local branches
git branch | grep feature
```

### Step 2 ? Fetch and check remote branches

```bash
git fetch origin
git branch -r           # List remote branches
git branch -a           # All local + remote
```

### Step 3 ? Check for typos with tab completion

```bash
git checkout feature/<TAB>   # Shows available branches

git branch -a --sort=-committerdate | head -20
```

### Step 4 ? For file checkout, check if it's tracked

```bash
git ls-files src/myfile.js   # Returns path if tracked, empty if not
```

---

## Solutions

### Solution 1 ? Fetch then checkout remote branch

```bash
git fetch origin
git checkout feature/my-branch
# Git auto-creates local tracking branch
```

### Solution 2 ? Create the branch if it doesn't exist

```bash
git checkout -b feature/my-new-branch
git checkout -b feature/my-branch origin/main
```

### Solution 3 ? Fix path for file checkout

```bash
git checkout -- src/components/Button.js
git checkout abc1234 -- src/components/Button.js
```

### Solution 4 ? Clean up stale remote refs

```bash
git fetch --prune origin
git config --global fetch.prune true
```

---

## Quick Reference

| Symptom | Likely Cause | Fix |
|---|---|---|
| Branch works on GitHub but not locally | Remote-only branch | `git fetch origin` |
| File exists on disk but Git can't find it | File never added | `git add file` |
| "main" not found after fresh clone | Default branch name | `git fetch` then `git checkout main` |
| Works on macOS, fails on Linux | Case sensitivity | Check exact casing: `git branch -a` |
| Branch existed before but not now | Remote branch deleted | `git fetch --prune` |

---

## Prevent This Error in the Future

**1. Run `git fetch --all` before switching branches** to keep local refs in sync.

**2. Configure Git to prune stale refs automatically:** `git config --global fetch.prune true`.

**3. Use `git switch` instead of `git checkout` for branch operations** ? clearer error messages.

---

## Use ToolNinja to Debug Faster

The Git Command Generator helps you build the right Git command ? fetch + checkout, branch creation, file restoration ? without memorizing the flag combinations.

?? **[Git Command Generator ? toolninja.io/tools/git-command-generator](https://toolninja.io/tools/git-command-generator)**
