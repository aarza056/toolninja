#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "CHANGELOG.md");

const EMOJI = {
  feat:     "✨",
  fix:      "🐛",
  perf:     "⚡",
  refactor: "♻️",
  style:    "💄",
  docs:     "📝",
  chore:    "🔧",
  test:     "✅",
  ci:       "👷",
  build:    "📦",
  revert:   "⏪",
};

function getPrefix(msg) {
  const m = msg.match(/^(\w+)(\(.+?\))?!?:\s*/);
  return m ? m[1].toLowerCase() : null;
}

function formatEntry(msg) {
  const prefix = getPrefix(msg);
  const emoji = prefix && EMOJI[prefix] ? EMOJI[prefix] : "•";
  const cleaned = msg.replace(/^(\w+)(\(.+?\))?!?:\s*/, "").trim();
  const scope = msg.match(/^\w+\((.+?)\)/)?.[1];
  const scopeStr = scope ? ` \`${scope}\`` : "";
  return `- ${emoji}${scopeStr} ${cleaned}`;
}

const raw = execSync(
  'git log --pretty=format:"%ad|%s" --date=short',
  { encoding: "utf8" }
).trim();

if (!raw) {
  fs.writeFileSync(OUT, "# Changelog\n\nNo commits yet.\n");
  process.exit(0);
}

const byDate = {};
for (const line of raw.split("\n")) {
  const [date, ...rest] = line.split("|");
  const msg = rest.join("|").trim();
  if (!msg || msg.startsWith("Merge")) continue;
  if (!byDate[date]) byDate[date] = [];
  byDate[date].push(msg);
}

const sections = Object.keys(byDate)
  .sort((a, b) => (a < b ? 1 : -1))
  .map((date) => {
    const entries = byDate[date].map(formatEntry).join("\n");
    return `## ${date}\n\n${entries}`;
  })
  .join("\n\n");

const content = `# Changelog\n\nAll notable changes to ToolNinja, auto-generated from commit history.\n\n${sections}\n`;
fs.writeFileSync(OUT, content);
console.log("✓ CHANGELOG.md updated");
