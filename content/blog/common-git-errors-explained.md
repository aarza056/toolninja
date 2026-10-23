---
title: "The Git Errors Every Developer Hits (and the Exact Fix for Each)"
description: "Failed to push some refs, refusing to merge unrelated histories, detached HEAD, and merge conflicts — the Git errors everyone Googles at least once. Here's what each one actually means and how to resolve it."
date: "2026-08-05"
author: "ToolNinja"
coverEmoji: "🔧"
tags: ["git errors explained", "failed to push some refs", "refusing to merge unrelated histories", "git merge conflict fix", "detached head state", "fatal not a git repository", "git error messages", "how to fix git errors", "git", "version-control", "errors"]
relatedTools: ["git-command-generator"]
faqs:
  - q: "Is git pull --force ever a good way to fix 'failed to push some refs'?"
    a: "There's no such thing as git pull --force — the force flag applies to push, not pull, and force-pushing to resolve a rejected push is exactly the wrong instinct in most cases: it overwrites whatever the remote has, including a teammate's work you haven't seen yet. The correct default is git pull to merge or rebase the remote changes in first, and reserve force-pushing for branches only you use, like your own feature branch after an interactive rebase."
  - q: "What's actually different about a merge conflict versus 'refusing to merge unrelated histories'?"
    a: "A merge conflict means Git successfully found a shared history between the two branches but both sides changed the same lines, so it needs you to decide the outcome. 'Refusing to merge unrelated histories' is a different situation entirely — Git can't find any common commit ancestor between the two histories at all, which usually means you're merging two repositories that were never actually connected, not two branches of the same project."
  - q: "How do I know if I'm in a detached HEAD state, and does it matter?"
    a: "Run git status — it will explicitly say 'HEAD detached at <commit>' instead of naming a branch. It matters because any commits you make while detached aren't attached to any branch, so if you switch away without creating a branch first, those commits become unreachable and are eventually garbage collected — effectively lost."
  - q: "Why does 'fatal: not a git repository' happen even though I'm sure I'm in the right folder?"
    a: "Git determines whether a directory is a repository by walking upward looking for a .git folder — if you deleted, renamed, or never actually ran git init in that specific directory tree, every git command fails with this error regardless of how confident you are about the folder name. Run ls -la (or dir /a on Windows) to check for a .git folder directly, or run git init if this is genuinely a new repository."
---

## Every Developer's Git Error Ritual

Type the exact error text into a search engine, open four Stack Overflow tabs, skim past three answers that don't quite match your situation, and eventually find the one that does. This happens to junior and senior developers alike — Git's error messages are accurate but rarely self-explanatory about *why* something is blocked or *what to do next*.

Here are the five that come up constantly, explained properly.

---

## 1. "error: failed to push some refs"

```
error: failed to push some refs to 'https://github.com/you/repo.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally.
```

**What it means:** the remote branch has commits your local branch doesn't have — usually because someone else pushed since you last pulled, or because you pushed from a different machine. Git refuses to overwrite history it doesn't know about.

**Fix:** pull the remote changes in first, then push:

```bash
git pull
git push
```

If `git pull` produces a merge conflict, resolve it (see below) before pushing. If you specifically want to preserve a linear history instead of a merge commit, `git pull --rebase` replays your local commits on top of the remote ones instead of merging.

**What not to do:** reach for `git push --force` as a first instinct. Force-pushing overwrites the remote branch with your local one — including discarding any commits the remote has that you don't. On a shared branch, that can silently delete a teammate's work. Reserve force-pushing for branches only you use.

---

## 2. Merge Conflict

```
Auto-merging src/app.js
CONFLICT (content): Merge conflict in src/app.js
Automatic merge failed; fix conflicts and then commit the result.
```

**What it means:** Git found a common ancestor between the two branches (unlike error #3 below), but both branches changed the **same lines** of the same file since that ancestor, and Git can't automatically decide which version is correct.

**Fix:** open the conflicting file — Git marks the conflicting sections directly in the file:

```
<<<<<<< HEAD
your version of the line
=======
their version of the line
>>>>>>> branch-name
```

Edit the file to keep whichever content is correct (removing the `<<<<<<<`, `=======`, `>>>>>>>` markers), then:

```bash
git add src/app.js
git commit
```

For conflicts in generated or binary files where you know which side should simply win entirely, `git checkout --ours <file>` or `git checkout --theirs <file>` resolves it without manual editing.

---

## 3. "fatal: refusing to merge unrelated histories"

```
fatal: refusing to merge unrelated histories
```

**What it means:** this is different from a normal merge conflict. Git looked for a common commit ancestor between the two histories and **found none at all** — the two branches don't share any origin. This typically happens when you're combining two repositories that were genuinely separate projects, or re-initializing a repo and trying to merge in an old clone that no longer shares history with the new one.

**Fix:** if you're certain this merge is intentional (it usually is when this error fires — you know you're combining two separate projects), explicitly allow it:

```bash
git merge other-branch --allow-unrelated-histories
```

Expect a genuine merge conflict resolution step afterward, since Git now has to reconcile two histories with zero shared context.

---

## 4. Detached HEAD State

```
Note: switching to '3f2a1b9'.

You are in 'detached HEAD' state...
```

**What it means:** you checked out a specific commit hash (or a tag) instead of a branch. `HEAD` — Git's pointer to "what you're currently looking at" — is now pointing directly at a commit instead of at a branch reference. You can look around and even make commits, but those commits aren't attached to any named branch.

**The risk:** if you make new commits while detached and then switch to another branch without doing anything else, those detached commits become unreachable by name — Git's garbage collector will eventually clean them up, and they're effectively lost.

**Fix, if you want to keep any work done in this state:** create a branch right where you are, before switching away:

```bash
git switch -c recovered-work
```

**Fix, if you just want to get back to normal:** switch back to a real branch:

```bash
git switch main
```

---

## 5. "fatal: not a git repository (or any of the parent directories): .git"

**What it means:** every Git command works by walking upward from your current directory looking for a `.git` folder. This error means it walked all the way up without finding one — you're either not inside a repository at all, or the `.git` folder was deleted or never created.

**Fix:** confirm what's actually there:

```bash
ls -la      # macOS/Linux
dir /a      # Windows
```

If there's genuinely no `.git` folder and this should be a new repository:

```bash
git init
```

If you meant to be inside an existing project, double check you're actually in the right directory — `pwd` (or `cd` alone on Windows) confirms your current path.

---

## Quick Reference

| Error | Root cause | Fix |
|---|---|---|
| failed to push some refs | Remote has commits you don't have locally | `git pull` (or `--rebase`), then push |
| Merge conflict | Both branches changed the same lines | Edit conflict markers, `git add`, `git commit` |
| refusing to merge unrelated histories | No common ancestor between the histories | `git merge --allow-unrelated-histories` |
| Detached HEAD | Checked out a commit/tag instead of a branch | `git switch -c <name>` to save work, or `git switch main` |
| fatal: not a git repository | No `.git` folder found in this directory tree | `git init`, or `cd` to the correct folder |

---

## Look Up the Right Command Without Guessing

**[ToolNinja's Git Command Generator →](/tools/git-command-generator)** covers 65+ common Git operations — search by what you're trying to do in plain English and get the exact command, with warnings on the destructive ones before you run them.

---

Sources:
- [Debugging Common Git Errors — Graphite](https://graphite.com/guides/debugging-common-git-errors)
- [Common Git Errors, How to Fix, and 5 Ways to Avoid Them — Komodor](https://komodor.com/learn/git-errors/)
