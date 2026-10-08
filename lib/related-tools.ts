import { tools, type Tool } from "./tools";

// Hand-curated "Related tools" for every tool page: 3-5 tools someone using this one is likely
// to need next, grouped by cluster. Every tool needs an entry with at least 3 valid slugs;
// `npm run check:seo` fails the build output check when a tool page shows fewer.

export const RELATED_TOOLS: Record<string, string[]> = {
  // ── JSON ────────────────────────────────────────────────────────────────
  "json-formatter": ["jsonpath-tester", "json-diff", "json-schema-generator", "json-to-typescript", "json-yaml"],
  "jsonpath-tester": ["json-formatter", "json-diff", "json-schema-generator", "xpath-tester"],
  "json-diff": ["json-patch-tool", "json-formatter", "diff-checker", "jsonpath-tester"],
  "json-patch-tool": ["json-diff", "json-formatter", "patch-generator", "http-request"],
  "json-yaml": ["config-validator", "json-formatter", "csv-json", "xml-json-converter"],
  "csv-json": ["json-to-markdown-table", "json-formatter", "json-yaml", "fake-data-generator"],
  "json-schema-generator": ["json-formatter", "json-to-typescript", "jsonpath-tester", "fake-data-generator"],
  "json-to-typescript": ["json-schema-generator", "json-formatter", "jsonpath-tester", "node-type-stripping-checker"],
  "ndjson-formatter": ["json-formatter", "jsonpath-tester", "csv-json", "json-diff"],
  "json-to-markdown-table": ["csv-json", "markdown-table-generator", "json-formatter", "markdown-preview"],
  "xml-json-converter": ["xml-formatter", "json-formatter", "xpath-tester", "json-yaml"],

  // ── JWT and keys ───────────────────────────────────────────────────────
  "jwt-decoder": ["jwt-generator", "jwt-keypair-generator", "jwk-pem-converter", "base64", "timestamp-converter"],
  "jwt-generator": ["jwt-decoder", "jwt-keypair-generator", "jwk-pem-converter", "jwk-thumbprint-calculator"],
  "jwt-keypair-generator": ["jwt-generator", "jwk-pem-converter", "jwk-thumbprint-calculator", "ssh-key-generator"],
  "jwk-pem-converter": ["jwk-thumbprint-calculator", "jwt-keypair-generator", "jwt-decoder", "crypto-tools"],
  "jwk-thumbprint-calculator": ["jwk-pem-converter", "jwt-keypair-generator", "jwt-generator", "hash-generator"],

  // ── Encoding ───────────────────────────────────────────────────────────
  base64: ["image-to-base64", "url-encoder", "base32", "jwt-decoder", "hash-generator"],
  "url-encoder": ["url-parser", "base64", "html-entity", "slug-generator"],
  "html-entity": ["url-encoder", "unicode-explorer", "html-formatter", "base64"],
  "image-to-base64": ["base64", "svg-optimizer", "image-compressor", "favicon-generator"],
  base58: ["base62-encoder", "base32", "base64", "number-base-converter"],
  base32: ["base64", "totp-generator", "base58", "hotp-generator"],
  "base62-encoder": ["base58", "base64", "uuid-generator", "number-base-converter"],
  "hash-generator": ["password-strength-checker", "crypto-tools", "base64", "jwk-thumbprint-calculator"],
  "unicode-explorer": ["html-entity", "url-encoder", "string-case-converter", "base64"],
  "number-base-converter": ["chmod-calculator", "color-converter", "base58", "cidr-calculator"],
  "string-case-converter": ["slug-generator", "list-sorter", "word-counter", "unicode-explorer"],

  // ── IDs and test data ──────────────────────────────────────────────────
  "uuid-generator": ["uuid-parser", "ulid-generator", "fake-data-generator", "hash-generator"],
  "ulid-generator": ["uuid-generator", "uuid-parser", "timestamp-converter", "base62-encoder"],
  "uuid-parser": ["uuid-generator", "ulid-generator", "timestamp-converter"],
  "fake-data-generator": ["json-schema-generator", "csv-json", "uuid-generator", "lorem-ipsum", "http-request"],
  "credit-card-test-generator": ["iban-validator", "fake-data-generator", "regex-tester"],
  "iban-validator": ["credit-card-test-generator", "fake-data-generator", "regex-tester"],
  "lorem-ipsum": ["placeholder-image-generator", "fake-data-generator", "word-counter", "markdown-preview"],

  // ── Text, diff and Markdown ────────────────────────────────────────────
  "diff-checker": ["text-diff", "json-diff", "patch-generator", "list-sorter"],
  "text-diff": ["diff-checker", "patch-generator", "word-counter"],
  "patch-generator": ["diff-checker", "text-diff", "git-command-generator", "json-patch-tool"],
  "word-counter": ["markdown-preview", "text-diff", "list-sorter", "ai-token-counter"],
  "list-sorter": ["diff-checker", "string-case-converter", "word-counter", "csv-json"],
  "markdown-preview": ["markdown-table-generator", "markdown-toc-generator", "mermaid-editor", "readme-badge-generator"],
  "markdown-table-generator": ["json-to-markdown-table", "markdown-preview", "csv-json", "markdown-toc-generator"],
  "markdown-toc-generator": ["markdown-preview", "markdown-table-generator", "slug-generator", "readme-badge-generator"],
  "mermaid-editor": ["markdown-preview", "svg-optimizer", "markdown-table-generator"],
  "readme-badge-generator": ["markdown-preview", "markdown-toc-generator", "gitignore-generator", "markdown-table-generator"],

  // ── Regex, XML and XPath ──────────────────────────────────────────────
  "regex-tester": ["jsonpath-tester", "xpath-tester", "string-case-converter", "secret-scanner"],
  "xpath-tester": ["css-xpath-converter", "xml-formatter", "jsonpath-tester", "xml-json-converter"],
  "css-xpath-converter": ["xpath-tester", "css-specificity-calculator", "html-formatter"],
  "xml-formatter": ["xpath-tester", "xml-json-converter", "html-formatter", "sitemap-generator"],

  // ── Code formatters ────────────────────────────────────────────────────
  "sql-formatter": ["graphql-formatter", "json-formatter", "csv-json"],
  "graphql-formatter": ["json-formatter", "http-request", "sql-formatter", "json-to-typescript"],
  "html-formatter": ["html-entity", "xml-formatter", "svg-to-jsx", "meta-tags-generator"],

  // ── HTTP, APIs and network ─────────────────────────────────────────────
  "http-request": ["curl-to-code", "cors-debugger", "http-header-inspector", "http-status-codes", "json-formatter"],
  "curl-to-code": ["http-request", "url-parser", "json-formatter", "jwt-decoder"],
  "cors-debugger": ["http-request", "http-header-inspector", "security-headers-checker", "csp-builder"],
  "http-header-inspector": ["security-headers-checker", "cors-debugger", "http-status-codes", "csp-builder"],
  "http-status-codes": ["http-request", "http-header-inspector", "cors-debugger", "htaccess-to-nginx"],
  "url-parser": ["url-encoder", "curl-to-code", "slug-generator", "user-agent-parser"],
  "user-agent-parser": ["http-header-inspector", "url-parser", "robots-txt-generator"],
  "cidr-calculator": ["number-base-converter", "chmod-calculator", "htaccess-to-nginx", "docker-run-to-compose"],

  // ── Security ───────────────────────────────────────────────────────────
  "security-headers-checker": ["csp-builder", "http-header-inspector", "cors-debugger", "htaccess-to-nginx"],
  "csp-builder": ["security-headers-checker", "http-header-inspector", "cors-debugger", "hash-generator"],
  "crypto-tools": ["hash-generator", "password-generator", "jwk-pem-converter", "base64"],
  "ssh-key-generator": ["jwt-keypair-generator", "chmod-calculator", "crypto-tools", "git-command-generator"],
  "secret-scanner": ["env-file-tool", "package-json-inspector", "gitignore-generator", "regex-tester"],
  "package-json-inspector": ["secret-scanner", "gitignore-generator", "env-file-tool", "node-type-stripping-checker"],
  "password-generator": ["password-strength-checker", "hash-generator", "backup-codes-generator", "crypto-tools"],
  "password-strength-checker": ["password-generator", "hash-generator", "backup-codes-generator"],
  "totp-generator": ["hotp-generator", "backup-codes-generator", "base32", "qr-code-scanner", "passkey-tester"],
  "hotp-generator": ["totp-generator", "backup-codes-generator", "base32", "hash-generator"],
  "backup-codes-generator": ["totp-generator", "hotp-generator", "password-generator", "hash-generator"],
  "passkey-tester": ["totp-generator", "jwk-thumbprint-calculator", "base64", "backup-codes-generator"],

  // ── DevOps, config and repo tooling ────────────────────────────────────
  "cron-tester": ["timestamp-converter", "docker-run-to-compose", "config-validator"],
  "docker-run-to-compose": ["json-yaml", "config-validator", "env-file-tool", "cidr-calculator"],
  "env-file-tool": ["secret-scanner", "docker-run-to-compose", "config-validator", "json-yaml"],
  "config-validator": ["json-yaml", "json-formatter", "env-file-tool", "docker-run-to-compose"],
  "htaccess-to-nginx": ["security-headers-checker", "http-status-codes", "robots-txt-generator", "chmod-calculator"],
  "chmod-calculator": ["number-base-converter", "ssh-key-generator", "htaccess-to-nginx", "cidr-calculator"],
  "git-command-generator": ["gitignore-generator", "patch-generator", "diff-checker", "readme-badge-generator"],
  "gitignore-generator": ["git-command-generator", "env-file-tool", "secret-scanner", "readme-badge-generator"],
  "ts7-migration-checker": ["node-type-stripping-checker", "json-to-typescript", "config-validator"],
  "node-type-stripping-checker": ["ts7-migration-checker", "json-to-typescript", "package-json-inspector"],

  // ── Time ───────────────────────────────────────────────────────────────
  "timestamp-converter": ["cron-tester", "meeting-planner", "uuid-parser", "jwt-decoder"],
  "meeting-planner": ["timestamp-converter", "cron-tester", "qr-code-generator"],

  // ── SEO and web publishing ─────────────────────────────────────────────
  "meta-tags-generator": ["favicon-generator", "robots-txt-generator", "sitemap-generator", "slug-generator"],
  "robots-txt-generator": ["sitemap-generator", "meta-tags-generator", "user-agent-parser", "htaccess-to-nginx"],
  "sitemap-generator": ["robots-txt-generator", "meta-tags-generator", "xml-formatter", "slug-generator"],
  "slug-generator": ["string-case-converter", "url-encoder", "meta-tags-generator", "markdown-toc-generator"],
  "favicon-generator": ["image-compressor", "svg-optimizer", "meta-tags-generator", "image-to-base64"],

  // ── Images and SVG ─────────────────────────────────────────────────────
  "image-compressor": ["favicon-generator", "image-to-base64", "svg-optimizer", "placeholder-image-generator"],
  "svg-optimizer": ["svg-to-jsx", "image-to-base64", "image-compressor", "favicon-generator"],
  "svg-to-jsx": ["svg-optimizer", "html-formatter", "json-to-typescript"],
  "placeholder-image-generator": ["lorem-ipsum", "image-compressor", "image-to-base64", "css-gradient"],
  "qr-code-generator": ["qr-code-scanner", "barcode-generator", "url-parser", "totp-generator"],
  "qr-code-scanner": ["qr-code-generator", "totp-generator", "barcode-generator", "url-parser"],
  "barcode-generator": ["qr-code-generator", "qr-code-scanner", "iban-validator"],

  // ── CSS ────────────────────────────────────────────────────────────────
  "css-flexbox-generator": ["css-grid-generator", "css-specificity-calculator", "box-shadow-generator", "fluid-typography-calculator"],
  "css-grid-generator": ["css-flexbox-generator", "fluid-typography-calculator", "css-carousel-generator", "css-specificity-calculator"],
  "css-gradient": ["box-shadow-generator", "color-palette", "color-converter", "css-animations"],
  "box-shadow-generator": ["css-gradient", "css-animations", "css-flexbox-generator", "color-converter"],
  "css-animations": ["css-carousel-generator", "box-shadow-generator", "css-gradient", "css-specificity-calculator"],
  "css-specificity-calculator": ["css-xpath-converter", "css-flexbox-generator", "css-grid-generator", "css-animations"],
  "fluid-typography-calculator": ["css-grid-generator", "css-flexbox-generator", "contrast-checker"],
  "scrollbar-generator": ["css-carousel-generator", "color-palette", "css-animations", "box-shadow-generator"],
  "css-carousel-generator": ["css-animations", "scrollbar-generator", "css-grid-generator", "css-flexbox-generator"],

  // ── Color and accessibility ────────────────────────────────────────────
  "color-converter": ["color-palette", "contrast-checker", "css-gradient", "image-color-picker"],
  "color-palette": ["color-converter", "contrast-checker", "image-color-picker", "css-gradient"],
  "image-color-picker": ["color-palette", "color-converter", "contrast-checker", "color-blindness-simulator"],
  "contrast-checker": ["color-blindness-simulator", "color-converter", "color-palette", "fluid-typography-calculator"],
  "color-blindness-simulator": ["contrast-checker", "image-color-picker", "color-palette"],

  // ── AI ─────────────────────────────────────────────────────────────────
  "ai-token-counter": ["word-counter", "json-formatter", "http-request", "markdown-preview"],
};

export function getRelatedTools(slug: string): Tool[] {
  return (RELATED_TOOLS[slug] ?? [])
    .filter((s) => s !== slug)
    .map((s) => tools.find((t) => t.slug === s))
    .filter((t): t is Tool => Boolean(t));
}
