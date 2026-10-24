export type GhaStack = "node" | "python" | "go" | "docker";
export type GhaNodePm = "npm" | "yarn" | "pnpm";

export interface GhaOptions {
  stack: GhaStack;
  name: string;
  branches: string;
  onPush: boolean;
  onPullRequest: boolean;
  onDispatch: boolean;
  schedule: string;
  os: string;
  // node
  nodeVersions: string;
  nodePm: GhaNodePm;
  runLint: boolean;
  runTest: boolean;
  runBuild: boolean;
  // python
  pythonVersions: string;
  // go
  goVersion: string;
  // docker
  imageName: string;
  pushImage: boolean;
  /** Pin each action to the commit of its release instead of a movable tag */
  pinShas: boolean;
}

export interface ActionRef {
  repo: string;
  major: string;
  version: string;
  sha: string;
}

// Each action's latest release and the commit its tag points to (checked 2026-10-24 with
// `git ls-remote`). Tags can be moved — that's how the tj-actions/changed-files compromise spread —
// commits can't.
export const ACTIONS = {
  checkout: { repo: "actions/checkout", major: "v7", version: "v7.0.1", sha: "3d3c42e5aac5ba805825da76410c181273ba90b1" },
  setupNode: { repo: "actions/setup-node", major: "v7", version: "v7.1.0", sha: "949feb2413d6458794dcd2491c4babbbce0c15c1" },
  setupPython: { repo: "actions/setup-python", major: "v7", version: "v7.1.0", sha: "6d4fd22b20465ccc0f7354476588e8df7c9ca0e0" },
  setupGo: { repo: "actions/setup-go", major: "v7", version: "v7.0.0", sha: "b7ad1dad31e06c5925ef5d2fc7ad053ef454303e" },
  pnpm: { repo: "pnpm/action-setup", major: "v6", version: "v6.1.0", sha: "ea17c68df8912ef543352723c149a84f56e3d413" },
  dockerLogin: { repo: "docker/login-action", major: "v4", version: "v4.7.0", sha: "81c6f93d4bc991e510b342a00b419b3bb4efc5c6" },
  dockerBuildx: { repo: "docker/setup-buildx-action", major: "v4", version: "v4.4.1", sha: "f87e5991a6d7451dcb8d9637bfbc97413f497069" },
  dockerMeta: { repo: "docker/metadata-action", major: "v6", version: "v6.2.0", sha: "dc802804100637a589fabce1cb79ff13a1411302" },
  dockerBuildPush: { repo: "docker/build-push-action", major: "v7", version: "v7.4.0", sha: "c3c9e263c25d99ce0380d002d59b67737d91b0dc" },
} satisfies Record<string, ActionRef>;

/** `owner/repo@<sha> # vX.Y.Z` when pinned, otherwise `owner/repo@vX` */
export function actionRef(a: ActionRef, pin: boolean): string {
  return pin ? `${a.repo}@${a.sha} # ${a.version}` : `${a.repo}@${a.major}`;
}

export const DEFAULT_GHA_OPTIONS: GhaOptions = {
  stack: "node",
  name: "CI",
  branches: "main",
  onPush: true,
  onPullRequest: true,
  onDispatch: false,
  schedule: "",
  os: "ubuntu-latest",
  nodeVersions: "20, 22",
  nodePm: "npm",
  runLint: true,
  runTest: true,
  runBuild: true,
  pythonVersions: "3.12, 3.13",
  goVersion: "stable",
  imageName: "",
  pushImage: true,
  pinShas: true,
};

function list(value: string): string[] {
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

function yamlList(items: string[]): string {
  return `[${items.map((i) => (/^[\w.-]+$/.test(i) && !/^\d/.test(i) ? i : `"${i}"`)).join(", ")}]`;
}

function triggers(o: GhaOptions): string {
  const branches = list(o.branches);
  const lines: string[] = ["on:"];
  if (o.onPush) lines.push("  push:", `    branches: ${yamlList(branches.length ? branches : ["main"])}`);
  if (o.onPullRequest) lines.push("  pull_request:", `    branches: ${yamlList(branches.length ? branches : ["main"])}`);
  if (o.onDispatch) lines.push("  workflow_dispatch:");
  if (o.schedule.trim()) lines.push("  schedule:", `    - cron: "${o.schedule.trim()}"`);
  if (lines.length === 1) lines.push("  workflow_dispatch:");
  return lines.join("\n");
}

// The token isn't left in .git/config for later steps to read — nothing here pushes with git.
function checkoutStep(o: GhaOptions): string[] {
  return [`      - uses: ${actionRef(ACTIONS.checkout, o.pinShas)}`, "        with:", "          persist-credentials: false"];
}

function nodeJob(o: GhaOptions): string {
  const u = (a: ActionRef) => actionRef(a, o.pinShas);
  const versions = list(o.nodeVersions);
  const run = (script: string) => (o.nodePm === "npm" ? `npm run ${script}` : `${o.nodePm} ${script}`);
  const install = o.nodePm === "npm" ? "npm ci" : o.nodePm === "yarn" ? "yarn install --frozen-lockfile" : "pnpm install --frozen-lockfile";
  const steps = [
    ...checkoutStep(o),
    ...(o.nodePm === "pnpm"
      ? [`      - uses: ${u(ACTIONS.pnpm)}`, `        # Reads the pnpm version from "packageManager" in package.json — or add: with: { version: <x> }`]
      : []),
    `      - uses: ${u(ACTIONS.setupNode)}`,
    "        with:",
    "          node-version: ${{ matrix.node-version }}",
    `          cache: ${o.nodePm}`,
    `      - run: ${install}`,
    ...(o.runLint ? [`      - run: ${run("lint")}`] : []),
    ...(o.runTest ? [`      - run: ${o.nodePm === "npm" ? "npm test" : `${o.nodePm} test`}`] : []),
    ...(o.runBuild ? [`      - run: ${run("build")}`] : []),
  ];
  return `jobs:
  build:
    runs-on: ${o.os}
    strategy:
      matrix:
        node-version: ${yamlList(versions.length ? versions : ["22"])}
    steps:
${steps.join("\n")}`;
}

function pythonJob(o: GhaOptions): string {
  const u = (a: ActionRef) => actionRef(a, o.pinShas);
  const versions = list(o.pythonVersions);
  const steps = [
    ...checkoutStep(o),
    `      - uses: ${u(ACTIONS.setupPython)}`,
    "        with:",
    "          python-version: ${{ matrix.python-version }}",
    "          cache: pip",
    "      - run: python -m pip install --upgrade pip",
    "      - run: pip install -r requirements.txt",
    ...(o.runLint ? ["      - run: pip install ruff && ruff check ."] : []),
    ...(o.runTest ? ["      - run: pip install pytest && pytest"] : []),
  ];
  return `jobs:
  test:
    runs-on: ${o.os}
    strategy:
      matrix:
        python-version: ${yamlList(versions.length ? versions : ["3.13"])}
    steps:
${steps.join("\n")}`;
}

function goJob(o: GhaOptions): string {
  const u = (a: ActionRef) => actionRef(a, o.pinShas);
  const steps = [
    ...checkoutStep(o),
    `      - uses: ${u(ACTIONS.setupGo)}`,
    "        with:",
    `          go-version: ${o.goVersion.trim() === "stable" || !o.goVersion.trim() ? "stable" : `"${o.goVersion.trim()}"`}`,
    ...(o.runLint ? ["      - run: go vet ./..."] : []),
    ...(o.runTest ? ["      - run: go test -race ./..."] : []),
    ...(o.runBuild ? ["      - run: go build ./..."] : []),
  ];
  return `jobs:
  build:
    runs-on: ${o.os}
    steps:
${steps.join("\n")}`;
}

function dockerJob(o: GhaOptions): string {
  const u = (a: ActionRef) => actionRef(a, o.pinShas);
  const image = o.imageName.trim() || "ghcr.io/${{ github.repository }}";
  const push = o.pushImage ? "${{ github.event_name != 'pull_request' }}" : "false";
  return `jobs:
  docker:
    runs-on: ${o.os}
    permissions:
      contents: read
      packages: write
    steps:
${checkoutStep(o).join("\n")}
      - uses: ${u(ACTIONS.dockerBuildx)}
${
  o.pushImage
    ? `      - uses: ${u(ACTIONS.dockerLogin)}
        if: github.event_name != 'pull_request'
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
`
    : ""
}      - id: meta
        uses: ${u(ACTIONS.dockerMeta)}
        with:
          images: ${image}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha
      - uses: ${u(ACTIONS.dockerBuildPush)}
        with:
          context: .
          push: ${push}
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max`;
}

export function generateWorkflow(o: GhaOptions): string {
  const job = o.stack === "node" ? nodeJob(o) : o.stack === "python" ? pythonJob(o) : o.stack === "go" ? goJob(o) : dockerJob(o);
  // Read-only token by default; a job that needs more asks for it itself (see the Docker job)
  return `name: ${o.name.trim() || "CI"}\n\n${triggers(o)}\n\npermissions:\n  contents: read\n\n${job}\n`;
}

/** .github/dependabot.yml that keeps pinned actions up to date (one grouped PR a week). */
export function dependabotConfig(): string {
  return `version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    groups:
      actions:
        patterns: ["*"]
`;
}

export function workflowFilename(o: GhaOptions): string {
  const slug = (o.name.trim() || "ci").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "ci"}.yml`;
}
