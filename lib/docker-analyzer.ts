import type { DockerService } from "./docker-parser";

export interface BestPractice {
  id: string;
  category: "security" | "reliability" | "performance" | "maintainability";
  title: string;
  description: string;
  severity: "error" | "warning" | "tip";
  points: number;
}

export interface AnalysisResult {
  score: number;
  passed: BestPractice[];
  failed: BestPractice[];
}

export function analyzeBestPractices(service: DockerService): AnalysisResult {
  const checks: { practice: BestPractice; passes: boolean }[] = [
    {
      practice: {
        id: "pinned-image",
        category: "reliability",
        title: "Image tag is pinned",
        description:
          "Using :latest can break deployments when new versions release. Pin to a specific version like nginx:1.25.3.",
        severity: "warning",
        points: 15,
      },
      passes:
        !!service.image &&
        !service.image.endsWith(":latest") &&
        service.image.includes(":"),
    },
    {
      practice: {
        id: "restart-policy",
        category: "reliability",
        title: "Restart policy is set",
        description:
          "Without a restart policy containers won't recover from crashes. Use unless-stopped for most services.",
        severity: "warning",
        points: 10,
      },
      passes: !!service.restart && service.restart !== "no",
    },
    {
      practice: {
        id: "no-privileged",
        category: "security",
        title: "Not running in privileged mode",
        description:
          "Privileged containers have full host access. Remove --privileged unless absolutely necessary.",
        severity: "error",
        points: 20,
      },
      passes: !service.privileged,
    },
    {
      practice: {
        id: "memory-limit",
        category: "performance",
        title: "Memory limit is set",
        description:
          "Without a memory limit a runaway container can consume all host memory and crash the system.",
        severity: "tip",
        points: 10,
      },
      passes: !!service.mem_limit,
    },
    {
      practice: {
        id: "no-host-network",
        category: "security",
        title: "Not using host network mode",
        description:
          "host network mode bypasses Docker network isolation. Use custom networks instead.",
        severity: "warning",
        points: 15,
      },
      passes: service.network_mode !== "host",
    },
    {
      practice: {
        id: "named-volumes",
        category: "maintainability",
        title: "Using named volumes for persistent data",
        description:
          "Named volumes are easier to back up and migrate than bind mounts to absolute host paths.",
        severity: "tip",
        points: 5,
      },
      passes:
        !service.volumes?.length ||
        !service.volumes.some((v) => {
          const src = v.split(":")[0];
          return (
            src.startsWith("/") &&
            !src.includes("/var/run/docker.sock") &&
            !src.includes("/tmp") &&
            !src.includes("/etc") &&
            !src.includes("/dev")
          );
        }),
    },
    {
      practice: {
        id: "healthcheck",
        category: "reliability",
        title: "Healthcheck is configured",
        description:
          "Healthchecks let Docker know when your container is ready and restart it if it becomes unhealthy.",
        severity: "tip",
        points: 10,
      },
      passes: !!service.healthcheck && !service.healthcheck.disable,
    },
    {
      practice: {
        id: "no-root-user",
        category: "security",
        title: "Container does not run as root",
        description:
          "Running as root inside a container is a security risk. Specify a non-root user with the user: field.",
        severity: "warning",
        points: 10,
      },
      passes:
        !!service.user &&
        service.user !== "root" &&
        service.user !== "0",
    },
    {
      practice: {
        id: "no-sensitive-env",
        category: "security",
        title: "Secrets use environment variable references",
        description:
          "Hardcoded passwords in compose files are a security risk. Use ${VARIABLE} references and .env files.",
        severity: "warning",
        points: 15,
      },
      passes: !Object.entries(service.environment || {}).some(([k, v]) => {
        const isSensitiveKey = /password|secret|key|token|auth|credential/i.test(k);
        const isHardcoded =
          typeof v === "string" && !v.startsWith("${") && v.length > 0;
        return isSensitiveKey && isHardcoded;
      }),
    },
    {
      practice: {
        id: "custom-network",
        category: "security",
        title: "Uses custom network",
        description:
          "Custom networks provide better isolation and allow services to communicate by name.",
        severity: "tip",
        points: 5,
      },
      passes: (service.networks?.length || 0) > 0,
    },
  ];

  const failed = checks.filter((c) => !c.passes).map((c) => c.practice);
  const passed = checks.filter((c) => c.passes).map((c) => c.practice);
  const deducted = failed.reduce((sum, p) => sum + p.points, 0);
  const score = Math.max(0, 100 - deducted);

  return { score, passed, failed };
}
