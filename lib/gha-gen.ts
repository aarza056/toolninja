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
}

// Major versions checked against each action's latest GitHub release.
export const ACTION_VERSIONS = {
  checkout: "actions/checkout@v7",
  setupNode: "actions/setup-node@v7",
  setupPython: "actions/setup-python@v7",
  setupGo: "actions/setup-go@v7",
  pnpm: "pnpm/action-setup@v6",
  dockerLogin: "docker/login-action@v4",
  dockerBuildx: "docker/setup-buildx-action@v4",
  dockerMeta: "docker/metadata-action@v6",
  dockerBuildPush: "docker/build-push-action@v7",
};

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

function nodeJob(o: GhaOptions): string {
  const versions = list(o.nodeVersions);
  const run = (script: string) => (o.nodePm === "npm" ? `npm run ${script}` : `${o.nodePm} ${script}`);
  const install = o.nodePm === "npm" ? "npm ci" : o.nodePm === "yarn" ? "yarn install --frozen-lockfile" : "pnpm install --frozen-lockfile";
  const steps = [
    `      - uses: ${ACTION_VERSIONS.checkout}`,
    ...(o.nodePm === "pnpm"
      ? [`      - uses: ${ACTION_VERSIONS.pnpm}`, `        # Reads the pnpm version from "packageManager" in package.json — or add: with: { version: <x> }`]
      : []),
    `      - uses: ${ACTION_VERSIONS.setupNode}`,
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
  const versions = list(o.pythonVersions);
  const steps = [
    `      - uses: ${ACTION_VERSIONS.checkout}`,
    `      - uses: ${ACTION_VERSIONS.setupPython}`,
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
  const steps = [
    `      - uses: ${ACTION_VERSIONS.checkout}`,
    `      - uses: ${ACTION_VERSIONS.setupGo}`,
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
  const image = o.imageName.trim() || "ghcr.io/${{ github.repository }}";
  const push = o.pushImage ? "${{ github.event_name != 'pull_request' }}" : "false";
  return `jobs:
  docker:
    runs-on: ${o.os}
    permissions:
      contents: read
      packages: write
    steps:
      - uses: ${ACTION_VERSIONS.checkout}
      - uses: ${ACTION_VERSIONS.dockerBuildx}
${
  o.pushImage
    ? `      - uses: ${ACTION_VERSIONS.dockerLogin}
        if: github.event_name != 'pull_request'
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
`
    : ""
}      - id: meta
        uses: ${ACTION_VERSIONS.dockerMeta}
        with:
          images: ${image}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha
      - uses: ${ACTION_VERSIONS.dockerBuildPush}
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
  return `name: ${o.name.trim() || "CI"}\n\n${triggers(o)}\n\n${job}\n`;
}

export function workflowFilename(o: GhaOptions): string {
  const slug = (o.name.trim() || "ci").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "ci"}.yml`;
}
