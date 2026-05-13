---
title: "Essential Git Commands Every Developer Should Know"
description: "A practical Git reference covering branching, stashing, rebasing, undoing mistakes, and advanced commands like bisect, reflog, and worktrees. With real-world workflows and examples."
date: "2025-12-13"
author: "ToolNinja"
coverEmoji: "🌿"
tags: ["git", "version-control", "workflow", "devops", "terminal"]
relatedTools: ["git-command-generator"]
---

## Setup and Config

```bash
# Set your identity
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Default branch name
git config --global init.defaultBranch main

# Better diffs
git config --global core.pager "diff-so-fancy | less --tabs=4 -RF"

# Pull with rebase instead of merge
git config --global pull.rebase true

# Useful aliases
git config --global alias.lg "log --oneline --graph --decorate --all"
git config --global alias.st "status -sb"
```

---

## The Core Workflow

```bash
# Stage specific files
git add src/auth.ts src/user.ts

# Stage parts of a file interactively
git add -p

# Commit
git commit -m "feat: add OAuth2 login support"

# Push a new branch
git push -u origin feature/oauth

# Pull with rebase (cleaner history than merge)
git pull --rebase
```

---

## Branching

```bash
# Create and switch in one command
git checkout -b feature/payment-flow
# Modern equivalent
git switch -c feature/payment-flow

# List all branches (local + remote)
git branch -a

# Delete merged branch
git branch -d feature/old-feature

# Delete unmerged branch (careful)
git branch -D feature/abandoned

# Rename current branch
git branch -m new-name

# Push and set upstream at once
git push -u origin feature/payment-flow
```

---

## Stashing

Stash is a temporary shelf for work-in-progress:

```bash
# Stash everything (tracked files)
git stash

# Stash with a description
git stash push -m "WIP: payment form validation"

# Include untracked files
git stash push -u

# List all stashes
git stash list

# Apply most recent stash (keep it in the list)
git stash apply

# Apply and remove from list
git stash pop

# Apply a specific stash
git stash apply stash@{2}

# Drop a specific stash
git stash drop stash@{1}

# Create a branch from a stash
git stash branch feature/from-stash stash@{0}
```

---

## Undoing Things

### Small mistakes (local, not pushed)

```bash
# Unstage a file
git restore --staged file.ts

# Discard working directory changes
git restore file.ts

# Amend the last commit (message or content)
git commit --amend --no-edit   # keep message, add staged changes
git commit --amend -m "better message"

# Undo last commit, keep changes staged
git reset --soft HEAD~1

# Undo last commit, keep changes unstaged
git reset HEAD~1

# Undo last commit, throw away changes (destructive)
git reset --hard HEAD~1
```

### After pushing

```bash
# Create a new commit that undoes a previous one (safe for shared branches)
git revert abc123

# Revert a merge commit
git revert -m 1 <merge-commit-sha>
```

---

## Rebasing

Rebase replays commits on top of another branch, giving you a linear history:

```bash
# Rebase feature branch on main
git checkout feature/my-feature
git rebase main

# Interactive rebase — edit, squash, reorder last 5 commits
git rebase -i HEAD~5

# Continue after resolving conflicts
git rebase --continue

# Abort the rebase
git rebase --abort

# Squash feature branch into one commit before merging
git rebase -i main
# mark all but first as 'squash' or 's'
```

**Rule:** Never rebase commits that have been pushed to a shared branch.

---

## The Reflog (Your Safety Net)

The reflog records every HEAD movement, including resets and rebases. Saved countless devs who thought they lost work:

```bash
# See all recent HEAD positions
git reflog

# Recover from a bad reset
git reset --hard HEAD@{3}

# Recover a deleted branch
git checkout -b recovered-branch abc1234
```

The reflog is local-only and expires after ~90 days by default.

---

## Searching History

```bash
# Search commit messages
git log --grep="payment" --oneline

# Find when a string was introduced
git log -S "function processPayment" --oneline

# Find when a regex pattern changed
git log -G "processPayment\(.*\)" --oneline

# Who changed a specific line (blame)
git blame -L 42,56 src/auth.ts

# Search through all history for a file
git log --all --full-history -- "**/deleted-file.ts"
```

---

## Git Bisect

Binary search through commit history to find the commit that introduced a bug:

```bash
git bisect start
git bisect bad                  # current commit is broken
git bisect good v2.1.0          # this tag was working

# Git checks out the midpoint commit
# Test your app, then tell git the result:
git bisect good    # or
git bisect bad

# Git narrows it down — repeat until it finds the culprit
# When done:
git bisect reset
```

For automated bisect with a test script:
```bash
git bisect run npm test
```

---

## Cherry-Picking

Apply a specific commit from another branch:

```bash
# Apply one commit
git cherry-pick abc123

# Apply a range of commits
git cherry-pick abc123..def456

# Cherry-pick without committing (stage only)
git cherry-pick -n abc123
```

---

## Tags

```bash
# Create a lightweight tag
git tag v1.0.0

# Create an annotated tag (with message)
git tag -a v1.0.0 -m "Release 1.0.0"

# Push tags to remote
git push origin v1.0.0
git push origin --tags

# Delete a local tag
git tag -d v0.9.0

# Delete a remote tag
git push origin --delete v0.9.0
```

---

## Working with Remotes

```bash
# View remotes
git remote -v

# Add a remote
git remote add upstream https://github.com/original/repo.git

# Fetch all remotes
git fetch --all

# Sync your fork with upstream
git fetch upstream
git rebase upstream/main

# Prune deleted remote branches
git fetch --prune
git remote prune origin
```

---

## Worktrees (Advanced)

Check out multiple branches simultaneously in separate directories:

```bash
# Create a worktree for a hotfix
git worktree add ../hotfix-branch hotfix/urgent-fix

# Work in the other directory without switching branches
cd ../hotfix-branch
# make changes, commit, push

# Remove the worktree when done
git worktree remove ../hotfix-branch
```

---

## Try It: ToolNinja Git Command Generator

Forget syntax for rarely-used commands? The **[ToolNinja Git Command Generator](/tools/git-command-generator)** lets you search across 65+ git commands by keyword or category, with clear descriptions and one-click copy.
