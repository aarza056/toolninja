export interface DockerService {
  image?: string;
  container_name?: string;
  ports?: string[];
  volumes?: string[];
  environment?: Record<string, string>;
  env_file?: string[];
  networks?: string[];
  network_mode?: string;
  hostname?: string;
  user?: string;
  working_dir?: string;
  entrypoint?: string;
  labels?: Record<string, string>;
  restart?: string;
  mem_limit?: string;
  cpus?: number | string;
  privileged?: boolean;
  read_only?: boolean;
  cap_add?: string[];
  cap_drop?: string[];
  devices?: string[];
  security_opt?: string[];
  healthcheck?: {
    test?: string[];
    interval?: string;
    timeout?: string;
    retries?: number;
    start_period?: string;
    disable?: boolean;
  };
  logging?: {
    driver?: string;
    options?: Record<string, string>;
  };
  shm_size?: string;
  tmpfs?: string[];
  sysctls?: Record<string, string>;
  extra_hosts?: string[];
  command?: string;
  tty?: boolean;
  stdin_open?: boolean;
  pid?: string;
  ipc?: string;
  init?: boolean;
}

export interface ParseResult {
  service: DockerService;
  warnings: string[];
  ignoredFlags: string[];
}

function tokenize(input: string): string[] {
  const normalized = input.replace(/\\\n\s*/g, " ").trim();
  const tokens: string[] = [];
  let i = 0;

  while (i < normalized.length) {
    while (i < normalized.length && /[ \t]/.test(normalized[i])) i++;
    if (i >= normalized.length) break;

    const ch = normalized[i];

    if (ch === '"') {
      i++;
      let val = "";
      while (i < normalized.length && normalized[i] !== '"') {
        if (normalized[i] === "\\" && i + 1 < normalized.length) { i++; }
        val += normalized[i++];
      }
      i++;
      tokens.push(val);
    } else if (ch === "'") {
      i++;
      let val = "";
      while (i < normalized.length && normalized[i] !== "'") val += normalized[i++];
      i++;
      tokens.push(val);
    } else {
      let val = "";
      while (i < normalized.length && !/[ \t]/.test(normalized[i])) val += normalized[i++];
      tokens.push(val);
    }
  }

  return tokens;
}

const LONG_VALUE_FLAGS: Record<string, string> = {
  "--name": "name",
  "-p": "port", "--publish": "port",
  "-v": "volume", "--volume": "volume",
  "-e": "env", "--env": "env",
  "--env-file": "env-file",
  "--network": "network", "--net": "network",
  "-h": "hostname", "--hostname": "hostname",
  "-u": "user", "--user": "user",
  "-w": "workdir", "--workdir": "workdir", "--working-dir": "workdir",
  "--entrypoint": "entrypoint",
  "-l": "label", "--label": "label",
  "--restart": "restart",
  "-m": "memory", "--memory": "memory",
  "--cpus": "cpus",
  "--cap-add": "cap-add",
  "--cap-drop": "cap-drop",
  "--device": "device",
  "--security-opt": "security-opt",
  "--health-cmd": "health-cmd",
  "--health-interval": "health-interval",
  "--health-timeout": "health-timeout",
  "--health-retries": "health-retries",
  "--health-start-period": "health-start-period",
  "--log-driver": "log-driver",
  "--log-opt": "log-opt",
  "--shm-size": "shm-size",
  "--tmpfs": "tmpfs",
  "--sysctl": "sysctl",
  "--add-host": "add-host",
  "--gpus": "gpus",
  "--pid": "pid",
  "--ipc": "ipc",
};

function applyFlag(
  kind: string, value: string,
  service: DockerService, warnings: string[], ignoredFlags: string[]
) {
  switch (kind) {
    case "name": service.container_name = value; break;
    case "port": service.ports = [...(service.ports || []), value]; break;
    case "volume": service.volumes = [...(service.volumes || []), value]; break;
    case "env": {
      if (!service.environment) service.environment = {};
      const eq = value.indexOf("=");
      if (eq > -1) service.environment[value.slice(0, eq)] = value.slice(eq + 1);
      else service.environment[value] = `\${${value}}`;
      break;
    }
    case "env-file": service.env_file = [...(service.env_file || []), value]; break;
    case "network":
      if (["bridge", "host", "none"].includes(value) || value.startsWith("container:")) {
        service.network_mode = value;
        if (value === "host") warnings.push("--network host bypasses Docker network isolation.");
      } else {
        service.networks = [...(service.networks || []), value];
      }
      break;
    case "hostname": service.hostname = value; break;
    case "user": service.user = value; break;
    case "workdir": service.working_dir = value; break;
    case "entrypoint": service.entrypoint = value; break;
    case "label": {
      if (!service.labels) service.labels = {};
      const eq = value.indexOf("=");
      if (eq > -1) service.labels[value.slice(0, eq)] = value.slice(eq + 1);
      else service.labels[value] = "";
      break;
    }
    case "restart": service.restart = value; break;
    case "memory": service.mem_limit = value; break;
    case "cpus": { const n = parseFloat(value); service.cpus = isNaN(n) ? value : n; break; }
    case "cap-add": service.cap_add = [...(service.cap_add || []), value]; break;
    case "cap-drop": service.cap_drop = [...(service.cap_drop || []), value]; break;
    case "device": service.devices = [...(service.devices || []), value]; break;
    case "security-opt": service.security_opt = [...(service.security_opt || []), value]; break;
    case "health-cmd":
      service.healthcheck = { ...(service.healthcheck || {}), test: ["CMD-SHELL", value] }; break;
    case "health-interval":
      service.healthcheck = { ...(service.healthcheck || {}), interval: value }; break;
    case "health-timeout":
      service.healthcheck = { ...(service.healthcheck || {}), timeout: value }; break;
    case "health-retries":
      service.healthcheck = { ...(service.healthcheck || {}), retries: parseInt(value) || 3 }; break;
    case "health-start-period":
      service.healthcheck = { ...(service.healthcheck || {}), start_period: value }; break;
    case "log-driver":
      service.logging = { ...(service.logging || {}), driver: value }; break;
    case "log-opt": {
      const opts = service.logging?.options || {};
      const eq = value.indexOf("=");
      if (eq > -1) opts[value.slice(0, eq)] = value.slice(eq + 1);
      service.logging = { ...(service.logging || {}), options: opts };
      break;
    }
    case "shm-size": service.shm_size = value; break;
    case "tmpfs": service.tmpfs = [...(service.tmpfs || []), value]; break;
    case "sysctl": {
      if (!service.sysctls) service.sysctls = {};
      const eq = value.indexOf("=");
      if (eq > -1) service.sysctls[value.slice(0, eq)] = value.slice(eq + 1);
      break;
    }
    case "add-host": service.extra_hosts = [...(service.extra_hosts || []), value]; break;
    case "gpus":
      warnings.push("--gpus requires NVIDIA Container Toolkit. Use deploy.resources in Compose v3.8+.");
      ignoredFlags.push(`--gpus ${value} (use deploy.resources for GPU support)`);
      break;
    case "pid": service.pid = value; break;
    case "ipc": service.ipc = value; break;
  }
}

const SHORT_VALUE: Record<string, string> = {
  p: "port", v: "volume", e: "env",
  u: "user", w: "workdir", h: "hostname", l: "label", m: "memory",
};
const SHORT_BOOL = new Set(["d", "i", "t"]);

function handleShortToken(
  token: string, tokens: string[], i: number,
  service: DockerService, warnings: string[], ignoredFlags: string[]
): number {
  const chars = token.slice(1);

  if (Array.from(chars).every(c => SHORT_BOOL.has(c))) {
    if (chars.includes("i")) service.stdin_open = true;
    if (chars.includes("t")) service.tty = true;
    return i + 1;
  }

  if (chars.length === 1 && SHORT_VALUE[chars]) {
    const val = tokens[i + 1];
    if (val !== undefined) { applyFlag(SHORT_VALUE[chars], val, service, warnings, ignoredFlags); return i + 2; }
    return i + 1;
  }

  if (chars.length > 1 && SHORT_VALUE[chars[0]]) {
    applyFlag(SHORT_VALUE[chars[0]], chars.slice(1), service, warnings, ignoredFlags);
    return i + 1;
  }

  const last = chars[chars.length - 1];
  if (chars.length > 1 && SHORT_VALUE[last]) {
    const prefix = chars.slice(0, -1);
    if (Array.from(prefix).every(c => SHORT_BOOL.has(c))) {
      if (prefix.includes("i")) service.stdin_open = true;
      if (prefix.includes("t")) service.tty = true;
      const val = tokens[i + 1];
      if (val !== undefined) { applyFlag(SHORT_VALUE[last], val, service, warnings, ignoredFlags); return i + 2; }
      return i + 1;
    }
  }

  ignoredFlags.push(token);
  return i + 1;
}

export function parseDockerRun(command: string): ParseResult {
  const tokens = tokenize(command);
  const service: DockerService = {};
  const warnings: string[] = [];
  const ignoredFlags: string[] = [];

  let i = 0;
  if (tokens[i] === "docker") i++;
  if (tokens[i] === "run") i++;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token === "--") { i++; break; }

    if (!token.startsWith("-")) {
      service.image = token;
      const rest = tokens.slice(i + 1);
      if (rest.length > 0) service.command = rest.join(" ");
      break;
    }

    if (token.startsWith("--") && token.includes("=")) {
      const eq = token.indexOf("=");
      const flag = token.slice(0, eq);
      const value = token.slice(eq + 1);
      const kind = LONG_VALUE_FLAGS[flag];
      if (kind) applyFlag(kind, value, service, warnings, ignoredFlags);
      else ignoredFlags.push(flag);
      i++;
      continue;
    }

    if (token.startsWith("--")) {
      const kind = LONG_VALUE_FLAGS[token];
      if (kind) {
        const val = tokens[i + 1];
        if (val !== undefined) { applyFlag(kind, val, service, warnings, ignoredFlags); i += 2; }
        else i++;
        continue;
      }
      switch (token) {
        case "--detach": break;
        case "--tty": service.tty = true; break;
        case "--interactive": service.stdin_open = true; break;
        case "--privileged":
          service.privileged = true;
          warnings.push("--privileged grants full host access. Remove unless absolutely necessary.");
          break;
        case "--read-only": service.read_only = true; break;
        case "--rm": ignoredFlags.push("--rm (containers in Compose are not auto-removed)"); break;
        case "--init": service.init = true; break;
        case "--no-healthcheck": service.healthcheck = { disable: true }; break;
        default: ignoredFlags.push(token);
      }
      i++;
      continue;
    }

    i = handleShortToken(token, tokens, i, service, warnings, ignoredFlags);
  }

  return { service, warnings, ignoredFlags };
}

export function parseMultipleDockerRuns(input: string): ParseResult[] {
  const blocks = input.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const results: ParseResult[] = [];

  for (const block of blocks) {
    const subCmds = block.split(/(?=\bdocker\s+run\b)/).map(s => s.trim()).filter(s => s.startsWith("docker"));
    for (const cmd of (subCmds.length > 0 ? subCmds : [block])) {
      const r = parseDockerRun(cmd);
      if (r.service.image) results.push(r);
    }
  }

  return results.length > 0 ? results : [parseDockerRun(input)];
}
