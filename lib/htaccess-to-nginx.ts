export interface ConvertResult {
  output: string;
  warnings: string[];
}

interface PendingCond {
  raw: string;
  variable: string;
  pattern: string;
  negate: boolean;
  nocase: boolean;
  isHttps: boolean;
  fileTest: string | null;
}

const APACHE_VAR_MAP: Record<string, string> = {
  "%{HTTP_HOST}": "$host",
  "%{REQUEST_URI}": "$request_uri",
  "%{QUERY_STRING}": "$args",
  "%{REQUEST_FILENAME}": "$request_filename",
  "%{DOCUMENT_ROOT}": "$document_root",
  "%{REMOTE_ADDR}": "$remote_addr",
  "%{HTTP_USER_AGENT}": "$http_user_agent",
  "%{HTTP_REFERER}": "$http_referer",
  "%{SERVER_PORT}": "$server_port",
  "%{TIME}": "$time_local",
};

function substituteApacheVars(str: string): string {
  let out = str;
  for (const [apacheVar, nginxVar] of Object.entries(APACHE_VAR_MAP)) {
    out = out.split(apacheVar).join(nginxVar);
  }
  // Backreferences to the last matched RewriteCond: %1, %2... -> nginx capture groups $1, $2...
  // (only valid inside an `if` block built from that same cond, which is how we emit them)
  out = out.replace(/%(\d)/g, "$$$1");
  return out;
}

function parseRewriteCond(line: string): PendingCond | null {
  const m = line.match(/^RewriteCond\s+(\S+)\s+(.+?)(\s+\[([^\]]*)\])?$/i);
  if (!m) return null;
  const [, variable, rawPattern, , flags] = m;
  const flagList = (flags || "").split(",").map((f) => f.trim().toUpperCase());
  const negate = rawPattern.startsWith("!");
  const pattern = negate ? rawPattern.slice(1) : rawPattern;
  const fileTestMatch = pattern.match(/^-([fdesxFDESXlL])$/);
  return {
    raw: line,
    variable: APACHE_VAR_MAP[variable] ?? variable,
    pattern: pattern.replace(/^["']|["']$/g, ""),
    negate,
    nocase: flagList.includes("NC"),
    isHttps: variable === "%{HTTPS}",
    fileTest: fileTestMatch ? fileTestMatch[1].toLowerCase() : null,
  };
}

/** Renders one RewriteCond as an nginx `if (...)` condition line. %{HTTPS} has no nginx
 * variable equivalent — it's translated to a $scheme comparison instead, and Apache's
 * -f/-d/-e/-x file-existence tests map to nginx's own (also somewhat unusual) `-f $var` syntax. */
function condToIfLine(cond: PendingCond): string {
  if (cond.isHttps) {
    const wantsHttps = /^on$/i.test(cond.pattern) !== cond.negate;
    return `if ($scheme ${wantsHttps ? "=" : "!="} "https") {`;
  }
  if (cond.fileTest && "fdex".includes(cond.fileTest)) {
    return `if (${cond.negate ? "!" : ""}-${cond.fileTest} ${cond.variable}) {`;
  }
  const op = cond.negate ? "!~" : "~";
  const modifier = cond.nocase ? op + "*" : op;
  return `if (${cond.variable} ${modifier} "${cond.pattern}") {`;
}

/** Detects the extremely common WordPress/front-controller idiom:
 *   RewriteCond %{REQUEST_FILENAME} !-f
 *   RewriteCond %{REQUEST_FILENAME} !-d
 *   RewriteRule . /index.php [L]
 * nginx's own docs recommend `try_files` over an if-based port for exactly this case — an
 * if-based translation is both harder to get right (the "." pattern isn't safely anchorable)
 * and not idiomatic nginx, so this is emitted as the canonical block instead of a literal port. */
function detectFrontControllerIdiom(pattern: string, target: string, flagList: string[], conds: PendingCond[]): string | null {
  const hasNotFileTest = conds.some((c) => c.negate && c.fileTest === "f" && c.variable === "$request_filename");
  const hasNotDirTest = conds.some((c) => c.negate && c.fileTest === "d" && c.variable === "$request_filename");
  const isCatchAll = pattern.trim() === "." || /^\^?\.\*\$?$/.test(pattern.trim()) || /^\^\(\.\*\)\$?$/.test(pattern.trim());
  const targetFile = target.split("?")[0];
  if (hasNotFileTest && hasNotDirTest && isCatchAll && flagList.includes("L") && /\.php$/i.test(targetFile)) {
    return `location / {\n    try_files $uri $uri/ ${targetFile}?$args;\n}`;
  }
  return null;
}

function parseRewriteRule(line: string, conds: PendingCond[]): { code: string; warnings: string[] } | null {
  const m = line.match(/^RewriteRule\s+(\S+)\s+(\S+)(\s+\[([^\]]*)\])?$/i);
  if (!m) return null;
  const [, pattern, target, , flags] = m;
  const flagList = (flags || "").split(",").map((f) => f.trim().toUpperCase());
  const warnings: string[] = [];

  const isRedirect = flagList.some((f) => f === "R" || f.startsWith("R="));
  const redirectFlag = flagList.find((f) => f.startsWith("R="));
  const statusCode = redirectFlag ? redirectFlag.split("=")[1] : "302";
  const qsa = flagList.includes("QSA");

  const nginxPattern = (pattern.startsWith("^") ? pattern : "^" + pattern).replace(/\$$/, "$") || pattern;
  const anchoredPattern = nginxPattern.startsWith("^/") || !nginxPattern.startsWith("^") ? nginxPattern : "^/" + nginxPattern.slice(1);

  // A catch-all rule pattern (^(.*)$ and equivalents) combined with a RewriteCond is almost
  // always the "redirect the whole request to a different host/scheme" idiom. In that case the
  // rule's own $1 means "the whole original path" — substitute $request_uri for it instead of a
  // bare nginx $1, which would otherwise collide with the cond's own capture group of the same name.
  const isCatchAllPattern = /^\^?\(\.\*\)\$?$/.test(pattern.trim());
  let targetForSubstitution = target;
  if (isCatchAllPattern && conds.length > 0) {
    // $request_uri already includes its own leading slash, so a literal "/" written just
    // before $1 in the Apache target (the near-universal way this idiom is written) would
    // otherwise produce a double slash — consume that separator along with $1.
    targetForSubstitution = target.includes("/$1")
      ? target.replace(/\/\$1\b/g, "$request_uri")
      : target.replace(/\$1\b/g, "$request_uri");
  }
  let nginxTarget = substituteApacheVars(targetForSubstitution);
  if (isRedirect && qsa && !nginxTarget.includes("$is_args") && !nginxTarget.includes("?")) {
    nginxTarget += "$is_args$args";
  }

  const lines: string[] = [];

  // Emit any RewriteCond lines as a matching `if` block wrapping the rule — nginx's `if` is
  // not a full equivalent of Apache's cond chaining (nginx ifs don't AND together cleanly),
  // so multi-condition chains get flagged for manual review.
  if (conds.length > 1) {
    warnings.push(`Multiple RewriteCond lines before "${line.trim()}" — nginx's if directive doesn't chain conditions the same way Apache does. Review the generated if blocks.`);
  }
  if (!isCatchAllPattern && conds.length > 0 && /\$1\b/.test(target)) {
    warnings.push(`"${line.trim()}" uses both a RewriteCond and its own capture group in the target — nginx's $1 inside the if block refers to the cond's capture, not the rule's. Verify the generated $1 references by hand.`);
  }

  for (const cond of conds) lines.push(condToIfLine(cond));

  const indent = "    ".repeat(conds.length);
  if (isRedirect) {
    const code = statusCode.match(/^\d+$/) ? statusCode : "302";
    lines.push(`${indent}return ${code} ${nginxTarget};`);
  } else {
    lines.push(`${indent}rewrite ${anchoredPattern} ${nginxTarget}${flagList.includes("L") ? " last" : ""};`);
  }

  for (let i = 0; i < conds.length; i++) lines.push(`${"    ".repeat(conds.length - 1 - i)}}`);

  return { code: lines.join("\n"), warnings };
}

export function convertHtaccessToNginx(input: string): ConvertResult {
  const lines = input.split("\n");
  const output: string[] = [];
  const warnings: string[] = [];
  let pendingConds: PendingCond[] = [];
  let inFilesBlock: { pattern: string; isMatch: boolean; body: string[] } | null = null;

  const flush = () => {
    if (pendingConds.length > 0) {
      warnings.push(`RewriteCond with no following RewriteRule was dropped: ${pendingConds.map((c) => c.raw.trim()).join(" / ")}`);
      pendingConds = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    // <IfModule ...> / </IfModule> wrappers — unwrap, process contents as normal
    if (/^<\/?IfModule/i.test(line)) continue;

    // <Files "x"> ... </Files> and <FilesMatch "regex"> ... </FilesMatch>
    const filesOpen = line.match(/^<Files(Match)?\s+"?([^">]+)"?>/i);
    if (filesOpen) {
      inFilesBlock = { pattern: filesOpen[2], isMatch: !!filesOpen[1], body: [] };
      continue;
    }
    if (/^<\/Files(Match)?>/i.test(line)) {
      if (inFilesBlock) {
        // <Files> matches a literal filename (no regex needed); <FilesMatch> takes a regex.
        const selector = inFilesBlock.isMatch ? inFilesBlock.pattern : "/" + inFilesBlock.pattern.replace(/^\/+/, "");
        const locationPrefix = inFilesBlock.isMatch ? "~" : "=";
        const blockLines = [`location ${locationPrefix} ${selector} {`, ...inFilesBlock.body.map((b) => `    ${b}`), "}"];
        output.push(blockLines.join("\n"));
      }
      inFilesBlock = null;
      continue;
    }
    if (inFilesBlock) {
      if (/^Deny\s+from\s+all/i.test(line)) inFilesBlock.body.push("deny all;");
      else if (/^Allow\s+from\s+all/i.test(line)) inFilesBlock.body.push("allow all;");
      else warnings.push(`Directive inside <Files> not translated: ${line}`);
      continue;
    }

    // RewriteEngine — no nginx equivalent needed, rewrite is always "on"
    if (/^RewriteEngine/i.test(line)) continue;
    if (/^RewriteBase/i.test(line)) {
      warnings.push(`RewriteBase has no direct nginx equivalent — nginx rewrite paths are relative to the location block instead: ${line}`);
      continue;
    }

    // RewriteCond — buffer until the following RewriteRule
    if (/^RewriteCond/i.test(line)) {
      const cond = parseRewriteCond(line);
      if (cond) pendingConds.push(cond);
      else warnings.push(`Could not parse: ${line}`);
      continue;
    }

    // RewriteRule — consume any buffered RewriteCond lines
    if (/^RewriteRule/i.test(line)) {
      const ruleMatch = line.match(/^RewriteRule\s+(\S+)\s+(\S+)(\s+\[([^\]]*)\])?$/i);
      const frontController = ruleMatch
        ? detectFrontControllerIdiom(ruleMatch[1], ruleMatch[2], (ruleMatch[4] || "").split(",").map((f) => f.trim().toUpperCase()), pendingConds)
        : null;

      if (frontController) {
        output.push(frontController);
        pendingConds = [];
        continue;
      }

      const result = parseRewriteRule(line, pendingConds);
      pendingConds = [];
      if (result) {
        output.push(result.code);
        warnings.push(...result.warnings);
      } else {
        warnings.push(`Could not parse: ${line}`);
      }
      continue;
    }

    flush();

    // Redirect / Redirect 301 /old /new
    const redirect = line.match(/^Redirect(Match)?\s+(?:(\d{3}|permanent|temp)\s+)?(\S+)\s+(\S+)/i);
    if (redirect) {
      const [, isMatch, codeWord, from, to] = redirect;
      const code = codeWord === "permanent" ? "301" : codeWord === "temp" ? "302" : codeWord || "302";
      const path = isMatch ? from : from.startsWith("/") ? from : "/" + from;
      output.push(isMatch ? `location ~ "${path}" {\n    return ${code} ${to};\n}` : `location = ${path} {\n    return ${code} ${to};\n}`);
      continue;
    }

    // ErrorDocument 404 /404.html
    const errorDoc = line.match(/^ErrorDocument\s+(\d{3})\s+(\S+)/i);
    if (errorDoc) {
      output.push(`error_page ${errorDoc[1]} ${errorDoc[2]};`);
      continue;
    }

    // DirectoryIndex index.html index.php
    const dirIndex = line.match(/^DirectoryIndex\s+(.+)/i);
    if (dirIndex) {
      output.push(`index ${dirIndex[1].trim().split(/\s+/).join(" ")};`);
      continue;
    }

    // Options -Indexes / +Indexes
    const options = line.match(/^Options\s+([+-])Indexes/i);
    if (options) {
      output.push(`autoindex ${options[1] === "+" ? "on" : "off"};`);
      continue;
    }

    // Top-level Deny/Allow
    if (/^Deny\s+from\s+all/i.test(line)) {
      output.push("deny all;");
      continue;
    }
    if (/^Allow\s+from\s+all/i.test(line)) {
      output.push("allow all;");
      continue;
    }
    const allowIp = line.match(/^Allow\s+from\s+(\S+)/i);
    if (allowIp) {
      output.push(`allow ${allowIp[1]};`);
      continue;
    }
    const denyIp = line.match(/^Deny\s+from\s+(\S+)/i);
    if (denyIp) {
      output.push(`deny ${denyIp[1]};`);
      continue;
    }

    // Basic auth
    if (/^AuthType\s+Basic/i.test(line)) continue; // handled together with AuthName below
    const authName = line.match(/^AuthName\s+"?([^"]+)"?/i);
    if (authName) {
      output.push(`auth_basic "${authName[1]}";`);
      continue;
    }
    const authUserFile = line.match(/^AuthUserFile\s+(\S+)/i);
    if (authUserFile) {
      output.push(`auth_basic_user_file ${authUserFile[1]};`);
      continue;
    }

    // PHP handler directives — no direct nginx equivalent, needs a fastcgi location block
    if (/^(AddHandler|AddType)\s+.*php/i.test(line)) {
      warnings.push(
        `PHP is handled differently in nginx — it needs a dedicated location block instead of "${line}". Add:\nlocation ~ \\.php$ {\n    include fastcgi_params;\n    fastcgi_pass unix:/run/php/php8.3-fpm.sock;\n    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;\n}`
      );
      continue;
    }

    // php_value / php_flag — belongs in php.ini or fastcgi_param, not portable directly
    if (/^php_(value|flag)/i.test(line)) {
      warnings.push(`"${line}" has no nginx equivalent — set this in php.ini or via fastcgi_param instead.`);
      continue;
    }

    warnings.push(`Not translated (no recognized rule): ${line}`);
  }

  flush();

  return {
    output: output.join("\n\n") + (output.length ? "\n" : ""),
    warnings,
  };
}
