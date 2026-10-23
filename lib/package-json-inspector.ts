export type ScriptRisk = "high" | "medium" | "info";

interface LifecycleInfo {
  autoRuns: boolean;
  risk: ScriptRisk;
  note: string;
}

// What npm actually triggers automatically, and when — this is the core thing worth surfacing,
// since the risk isn't the script content itself so much as whether it runs without being asked.
const LIFECYCLE_SCRIPTS: Record<string, LifecycleInfo> = {
  preinstall: {
    autoRuns: true,
    risk: "high",
    note: "Runs automatically before dependencies are installed, with the full privileges of whoever ran npm install — the most common vector for npm supply-chain malware, since it executes before any code review, CI check, or test suite runs.",
  },
  install: {
    autoRuns: true,
    risk: "high",
    note: "Runs automatically during npm install. Legitimate for native addons that need to compile, but also a common malware vector — worth understanding exactly why this package needs it.",
  },
  postinstall: {
    autoRuns: true,
    risk: "high",
    note: "Runs automatically immediately after install completes — the second most common lifecycle-script malware vector after preinstall, and the one used in several recent npm worm incidents.",
  },
  prepare: {
    autoRuns: true,
    risk: "medium",
    note: "Runs automatically on npm install in several common workflows (git dependencies, monorepo linking) and always before npm publish. Less commonly abused than preinstall/postinstall, but still worth reviewing if unexpected.",
  },
  prepublishOnly: {
    autoRuns: false,
    risk: "info",
    note: "Only runs when this package's own maintainer publishes a new version — not executed by anyone who merely installs the package.",
  },
  preuninstall: {
    autoRuns: true,
    risk: "medium",
    note: "Runs automatically when the package is uninstalled — less common as an attack vector, but still executes without explicit confirmation.",
  },
  postuninstall: {
    autoRuns: true,
    risk: "medium",
    note: "Runs automatically after the package is uninstalled.",
  },
};

export interface LifecycleFinding {
  name: string;
  command: string;
  autoRuns: boolean;
  risk: ScriptRisk;
  note: string;
}

export type DependencyPinning = "exact" | "range" | "tag" | "git" | "url" | "workspace" | "unknown";

export interface DependencyFinding {
  name: string;
  version: string;
  pinning: DependencyPinning;
  note?: string;
}

export interface PackageJsonInspection {
  valid: boolean;
  error?: string;
  packageName?: string;
  lifecycleScripts: LifecycleFinding[];
  looseDependencies: DependencyFinding[];
  totalDependencies: number;
  otherScripts: { name: string; command: string }[];
}

function classifyVersion(version: string): { pinning: DependencyPinning; note?: string } {
  const v = version.trim();
  if (/^(git\+|git:)/.test(v) || /^[\w-]+\/[\w.-]+$/.test(v)) {
    return { pinning: "git", note: "Installed directly from a repository rather than the npm registry — bypasses registry-level review and provenance checks entirely." };
  }
  if (/^https?:\/\//.test(v)) {
    return { pinning: "url", note: "Installed from a direct URL rather than the npm registry — bypasses registry-level review and provenance checks entirely." };
  }
  if (/^workspace:/.test(v)) {
    return { pinning: "workspace" };
  }
  if (v === "*" || v === "latest" || v === "") {
    return { pinning: "tag", note: "No real version pinning — always resolves to whatever is currently published, including a release published minutes ago." };
  }
  if (/^[~^]/.test(v)) {
    return { pinning: "range", note: "Auto-accepts new versions within this range on the next install — a compromised maintainer account can ship a malicious version that gets pulled in automatically." };
  }
  if (/^\d+\.\d+\.\d+/.test(v)) {
    return { pinning: "exact" };
  }
  return { pinning: "unknown" };
}

export function inspectPackageJson(raw: string): PackageJsonInspection {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? `Invalid JSON: ${e.message}` : "Invalid JSON.",
      lifecycleScripts: [],
      looseDependencies: [],
      totalDependencies: 0,
      otherScripts: [],
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      valid: false,
      error: "This doesn't look like a package.json — expected a JSON object.",
      lifecycleScripts: [],
      looseDependencies: [],
      totalDependencies: 0,
      otherScripts: [],
    };
  }

  const pkg = parsed as Record<string, unknown>;
  const scripts = (typeof pkg.scripts === "object" && pkg.scripts !== null ? pkg.scripts : {}) as Record<string, string>;

  const lifecycleScripts: LifecycleFinding[] = [];
  const otherScripts: { name: string; command: string }[] = [];

  for (const [name, command] of Object.entries(scripts)) {
    const info = LIFECYCLE_SCRIPTS[name];
    if (info) {
      lifecycleScripts.push({ name, command: String(command), ...info });
    } else {
      otherScripts.push({ name, command: String(command) });
    }
  }

  const depFields = ["dependencies", "devDependencies", "optionalDependencies"];
  const looseDependencies: DependencyFinding[] = [];
  let totalDependencies = 0;

  for (const field of depFields) {
    const deps = (typeof pkg[field] === "object" && pkg[field] !== null ? pkg[field] : {}) as Record<string, string>;
    for (const [name, version] of Object.entries(deps)) {
      totalDependencies++;
      const { pinning, note } = classifyVersion(String(version));
      if (pinning !== "exact" && pinning !== "workspace") {
        looseDependencies.push({ name, version: String(version), pinning, note });
      }
    }
  }

  return {
    valid: true,
    packageName: typeof pkg.name === "string" ? pkg.name : undefined,
    lifecycleScripts,
    looseDependencies,
    totalDependencies,
    otherScripts,
  };
}
