export interface PathSegment {
  command: string;
  args: number[];
}

const COMMAND_ARG_COUNTS: Record<string, number> = {
  M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0,
};

const COMMAND_LABELS: Record<string, string> = {
  M: "Move to",
  L: "Line to",
  H: "Horizontal line to",
  V: "Vertical line to",
  C: "Cubic Bézier curve",
  S: "Smooth cubic Bézier",
  Q: "Quadratic Bézier curve",
  T: "Smooth quadratic Bézier",
  A: "Elliptical arc",
  Z: "Close path",
};

export function commandLabel(command: string): string {
  return COMMAND_LABELS[command.toUpperCase()] ?? "Unknown";
}

/** Tokenizes a path `d` attribute into individual commands, splitting repeated-argument runs
 * (e.g. "L10 20 30 40" = two L commands) the way browsers interpret them. */
export function parsePathCommands(d: string): PathSegment[] {
  const segments: PathSegment[] = [];
  const re = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(d)) !== null) {
    const command = m[1];
    const upper = command.toUpperCase();
    const argCount = COMMAND_ARG_COUNTS[upper] ?? 0;

    if (argCount === 0) {
      segments.push({ command, args: [] });
      continue;
    }

    const nums = (m[2].match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
    for (let i = 0; i + argCount <= nums.length; i += argCount) {
      segments.push({ command, args: nums.slice(i, i + argCount) });
    }
  }

  return segments;
}

export interface PathSummary {
  segments: PathSegment[];
  commandCounts: Record<string, number>;
  hasRelative: boolean;
  hasAbsolute: boolean;
  hasCurves: boolean;
  isClosed: boolean;
}

export function summarizePath(d: string): PathSummary {
  const segments = parsePathCommands(d);
  const commandCounts: Record<string, number> = {};
  let hasRelative = false;
  let hasAbsolute = false;

  for (const seg of segments) {
    const upper = seg.command.toUpperCase();
    commandCounts[upper] = (commandCounts[upper] ?? 0) + 1;
    if (seg.command === seg.command.toLowerCase()) hasRelative = true;
    else hasAbsolute = true;
  }

  return {
    segments,
    commandCounts,
    hasRelative,
    hasAbsolute,
    hasCurves: !!(commandCounts.C || commandCounts.S || commandCounts.Q || commandCounts.T || commandCounts.A),
    isClosed: segments.length > 0 && segments[segments.length - 1].command.toUpperCase() === "Z",
  };
}
