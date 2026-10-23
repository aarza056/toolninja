---
title: "The keyv / cacheable npm Supply Chain Attack: Am I Affected, and How Do I Fix It?"
description: "On August 4, 2026, a compromised maintainer account turned keyv, flat-cache, file-entry-cache and a dozen related packages — over 500 million weekly downloads combined — into a credential-stealing worm. Here's exactly how to check if you pulled a bad version and what to do next."
date: "2026-08-11"
author: "ToolNinja"
coverEmoji: "🪱"
tags: ["keyv npm attack", "cacheable npm supply chain", "flat-cache compromised", "file-entry-cache malware", "npm worm august 2026", "npm supply chain attack", "postinstall script malware", "npm credential stealer", "shai-hulud npm", "chaindrop worm", "devops", "security"]
relatedTools: ["hash-generator"]
faqs:
  - q: "How do I know for sure if I pulled a compromised version?"
    a: "Run npm ls keyv flat-cache file-entry-cache cacheable-request cacheable cache-manager @cacheable/utils @cacheable/memory @cacheable/node-cache --all in every project and check the resolved versions against the known-bad list. Also grep your lockfile (package-lock.json, yarn.lock, or pnpm-lock.yaml) directly, since a version can still be pinned in the lockfile even after npm pulls the bad release from the registry — and check recent CI run logs for install steps that pulled one of these packages between August 4 and when you patch."
  - q: "I ran npm install during the attack window but tests passed fine. Am I safe?"
    a: "No — this specifically does not mean you are safe. The payload runs during install, before your test suite ever executes, through a preinstall lifecycle script. A clean test run tells you your application logic works; it tells you nothing about whether a credential-stealing script ran on that machine during the install step. If the resolved version in your lockfile matches a known-bad one, treat the host as compromised regardless of what your tests showed."
  - q: "Is upgrading to the latest version enough to fix this?"
    a: "Not by itself, and it can make things worse if you grab another bad release in the process. The recommended path is pinning to a specific version confirmed clean by the maintainers or npm (not just 'latest'), rather than a blanket npm update — the whole point of this attack is that ordinary-looking patch releases were the malicious ones. Fixing the dependency is also only step one; if any exposed host ran the payload, every credential reachable from that host needs rotating and the host itself should be rebuilt, not just cleaned."
  - q: "Why do preinstall/postinstall scripts keep being the attack vector for these worms?"
    a: "Because npm runs them automatically and silently the moment a package is installed — before your code runs, before a human reviews anything, and by default with the full privileges of whoever ran npm install, including CI service accounts with cloud and registry credentials. That combination — automatic execution, full privileges, zero review — is exactly why lifecycle scripts have become the recurring attack vector for self-propagating npm worms, and why npm's own roadmap is moving toward disabling automatic script execution by default."
---

## What Happened

On August 4, 2026, an attacker compromised the GitHub account of the maintainer behind **keyv**, a key-value storage library with roughly 127–150 million weekly npm downloads. That same maintainer also owns **cache-manager**, **cacheable-request**, **@cacheable/utils**, **flat-cache**, **cacheable**, **file-entry-cache**, **@cacheable/memory**, and **@cacheable/node-cache** — a family of caching utilities that together account for well over 500 million weekly downloads.

The attacker used that access to publish malicious versions across the family, and the malware then used any npm publish tokens it could steal to propagate itself into other, unrelated packages — worm behavior, not a single poisoned release. Reported numbers vary by source (some put it at 400+ packages, others over 2,200 versions across more than a dozen organizations), and no single source has published a complete, independently verified list. What's consistent across every report: this is large, it started August 4, and it is still being actively tracked as of this writing.

---

## How It Actually Works

The malicious versions add a **preinstall** lifecycle script — meaning it runs automatically the moment `npm install` starts, before your application code, your test suite, or any conventional security scan gets a chance to look at anything.

```
package.json
{
  "scripts": {
    "preinstall": "node setup.mjs"
  }
}
```

That script launches a heavily obfuscated payload (commonly named `setup.mjs`, with a second-stage file seen as `Math_Symbol.js` and later `math_init.js`), which downloads a Bun runtime and executes further obfuscated code. From there it:

- Harvests **npm, GitHub, AWS, and HashiCorp Vault credentials** reachable from the machine
- Exfiltrates them to an external domain (`npm-cache[.]com` has been reported) and to attacker-controlled GitHub repositories
- Uses any stolen **npm publish tokens** to push malicious versions to other packages that account controls — this is the self-propagation step that makes it a worm rather than a one-off compromise
- Looks up its command-and-control domain via an **Ethereum smart contract**, so the operator can rotate infrastructure without changing the payload itself

One detail worth knowing if you use AI coding assistants: multiple researchers reported the payload also planting hooks targeting Claude Code and VS Code, specifically to persist inside developer tooling rather than just the CI pipeline.

---

## Confirmed Bad Versions (Check Your Lockfile Against These)

```
keyv                → 6.0.0
flat-cache          → 6.1.24
file-entry-cache    → 11.1.6
cache-manager, cacheable-request, @cacheable/utils → confirmed malicious, specific
                       version numbers vary by report — verify against your lockfile
```

**cacheable, file-entry-cache, @cacheable/memory, and @cacheable/node-cache** are confirmed as affected by the same maintainer compromise, but at the time of writing not every source has published a specific bad version number for each — treat any version of these published after August 4, 2026 as suspect until you've confirmed otherwise.

npm has since restored **flat-cache@6.1.23** as a confirmed-clean version to roll back to. As of the most recent reporting, no confirmed-clean version had yet been published for file-entry-cache — check current advisories before picking a version to pin to.

---

## Check If You're Affected

Run this in every project (and every CI config) that might touch these packages:

```bash
npm ls keyv flat-cache file-entry-cache cacheable-request cacheable cache-manager @cacheable/utils @cacheable/memory @cacheable/node-cache --all
```

This alone isn't enough — a bad version can still be sitting in your lockfile even if `npm ls` resolves something else locally right now. Also:

```bash
# Search your lockfile directly for the known-bad versions
grep -E "keyv\"?:\s*\"?6\.0\.0|flat-cache\"?:\s*\"?6\.1\.24|file-entry-cache\"?:\s*\"?11\.1\.6" package-lock.json
```

And check CI run logs for any install step between August 4, 2026 and whenever you patch, since a CI runner that pulled a bad version already executed the payload — a clean lockfile *today* doesn't undo that.

**Indicators a version has been tampered with**, even before checking version numbers against a list:

- A `preinstall` (or unusual `postinstall`) script that wasn't there in a previous release
- Files named `setup.mjs`, `Math_Symbol.js`, or `math_init.js` in the package
- A "patch" release with no corresponding commit, pull request, or tag in the package's public source repository — several of the malicious releases were published straight to the registry with no matching source history at all

---

## Fixing It

1. **Pin, don't blanket-update.** Pin `keyv` to `5.6.0` (or `6.0.0-rc.1` if you specifically need the v6 API) rather than running `npm update`, which could just as easily pull a different bad release published during the same window. Pin `flat-cache` to `6.1.23`. Check current advisories for the rest before choosing a version.
2. **Rebuild, don't just clean, any host that ran a bad install.** If a machine's lockfile resolved to a known-bad version at any point since August 4, treat that host as compromised — reinstalling clean packages afterward does not undo whatever the preinstall script already did.
3. **Rotate every credential reachable from an exposed host** — npm tokens, GitHub tokens/SSH keys, AWS keys, Vault tokens — not just the ones you assume were touched. The malware is a generic credential harvester; assume it grabbed everything it could reach.
4. **Audit for unexpected npm publish activity** on any package your team maintains, since a stolen publish token from your org could be used to push malicious versions of *your own* packages next.

---

## Why This Keeps Happening

This is not an isolated incident — it's the latest in a pattern of self-propagating npm worms that abuse lifecycle scripts specifically because they run automatically, with full user privileges, before any review happens. The direct response from the ecosystem: npm's roadmap includes disabling automatic execution of preinstall/postinstall scripts by default in an upcoming major version, which would close off this exact attack vector for packages that don't explicitly need install-time scripts.

Until that ships, `--ignore-scripts` on `npm install` is the closest thing to a blanket mitigation available today — at the cost of breaking any package that legitimately relies on a build step at install time, so it's not a universal drop-in fix, but it's worth evaluating for CI pipelines where you control the dependency tree tightly.

---

## Quick Reference

| Question | Answer |
|---|---|
| When did this start | August 4, 2026 |
| Root cause | Compromised GitHub account of the keyv/cacheable maintainer |
| Attack mechanism | Malicious `preinstall` script → credential theft → self-propagation via stolen npm tokens |
| Confirmed bad versions | `keyv@6.0.0`, `flat-cache@6.1.24`, `file-entry-cache@11.1.6`, plus others — check current advisories |
| Confirmed clean rollback | `flat-cache@6.1.23`; `keyv@5.6.0` or `6.0.0-rc.1` |
| What to do | Pin to clean versions, rebuild any exposed host, rotate every reachable credential |

---

Sources:
- [Keyv and Cacheable npm Packages Compromised in Active Supply-Chain Attack — Cloudsmith](https://cloudsmith.com/blog/keyv-and-cacheable-npm-packages-compromised-in-active-supply-chain-attack)
- [The keyv and cacheable npm Supply Chain Attack: Inside the Mini Shai-Hulud Campaign — Chainguard](https://www.chainguard.dev/unchained/the-keyv-and-cacheable-npm-supply-chain-attack-inside-the-mini-shai-hulud-campaign)
- [Keyv-Linked npm Worm Poisons Hundreds of Packages, Plants Claude Code and VS Code Hooks — The Hacker News](https://thehackernews.com/2026/08/keyv-linked-npm-worm-poisons-hundreds.html)
- [Inside the keyv npm Supply Chain Compromise — Snyk](https://snyk.io/blog/inside-keyv-npm-compromise-preinstall-malware-trusted-provenance-ide-hooks/)
- [ChainDrop supply chain compromise: Anatomy of a self-propagating worm — Microsoft Security Blog](https://www.microsoft.com/en-us/security/blog/2026/08/04/chaindrop-supply-chain-compromise-anatomy-self-propagating-worm/)
- [NPM Malware Compromises keyv and cacheable with 500M+ Weekly Downloads — Endor Labs](https://www.endorlabs.com/learn/npm-malware-compromises-keyv-and-cacheable-with-500m-weekly-downloads-and-spreads-to-hundreds-of-packages)
- [keyv and cacheable npm compromise: 400+ packages — SafeDep](https://safedep.io/keyv-npm-supply-chain-compromise/)
- [RIP npm Postinstall Scripts: npm v12 Kills Auto Script Execution by Default — Semgrep](https://semgrep.dev/blog/2026/rip-npm-postinstall-scripts-npm-v12-default-change/)
