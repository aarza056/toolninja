#!/usr/bin/env node
/**
 * Generates CHANGELOG.md from git log.
 * Run manually: node scripts/gen-changelog.js
 * Runs automatically via .git/hooks/post-commit
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "CHANGELOG.md");

// Emoji + label mapping for conventional commit prefixes
const TYPES = {
  feat:     { emoji: "✨", label: "Features" },
  fix:      { emoji: "🐛", label: "Bug Fixes" },
  perf:     { emoji: "⚡", label: "Performance" },
  refactor: { emoji: "♻️", label: "Refactoring" },
  style:    { emoji: "💄", label: "Styling" },
  docs:     { emoji: "📚", label: "Documentation" },
  chore:    { emoji: "🔧", label: "Maintenance" },
  build:    { emoji: "📦", label: "Build" },
  ci:       { emoji: "🤖", label: "CI/CD" },
  test:     { emoji: "🧪", label: "Tests" },
  revert:   { emoji: "⏪", label: "Reverts" },
};

const DEFAULT_TYPE = { emoji: "📝", label: "Changes" };

function parseCommitType(subject) {
  const match = subject.match(/^(\w+)(\(.+?\))?!?:\s*(.*)/);
  if (!match) return { type: null, scope: null, message: subject };
  return {
    type: match[1].toLowerCase(),
    scope: match[2] ? match[2].replace(/[()]/g, "") : null,
    message: match[3],
  };
}

function getCommits() {
  const raw = execSync(
    'git log --pretty=format:"%H|%ad|%s" --date=short',
    { cwd: ROOT }
  )
    .toString()
    .trim();

  if (!raw) return [];

  return raw.split("\n").map((line) => {
    const [hash, date, ...rest] = line.split("|");
    const subject = rest.join("|");
    const { type, scope, message } = parseCommitType(subject);
    return { hash: hash.slice(0, 7), date, subject, type, scope, message };
  });
}

function groupByDate(commits) {
  const map = new Map();
  for (const commit of commits) {
    if (!map.has(commit.date)) map.set(commit.date, []);
    map.get(commit.date).push(commit);
  }
  return map;
}

function renderEntry(commit) {
  const scopePart = commit.scope ? ` **${commit.scope}**:` : "";
  const body = commit.type ? commit.message : commit.subject;
  return `- ${scopePart} ${body} (\`${commit.hash}\`)`;
}

function renderSection(typeKey, commits) {
  const def = TYPES[typeKey] || DEFAULT_TYPE;
  const lines = commits.map(renderEntry);
  return `### ${def.emoji} ${def.label}\n\n${lines.join("\n")}`;
}

function render(byDate) {
  const sections = [];

  for (const [date, commits] of [...byDate.entries()].sort((a, b) =>
    b[0].localeCompare(a[0])
  )) {
    // Group commits within the date by type
    const byType = new Map();
    for (const c of commits) {
      const key = c.type && TYPES[c.type] ? c.type : "__other__";
      if (!byType.has(key)) byType.set(key, []);
      byType.get(key).push(c);
    }

    const typeSections = [];
    // Render known types in priority order first
    for (const typeKey of Object.keys(TYPES)) {
      if (byType.has(typeKey)) {
        typeSections.push(renderSection(typeKey, byType.get(typeKey)));
      }
    }
    // Then uncategorised
    if (byType.has("__other__")) {
      typeSections.push(renderSection("__other__", byType.get("__other__")));
    }

    sections.push(`## ${date}\n\n${typeSections.join("\n\n")}`);
  }

  return `# Changelog\n\nAll notable changes to ToolNinja are documented here.\n\n---\n\n${sections.join("\n\n---\n\n")}`;
}

try {
  const commits = getCommits();
  if (commits.length === 0) {
    console.log("gen-changelog: no commits found, skipping.");
    process.exit(0);
  }
  const byDate = groupByDate(commits);
  const md = render(byDate);
  fs.writeFileSync(OUT, md + "\n", "utf8");
  console.log(`gen-changelog: wrote ${commits.length} commits → CHANGELOG.md`);
} catch (err) {
  console.error("gen-changelog error:", err.message);
  process.exit(1);
}
