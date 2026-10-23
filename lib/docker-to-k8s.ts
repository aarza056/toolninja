import type { DockerService } from "./docker-parser";
import { getServiceName } from "./docker-to-yaml";

function sanitizeK8sName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "") || "app";
}

function parsePort(mapping: string): { hostPort?: number; containerPort: number; protocol: "TCP" | "UDP" } {
  const proto = mapping.toLowerCase().endsWith("/udp") ? "UDP" : "TCP";
  const clean = mapping.replace(/\/(tcp|udp)$/i, "");
  const parts = clean.split(":");
  if (parts.length === 1) return { containerPort: parseInt(parts[0], 10), protocol: proto };
  const containerPort = parseInt(parts[parts.length - 1], 10);
  const hostPort = parseInt(parts[parts.length - 2], 10);
  return { hostPort: isNaN(hostPort) ? undefined : hostPort, containerPort, protocol: proto };
}

/** Converts a parsed `docker run` service into a Kubernetes Deployment + Service
 * manifest. Covers the common mappings (image, ports, env, command, resource
 * limits) — bind-mount volumes and restart-policy nuances don't have a direct
 * Kubernetes equivalent and are called out as comments rather than guessed at. */
export function generateK8sYaml(service: DockerService, nameOverride?: string): string {
  const name = sanitizeK8sName(nameOverride || getServiceName(service));
  const ports = (service.ports || []).map(parsePort).filter((p) => !isNaN(p.containerPort));
  const lines: string[] = [];

  // ── Deployment ──
  lines.push("apiVersion: apps/v1");
  lines.push("kind: Deployment");
  lines.push("metadata:");
  lines.push(`  name: ${name}`);
  lines.push("  labels:");
  lines.push(`    app: ${name}`);
  lines.push("spec:");
  lines.push("  replicas: 1");
  lines.push("  selector:");
  lines.push("    matchLabels:");
  lines.push(`      app: ${name}`);
  lines.push("  template:");
  lines.push("    metadata:");
  lines.push("      labels:");
  lines.push(`        app: ${name}`);
  lines.push("    spec:");
  lines.push("      containers:");
  lines.push(`        - name: ${name}`);
  lines.push(`          image: ${service.image || "REPLACE_WITH_IMAGE"}`);

  if (service.command) {
    lines.push("          command:");
    lines.push(`            - ${JSON.stringify(service.command)}`);
  }

  if (ports.length > 0) {
    lines.push("          ports:");
    ports.forEach((p) => {
      lines.push(`            - containerPort: ${p.containerPort}`);
      lines.push(`              protocol: ${p.protocol}`);
    });
  }

  const envEntries = Object.entries(service.environment || {});
  if (envEntries.length > 0) {
    lines.push("          env:");
    envEntries.forEach(([key, value]) => {
      lines.push(`            - name: ${key}`);
      lines.push(`              value: ${JSON.stringify(value)}`);
    });
  }

  if (service.mem_limit || service.cpus) {
    lines.push("          resources:");
    lines.push("            limits:");
    if (service.mem_limit) lines.push(`              memory: "${service.mem_limit}"`);
    if (service.cpus) lines.push(`              cpu: "${service.cpus}"`);
  }

  if (service.working_dir) {
    lines.push(`          workingDir: ${service.working_dir}`);
  }

  const bindMounts = (service.volumes || []).filter((v) => v.startsWith("/") || v.startsWith(".") || v.startsWith("~"));
  if (bindMounts.length > 0) {
    lines.push("          # NOTE: bind-mounted host paths below have no direct Kubernetes equivalent.");
    lines.push("          # Use a PersistentVolumeClaim, ConfigMap, or hostPath volume as appropriate:");
    bindMounts.forEach((v) => lines.push(`          #   ${v}`));
  }

  if (service.restart) {
    lines.push(`      # NOTE: docker's "restart: ${service.restart}" has no direct equivalent —`);
    lines.push("      # Kubernetes Deployments always restart failed containers by design.");
  }

  // ── Service (only if ports are exposed) ──
  if (ports.length > 0) {
    lines.push("---");
    lines.push("apiVersion: v1");
    lines.push("kind: Service");
    lines.push("metadata:");
    lines.push(`  name: ${name}`);
    lines.push("spec:");
    lines.push("  selector:");
    lines.push(`    app: ${name}`);
    lines.push("  ports:");
    ports.forEach((p) => {
      lines.push(`    - port: ${p.hostPort ?? p.containerPort}`);
      lines.push(`      targetPort: ${p.containerPort}`);
      lines.push(`      protocol: ${p.protocol}`);
    });
    lines.push("  type: ClusterIP");
  }

  return lines.join("\n") + "\n";
}
