// Collapses whitespace and strips comments while leaving string literals, quoted identifiers, and
// dollar-quoted bodies untouched. Optimizer hints (/*+ ... */) and MySQL executable comments
// (/*! ... */) are kept because removing them changes how the query runs.
export function minifySql(sql: string): string {
  let out = "";
  let pendingSpace = false;
  let i = 0;

  const emit = (chunk: string) => {
    const last = out[out.length - 1];
    if (pendingSpace && out.length > 0 && last !== "," && last !== "(") out += " ";
    pendingSpace = false;
    out += chunk;
  };

  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (/\s/.test(ch)) {
      pendingSpace = true;
      i++;
      continue;
    }

    if (ch === "-" && next === "-") {
      while (i < sql.length && sql[i] !== "\n") i++;
      pendingSpace = true;
      continue;
    }

    if (ch === "/" && next === "*") {
      const end = sql.indexOf("*/", i + 2);
      const stop = end === -1 ? sql.length : end + 2;
      const marker = sql[i + 2];
      if (marker === "+" || marker === "!") emit(sql.slice(i, stop));
      else pendingSpace = true;
      i = stop;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === "\\" && ch !== "`") {
          j += 2;
          continue;
        }
        if (sql[j] === ch) {
          if (sql[j + 1] === ch) {
            j += 2;
            continue;
          }
          break;
        }
        j++;
      }
      emit(sql.slice(i, j + 1));
      i = j + 1;
      continue;
    }

    if (ch === "[") {
      const end = sql.indexOf("]", i + 1);
      const stop = end === -1 ? sql.length : end + 1;
      emit(sql.slice(i, stop));
      i = stop;
      continue;
    }

    if (ch === "$") {
      const tag = sql.slice(i).match(/^\$[A-Za-z_]*\$/);
      if (tag) {
        const end = sql.indexOf(tag[0], i + tag[0].length);
        const stop = end === -1 ? sql.length : end + tag[0].length;
        emit(sql.slice(i, stop));
        i = stop;
        continue;
      }
    }

    if ("(),;".includes(ch)) {
      pendingSpace = false;
      out += ch;
      i++;
      continue;
    }

    emit(ch);
    i++;
  }

  return out.trim();
}
