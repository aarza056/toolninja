import { tools } from "./tools";

// Which tools each blog post is about, most relevant first. This is the single source for:
// - the "Try it yourself" tool links under each post,
// - in-body links (each post must link its first tool in the text; see check:seo),
// - the "Guides" list on each tool page (the reverse of this map, see getPostsForTool),
// - the tool Explain This Error suggests for a matched post.
export const POST_TOOLS: Record<string, string[]> = {
  "active-directory-replication-lockout-group-policy-errors": [],
  "aws-vpc-cidr-blocks-guide": ["cidr-calculator"],
  "base64-encoding-explained": ["base64", "image-to-base64", "url-encoder"],
  "bcrypt-hash-verification-error-salt-password": ["hash-generator", "password-generator"],
  "cannot-read-properties-undefined-reading-map": ["json-formatter", "json-to-typescript"],
  "chmod-explained": ["chmod-calculator"],
  "cidr-block-overlaps-existing-subnet-vpc": ["cidr-calculator"],
  "cidr-subnetting-guide": ["cidr-calculator"],
  "common-git-errors-explained": ["git-command-generator", "diff-checker"],
  "content-security-policy-unsafe-inline-mistakes": ["csp-builder", "security-headers-checker", "hash-generator"],
  "cors-error-no-access-control-allow-origin": ["cors-debugger", "http-header-inspector", "http-request"],
  "cron-expression-out-of-range-invalid-interval": ["cron-tester"],
  "css-grid-common-mistakes": ["css-grid-generator", "css-flexbox-generator"],
  "css-invalid-property-linear-gradient": ["css-gradient"],
  "csv-vs-json-when-to-use-which": ["csv-json", "json-formatter"],
  "curl-to-python-javascript-code": ["curl-to-code", "http-request"],
  "dns-error-codes-nxdomain-servfail-refused-explained": ["url-parser"],
  "docker-container-name-already-in-use": ["docker-run-to-compose"],
  "docker-port-already-allocated-error": ["docker-run-to-compose"],
  "domexception-btoa-characters-outside-latin1": ["base64", "unicode-explorer"],
  "duckduckgo-vs-google-seo": ["meta-tags-generator", "robots-txt-generator", "sitemap-generator"],
  "european-accessibility-act-color-contrast": ["contrast-checker", "color-blindness-simulator"],
  "favicon-guide-2026": ["favicon-generator", "svg-optimizer"],
  "free-postman-alternative-browser": ["http-request", "curl-to-code"],
  "git-commands-reference": ["git-command-generator", "gitignore-generator"],
  "git-pathspec-did-not-match-any-files": ["git-command-generator"],
  "hardcoded-secrets-in-your-codebase": ["secret-scanner", "env-file-tool", "gitignore-generator"],
  "hmac-webhook-signature-verification-guide": ["hash-generator"],
  "how-to-compare-json-api-responses": ["json-diff", "http-request"],
  "how-to-estimate-llm-api-costs-before-the-bill": ["ai-token-counter"],
  "how-to-generate-and-apply-json-patch-rfc-6902": ["json-patch-tool", "json-diff"],
  "how-to-set-up-2fa-the-right-way": ["totp-generator", "hotp-generator", "backup-codes-generator", "qr-code-scanner"],
  "how-to-test-passkeys-webauthn-without-a-backend": ["passkey-tester", "jwk-thumbprint-calculator"],
  "http-401-unauthorized-vs-403-forbidden": ["http-status-codes", "jwt-decoder"],
  "http-415-unsupported-media-type": ["http-request", "http-header-inspector"],
  "invalid-octal-value-chmod-permissions": ["chmod-calculator", "number-base-converter"],
  "invalid-regular-expression-nothing-to-repeat": ["regex-tester"],
  "invalid-xml-xpath-query-failed-expression-expected": ["xpath-tester", "xml-formatter"],
  "json-formatting-guide": ["json-formatter", "jsonpath-tester", "json-schema-generator"],
  "json-ld-structured-data-seo-guide": ["meta-tags-generator", "json-formatter"],
  "json-parse-unexpected-character-line-1-column-1": ["json-formatter"],
  "jwt-classcasstexception-claimjwtexception": ["jwt-decoder", "timestamp-converter"],
  "jwt-invalid-key-size-too-short": ["jwt-generator", "jwt-keypair-generator"],
  "jwt-signature-verification-failed": ["jwt-decoder", "jwk-pem-converter"],
  "jwt-tokens-explained": ["jwt-decoder", "jwt-generator"],
  "keyv-cacheable-npm-supply-chain-attack-explained": ["package-json-inspector", "secret-scanner"],
  "linux-no-space-left-permission-denied-errors": ["chmod-calculator"],
  "markdown-guide-for-developers": ["markdown-preview", "markdown-table-generator", "mermaid-editor"],
  "mock-data-api-testing-guide": ["fake-data-generator", "json-schema-generator"],
  "mysql-error-1064-sql-syntax": ["sql-formatter"],
  "nginx-502-504-403-errors-explained": ["http-status-codes", "htaccess-to-nginx"],
  "password-security-guide": ["password-generator", "password-strength-checker"],
  "qr-code-generator-guide": ["qr-code-generator", "qr-code-scanner"],
  "regex-guide-for-developers": ["regex-tester"],
  "robots-txt-ai-crawlers-2026-guide": ["robots-txt-generator", "user-agent-parser"],
  "sql-incorrect-syntax-near-keyword": ["sql-formatter"],
  "ssh-permission-denied-publickey-explained": ["ssh-key-generator", "chmod-calculator"],
  "standard-init-linux-exec-user-process-no-such-file": ["docker-run-to-compose", "chmod-calculator"],
  "svg-optimization-guide-reduce-file-size": ["svg-optimizer", "svg-to-jsx"],
  "timestamp-unix-time-guide": ["timestamp-converter"],
  "typeerror-cannot-convert-undefined-null-to-object": ["json-formatter", "json-to-typescript"],
  "typescript-7-migration-guide-breaking-changes": ["ts7-migration-checker", "node-type-stripping-checker"],
  "typescript-type-errors-common": ["json-to-typescript"],
  "uri-malformed-error-javascript-url-parsing": ["url-encoder", "url-parser"],
  "uuid-guide": ["uuid-generator", "uuid-parser"],
  "uuid-v7-vs-v4-vs-ulid-database-primary-keys": ["uuid-generator", "ulid-generator", "uuid-parser"],
  "windows-event-id-errors-explained": [],
  "xpath-guide-for-developers": ["xpath-tester", "css-xpath-converter"],
  "yaml-map-keys-not-allowed-bad-indentation": ["config-validator", "json-yaml"],
};

const TOOL_SLUGS = new Set(tools.map((t) => t.slug));

export function getToolsForPost(postSlug: string): string[] {
  return (POST_TOOLS[postSlug] ?? []).filter((s) => TOOL_SLUGS.has(s));
}

/**
 * Posts relevant to a tool: posts that list it first come before posts that list it later.
 * Returns post slugs; the caller resolves titles.
 */
export function getPostsForTool(toolSlug: string, limit = 3): string[] {
  return Object.entries(POST_TOOLS)
    .map(([post, list]) => ({ post, rank: list.indexOf(toolSlug) }))
    .filter((p) => p.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.post.localeCompare(b.post))
    .slice(0, limit)
    .map((p) => p.post);
}
