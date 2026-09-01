export interface DiffOp {
  type: "equal" | "delete" | "insert";
  line: string;
}

// Line count above which the O(n*m) LCS table would get expensive enough to risk hanging
// the browser tab — large enough for any real code file or config, small enough to stay fast.
const MAX_LINES = 4000;

/** Classic LCS-backtrack line diff. dp[i][j] holds the LCS length of a[i..) and b[j..),
 * built from the end backward so the forward walk below can greedily follow the longer path. */
function computeLineDiff(a: string[], b: string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", line: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "delete", line: a[i] });
      i++;
    } else {
      ops.push({ type: "insert", line: b[j] });
      j++;
    }
  }
  while (i < n) {
    ops.push({ type: "delete", line: a[i] });
    i++;
  }
  while (j < m) {
    ops.push({ type: "insert", line: b[j] });
    j++;
  }
  return ops;
}

export interface DiffLine {
  type: "context" | "delete" | "insert";
  text: string;
}

export interface Hunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export function buildHunks(a: string[], b: string[], context = 3): Hunk[] {
  const ops = computeLineDiff(a, b);

  const annotated: { op: DiffOp; oldIdx: number; newIdx: number }[] = [];
  let oldIdx = 0;
  let newIdx = 0;
  for (const op of ops) {
    annotated.push({ op, oldIdx, newIdx });
    if (op.type === "equal") {
      oldIdx++;
      newIdx++;
    } else if (op.type === "delete") {
      oldIdx++;
    } else {
      newIdx++;
    }
  }

  const changeIndices: number[] = [];
  annotated.forEach((entry, idx) => {
    if (entry.op.type !== "equal") changeIndices.push(idx);
  });
  if (changeIndices.length === 0) return [];

  // Cluster nearby changes together so their context windows merge into one hunk instead
  // of producing separate hunks with overlapping context.
  const clusters: [number, number][] = [];
  let clusterStart = changeIndices[0];
  let clusterEnd = changeIndices[0];
  for (let k = 1; k < changeIndices.length; k++) {
    const idx = changeIndices[k];
    if (idx - clusterEnd <= context * 2) {
      clusterEnd = idx;
    } else {
      clusters.push([clusterStart, clusterEnd]);
      clusterStart = idx;
      clusterEnd = idx;
    }
  }
  clusters.push([clusterStart, clusterEnd]);

  const hunks: Hunk[] = [];
  for (const [start, end] of clusters) {
    const from = Math.max(0, start - context);
    const to = Math.min(annotated.length - 1, end + context);

    const lines: DiffLine[] = [];
    let oldCount = 0;
    let newCount = 0;
    const oldStart = annotated[from].oldIdx + 1;
    const newStart = annotated[from].newIdx + 1;

    for (let k = from; k <= to; k++) {
      const { op } = annotated[k];
      if (op.type === "equal") {
        lines.push({ type: "context", text: op.line });
        oldCount++;
        newCount++;
      } else if (op.type === "delete") {
        lines.push({ type: "delete", text: op.line });
        oldCount++;
      } else {
        lines.push({ type: "insert", text: op.line });
        newCount++;
      }
    }

    hunks.push({ oldStart, oldLines: oldCount, newStart, newLines: newCount, lines });
  }

  return hunks;
}

export interface UnifiedDiffResult {
  patch: string;
  hunks: Hunk[];
  identical: boolean;
  tooLarge: boolean;
}

export function generateUnifiedDiff(
  oldText: string,
  newText: string,
  oldFileName = "a/file",
  newFileName = "b/file",
  context = 3
): UnifiedDiffResult {
  const a = oldText.split("\n");
  const b = newText.split("\n");

  if (a.length > MAX_LINES || b.length > MAX_LINES) {
    return { patch: "", hunks: [], identical: false, tooLarge: true };
  }

  const hunks = buildHunks(a, b, context);
  if (hunks.length === 0) {
    return { patch: "", hunks: [], identical: true, tooLarge: false };
  }

  const out: string[] = [`--- ${oldFileName}`, `+++ ${newFileName}`];
  for (const h of hunks) {
    // Convention: a hunk with zero lines from one side reports the line before the
    // insertion/deletion point (0 if it happens at the very start of the file), matching
    // how real diff tools format an add-only or delete-only hunk.
    const displayOldStart = h.oldLines === 0 ? Math.max(0, h.oldStart - 1) : h.oldStart;
    const displayNewStart = h.newLines === 0 ? Math.max(0, h.newStart - 1) : h.newStart;
    out.push(`@@ -${displayOldStart},${h.oldLines} +${displayNewStart},${h.newLines} @@`);
    for (const line of h.lines) {
      const prefix = line.type === "context" ? " " : line.type === "delete" ? "-" : "+";
      out.push(prefix + line.text);
    }
  }

  return { patch: out.join("\n") + "\n", hunks, identical: false, tooLarge: false };
}
