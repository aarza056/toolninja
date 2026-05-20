import yaml from "js-yaml";
import type { DockerService } from "./docker-parser";

interface ComposeService {
  image?: string;
  container_name?: string;
  ports?: string[];
  volumes?: string[];
  environment?: Record<string, string> | string[];
  env_file?: string | string[];
  networks?: string[] | Record<string, unknown>;
  network_mode?: string;
  hostname?: string;
  user?: string;
  working_dir?: string;
  entrypoint?: string | string[];
  labels?: Record<string, string> | string[];
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
    test?: string | string[];
    interval?: string;
    timeout?: string;
    retries?: number;
    start_period?: string;
    disable?: boolean;
  };
  logging?: { driver?: string; options?: Record<string, string> };
  shm_size?: string;
  tmpfs?: string | string[];
  sysctls?: Record<string, string> | string[];
  extra_hosts?: string[];
  command?: string | string[];
  tty?: boolean;
  stdin_open?: boolean;
  pid?: string;
  ipc?: string;
  init?: boolean;
}

interface ComposeFile {
  version?: string;
  services?: Record<string, ComposeService>;
}

function normalizeEnv(env: Record<string, string> | string[] | undefined): Record<string, string> {
  if (!env) return {};
  if (Array.isArray(env)) {
    return Object.fromEntries(
      env.map((e) => {
        const eq = e.indexOf("=");
        return eq > -1 ? [e.slice(0, eq), e.slice(eq + 1)] : [e, `\${${e}}`];
      })
    );
  }
  return env;
}

function normalizeLabels(labels: Record<string, string> | string[] | undefined): Record<string, string> {
  if (!labels) return {};
  if (Array.isArray(labels)) {
    return Object.fromEntries(
      labels.map((l) => {
        const eq = l.indexOf("=");
        return eq > -1 ? [l.slice(0, eq), l.slice(eq + 1)] : [l, ""];
      })
    );
  }
  return labels;
}

function normalizeNetworks(
  networks: string[] | Record<string, unknown> | undefined
): string[] {
  if (!networks) return [];
  if (Array.isArray(networks)) return networks;
  return Object.keys(networks);
}

function composeServiceToDockerService(svc: ComposeService): DockerService {
  const service: DockerService = {};

  if (svc.image) service.image = svc.image;
  if (svc.container_name) service.container_name = svc.container_name;
  if (svc.restart) service.restart = svc.restart;
  if (svc.hostname) service.hostname = svc.hostname;
  if (svc.user) service.user = String(svc.user);
  if (svc.working_dir) service.working_dir = svc.working_dir;
  if (svc.mem_limit) service.mem_limit = svc.mem_limit;
  if (svc.cpus !== undefined) service.cpus = svc.cpus;
  if (svc.privileged) service.privileged = true;
  if (svc.read_only) service.read_only = true;
  if (svc.tty) service.tty = true;
  if (svc.stdin_open) service.stdin_open = true;
  if (svc.init) service.init = true;
  if (svc.pid) service.pid = svc.pid;
  if (svc.ipc) service.ipc = svc.ipc;
  if (svc.shm_size) service.shm_size = svc.shm_size;
  if (svc.network_mode) service.network_mode = svc.network_mode;

  if (svc.ports?.length) service.ports = svc.ports.map(String);
  if (svc.volumes?.length) service.volumes = svc.volumes.map(String);
  if (svc.cap_add?.length) service.cap_add = svc.cap_add;
  if (svc.cap_drop?.length) service.cap_drop = svc.cap_drop;
  if (svc.devices?.length) service.devices = svc.devices;
  if (svc.security_opt?.length) service.security_opt = svc.security_opt;
  if (svc.extra_hosts?.length) service.extra_hosts = svc.extra_hosts;

  const env = normalizeEnv(svc.environment as Record<string, string> | string[] | undefined);
  if (Object.keys(env).length > 0) service.environment = env;

  const labels = normalizeLabels(svc.labels as Record<string, string> | string[] | undefined);
  if (Object.keys(labels).length > 0) service.labels = labels;

  const networks = normalizeNetworks(svc.networks as string[] | Record<string, unknown> | undefined);
  if (networks.length > 0) service.networks = networks;

  const envFile = svc.env_file;
  if (envFile) service.env_file = Array.isArray(envFile) ? envFile : [envFile];

  const tmpfs = svc.tmpfs;
  if (tmpfs) service.tmpfs = Array.isArray(tmpfs) ? tmpfs : [tmpfs];

  if (svc.healthcheck) {
    const hc = svc.healthcheck;
    const test = typeof hc.test === "string"
      ? ["CMD-SHELL", hc.test]
      : hc.test;
    service.healthcheck = {
      ...(test !== undefined ? { test } : {}),
      ...(hc.interval ? { interval: hc.interval } : {}),
      ...(hc.timeout ? { timeout: hc.timeout } : {}),
      ...(hc.retries !== undefined ? { retries: hc.retries } : {}),
      ...(hc.start_period ? { start_period: hc.start_period } : {}),
      ...(hc.disable ? { disable: hc.disable } : {}),
    };
  }

  if (svc.logging) service.logging = svc.logging;

  if (svc.sysctls) {
    if (Array.isArray(svc.sysctls)) {
      service.sysctls = Object.fromEntries(
        (svc.sysctls as string[]).map((s) => {
          const eq = s.indexOf("=");
          return eq > -1 ? [s.slice(0, eq), s.slice(eq + 1)] : [s, ""];
        })
      );
    } else {
      service.sysctls = svc.sysctls as Record<string, string>;
    }
  }

  if (svc.entrypoint) {
    service.entrypoint = Array.isArray(svc.entrypoint)
      ? svc.entrypoint.join(" ")
      : svc.entrypoint;
  }

  if (svc.command) {
    service.command = Array.isArray(svc.command)
      ? svc.command.join(" ")
      : svc.command;
  }

  return service;
}

function serviceToDockerRun(name: string, service: DockerService): string {
  const parts: string[] = ["docker run"];

  if (service.container_name) parts.push(`--name ${service.container_name}`);
  else parts.push(`--name ${name}`);

  parts.push("-d");

  if (service.restart) parts.push(`--restart ${service.restart}`);
  if (service.hostname) parts.push(`--hostname ${service.hostname}`);
  if (service.user) parts.push(`--user "${service.user}"`);
  if (service.working_dir) parts.push(`--workdir ${service.working_dir}`);
  if (service.mem_limit) parts.push(`--memory ${service.mem_limit}`);
  if (service.cpus !== undefined) parts.push(`--cpus "${service.cpus}"`);
  if (service.privileged) parts.push("--privileged");
  if (service.read_only) parts.push("--read-only");
  if (service.tty) parts.push("-t");
  if (service.stdin_open) parts.push("-i");
  if (service.init) parts.push("--init");
  if (service.pid) parts.push(`--pid "${service.pid}"`);
  if (service.ipc) parts.push(`--ipc "${service.ipc}"`);
  if (service.shm_size) parts.push(`--shm-size "${service.shm_size}"`);
  if (service.network_mode) parts.push(`--network ${service.network_mode}`);

  for (const p of service.ports || []) parts.push(`-p ${p}`);
  for (const v of service.volumes || []) parts.push(`-v ${v}`);

  for (const [k, v] of Object.entries(service.environment || {})) {
    if (v === `\${${k}}`) parts.push(`-e ${k}`);
    else parts.push(`-e ${k}=${v}`);
  }

  for (const f of service.env_file || []) parts.push(`--env-file ${f}`);

  for (const n of service.networks || []) parts.push(`--network ${n}`);

  for (const [k, v] of Object.entries(service.labels || {})) {
    parts.push(`--label ${k}=${v}`);
  }

  for (const c of service.cap_add || []) parts.push(`--cap-add ${c}`);
  for (const c of service.cap_drop || []) parts.push(`--cap-drop ${c}`);
  for (const d of service.devices || []) parts.push(`--device ${d}`);
  for (const s of service.security_opt || []) parts.push(`--security-opt ${s}`);
  for (const h of service.extra_hosts || []) parts.push(`--add-host "${h}"`);
  for (const t of service.tmpfs || []) parts.push(`--tmpfs ${t}`);

  for (const [k, v] of Object.entries(service.sysctls || {})) {
    parts.push(`--sysctl ${k}=${v}`);
  }

  if (service.healthcheck) {
    if (service.healthcheck.disable) {
      parts.push("--no-healthcheck");
    } else {
      if (service.healthcheck.test) {
        const cmd = Array.isArray(service.healthcheck.test)
          ? service.healthcheck.test.slice(1).join(" ")
          : service.healthcheck.test;
        parts.push(`--health-cmd "${cmd}"`);
      }
      if (service.healthcheck.interval) parts.push(`--health-interval ${service.healthcheck.interval}`);
      if (service.healthcheck.timeout) parts.push(`--health-timeout ${service.healthcheck.timeout}`);
      if (service.healthcheck.retries) parts.push(`--health-retries ${service.healthcheck.retries}`);
      if (service.healthcheck.start_period) parts.push(`--health-start-period ${service.healthcheck.start_period}`);
    }
  }

  if (service.logging?.driver) {
    parts.push(`--log-driver ${service.logging.driver}`);
    for (const [k, v] of Object.entries(service.logging.options || {})) {
      parts.push(`--log-opt ${k}=${v}`);
    }
  }

  if (service.entrypoint) parts.push(`--entrypoint "${service.entrypoint}"`);
  if (service.image) parts.push(service.image);
  if (service.command) parts.push(service.command);

  return parts.join(" \\\n  ");
}

export interface ComposeParseResult {
  commands: { name: string; command: string }[];
  error?: string;
}

export function composeToDockerRun(input: string): ComposeParseResult {
  let parsed: ComposeFile;
  try {
    parsed = yaml.load(input) as ComposeFile;
  } catch (e) {
    return { commands: [], error: `YAML parse error: ${(e as Error).message}` };
  }

  if (!parsed || typeof parsed !== "object") {
    return { commands: [], error: "Invalid compose file: expected a YAML object" };
  }

  const services = parsed.services;
  if (!services || typeof services !== "object") {
    return { commands: [], error: "No services found in compose file" };
  }

  const commands = Object.entries(services).map(([name, svc]) => {
    const service = composeServiceToDockerService(svc);
    return { name, command: serviceToDockerRun(name, service) };
  });

  return { commands };
}
