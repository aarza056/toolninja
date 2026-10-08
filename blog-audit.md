# Blog audit

Generated on 2026-10-08 from the 69 posts in `content/blog`. Nothing was deleted or noindexed; this is a report. Word counts exclude code blocks. "Original examples" means the post has its own code or worked examples (code-block count shown). "Links to tools" counts distinct ToolNinja tools linked from the body after this PR's linking pass. Recommendations are judgment calls for you to review.

## Summary

- Recommendations: **38 keep**, **28 rewrite**, **3 merge**, **0 noindex**.
- **21 posts are dated 2026-05-22.** All of them use the same template ("The Exact Error" code block, "> Quick summary", "Step-by-Step Diagnosis", "Quick Reference"), are 279-572 words, cite no sources, and have descriptions that all end with the same "Learn …" teaser sentence. Six more posts share 2026-08-04. These read as batch-published; spreading future publishing and giving each post real, sourced detail matters more than the dates themselves.
- **Dates:** the keyv post (dated Aug 11) describes an incident from Aug 4, which is consistent for a follow-up write-up, but its "until npm v12 ships" wording may now be outdated.
- **Unverified figures:** the CSP post's "87%" title, the robots.txt post's "40% of bandwidth" and per-bot percentages, the favicon post's "~95% of browsers" and the SVG post's "40-80%" rely on secondary sources or none. Each needs a primary source or softer wording.
- **Fixed in this PR across all posts:** every code block now has a language tag, every post shows its author and a "last updated" date, each post links in its body to every tool it is mapped to, first mentions of RFCs and key standards link to the spec, and the CORS post was corrected and expanded.
- **Slug issue:** `jwt-classcasstexception-claimjwtexception` misspells ClassCastException and doesn't match the content. Renaming needs a 301 redirect.

## Top 10 recommended rewrites

Ordered by likely search demand and how far the post is from what a searcher needs.

1. **[Cannot read properties of undefined (reading 'map') — React/JS Fix Guide](content/blog/cannot-read-properties-undefined-reading-map.md)** (433 words): May 22 template post for a very high-volume error. Add React-specific examples (loading state, optional chaining) and sources.
2. **[HTTP 401 vs 403: Unauthorized vs Forbidden Explained](content/blog/http-401-unauthorized-vs-403-forbidden.md)** (413 words): May 22 template post for a high-demand comparison. Add RFC 9110 links and real framework examples.
3. **[JSON Formatting and Validation: A Developer's Guide](content/blog/json-formatting-guide.md)** (372 words): Thin (~370 words) for the site's biggest topic. Expand with examples and an RFC 8259 link.
4. **[SignatureVerificationException: Signature verification failed — JWT Fix Guide](content/blog/jwt-signature-verification-failed.md)** (572 words): May 22 template post for a high-demand error. Add worked examples per library and sources.
5. **[Base64 Encoding Explained: What It Is, When to Use It](content/blog/base64-encoding-explained.md)** (428 words): Thin (~430 words) for a high-demand topic. Add Base64URL/padding examples, a Unicode example, and an RFC 4648 link; cross-link the btoa() post.
6. **[Unix Timestamps and Time Zones: A Developer's Reference](content/blog/timestamp-unix-time-guide.md)** (412 words): Thin (~410 words) for a high-demand topic. Add time zone/DST worked examples and the Year 2038 issue.
7. **[MySQL Error 1064: You Have an Error in Your SQL Syntax Fix](content/blog/mysql-error-1064-sql-syntax.md)** (316 words): May 22 template post (~320 words) for a high-volume error. Add more real 1064 cases and MySQL docs links.
8. **[Content-Security-Policy: The 'unsafe-inline' Mistake 87% of Sites Make](content/blog/content-security-policy-unsafe-inline-mistakes.md)** (805 words): Title leads with "87% of Sites", attributed to "one analysis" with no inline link. Verify and link the primary study or drop the number from the title.
9. **[robots.txt for AI Crawlers in 2026: What to Actually Block](content/blog/robots-txt-ai-crawlers-2026-guide.md)** (775 words): "Up to 40% of bandwidth" and the 5.5%/5.1%/4.9% figures come from secondary blogs. Verify against primary data or qualify them.
10. **[TypeError: Cannot convert undefined or null to object — JS Fix Guide](content/blog/typeerror-cannot-convert-undefined-null-to-object.md)** (342 words): May 22 template post (~340 words). Add real-world triggers and MDN links.

## Merges

- `docker-container-name-already-in-use`: May 22 template post that overlaps the Docker errors hub. Merge into docker-port-already-allocated-error as a section and 301 the URL.
- `git-pathspec-did-not-match-any-files`: May 22 template post. Merge into common-git-errors-explained as a section and 301 the URL.
- `invalid-octal-value-chmod-permissions`: May 22 template post overlapping chmod-explained. Merge as a section and 301.

## All posts

| Post | Date | Words | Original examples (code blocks) | Tool links | Sources | Title matches intent | Recommendation | Notes |
|---|---|---:|---|---:|---|---|---|---|
| `chmod-explained` | 2026-05-01 | 632 | yes (12) | 1 | none | yes | **keep** | Good reference. Natural home for the invalid-octal post (see merge). |
| `cidr-subnetting-guide` | 2026-05-02 | 706 | yes (6) | 1 | none | yes | **keep** | Good. Some overlap with the AWS VPC guide; keep both, cross-linked. |
| `jwt-tokens-explained` | 2026-05-03 | 695 | yes (9) | 2 | some | yes | **keep** | Good. |
| `regex-guide-for-developers` | 2026-05-04 | 398 | yes (26) | 1 | some | yes | **keep** | Pattern reference with many examples. |
| `base64-encoding-explained` | 2026-05-05 | 428 | yes (12) | 3 | none | yes | **rewrite** | Thin (~430 words) for a high-demand topic. Add Base64URL/padding examples, a Unicode example, and an RFC 4648 link; cross-link the btoa() post. |
| `uuid-guide` | 2026-05-06 | 570 | yes (14) | 2 | some | yes | **keep** | Mentions RFC 4122, which RFC 9562 replaced; update. |
| `git-commands-reference` | 2026-05-07 | 191 | yes (15) | 2 | none | yes | **rewrite** | Only ~190 words of prose around 15 code blocks. Add when/why for each command or fold it into the Git Command Generator page. |
| `json-formatting-guide` | 2026-05-08 | 372 | yes (12) | 3 | none | yes | **rewrite** | Thin (~370 words) for the site's biggest topic. Expand with examples and an RFC 8259 link. |
| `password-security-guide` | 2026-05-09 | 715 | yes (5) | 2 | none | yes | **keep** | Link NIST SP 800-63B where its guidance is cited. |
| `markdown-guide-for-developers` | 2026-05-10 | 376 | yes (25) | 3 | yes | yes | **keep** | Reference format with many examples. |
| `timestamp-unix-time-guide` | 2026-05-11 | 412 | yes (10) | 1 | none | yes | **rewrite** | Thin (~410 words) for a high-demand topic. Add time zone/DST worked examples and the Year 2038 issue. |
| `xpath-guide-for-developers` | 2026-05-18 | 813 | yes (18) | 2 | some | yes | **keep** | Good reference. |
| `aws-vpc-cidr-blocks-guide` | 2026-05-20 | 1096 | yes (5) | 1 | some | yes | **keep** | Good depth. Add a link to AWS's VPC CIDR documentation for the reserved-IP and size limits. |
| `bcrypt-hash-verification-error-salt-password` | 2026-05-22 | 314 | yes (9) | 2 | none | yes | **rewrite** | May 22 template post (~310 words). Add real library versions, a reproducible failing example, and sources. |
| `cannot-read-properties-undefined-reading-map` | 2026-05-22 | 433 | yes (9) | 2 | none | yes | **rewrite** | May 22 template post for a very high-volume error. Add React-specific examples (loading state, optional chaining) and sources. |
| `cidr-block-overlaps-existing-subnet-vpc` | 2026-05-22 | 384 | yes (8) | 1 | some | yes | **rewrite** | May 22 template post (~380 words). Add a worked overlap calculation and AWS doc links; cross-link the VPC guide. |
| `cron-expression-out-of-range-invalid-interval` | 2026-05-22 | 281 | yes (7) | 1 | none | yes | **rewrite** | May 22 template post (~280 words). Add cron flavors (Vixie, Quartz, AWS, Kubernetes) with real error messages and links. |
| `css-invalid-property-linear-gradient` | 2026-05-22 | 279 | yes (9) | 1 | none | yes | **rewrite** | May 22 template post (~280 words). Add before/after DevTools screenshots or examples and a spec/MDN link. |
| `docker-container-name-already-in-use` | 2026-05-22 | 405 | yes (12) | 1 | none | yes | **merge** | May 22 template post that overlaps the Docker errors hub. Merge into docker-port-already-allocated-error as a section and 301 the URL. |
| `domexception-btoa-characters-outside-latin1` | 2026-05-22 | 280 | yes (8) | 2 | none | yes | **rewrite** | May 22 template post (~280 words). Add the TextEncoder approach and Node's Buffer, plus MDN links. |
| `git-pathspec-did-not-match-any-files` | 2026-05-22 | 375 | yes (9) | 1 | none | yes | **merge** | May 22 template post. Merge into common-git-errors-explained as a section and 301 the URL. |
| `http-401-unauthorized-vs-403-forbidden` | 2026-05-22 | 413 | yes (7) | 2 | none | yes | **rewrite** | May 22 template post for a high-demand comparison. Add RFC 9110 links and real framework examples. |
| `http-415-unsupported-media-type` | 2026-05-22 | 329 | yes (9) | 2 | none | yes | **rewrite** | May 22 template post (~330 words). Add fetch/axios/curl examples and an RFC 9110 link. |
| `invalid-octal-value-chmod-permissions` | 2026-05-22 | 332 | yes (9) | 2 | none | yes | **merge** | May 22 template post overlapping chmod-explained. Merge as a section and 301. |
| `invalid-regular-expression-nothing-to-repeat` | 2026-05-22 | 280 | yes (9) | 1 | none | yes | **rewrite** | May 22 template post (~280 words). Add engine differences (JS, Python, PCRE) and links. |
| `invalid-xml-xpath-query-failed-expression-expected` | 2026-05-22 | 303 | yes (11) | 2 | none | yes | **rewrite** | May 22 template post (~300 words). Cross-link the XPath guide and add per-language error messages. |
| `jwt-classcasstexception-claimjwtexception` | 2026-05-22 | 362 | yes (9) | 2 | some | partial | **rewrite** | May 22 template post. The slug misspells ClassCastException and doesn't match the content (claim validation). Fix content and add a 301 if you rename. |
| `jwt-invalid-key-size-too-short` | 2026-05-22 | 304 | yes (9) | 2 | some | yes | **rewrite** | May 22 template post (~300 words). Add RFC 7518 minimum key sizes inline. |
| `jwt-signature-verification-failed` | 2026-05-22 | 572 | yes (9) | 2 | none | yes | **rewrite** | May 22 template post for a high-demand error. Add worked examples per library and sources. |
| `mysql-error-1064-sql-syntax` | 2026-05-22 | 316 | yes (9) | 1 | none | yes | **rewrite** | May 22 template post (~320 words) for a high-volume error. Add more real 1064 cases and MySQL docs links. |
| `sql-incorrect-syntax-near-keyword` | 2026-05-22 | 335 | yes (7) | 1 | none | yes | **rewrite** | May 22 template post. Overlaps MySQL 1064; refocus on SQL Server/PostgreSQL phrasing with vendor docs. |
| `standard-init-linux-exec-user-process-no-such-file` | 2026-05-22 | 397 | yes (10) | 2 | none | yes | **rewrite** | May 22 template post (~400 words). Add the shebang/ARM architecture causes and links. |
| `typeerror-cannot-convert-undefined-null-to-object` | 2026-05-22 | 342 | yes (10) | 2 | none | yes | **rewrite** | May 22 template post (~340 words). Add real-world triggers and MDN links. |
| `uri-malformed-error-javascript-url-parsing` | 2026-05-22 | 292 | yes (9) | 2 | none | yes | **rewrite** | May 22 template post (~290 words). Add safe-decode helper and RFC 3986 link. |
| `curl-to-python-javascript-code` | 2026-05-24 | 530 | yes (6) | 2 | none | yes | **keep** | Useful examples. Fine as is. |
| `css-grid-common-mistakes` | 2026-07-13 | 1122 | yes (14) | 4 | none | yes | **keep** | Good, with broken/fixed examples. Add MDN links. |
| `free-postman-alternative-browser` | 2026-07-14 | 701 | no (0) | 2 | none | yes | **keep** | Honest comparison. Comparison table fixed in this PR (it claimed nothing leaves the browser). |
| `qr-code-generator-guide` | 2026-07-15 | 742 | yes (3) | 2 | some | yes | **keep** | Good. |
| `duckduckgo-vs-google-seo` | 2026-07-16 | 817 | no (0) | 3 | yes | partial | **rewrite** | Claims about DuckDuckGo's sources and ranking need inline links to DuckDuckGo's own documentation. No code or examples. |
| `typescript-type-errors-common` | 2026-07-17 | 945 | yes (21) | 1 | none | yes | **keep** | Good, many examples. Add TypeScript handbook links. |
| `european-accessibility-act-color-contrast` | 2026-07-28 | 762 | no (0) | 2 | yes | yes | **keep** | Sourced. Re-verify the "first full year of enforcement" wording against official sources. |
| `how-to-compare-json-api-responses` | 2026-07-29 | 809 | no (0) | 2 | yes | yes | **keep** | Good. Add one before/after JSON example. |
| `favicon-guide-2026` | 2026-07-30 | 830 | no (0) | 2 | yes | yes | **rewrite** | A setup guide with no code: add the actual <link> tags and manifest snippet. Source the "~95% of browsers" figure (e.g. caniuse). |
| `mock-data-api-testing-guide` | 2026-07-31 | 786 | no (0) | 3 | yes | yes | **keep** | Good. Add one example schema. |
| `csv-vs-json-when-to-use-which` | 2026-08-01 | 841 | no (0) | 2 | yes | yes | **rewrite** | No code at all in a post that promises conversion pitfalls. Add sample CSV/JSON and a nested-data example. |
| `cors-error-no-access-control-allow-origin` | 2026-08-02 | 1571 | yes (9) | 3 | yes | yes | **keep** | Rewritten in this PR: preflight correction, new pitfalls, DevTools section, nginx example, sources. |
| `json-parse-unexpected-character-line-1-column-1` | 2026-08-03 | 748 | yes (8) | 1 | yes | yes | **keep** | Good, sourced. |
| `active-directory-replication-lockout-group-policy-errors` | 2026-08-04 | 892 | yes (10) | 0 | yes | yes | **keep** | Solid and sourced, but sysadmin content with no matching ToolNinja tool. Keep unless you decide this topic is off-strategy. |
| `dns-error-codes-nxdomain-servfail-refused-explained` | 2026-08-04 | 867 | yes (5) | 1 | yes | yes | **keep** | Good, sourced, real dig output. |
| `docker-port-already-allocated-error` | 2026-08-04 | 699 | yes (8) | 1 | yes | yes | **keep** | Works as the Docker errors hub; absorb the container-name post. |
| `linux-no-space-left-permission-denied-errors` | 2026-08-04 | 919 | yes (10) | 1 | yes | yes | **keep** | Good, sourced. |
| `nginx-502-504-403-errors-explained` | 2026-08-04 | 932 | yes (10) | 3 | yes | yes | **keep** | Strong, with real log lines. |
| `windows-event-id-errors-explained` | 2026-08-04 | 1043 | yes (5) | 0 | yes | yes | **keep** | Sourced, but sysadmin content with no matching tool, like the AD post. |
| `common-git-errors-explained` | 2026-08-05 | 877 | yes (12) | 2 | yes | yes | **keep** | Good hub. Absorb the pathspec post as a section. |
| `yaml-map-keys-not-allowed-bad-indentation` | 2026-08-06 | 715 | yes (6) | 2 | yes | yes | **keep** | Good, sourced. |
| `hmac-webhook-signature-verification-guide` | 2026-08-07 | 782 | yes (6) | 1 | yes | yes | **keep** | Strong, with code and sources. |
| `json-ld-structured-data-seo-guide` | 2026-08-08 | 658 | yes (4) | 2 | yes | partial | **rewrite** | Says pages without JSON-LD "are being left out" of AI answers with no evidence. Source it or soften it. |
| `content-security-policy-unsafe-inline-mistakes` | 2026-08-09 | 805 | yes (6) | 3 | yes | partial | **rewrite** | Title leads with "87% of Sites", attributed to "one analysis" with no inline link. Verify and link the primary study or drop the number from the title. |
| `robots-txt-ai-crawlers-2026-guide` | 2026-08-10 | 775 | yes (2) | 2 | yes | yes | **rewrite** | "Up to 40% of bandwidth" and the 5.5%/5.1%/4.9% figures come from secondary blogs. Verify against primary data or qualify them. |
| `keyv-cacheable-npm-supply-chain-attack-explained` | 2026-08-11 | 1197 | yes (4) | 2 | yes | yes | **keep** | Dated Aug 11 about an Aug 4 incident, which is consistent for a follow-up write-up. Re-check the "until npm v12 ships" wording (npm 12 is now released) and the download figures, which differ across sources. |
| `svg-optimization-guide-reduce-file-size` | 2026-08-11 | 691 | yes (4) | 2 | yes | partial | **keep** | Title "6× Bigger" is attention-seeking; the 40-80% range comes from vendor blogs. Consider a plainer title. |
| `ssh-permission-denied-publickey-explained` | 2026-09-01 | 869 | yes (12) | 2 | yes | yes | **keep** | Strong, with real debug output. |
| `uuid-v7-vs-v4-vs-ulid-database-primary-keys` | 2026-09-15 | 996 | yes (1) | 3 | some | yes | **keep** | Strong. |
| `typescript-7-migration-guide-breaking-changes` | 2026-09-16 | 926 | no (0) | 2 | yes | yes | **keep** | Release-sensitive: re-verify against the official TypeScript release notes. No code: add tsconfig before/after. |
| `hardcoded-secrets-in-your-codebase` | 2026-10-02 | 890 | no (0) | 3 | yes | yes | **keep** | Sourced. Would benefit from a pre-commit hook example. |
| `how-to-test-passkeys-webauthn-without-a-backend` | 2026-10-03 | 714 | yes (4) | 2 | yes | yes | **keep** | Strong, sourced. |
| `how-to-estimate-llm-api-costs-before-the-bill` | 2026-10-04 | 836 | yes (2) | 1 | yes | yes | **keep** | Accuracy and price-ratio claims corrected in this PR. Prices need re-verifying with the tool's table. |
| `how-to-set-up-2fa-the-right-way` | 2026-10-05 | 765 | yes (4) | 4 | yes | yes | **keep** | Strong, sourced. |
| `how-to-generate-and-apply-json-patch-rfc-6902` | 2026-10-07 | 715 | yes (5) | 2 | yes | yes | **keep** | Strong, with real examples. |
