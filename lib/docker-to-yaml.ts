import type { DockerService, ParseResult } from "./docker-parser";

function qs(value: string): string {
  if (/[:#{}[\],&*?|<>=!%@`\n]/.test(value) || value === "" || /^\s|\s$/.test(value)) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}

export function getServiceName(service: DockerService): string {
  if (service.container_name) return service.container_name;
  const img = service.image || "app";
  return img.split("/").pop()?.split(":")[0]?.replace(/[^a-z0-9_-]/gi, "_").toLowerCase() || "app";
}

function collectNamedVolumes(services: DockerService[]): Set<string> {
  const named = new Set<string>();
  for (const svc of services) {
    for (const v of svc.volumes || []) {
      const src = v.split(":")[0];
      if (!src.startsWith("/") && !src.startsWith(".") && !src.startsWith("~")) {
        named.add(src);
      }
    }
  }
  return named;
}

function buildServiceLines(service: DockerService): string[] {
  const lines: string[] = [];

  if (service.image) lines.push(`image: ${service.image}`);
  if (service.container_name) lines.push(`container_name: ${service.container_name}`);
  if (service.restart) lines.push(`restart: ${service.restart}`);

  if (service.ports?.length) {
    lines.push("ports:");
    for (const p of service.ports) lines.push(`  - "${p}"`);
  }

  if (service.volumes?.length) {
    lines.push("volumes:");
    for (const v of service.volumes) lines.push(`  - ${v}`);
  }

  const env = service.environment;
  if (env && Object.keys(env).length > 0) {
    lines.push("environment:");
    for (const [k, v] of Object.entries(env)) lines.push(`  ${k}: ${qs(String(v))}`);
  }

  if (service.env_file?.length) {
    lines.push("env_file:");
    for (const f of service.env_file) lines.push(`  - ${f}`);
  }

  if (service.network_mode) lines.push(`network_mode: ${service.network_mode}`);

  if (service.networks?.length) {
    lines.push("networks:");
    for (const n of service.networks) lines.push(`  - ${n}`);
  }

  if (service.hostname) lines.push(`hostname: ${service.hostname}`);
  if (service.user) lines.push(`user: "${service.user}"`);
  if (service.working_dir) lines.push(`working_dir: ${service.working_dir}`);
  if (service.entrypoint) lines.push(`entrypoint: ${qs(service.entrypoint)}`);

  const labels = service.labels;
  if (labels && Object.keys(labels).length > 0) {
    lines.push("labels:");
    for (const [k, v] of Object.entries(labels)) lines.push(`  - "${k}=${v}"`);
  }

  if (service.mem_limit) lines.push(`mem_limit: ${service.mem_limit}`);
  if (service.cpus !== undefined) lines.push(`cpus: ${service.cpus}`);
  if (service.privileged) lines.push("privileged: true");
  if (service.read_only) lines.push("read_only: true");
  if (service.init) lines.push("init: true");
  if (service.tty) lines.push("tty: true");
  if (service.stdin_open) lines.push("stdin_open: true");

  if (service.cap_add?.length) {
    lines.push("cap_add:");
    for (const c of service.cap_add) lines.push(`  - ${c}`);
  }
  if (service.cap_drop?.length) {
    lines.push("cap_drop:");
    for (const c of service.cap_drop) lines.push(`  - ${c}`);
  }
  if (service.devices?.length) {
    lines.push("devices:");
    for (const d of service.devices) lines.push(`  - ${d}`);
  }
  if (service.security_opt?.length) {
    lines.push("security_opt:");
    for (const s of service.security_opt) lines.push(`  - ${s}`);
  }

  if (service.healthcheck) {
    lines.push("healthcheck:");
    if (service.healthcheck.disable) {
      lines.push("  disable: true");
    } else {
      if (service.healthcheck.test) {
        lines.push(`  test: ${JSON.stringify(service.healthcheck.test)}`);
      }
      if (service.healthcheck.interval) lines.push(`  interval: ${service.healthcheck.interval}`);
      if (service.healthcheck.timeout) lines.push(`  timeout: ${service.healthcheck.timeout}`);
      if (service.healthcheck.retries) lines.push(`  retries: ${service.healthcheck.retries}`);
      if (service.healthcheck.start_period) lines.push(`  start_period: ${service.healthcheck.start_period}`);
    }
  }

  if (service.logging?.driver) {
    lines.push("logging:");
    lines.push(`  driver: ${service.logging.driver}`);
    if (service.logging.options && Object.keys(service.logging.options).length > 0) {
      lines.push("  options:");
      for (const [k, v] of Object.entries(service.logging.options)) lines.push(`    ${k}: "${v}"`);
    }
  }

  if (service.shm_size) lines.push(`shm_size: "${service.shm_size}"`);

  if (service.tmpfs?.length) {
    lines.push("tmpfs:");
    for (const t of service.tmpfs) lines.push(`  - ${t}`);
  }

  if (service.sysctls && Object.keys(service.sysctls).length > 0) {
    lines.push("sysctls:");
    for (const [k, v] of Object.entries(service.sysctls)) lines.push(`  ${k}: "${v}"`);
  }

  if (service.extra_hosts?.length) {
    lines.push("extra_hosts:");
    for (const h of service.extra_hosts) lines.push(`  - "${h}"`);
  }

  if (service.pid) lines.push(`pid: "${service.pid}"`);
  if (service.ipc) lines.push(`ipc: "${service.ipc}"`);

  if (service.command) lines.push(`command: ${qs(service.command)}`);

  return lines;
}

export function generateComposeYaml(service: DockerService, serviceName: string): string {
  const serviceLines = buildServiceLines(service);
  const indented = serviceLines.map(l => `    ${l}`).join("\n");
  const namedVolumes = collectNamedVolumes([service]);
  const networks = service.networks || [];

  let out = `services:\n  ${serviceName}:\n${indented}`;

  if (namedVolumes.size > 0) {
    out += "\n\nvolumes:";
    Array.from(namedVolumes).forEach(v => { out += `\n  ${v}:`; });
  }

  if (networks.length > 0) {
    out += "\n\nnetworks:";
    for (const n of networks) out += `\n  ${n}:`;
  }

  return out;
}

export function generateMultiServiceCompose(results: ParseResult[]): string {
  const allNetworks = new Set<string>();
  const namedVolumes = collectNamedVolumes(results.map(r => r.service));

  for (const { service } of results) {
    for (const n of service.networks || []) allNetworks.add(n);
  }

  const lines: string[] = ["services:"];

  for (const { service } of results) {
    const name = getServiceName(service);
    lines.push(`  ${name}:`);
    for (const l of buildServiceLines(service)) lines.push(`    ${l}`);
    lines.push("");
  }

  if (namedVolumes.size > 0) {
    lines.push("volumes:");
    Array.from(namedVolumes).forEach(v => lines.push(`  ${v}:`));
    lines.push("");
  }

  if (allNetworks.size > 0) {
    lines.push("networks:");
    Array.from(allNetworks).forEach(n => lines.push(`  ${n}:`));
  }

  return lines.join("\n").trimEnd();
}
