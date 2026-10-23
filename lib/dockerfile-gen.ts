export type Stack = "node" | "python" | "go" | "static";
export type NodePm = "npm" | "yarn" | "pnpm";
export type BaseVariant = "alpine" | "slim" | "full";

export interface DockerfileOptions {
  stack: Stack;
  port: number;
  baseVariant: BaseVariant;
  // node
  nodeVersion: string;
  nodePm: NodePm;
  multiStage: boolean;
  buildCommand: string;
  startCommand: string;
  // python
  pythonVersion: string;
  pythonStartCommand: string;
  // go
  goVersion: string;
  // static
  buildOutputDir: string;
}

export const DEFAULT_DOCKERFILE_OPTIONS: DockerfileOptions = {
  stack: "node",
  port: 3000,
  baseVariant: "alpine",
  nodeVersion: "22",
  nodePm: "npm",
  multiStage: true,
  buildCommand: "npm run build",
  startCommand: "npm start",
  pythonVersion: "3.13",
  pythonStartCommand: "python app.py",
  goVersion: "1.23",
  buildOutputDir: "dist",
};

function nodeInstallCmd(pm: NodePm): string {
  if (pm === "yarn") return "yarn install --frozen-lockfile";
  if (pm === "pnpm") return "corepack enable && pnpm install --frozen-lockfile";
  return "npm ci";
}

function nodeImage(version: string, variant: BaseVariant): string {
  if (variant === "alpine") return `node:${version}-alpine`;
  if (variant === "slim") return `node:${version}-slim`;
  return `node:${version}`;
}

function generateNodeDockerfile(o: DockerfileOptions): string {
  const image = nodeImage(o.nodeVersion, o.baseVariant);
  const install = nodeInstallCmd(o.nodePm);
  const lockfile = o.nodePm === "yarn" ? "yarn.lock" : o.nodePm === "pnpm" ? "pnpm-lock.yaml" : "package-lock.json";

  if (!o.multiStage) {
    return `FROM ${image}

WORKDIR /app

COPY package.json ${lockfile} ./
RUN ${install}

COPY . .
${o.buildCommand.trim() ? `RUN ${o.buildCommand.trim()}\n\n` : "\n"}EXPOSE ${o.port}

CMD [${o.startCommand.trim().split(/\s+/).map((p) => `"${p}"`).join(", ")}]
`;
  }

  return `# ── Build stage ──────────────────────────────────────────────
FROM ${image} AS builder

WORKDIR /app

COPY package.json ${lockfile} ./
RUN ${install}

COPY . .
RUN ${o.buildCommand.trim() || "npm run build"}

# ── Runtime stage ────────────────────────────────────────────
FROM ${image}

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ${lockfile} ./
RUN ${o.nodePm === "yarn" ? "yarn install --frozen-lockfile --production" : o.nodePm === "pnpm" ? "corepack enable && pnpm install --frozen-lockfile --prod" : "npm ci --omit=dev"}

COPY --from=builder /app/${o.buildOutputDir.trim() || "dist"} ./${o.buildOutputDir.trim() || "dist"}

EXPOSE ${o.port}

CMD [${o.startCommand.trim().split(/\s+/).map((p) => `"${p}"`).join(", ")}]
`;
}

function pythonImage(version: string, variant: BaseVariant): string {
  if (variant === "alpine") return `python:${version}-alpine`;
  if (variant === "slim") return `python:${version}-slim`;
  return `python:${version}`;
}

function generatePythonDockerfile(o: DockerfileOptions): string {
  const image = pythonImage(o.pythonVersion, o.baseVariant);
  return `FROM ${image}

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE ${o.port}

CMD [${o.pythonStartCommand.trim().split(/\s+/).map((p) => `"${p}"`).join(", ")}]
`;
}

function generateGoDockerfile(o: DockerfileOptions): string {
  return `# ── Build stage ──────────────────────────────────────────────
FROM golang:${o.goVersion}-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server .

# ── Runtime stage ────────────────────────────────────────────
FROM alpine:latest

RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/server .

EXPOSE ${o.port}

CMD ["./server"]
`;
}

function generateStaticDockerfile(o: DockerfileOptions): string {
  return `# ── Build stage ──────────────────────────────────────────────
FROM node:${o.nodeVersion}-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN ${o.buildCommand.trim() || "npm run build"}

# ── Runtime stage ────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/${o.buildOutputDir.trim() || "dist"} /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`;
}

export function generateDockerfile(o: DockerfileOptions): string {
  if (o.stack === "node") return generateNodeDockerfile(o);
  if (o.stack === "python") return generatePythonDockerfile(o);
  if (o.stack === "go") return generateGoDockerfile(o);
  return generateStaticDockerfile(o);
}

export function generateDockerignore(stack: Stack): string {
  const common = [".git", ".gitignore", "README.md", ".env", ".env.local", ".dockerignore", "Dockerfile"];
  if (stack === "node") return [...common, "node_modules", "npm-debug.log", ".next", "dist", "coverage"].join("\n") + "\n";
  if (stack === "python") return [...common, "__pycache__", "*.pyc", ".venv", "venv", ".pytest_cache"].join("\n") + "\n";
  if (stack === "go") return [...common, "*.exe", "vendor"].join("\n") + "\n";
  return [...common, "node_modules", "dist", "build"].join("\n") + "\n";
}
