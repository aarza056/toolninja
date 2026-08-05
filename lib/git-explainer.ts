export interface ExplainedToken {
  token: string;
  meaning: string;
  dangerous?: boolean;
}

export interface GitExplanation {
  subcommand: string;
  subcommandMeaning: string;
  tokens: ExplainedToken[];
  hasDangerousFlags: boolean;
}

const SUBCOMMAND_MEANINGS: Record<string, string> = {
  reset: "Moves the current branch pointer, optionally changing the staging area and working directory to match.",
  rebase: "Reapplies your commits on top of a different base commit, rewriting history.",
  checkout: "Switches branches, or restores working tree files to a previous state.",
  switch: "Switches the current branch — a safer, narrower alternative to checkout.",
  restore: "Restores working tree files from the index or a specific commit, without switching branches.",
  merge: "Combines the changes from another branch into the current branch.",
  "cherry-pick": "Applies the changes introduced by an existing commit onto the current branch as a new commit.",
  stash: "Temporarily shelves uncommitted changes so you can work on something else.",
  push: "Uploads local commits to a remote repository.",
  pull: "Fetches from a remote and integrates the changes into the current branch.",
  fetch: "Downloads commits, files, and refs from a remote without merging or rebasing.",
  clean: "Removes untracked files from the working directory.",
  revert: "Creates a new commit that undoes the changes introduced by a previous commit.",
  tag: "Creates, lists, or deletes tags — named pointers to specific commits.",
  branch: "Creates, lists, or deletes branches.",
  log: "Shows the commit history.",
  diff: "Shows changes between commits, the working tree, and the staging area.",
  status: "Shows the state of the working directory and staging area.",
  add: "Stages changes for the next commit.",
  commit: "Records staged changes as a new commit.",
  remote: "Manages the set of tracked remote repositories.",
  init: "Creates a new, empty git repository.",
  clone: "Copies an existing repository, including its full history.",
  rm: "Removes files from the working directory and stages the removal.",
  mv: "Moves or renames a file and stages the change.",
  show: "Shows information about a git object — a commit, tag, or tree.",
  blame: "Shows who last modified each line of a file, and in which commit.",
  bisect: "Uses binary search across commit history to find the commit that introduced a bug.",
  reflog: "Shows a log of everywhere HEAD and branch refs have pointed — including commits that look 'lost'.",
  worktree: "Manages multiple working directories attached to the same repository.",
  submodule: "Manages nested git repositories referenced within this repository.",
};

const FLAG_MEANINGS: Record<string, { meaning: string; dangerous?: boolean }> = {
  "--hard": { meaning: "discards all changes in the working directory and staging area — any uncommitted work is permanently lost.", dangerous: true },
  "--soft": { meaning: "moves HEAD only, leaving the staging area and working directory untouched (changes stay staged)." },
  "--mixed": { meaning: "moves HEAD and unstages changes, but keeps them in the working directory (this is reset's default mode)." },
  "-f": { meaning: "forces the operation, overriding a safety check that would otherwise stop it.", dangerous: true },
  "--force": { meaning: "forces the operation, overriding a safety check that would otherwise stop it.", dangerous: true },
  "--force-with-lease": { meaning: "force-pushes, but only if the remote branch hasn't changed since you last fetched it — safer than a plain --force.", dangerous: true },
  "-d": { meaning: "deletes — refuses if the target isn't fully merged/safe to remove." },
  "-D": { meaning: "force-deletes, even if the target isn't fully merged.", dangerous: true },
  "--amend": { meaning: "replaces the most recent commit instead of creating a new one." },
  "--no-verify": { meaning: "skips pre-commit and commit-message hooks.", dangerous: true },
  "-x": { meaning: "also removes files that are ignored by .gitignore.", dangerous: true },
  "-n": { meaning: "dry run — shows what would happen without actually doing it." },
  "--dry-run": { meaning: "shows what would happen without actually doing it." },
  "-a": { meaning: "applies to all matching items, not just the current one." },
  "--all": { meaning: "applies to all matching items, not just the current one." },
  "--rebase": { meaning: "replays your local commits on top of the fetched changes instead of creating a merge commit." },
  "--squash": { meaning: "combines all commits from the other branch into a single set of changes, without creating a merge commit." },
  "--no-ff": { meaning: "always creates a merge commit, even when a fast-forward would otherwise be possible." },
  "--ff-only": { meaning: "only allows the merge if it can fast-forward, refusing otherwise." },
  "-u": { meaning: "sets the remote branch as the upstream tracking branch for the current local branch." },
  "--set-upstream": { meaning: "sets the remote branch as the upstream tracking branch for the current local branch." },
  "--prune": { meaning: "removes remote-tracking references that no longer exist on the remote.", dangerous: true },
  "--staged": { meaning: "operates on the staged (index) changes rather than the working directory." },
  "--cached": { meaning: "operates on the staged (index) changes, or (for rm) removes only from the index, keeping the file on disk." },
  "-p": { meaning: "interactively selects individual hunks rather than applying to the whole file." },
  "--patch": { meaning: "interactively selects individual hunks rather than applying to the whole file." },
  "-b": { meaning: "creates a new branch (commonly paired with checkout/switch to also switch to it)." },
  "-B": { meaning: "creates or resets a branch to the given start point, then switches to it.", dangerous: true },
  "--delete": { meaning: "deletes the specified branch or tag." },
  "--tags": { meaning: "includes tags in the operation." },
  "--depth": { meaning: "limits history to the given number of recent commits (a shallow clone/fetch)." },
  "--global": { meaning: "applies the config change for the current user across all repositories, not just this one." },
  "-m": { meaning: "provides an inline message, or (for cherry-pick/revert on a merge commit) selects the mainline parent — meaning depends on the subcommand." },
  "-i": { meaning: "interactive mode — opens an editor or prompt to review/modify each step." },
  "--interactive": { meaning: "interactive mode — opens an editor or prompt to review/modify each step." },
  "--onto": { meaning: "replays commits onto a different base than the one they're currently built on." },
  "--abort": { meaning: "cancels the in-progress operation and restores the state from before it started." },
  "--continue": { meaning: "continues the in-progress operation after resolving a conflict." },
  "--no-edit": { meaning: "accepts the default commit message without opening an editor." },
};

export function explainGitCommand(input: string): GitExplanation | null {
  const trimmed = input.trim().replace(/^git\s+/, "");
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  const subcommand = parts[0];
  const rest = parts.slice(1);

  // Two-word subcommands like "cherry-pick" are already single tokens; nothing extra needed,
  // but git also has some genuinely two-token forms — none common enough to special-case here.
  if (!(subcommand in SUBCOMMAND_MEANINGS)) {
    return null;
  }

  const tokens: ExplainedToken[] = [];
  let hasDangerousFlags = false;

  const pushFlag = (token: string) => {
    const known = FLAG_MEANINGS[token];
    if (known) {
      tokens.push({ token, meaning: known.meaning, dangerous: known.dangerous });
      if (known.dangerous) hasDangerousFlags = true;
      return true;
    }
    return false;
  };

  for (const token of rest) {
    if (token.startsWith("--")) {
      if (!pushFlag(token)) {
        tokens.push({ token, meaning: "flag (meaning not in our lookup — check `git help " + subcommand + "`)" });
      }
    } else if (token.startsWith("-") && token.length > 1) {
      // Short flags can be bundled (-fdx means -f -d -x) — split and explain each individually
      // if every character resolves to a known short flag; otherwise show it as one opaque token.
      const chars = token.slice(1).split("");
      const asShortFlags = chars.map((c) => `-${c}`);
      if (chars.length > 1 && asShortFlags.every((f) => f in FLAG_MEANINGS)) {
        asShortFlags.forEach(pushFlag);
      } else if (!pushFlag(token)) {
        tokens.push({ token, meaning: "flag (meaning not in our lookup — check `git help " + subcommand + "`)" });
      }
    } else {
      tokens.push({ token, meaning: "argument — a branch, ref, commit, path, or similar value" });
    }
  }

  return {
    subcommand,
    subcommandMeaning: SUBCOMMAND_MEANINGS[subcommand],
    tokens,
    hasDangerousFlags,
  };
}
