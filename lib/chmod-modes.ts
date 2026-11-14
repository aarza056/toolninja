// Facts for the /tools/chmod-calculator/<mode> pages: what a numeric mode means, how it reads in
// `ls -l`, the symbolic chmod equivalent, and where it's typically used.

export interface ModeInfo {
  mode: string;
  /** e.g. rwxr-xr-x (with s/S/t/T for special bits) */
  symbolic: string;
  /** chmod u=rwx,g=rx,o=rx form */
  symbolicCmd: string;
  who: { label: string; perms: { r: boolean; w: boolean; x: boolean } }[];
  special: { setuid: boolean; setgid: boolean; sticky: boolean };
  worldWritable: boolean;
}

const bits = (d: number) => ({ r: (d & 4) !== 0, w: (d & 2) !== 0, x: (d & 1) !== 0 });

export function parseMode(mode: string): ModeInfo | null {
  if (!/^[0-7]?[0-7]{3}$/.test(mode)) return null;
  const sp = mode.length === 4 ? Number(mode[0]) : 0;
  const [u, g, o] = mode.slice(-3).split("").map(Number);
  const special = { setuid: (sp & 4) !== 0, setgid: (sp & 2) !== 0, sticky: (sp & 1) !== 0 };
  const triplet = (d: number, specialOn: boolean, letter: "s" | "t") => {
    const b = bits(d);
    const x = specialOn ? (b.x ? letter : letter.toUpperCase()) : b.x ? "x" : "-";
    return `${b.r ? "r" : "-"}${b.w ? "w" : "-"}${x}`;
  };
  const symbolic = triplet(u, special.setuid, "s") + triplet(g, special.setgid, "s") + triplet(o, special.sticky, "t");
  const part = (who: string, d: number, extra: string) => {
    const b = bits(d);
    const p = `${b.r ? "r" : ""}${b.w ? "w" : ""}${b.x ? "x" : ""}${extra}`;
    return `${who}=${p}`;
  };
  const symbolicCmd = [part("u", u, special.setuid ? "s" : ""), part("g", g, special.setgid ? "s" : ""), part("o", o, special.sticky ? "t" : "")].join(",");
  return {
    mode,
    symbolic,
    symbolicCmd,
    who: [
      { label: "Owner", perms: bits(u) },
      { label: "Group", perms: bits(g) },
      { label: "Others", perms: bits(o) },
    ],
    special,
    worldWritable: (o & 2) !== 0,
  };
}

/** Modes with their own page, most searched first. */
export const COMMON_MODES = ["755", "644", "777", "600", "700", "775", "664", "400", "444", "750", "640", "660", "770", "666", "711", "500", "550", "555", "440", "740", "760", "1777", "2755", "2775", "4755"];

/** Where each mode is typically used — written per mode. */
export const MODE_USES: Record<string, string> = {
  "755": "The default for directories and executable files: scripts, binaries and web folders. Everyone can read and run it; only the owner can change it.",
  "644": "The default for regular files — HTML, CSS, config files, images. The owner can edit; everyone else can only read.",
  "777": "Everyone can read, write and execute. Almost never the right answer: any user or compromised process can change or replace the file. Fix ownership (chown) or group access (775/664) instead.",
  "600": "Private files only the owner may read or change: SSH private keys (~/.ssh/id_ed25519), .env files with secrets, ~/.netrc. SSH refuses keys that are more open than this.",
  "700": "Private directories and scripts: ~/.ssh, personal bin folders. Nobody but the owner can even list the contents.",
  "775": "Shared project directories: the owner and the group can add and change files, others can read and enter. Common on web servers where a deploy group manages files.",
  "664": "Shared files that a team edits together: the owner and group can write, others can read.",
  "400": "Read-only for the owner and nothing for anyone else — AWS .pem key files need this (or 600), otherwise ssh complains about an unprotected private key.",
  "444": "Read-only for everyone, including the owner (who can still chmod it back). Useful to protect generated or reference files from accidental edits.",
  "750": "Directories and programs for the owner and one group only — others get no access at all. Common for application folders and service users.",
  "640": "Config files a service reads through its group but other users must not see, like database or web server configs with passwords.",
  "660": "Files the owner and group both read and write, hidden from everyone else — shared sockets, logs or data files of a service group.",
  "770": "A team directory: full access for the owner and group, nothing for others.",
  "666": "Everyone can read and write, nobody can execute. Typical for device files like /dev/null; for normal files it's as risky as 777 without execute.",
  "711": "Others can enter the directory (and open files whose names they know) but cannot list it. Used for home directories on shared servers.",
  "500": "The owner can read and run it, nobody can write — a locked-down script or binary.",
  "550": "Owner and group can read and run, nobody can modify it — deployed application code that shouldn't change at runtime.",
  "555": "Everyone can read and run, nobody can write. Seen on system directories like /proc entries and on read-only program folders.",
  "440": "Read-only for owner and group, nothing for others. /etc/sudoers must be 440 — sudo refuses to run if it's writable.",
  "740": "The owner has full access and the group can read; others nothing. Scripts the group may inspect but not run or change.",
  "760": "The owner has full access, the group can read and write, others nothing.",
  "1777": "rwxrwxrwt — everyone can create files, but the sticky bit means people can only delete their own. This is /tmp's permission.",
  "2755": "setgid on a directory: new files inherit the directory's group instead of the creator's. Used for shared team folders.",
  "2775": "Like 775 with setgid: a shared, group-writable folder where every new file automatically belongs to the team's group.",
  "4755": "setuid: the program runs with its owner's rights (often root), like /usr/bin/passwd. Powerful and risky — only for well-audited binaries.",
};

// ── Reading modes back: ls -l output, rwx strings, symbolic chmod expressions, umask ──────────

export interface LsEntry {
  /** 4-digit octal mode, e.g. "0755" */
  octal: string;
  /** The 3-digit form when no special bits are set, else the 4-digit one */
  short: string;
  type: string;
  typeLabel: string;
  owner?: string;
  group?: string;
  name?: string;
}

const TYPES: Record<string, string> = { "-": "file", d: "directory", l: "symlink", c: "character device", b: "block device", p: "named pipe", s: "socket" };

/** A 9-character permission string (rwxr-sr-t) as a mode number */
export function rwxToMode(s: string): number | null {
  const m = /^([r-])([w-])([xsS-])([r-])([w-])([xsS-])([r-])([w-])([xtT-])$/.exec(s);
  if (!m) return null;
  let mode = 0;
  const set = (on: boolean, bit: number) => {
    if (on) mode |= bit;
  };
  set(m[1] === "r", 0o400);
  set(m[2] === "w", 0o200);
  set(m[3] === "x" || m[3] === "s", 0o100);
  set(m[3] === "s" || m[3] === "S", 0o4000);
  set(m[4] === "r", 0o40);
  set(m[5] === "w", 0o20);
  set(m[6] === "x" || m[6] === "s", 0o10);
  set(m[6] === "s" || m[6] === "S", 0o2000);
  set(m[7] === "r", 0o4);
  set(m[8] === "w", 0o2);
  set(m[9] === "x" || m[9] === "t", 0o1);
  set(m[9] === "t" || m[9] === "T", 0o1000);
  return mode;
}

export const modeToOctal = (mode: number) => (mode & 0o7777).toString(8).padStart(4, "0");
export const shortOctal = (mode: number) => (mode & 0o7000 ? modeToOctal(mode) : (mode & 0o777).toString(8).padStart(3, "0"));

/** One line of `ls -l` (or just "drwxr-xr-x", or "rwxr-xr-x") */
export function parseLsLine(line: string): LsEntry | null {
  const t = line.trim().split(/\s+/);
  if (!t[0]) return null;
  const m = /^([-dlcbps])?([rwxsStT-]{9})[.+@]?$/.exec(t[0]);
  if (!m) return null;
  const mode = rwxToMode(m[2]);
  if (mode === null) return null;
  const type = m[1] ?? "-";
  const full = t.length >= 8 && /^\d+$/.test(t[1]);
  let name: string | undefined;
  if (full) {
    // ls -l: perms links owner group size month day time|year name…
    const nameStart = t.length >= 9 ? 8 : t.length - 1;
    name = t.slice(nameStart).join(" ").replace(/ -> .*$/, "");
  }
  return { octal: modeToOctal(mode), short: shortOctal(mode), type, typeLabel: TYPES[type], owner: full ? t[2] : undefined, group: full ? t[3] : undefined, name };
}

/**
 * Applies a symbolic chmod expression (u+x, go-w, a=rX, u=rwx,g=rx,o=) to a mode, like chmod does.
 * With no u/g/o/a the change applies to all (chmod would also mask it with the umask).
 */
export function applySymbolic(mode: number, expr: string, isDir = false): number | null {
  const e = expr.trim().replace(/^chmod\s+(-R\s+)?/, "");
  if (/^[0-7]{3,4}$/.test(e)) return parseInt(e, 8);
  let result = mode;
  for (const clause of e.split(",")) {
    const m = /^([ugoa]*)((?:[+=-][rwxXstugo]*)+)$/.exec(clause);
    if (!m) return null;
    const who = m[1] && !m[1].includes("a") ? m[1] : "ugo";
    const ops = m[2].match(/[+=-][rwxXstugo]*/g) ?? [];
    for (const op of ops) {
      const sign = op[0];
      const perms = op.slice(1);
      let bits = 0;
      // Copying another class's bits (g=u)
      const copy = (cls: string) => {
        const shift = cls === "u" ? 6 : cls === "g" ? 3 : 0;
        return (result >> shift) & 7;
      };
      for (const cls of who) {
        const shift = cls === "u" ? 6 : cls === "g" ? 3 : 0;
        let b = 0;
        for (const p of perms) {
          if (p === "r") b |= 4;
          else if (p === "w") b |= 2;
          else if (p === "x") b |= 1;
          else if (p === "X") {
            if (isDir || result & 0o111) b |= 1;
          } else if (p === "u" || p === "g" || p === "o") b |= copy(p);
        }
        bits |= b << shift;
        if (perms.includes("s")) {
          if (cls === "u") bits |= 0o4000;
          if (cls === "g") bits |= 0o2000;
        }
        if (perms.includes("t") && cls === "o") bits |= 0o1000;
      }
      if (perms.includes("t") && who === "ugo") bits |= 0o1000;
      let classMask = 0;
      for (const cls of who) classMask |= cls === "u" ? 0o4700 : cls === "g" ? 0o2070 : 0o1007;
      if (sign === "+") result |= bits;
      else if (sign === "-") result &= ~bits;
      else result = (result & ~classMask) | bits;
    }
  }
  return result & 0o7777;
}

export interface UmaskResult {
  umask: string;
  files: string;
  dirs: string;
  /** umask -S form, e.g. u=rwx,g=rx,o=rx */
  symbolic: string;
}

/** Default permissions a umask gives new files (from 666) and directories (from 777) */
export function umaskInfo(umask: string): UmaskResult | null {
  if (!/^0?[0-7]{3}$/.test(umask)) return null;
  const u = parseInt(umask, 8) & 0o777;
  const files = 0o666 & ~u;
  const dirs = 0o777 & ~u;
  const cls = (shift: number) => {
    const b = (dirs >> shift) & 7;
    return `${b & 4 ? "r" : ""}${b & 2 ? "w" : ""}${b & 1 ? "x" : ""}`;
  };
  return {
    umask: u.toString(8).padStart(4, "0"),
    files: files.toString(8).padStart(3, "0"),
    dirs: dirs.toString(8).padStart(3, "0"),
    symbolic: `u=${cls(6)},g=${cls(3)},o=${cls(0)}`,
  };
}

/** The umask that makes new directories get this mode (and files the same without execute) */
export const umaskFor = (dirMode: string) => (0o777 & ~(parseInt(dirMode.slice(-3), 8) & 0o777)).toString(8).padStart(4, "0");
