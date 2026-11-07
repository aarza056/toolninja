// Reads a unified diff or git patch (git diff, git format-patch, plain diff -u) into files and hunks
// for the patch viewer: which files changed, how, and each line with its old and new line numbers.

export type FileStatus = "modified" | "added" | "deleted" | "renamed" | "binary";

export interface PatchLine {
  type: "context" | "delete" | "insert" | "note";
  text: string;
  oldNo: number | null;
  newNo: number | null;
}

export interface PatchHunk {
  header: string;
  lines: PatchLine[];
}

export interface PatchFile {
  oldPath: string;
  newPath: string;
  status: FileStatus;
  additions: number;
  deletions: number;
  hunks: PatchHunk[];
  /** Mode change or similarity notes from the git header, e.g. "mode 100644 → 100755" */
  notes: string[];
}

export interface PatchCommit {
  hash?: string;
  author?: string;
  date?: string;
  subject?: string;
}

export interface ParsedPatch {
  files: PatchFile[];
  commits: PatchCommit[];
  additions: number;
  deletions: number;
}

/** "a/src/x.ts\t2026-01-01" → "src/x.ts"; quoted names, the a/ b/ prefix and timestamps are removed */
function cleanPath(raw: string): string {
  let p = raw.trim();
  const tab = p.indexOf("\t");
  if (tab >= 0) p = p.slice(0, tab);
  if (p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1).replace(/\\(.)/g, "$1");
  return p === "/dev/null" ? p : p.replace(/^[ab]\//, "");
}

function newFile(oldPath = "", newPath = ""): PatchFile {
  return { oldPath, newPath, status: "modified", additions: 0, deletions: 0, hunks: [], notes: [] };
}

export function parsePatch(text: string): ParsedPatch {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const files: PatchFile[] = [];
  const commits: PatchCommit[] = [];
  let file: PatchFile | null = null;
  let hunk: PatchHunk | null = null;
  let oldNo = 0;
  let newNo = 0;
  let oldLeft = 0;
  let newLeft = 0;
  let commit: PatchCommit | null = null;

  const startFile = (f: PatchFile) => {
    files.push(f);
    file = f;
    hunk = null;
    oldLeft = newLeft = 0;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Inside a hunk, its header's counts say exactly which lines belong to it, so a removed line that
    // happens to read "--- something" isn't mistaken for the next file
    if (hunk && (oldLeft > 0 || newLeft > 0)) {
      const h = hunk as PatchHunk;
      const f = file as unknown as PatchFile;
      const mark = line[0];
      if (mark === "\\") {
        h.lines.push({ type: "note", text: line.slice(2), oldNo: null, newNo: null });
        continue;
      }
      if (mark === "-") {
        h.lines.push({ type: "delete", text: line.slice(1), oldNo: oldNo++, newNo: null });
        f.deletions++;
        oldLeft--;
        continue;
      }
      if (mark === "+") {
        h.lines.push({ type: "insert", text: line.slice(1), oldNo: null, newNo: newNo++ });
        f.additions++;
        newLeft--;
        continue;
      }
      if (mark === " " || line === "") {
        h.lines.push({ type: "context", text: line.slice(1), oldNo: oldNo++, newNo: newNo++ });
        oldLeft--;
        newLeft--;
        continue;
      }
      // Malformed or cut-off hunk: stop trusting its counts and read this line normally
      oldLeft = newLeft = 0;
    }
    if (hunk && line.startsWith("\\")) {
      (hunk as PatchHunk).lines.push({ type: "note", text: line.slice(2), oldNo: null, newNo: null });
      continue;
    }

    const fromLine = /^From ([0-9a-f]{7,40}) /.exec(line);
    const commitLine = /^commit ([0-9a-f]{7,40})\b/.exec(line);
    if (fromLine || commitLine) {
      commit = { hash: (fromLine ?? commitLine)![1] };
      commits.push(commit);
      file = null;
      hunk = null;
      continue;
    }
    if (commit && !file) {
      const m = /^(?:From|Author):\s*(.*)$/.exec(line);
      if (m) {
        commit.author = m[1];
        continue;
      }
      const d = /^Date:\s*(.*)$/.exec(line);
      if (d) {
        commit.date = d[1].trim();
        continue;
      }
      const s = /^Subject:\s*(?:\[[^\]]*\]\s*)?(.*)$/.exec(line);
      if (s) {
        commit.subject = s[1];
        continue;
      }
      // git log -p: the subject is the first indented line
      if (!commit.subject && /^ {4}\S/.test(line)) {
        commit.subject = line.trim();
        continue;
      }
    }

    const git = /^diff --git (.+)$/.exec(line);
    if (git) {
      // Paths with spaces make "a/x y b/x y" ambiguous; rename/---/+++ lines below correct them
      const parts = /^("?a\/.*"?) ("?b\/.*"?)$/.exec(git[1]);
      startFile(newFile(parts ? cleanPath(parts[1]) : "", parts ? cleanPath(parts[2]) : ""));
      continue;
    }
    const f = file as PatchFile | null;
    if (f) {
      if (/^new file mode /.test(line)) {
        f.status = "added";
        continue;
      }
      if (/^deleted file mode /.test(line)) {
        f.status = "deleted";
        continue;
      }
      const rn = /^rename (from|to) (.+)$/.exec(line) ?? /^copy (from|to) (.+)$/.exec(line);
      if (rn) {
        f.status = "renamed";
        if (rn[1] === "from") f.oldPath = cleanPath(rn[2]);
        else f.newPath = cleanPath(rn[2]);
        continue;
      }
      const sim = /^similarity index (\d+%)$/.exec(line);
      if (sim) {
        f.notes.push(`${sim[1]} similar`);
        continue;
      }
      if (/^old mode /.test(line)) {
        f.notes.push(`mode ${line.slice(9)} → ${(lines[i + 1] ?? "").replace(/^new mode /, "")}`);
        i++;
        continue;
      }
      if (/^(?:Binary files .* differ|GIT binary patch)/.test(line)) {
        f.status = "binary";
        continue;
      }
    }

    if (line.startsWith("--- ") && (lines[i + 1] ?? "").startsWith("+++ ")) {
      const oldP = cleanPath(line.slice(4));
      const newP = cleanPath(lines[i + 1].slice(4));
      i++;
      // Plain diffs have no "diff --git" line, and a new file starts at each ---/+++ pair
      if (!f || f.hunks.length) startFile(newFile());
      const cur = file as unknown as PatchFile;
      cur.oldPath = oldP === "/dev/null" ? newP : oldP;
      cur.newPath = newP === "/dev/null" ? oldP : newP;
      if (oldP === "/dev/null") cur.status = "added";
      else if (newP === "/dev/null") cur.status = "deleted";
      continue;
    }

    const h = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/.exec(line);
    if (h) {
      if (!file) startFile(newFile("(unnamed)", "(unnamed)"));
      oldNo = Number(h[1]);
      newNo = Number(h[3]);
      oldLeft = h[2] === undefined ? 1 : Number(h[2]);
      newLeft = h[4] === undefined ? 1 : Number(h[4]);
      hunk = { header: line, lines: [] };
      (file as unknown as PatchFile).hunks.push(hunk);
    }
  }
  return { files, commits, additions: files.reduce((n, x) => n + x.additions, 0), deletions: files.reduce((n, x) => n + x.deletions, 0) };
}

export interface SideRow {
  left: PatchLine | null;
  right: PatchLine | null;
}

/** Lines paired for a side-by-side view: each run of deletions lines up with the insertions after it */
export function sideBySide(hunk: PatchHunk): SideRow[] {
  const rows: SideRow[] = [];
  let dels: PatchLine[] = [];
  let ins: PatchLine[] = [];
  const flush = () => {
    for (let i = 0; i < Math.max(dels.length, ins.length); i++) rows.push({ left: dels[i] ?? null, right: ins[i] ?? null });
    dels = [];
    ins = [];
  };
  for (const l of hunk.lines) {
    if (l.type === "delete") dels.push(l);
    else if (l.type === "insert") ins.push(l);
    else if (l.type === "note") {
      // "\ No newline at end of file" belongs to the side it follows
      if (ins.length) ins.push(l);
      else if (dels.length) dels.push(l);
      else rows.push({ left: l, right: l });
    } else {
      flush();
      rows.push({ left: l, right: l });
    }
  }
  flush();
  return rows;
}
