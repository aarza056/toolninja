// Identifies an API key, token or credential from its format alone: which service issued it, whether
// it's a secret or meant to be public, live or test, and what can be read out of it without asking
// the service (AWS account ID, GitHub/npm checksum, Discord bot ID, JWT claims). Runs in the browser;
// nothing here makes a network request.

export type KeyKind = "secret" | "public" | "identifier" | "token";
export type Confidence = "certain" | "likely" | "possible";

export interface KeyFact {
  label: string;
  value: string;
  /** good: confirms the format; bad: something is off */
  tone?: "good" | "bad";
}

export interface KeyMatch {
  service: string;
  name: string;
  kind: KeyKind;
  confidence: Confidence;
  environment?: "live" | "test" | "sandbox";
  facts: KeyFact[];
  /** What someone holding it can do */
  risk: string;
  /** Where to revoke or rotate it */
  revoke: string;
  revokeUrl?: string;
}

interface Format {
  service: string;
  name: string;
  kind: KeyKind;
  re: RegExp;
  confidence?: Confidence;
  risk: string;
  revoke: string;
  revokeUrl?: string;
  env?: (key: string) => KeyMatch["environment"];
  facts?: (key: string, m: RegExpExecArray) => KeyFact[];
}

const B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const CRC_TABLE = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

export function crc32(s: string): number {
  let c = 0xffffffff;
  for (let i = 0; i < s.length; i++) c = CRC_TABLE[(c ^ s.charCodeAt(i)) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function base62(n: number, width: number): string {
  let out = "";
  let v = n;
  while (v > 0) {
    out = B62[v % 62] + out;
    v = Math.floor(v / 62);
  }
  while (out.length < width) out = `0${out}`;
  return out;
}

/** GitHub's and npm's token checksum: the last 6 characters are base62(CRC32 of the 30 random characters) */
export function checksumFacts(body: string): KeyFact[] {
  if (body.length !== 36) return [];
  const ok = base62(crc32(body.slice(0, 30)), 6) === body.slice(30);
  return [
    ok
      ? { label: "Checksum", value: "Valid. The last 6 characters match, so this is a correctly formed token (not proof that it still works).", tone: "good" }
      : { label: "Checksum", value: "Doesn't match. The token is mistyped, cut short or made up.", tone: "bad" },
  ];
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * The AWS account ID encoded in an access key ID (keys created since about 2019): base32-decode the
 * part after the 4-letter prefix and take bits 7 to 46 of the first 6 bytes.
 */
export function awsAccountFromKeyId(keyId: string): string | null {
  const body = keyId.slice(4);
  if (!/^[A-Z2-7]{16}$/.test(body)) return null;
  // The first 10 base32 characters cover the first 6 bytes (50 bits ≥ 48)
  let bits = "";
  for (const ch of body.slice(0, 10)) bits += B32.indexOf(ch).toString(2).padStart(5, "0");
  const z = parseInt(bits.slice(0, 48), 2);
  const account = Math.floor(z / 128) % 2 ** 40;
  return String(account).padStart(12, "0");
}

function b64urlDecode(s: string): string | null {
  try {
    const norm = s.replace(/-/g, "+").replace(/_/g, "/");
    const padded = norm + "=".repeat((4 - (norm.length % 4)) % 4);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function fmtDate(ms: number): string {
  return new Date(ms).toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

/** Discord snowflake → creation time (ms). Exact to the millisecond for any id below 2^53; close enough above */
export function snowflakeTime(id: string): number {
  return Math.floor(Number(id) / 4194304) + 1420070400000;
}

function jwtFacts(token: string): { facts: KeyFact[]; payload: Record<string, unknown> | null; header: Record<string, unknown> | null } {
  const [h, p] = token.split(".");
  const facts: KeyFact[] = [];
  let header: Record<string, unknown> | null = null;
  let payload: Record<string, unknown> | null = null;
  try {
    header = JSON.parse(b64urlDecode(h) ?? "null");
    payload = JSON.parse(b64urlDecode(p) ?? "null");
  } catch {}
  if (header?.alg) facts.push({ label: "Algorithm", value: String(header.alg) });
  if (payload) {
    for (const k of ["iss", "sub", "aud", "role", "ref", "azp", "scope"]) {
      if (payload[k] !== undefined) facts.push({ label: k, value: typeof payload[k] === "string" ? (payload[k] as string) : JSON.stringify(payload[k]) });
    }
    if (typeof payload.iat === "number") facts.push({ label: "Issued", value: fmtDate(payload.iat * 1000) });
    if (typeof payload.exp === "number") {
      const expired = payload.exp * 1000 < Date.now();
      facts.push({ label: "Expires", value: `${fmtDate(payload.exp * 1000)}${expired ? " (expired)" : ""}`, tone: expired ? "bad" : undefined });
    } else facts.push({ label: "Expires", value: "Never: there's no exp claim, so it works until the signing key changes." });
  }
  return { facts, payload, header };
}

const live = (k: string): KeyMatch["environment"] => (/_live_|live/.test(k) ? "live" : /_test_|test/.test(k) ? "test" : undefined);

const FORMATS: Format[] = [
  // ── Cloud providers ────────────────────────────────────────────────────────
  {
    service: "AWS",
    name: "Access key ID (long-term, IAM user)",
    kind: "identifier",
    re: /^AKIA[A-Z2-7]{16}$/,
    risk: "Half of a credential pair. Together with its 40-character secret access key it can do whatever the IAM user is allowed to.",
    revoke: "IAM console → Users → Security credentials → deactivate, then delete the key. Check CloudTrail for its recent use.",
    revokeUrl: "https://console.aws.amazon.com/iam/home#/users",
    facts: (k) => {
      const acct = awsAccountFromKeyId(k);
      return acct ? [{ label: "AWS account (decoded)", value: `${acct}. Read from the key itself; keys created before 2019 don't carry it, and give a meaningless number.` }] : [];
    },
  },
  {
    service: "AWS",
    name: "Temporary access key ID (STS session)",
    kind: "identifier",
    re: /^ASIA[A-Z2-7]{16}$/,
    risk: "Part of short-lived STS credentials (with a secret key and session token). They expire on their own, usually within 1 to 12 hours.",
    revoke: "Revoke active sessions for the role (IAM → Roles → Revoke sessions) if it leaked before expiring.",
    revokeUrl: "https://console.aws.amazon.com/iam/home#/roles",
    facts: (k) => {
      const acct = awsAccountFromKeyId(k);
      return acct ? [{ label: "AWS account (decoded)", value: acct }] : [];
    },
  },
  {
    service: "AWS",
    name: "IAM unique ID (user, role, group or instance profile)",
    kind: "identifier",
    re: /^(AIDA|AROA|AGPA|AIPA|ANPA|ANVA|APKA|ASCA|ACCA|ABIA)[A-Z2-7]{16}$/,
    risk: "An identifier, not a credential. It names an IAM entity but grants nothing.",
    revoke: "Nothing to revoke.",
    facts: (k) => {
      const types: Record<string, string> = { AIDA: "IAM user", AROA: "IAM role", AGPA: "IAM group", AIPA: "EC2 instance profile", ANPA: "Managed policy", ANVA: "Managed policy version", APKA: "Public key", ASCA: "Certificate", ACCA: "Context-specific credential", ABIA: "AWS STS service bearer token" };
      const acct = awsAccountFromKeyId(k);
      return [{ label: "Entity type", value: types[k.slice(0, 4)] }, ...(acct ? [{ label: "AWS account (decoded)", value: acct }] : [])];
    },
  },
  {
    service: "Google Cloud / Firebase",
    name: "Google API key",
    kind: "secret",
    re: /^AIza[0-9A-Za-z_-]{35}$/,
    risk: "Calls any Google API enabled for its project and bills that project. Firebase web keys are meant to be in client code, but only safe with API and referrer restrictions.",
    revoke: "Google Cloud console → APIs & Services → Credentials → restrict or regenerate the key.",
    revokeUrl: "https://console.cloud.google.com/apis/credentials",
  },
  {
    service: "Google",
    name: "OAuth client secret",
    kind: "secret",
    re: /^GOCSPX-[A-Za-z0-9_-]{28}$/,
    risk: "Lets someone impersonate your OAuth app when exchanging authorization codes for tokens.",
    revoke: "Google Cloud console → Credentials → the OAuth client → reset secret.",
    revokeUrl: "https://console.cloud.google.com/apis/credentials",
  },
  {
    service: "Google",
    name: "OAuth client ID",
    kind: "public",
    re: /^\d{6,}-[a-z0-9]{32}\.apps\.googleusercontent\.com$/,
    risk: "Public by design: it appears in every sign-in link.",
    revoke: "Nothing to revoke; keep the client secret private.",
    facts: (k) => [{ label: "Project number", value: k.split("-")[0] }],
  },
  {
    service: "Google",
    name: "OAuth access token",
    kind: "token",
    re: /^ya29\.[0-9A-Za-z_-]{20,}$/,
    risk: "Acts as the signed-in user or service account for the granted scopes, usually for one hour.",
    revoke: "It expires within an hour; revoke the grant at myaccount.google.com/permissions, or POST it to oauth2.googleapis.com/revoke.",
    revokeUrl: "https://myaccount.google.com/permissions",
  },
  {
    service: "Microsoft Azure",
    name: "Storage account connection string",
    kind: "secret",
    re: /^DefaultEndpointsProtocol=https?;AccountName=([a-z0-9]{3,24});AccountKey=[A-Za-z0-9+/=]{80,};?/,
    risk: "Full read, write and delete access to every blob, queue, table and file share in the storage account.",
    revoke: "Azure portal → the storage account → Access keys → rotate the key. Prefer SAS tokens or managed identities.",
    revokeUrl: "https://portal.azure.com/",
    facts: (_k, m) => [{ label: "Storage account", value: m[1] }],
  },
  {
    service: "DigitalOcean",
    name: "Personal access token",
    kind: "secret",
    re: /^do([por])_v1_[a-f0-9]{64}$/,
    risk: "Full API access to the team's droplets, databases, DNS and billing (or whatever scopes it was given).",
    revoke: "DigitalOcean control panel → API → Tokens → delete.",
    revokeUrl: "https://cloud.digitalocean.com/account/api/tokens",
    facts: (k) => [{ label: "Type", value: k[2] === "p" ? "Personal access token" : k[2] === "o" ? "OAuth access token" : "OAuth refresh token" }],
  },
  {
    service: "Heroku",
    name: "API key / OAuth token",
    kind: "secret",
    re: /^HRKU-[A-Za-z0-9_-]{20,}$/,
    risk: "Manages apps, config vars (often more secrets) and add-ons on the account.",
    revoke: "Heroku dashboard → Account settings → API key → regenerate, or `heroku authorizations:revoke`.",
    revokeUrl: "https://dashboard.heroku.com/account",
  },
  {
    service: "Databricks",
    name: "Personal access token",
    kind: "secret",
    re: /^dapi[a-f0-9]{32}(-\d)?$/,
    risk: "Acts as the user in the workspace: notebooks, jobs, clusters and data.",
    revoke: "Workspace → User settings → Developer → Access tokens → revoke.",
  },
  {
    service: "Terraform Cloud / HCP Terraform",
    name: "API token",
    kind: "secret",
    re: /^[A-Za-z0-9]{14}\.atlasv1\.[A-Za-z0-9_=-]{60,}$/,
    risk: "Runs plans and applies, and reads state files, which often hold other secrets.",
    revoke: "HCP Terraform → User settings → Tokens (or the organization/team token page) → delete.",
    revokeUrl: "https://app.terraform.io/app/settings/tokens",
  },
  {
    service: "Pulumi",
    name: "Access token",
    kind: "secret",
    re: /^pul-[a-f0-9]{40}$/,
    risk: "Reads stacks and their state, and runs updates.",
    revoke: "Pulumi Cloud → Settings → Access tokens → delete.",
    revokeUrl: "https://app.pulumi.com/account/tokens",
  },
  // ── Code hosting and packages ─────────────────────────────────────────────
  {
    service: "GitHub",
    name: "Token",
    kind: "secret",
    re: /^gh([pousr])_([A-Za-z0-9]{36,251})$/,
    risk: "Repository access as the user or app it belongs to, within its scopes: read code, push, open PRs, read secrets in Actions logs.",
    revoke: "GitHub → Settings → Developer settings → Personal access tokens → delete. Leaked tokens found in public repos are revoked by GitHub automatically.",
    revokeUrl: "https://github.com/settings/tokens",
    facts: (_k, m) => {
      const types: Record<string, string> = { p: "Personal access token (classic)", o: "OAuth access token", u: "GitHub App user access token", s: "GitHub App installation token (expires in 1 hour)", r: "GitHub App refresh token" };
      return [{ label: "Type", value: types[m[1]] }, ...checksumFacts(m[2])];
    },
  },
  {
    service: "GitHub",
    name: "Fine-grained personal access token",
    kind: "secret",
    re: /^github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}$/,
    risk: "Access to the repositories and permissions chosen when it was created.",
    revoke: "GitHub → Settings → Developer settings → Fine-grained tokens → delete.",
    revokeUrl: "https://github.com/settings/personal-access-tokens",
  },
  {
    service: "GitLab",
    name: "Token",
    kind: "secret",
    re: /^gl(pat|dt|rt|ptt|oas|cbt|imt|ft|soat|agent)-[A-Za-z0-9_.-]{20,}$/,
    risk: "API or repository access within the token's scopes.",
    revoke: "GitLab → User settings → Access tokens (or the project/group's settings) → revoke.",
    revokeUrl: "https://gitlab.com/-/user_settings/personal_access_tokens",
    facts: (_k, m) => {
      const types: Record<string, string> = { pat: "Personal, project or group access token", dt: "Deploy token", rt: "Runner authentication token", ptt: "Pipeline trigger token", oas: "OAuth application secret", cbt: "CI/CD job token", imt: "Incoming mail token", ft: "Feed token", soat: "SCIM OAuth token", agent: "Kubernetes agent token" };
      return [{ label: "Type", value: types[m[1]] }];
    },
  },
  {
    service: "npm",
    name: "Access token",
    kind: "secret",
    re: /^npm_([A-Za-z0-9]{36})$/,
    risk: "Publishes packages as you, the start of a supply-chain attack on everyone who installs them.",
    revoke: "npmjs.com → Access tokens → delete. Use granular, short-lived tokens or trusted publishing in CI.",
    revokeUrl: "https://www.npmjs.com/settings/~/tokens",
    facts: (_k, m) => checksumFacts(m[1]),
  },
  {
    service: "PyPI",
    name: "API token",
    kind: "secret",
    re: /^pypi-AgEIcHlwaS5vcmc[A-Za-z0-9_-]{50,}$/,
    risk: "Uploads new releases of your packages (all of them, or one project if scoped).",
    revoke: "pypi.org → Account settings → API tokens → remove. Prefer trusted publishing from CI.",
    revokeUrl: "https://pypi.org/manage/account/",
  },
  {
    service: "Docker Hub",
    name: "Personal access token",
    kind: "secret",
    re: /^dckr_pat_[A-Za-z0-9_-]{27}$/,
    risk: "Pushes and pulls images as you, so someone could replace your images.",
    revoke: "Docker Hub → Account settings → Personal access tokens → delete.",
    revokeUrl: "https://app.docker.com/settings/personal-access-tokens",
  },
  {
    service: "Hugging Face",
    name: "User access token",
    kind: "secret",
    re: /^hf_[A-Za-z]{34}$/,
    risk: "Reads private models and datasets, and with write scope pushes to them.",
    revoke: "huggingface.co → Settings → Access tokens → invalidate.",
    revokeUrl: "https://huggingface.co/settings/tokens",
  },
  // ── AI providers ─────────────────────────────────────────────────────────
  {
    service: "Anthropic",
    name: "API key",
    kind: "secret",
    re: /^sk-ant-api\d{2}-[A-Za-z0-9_-]{80,}$/,
    risk: "Calls the Claude API on your organization's account and bills it.",
    revoke: "Claude Console → Settings → API keys → disable or delete.",
    revokeUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    service: "Anthropic",
    name: "Admin API key",
    kind: "secret",
    re: /^sk-ant-admin\d{2}-[A-Za-z0-9_-]{80,}$/,
    risk: "Manages the organization itself: members, workspaces and API keys.",
    revoke: "Claude Console → Settings → Admin keys → delete.",
    revokeUrl: "https://console.anthropic.com/settings/admin-keys",
  },
  {
    service: "Anthropic",
    name: "OAuth token",
    kind: "token",
    re: /^sk-ant-o(at|rt)\d{2}-[A-Za-z0-9_-]{60,}$/,
    risk: "Acts as the signed-in Claude account, for example in Claude Code.",
    revoke: "Sign out of the app that created it, or revoke the session in your Claude account settings.",
  },
  {
    service: "OpenAI",
    name: "API key",
    kind: "secret",
    re: /^sk-(proj|svcacct|admin|None)-[A-Za-z0-9_-]{20,}$/,
    risk: "Calls the OpenAI API and bills the project; an admin key manages the organization.",
    revoke: "platform.openai.com → API keys → revoke.",
    revokeUrl: "https://platform.openai.com/api-keys",
    facts: (_k, m) => {
      const types: Record<string, string> = { proj: "Project API key", svcacct: "Service account key", admin: "Admin key", None: "Legacy user key" };
      return [{ label: "Type", value: types[m[1]] }];
    },
  },
  {
    service: "OpenAI",
    name: "Legacy API key",
    kind: "secret",
    re: /^sk-[A-Za-z0-9]{20}T3BlbkFJ[A-Za-z0-9]{20}$/,
    risk: "Calls the OpenAI API on the account and bills it.",
    revoke: "platform.openai.com → API keys → revoke.",
    revokeUrl: "https://platform.openai.com/api-keys",
    facts: () => [{ label: "Marker", value: "Contains T3BlbkFJ, which is base64 for “OpenAI”.", tone: "good" }],
  },
  {
    service: "Groq",
    name: "API key",
    kind: "secret",
    re: /^gsk_[A-Za-z0-9]{52}$/,
    risk: "Calls the Groq API on your account.",
    revoke: "console.groq.com → API keys → delete.",
    revokeUrl: "https://console.groq.com/keys",
  },
  {
    service: "xAI",
    name: "API key",
    kind: "secret",
    re: /^xai-[A-Za-z0-9]{70,90}$/,
    risk: "Calls the Grok API and bills your team.",
    revoke: "console.x.ai → API keys → delete.",
    revokeUrl: "https://console.x.ai/",
  },
  {
    service: "Perplexity",
    name: "API key",
    kind: "secret",
    re: /^pplx-[A-Za-z0-9]{40,56}$/,
    risk: "Calls the Perplexity API and bills your account.",
    revoke: "perplexity.ai → Settings → API → revoke.",
  },
  {
    service: "Replicate",
    name: "API token",
    kind: "secret",
    re: /^r8_[A-Za-z0-9]{37}$/,
    risk: "Runs models and bills your account.",
    revoke: "replicate.com → Account → API tokens → delete.",
    revokeUrl: "https://replicate.com/account/api-tokens",
  },
  // ── Payments ──────────────────────────────────────────────────────────────
  {
    service: "Stripe",
    name: "Secret key",
    kind: "secret",
    re: /^sk_(live|test)_[0-9A-Za-z]{24,}$/,
    risk: "Full API access: charges, refunds, payouts and customer data.",
    revoke: "Stripe Dashboard → Developers → API keys → roll the key.",
    revokeUrl: "https://dashboard.stripe.com/apikeys",
    env: live,
  },
  {
    service: "Stripe",
    name: "Restricted key",
    kind: "secret",
    re: /^rk_(live|test)_[0-9A-Za-z]{24,}$/,
    risk: "API access limited to the permissions chosen when it was created.",
    revoke: "Stripe Dashboard → Developers → API keys → roll or delete the restricted key.",
    revokeUrl: "https://dashboard.stripe.com/apikeys",
    env: live,
  },
  {
    service: "Stripe",
    name: "Publishable key",
    kind: "public",
    re: /^pk_(live|test)_[0-9A-Za-z]{24,}$/,
    risk: "Public by design: it goes in your web page and can only create tokens for card details.",
    revoke: "Nothing to do. It's meant to be visible.",
    env: live,
  },
  {
    service: "Stripe",
    name: "Webhook signing secret",
    kind: "secret",
    re: /^whsec_[A-Za-z0-9+/=]{24,}$/,
    risk: "Lets someone forge webhook events your server will trust, such as a fake “payment succeeded”.",
    revoke: "Stripe Dashboard → Developers → Webhooks → the endpoint → roll secret.",
    revokeUrl: "https://dashboard.stripe.com/webhooks",
  },
  {
    service: "Paystack",
    name: "Key",
    kind: "secret",
    re: /^(sk|pk)_(live|test)_[a-f0-9]{40}$/,
    confidence: "likely",
    risk: "A secret key (sk_) gives full API access to transactions and transfers; a public key (pk_) is meant for your web page.",
    revoke: "Paystack dashboard → Settings → API keys & webhooks → generate new keys.",
    revokeUrl: "https://dashboard.paystack.com/#/settings/developers",
    env: live,
  },
  {
    service: "Razorpay",
    name: "Key ID",
    kind: "identifier",
    re: /^rzp_(live|test)_[A-Za-z0-9]{14}$/,
    risk: "The public half of a key pair; the key secret is what must stay private.",
    revoke: "Razorpay dashboard → Account & settings → API keys → regenerate.",
    env: live,
  },
  {
    service: "Square",
    name: "Production access token",
    kind: "secret",
    re: /^EAAA[A-Za-z0-9_-]{60}$/,
    confidence: "likely",
    risk: "Takes payments, refunds and reads customer data for the seller account.",
    revoke: "Square Developer Console → the application → Credentials → replace the token.",
    revokeUrl: "https://developer.squareup.com/apps",
  },
  {
    service: "Square",
    name: "Access token or application secret",
    kind: "secret",
    re: /^sq0(atp|csp)-[0-9A-Za-z_-]{22,43}$/,
    risk: "An access token (sq0atp) acts on the seller account; an application secret (sq0csp) completes OAuth as your app.",
    revoke: "Square Developer Console → the application → Credentials → replace.",
    revokeUrl: "https://developer.squareup.com/apps",
  },
  {
    service: "PayPal Braintree",
    name: "Access token",
    kind: "secret",
    re: /^access_token\$(production|sandbox)\$[0-9a-z]{16}\$[0-9a-f]{32}$/,
    risk: "Processes payments through your Braintree merchant account.",
    revoke: "PayPal developer dashboard → the app → regenerate credentials.",
    env: (k) => (k.includes("$production$") ? "live" : "sandbox"),
  },
  {
    service: "Plaid",
    name: "Access token",
    kind: "secret",
    re: /^access-(sandbox|development|production)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    risk: "Reads one user's linked bank account data (with your client ID and secret).",
    revoke: "Call /item/remove for the item, or rotate your Plaid secret in the dashboard.",
    env: (k) => (k.includes("-production-") ? "live" : "sandbox"),
  },
  {
    service: "Shopify",
    name: "App token",
    kind: "secret",
    re: /^shp(at|ca|pa|ss)_[a-fA-F0-9]{32}$/,
    risk: "Admin API access to the store: orders, customers and products, within the app's scopes.",
    revoke: "Shopify admin → Settings → Apps and sales channels → Develop apps → the app → rotate or uninstall.",
    facts: (_k, m) => {
      const types: Record<string, string> = { at: "Admin API access token", ca: "Custom app access token", pa: "Private app access token", ss: "Shared secret (verifies webhooks and OAuth)" };
      return [{ label: "Type", value: types[m[1]] }];
    },
  },
  // ── Messaging and email ───────────────────────────────────────────────────
  {
    service: "Slack",
    name: "Token",
    kind: "secret",
    re: /^xox([baprse])-[0-9A-Za-z-]{10,}$/,
    risk: "Reads and posts messages as the bot or user, within the app's scopes.",
    revoke: "api.slack.com/apps → the app → OAuth & Permissions → revoke tokens, or call auth.revoke.",
    revokeUrl: "https://api.slack.com/apps",
    facts: (k) => {
      const types: Record<string, string> = { b: "Bot token", p: "User token", a: "Workspace app token (legacy)", r: "Refresh token", s: "Session token", e: "Rotating token" };
      const team = /^xox[bp]-(\d+)-/.exec(k);
      return [{ label: "Type", value: types[k[3]] ?? "Token" }, ...(team ? [{ label: "Workspace or user ID", value: team[1] }] : [])];
    },
  },
  {
    service: "Slack",
    name: "App-level token",
    kind: "secret",
    re: /^xapp-\d-([A-Z0-9]+)-\d+-[a-f0-9]{64}$/,
    risk: "Opens Socket Mode connections and manages the app's event subscriptions.",
    revoke: "api.slack.com/apps → the app → Basic information → App-level tokens → revoke.",
    revokeUrl: "https://api.slack.com/apps",
    facts: (_k, m) => [{ label: "App ID", value: m[1] }],
  },
  {
    service: "Slack",
    name: "Incoming webhook URL",
    kind: "secret",
    re: /^https:\/\/hooks\.slack\.com\/(services|workflows)\/(T[A-Z0-9]+)\/[A-Za-z0-9/]+$/,
    risk: "Anyone with the URL can post messages into the channel it's connected to.",
    revoke: "api.slack.com/apps → the app → Incoming webhooks → remove it, and create a new one.",
    revokeUrl: "https://api.slack.com/apps",
    facts: (_k, m) => [{ label: "Workspace ID", value: m[2] }],
  },
  {
    service: "Discord",
    name: "Bot token",
    kind: "secret",
    re: /^([MNO][A-Za-z0-9_-]{23,27})\.([A-Za-z0-9_-]{6})\.([A-Za-z0-9_-]{27,40})$/,
    risk: "Full control of the bot: reads messages in every server it's in, posts, kicks and bans with its permissions.",
    revoke: "Discord Developer Portal → the application → Bot → Reset token.",
    revokeUrl: "https://discord.com/developers/applications",
    facts: (_k, m) => {
      const id = b64urlDecode(m[1]);
      if (!id || !/^\d{17,20}$/.test(id)) return [];
      return [
        { label: "Bot user ID (decoded)", value: id },
        { label: "Bot created", value: fmtDate(snowflakeTime(id)) },
      ];
    },
  },
  {
    service: "Discord",
    name: "Webhook URL",
    kind: "secret",
    re: /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/(\d{17,20})\/[A-Za-z0-9_-]{60,}$/,
    risk: "Anyone with the URL can post into the channel, under any name and avatar.",
    revoke: "Discord → Server settings → Integrations → Webhooks → delete it.",
    facts: (_k, m) => [{ label: "Webhook ID", value: m[1] }, { label: "Created", value: fmtDate(snowflakeTime(m[1])) }],
  },
  {
    service: "Telegram",
    name: "Bot token",
    kind: "secret",
    re: /^(\d{8,10}):([A-Za-z0-9_-]{35})$/,
    risk: "Full control of the bot: reads the messages sent to it and sends as it.",
    revoke: "Message @BotFather, send /revoke and pick the bot.",
    revokeUrl: "https://t.me/BotFather",
    facts: (_k, m) => [{ label: "Bot ID", value: m[1] }],
  },
  {
    service: "Twilio",
    name: "Account SID",
    kind: "identifier",
    re: /^AC[a-f0-9]{32}$/,
    risk: "An identifier, not a secret on its own. The auth token that goes with it is.",
    revoke: "Nothing to revoke; rotate the auth token if it leaked too.",
  },
  {
    service: "Twilio",
    name: "API key SID",
    kind: "identifier",
    re: /^SK[a-f0-9]{32}$/,
    risk: "Paired with its API key secret, it sends messages and calls and reads logs on the account.",
    revoke: "Twilio Console → Account → API keys & tokens → delete the key.",
    revokeUrl: "https://console.twilio.com/us1/account/keys-credentials/api-keys",
  },
  {
    service: "SendGrid",
    name: "API key",
    kind: "secret",
    re: /^SG\.([A-Za-z0-9_-]{22})\.[A-Za-z0-9_-]{43}$/,
    risk: "Sends email as your verified domains, a gift to phishers, and reads contacts within its scopes.",
    revoke: "SendGrid → Settings → API keys → delete.",
    revokeUrl: "https://app.sendgrid.com/settings/api_keys",
    facts: (_k, m) => [{ label: "Key ID", value: m[1] }],
  },
  {
    service: "Mailgun",
    name: "API key (legacy format)",
    kind: "secret",
    re: /^key-[a-f0-9]{32}$/,
    risk: "Sends email from your domains and reads logs.",
    revoke: "Mailgun → API security → delete the key.",
  },
  {
    service: "Resend",
    name: "API key",
    kind: "secret",
    re: /^re_[A-Za-z0-9]{8}_[A-Za-z0-9]{24}$/,
    risk: "Sends email from your verified domains (or does more, with full access).",
    revoke: "resend.com → API keys → delete.",
    revokeUrl: "https://resend.com/api-keys",
  },
  {
    service: "Unknown service",
    name: "UUID-shaped key",
    kind: "secret",
    re: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    confidence: "possible",
    risk: "Many services use plain UUIDs as keys or tokens (Postmark server tokens and older Heroku API keys, for example). A UUID alone doesn't say which.",
    revoke: "Check where it came from; the variable name next to it usually tells you.",
  },
  // ── Dev tools and SaaS ────────────────────────────────────────────────────
  {
    service: "Linear",
    name: "Personal API key",
    kind: "secret",
    re: /^lin_api_[A-Za-z0-9]{40}$/,
    risk: "Reads and changes issues, projects and comments as you.",
    revoke: "Linear → Settings → Security & access → Personal API keys → revoke.",
  },
  {
    service: "Notion",
    name: "Integration token",
    kind: "secret",
    re: /^(secret_[A-Za-z0-9]{43}|ntn_[A-Za-z0-9]{46})$/,
    risk: "Reads and edits the pages and databases shared with the integration.",
    revoke: "notion.so/my-integrations → the integration → refresh the secret.",
    revokeUrl: "https://www.notion.so/my-integrations",
  },
  {
    service: "Atlassian",
    name: "API token",
    kind: "secret",
    re: /^ATATT3[A-Za-z0-9_=-]{180,}$/,
    risk: "Acts as you in Jira, Confluence and Bitbucket Cloud (with your email address).",
    revoke: "id.atlassian.com → Security → API tokens → revoke.",
    revokeUrl: "https://id.atlassian.com/manage-profile/security/api-tokens",
  },
  {
    service: "Postman",
    name: "API key",
    kind: "secret",
    re: /^PMAK-[a-f0-9]{24}-[a-f0-9]{34}$/,
    risk: "Reads your workspaces, collections and environments, which often store other keys.",
    revoke: "Postman → Settings → API keys → delete.",
  },
  {
    service: "Airtable",
    name: "Personal access token",
    kind: "secret",
    re: /^pat[A-Za-z0-9]{14}\.[a-f0-9]{64}$/,
    risk: "Reads and writes the bases it was given access to.",
    revoke: "airtable.com/create/tokens → delete.",
    revokeUrl: "https://airtable.com/create/tokens",
  },
  {
    service: "Figma",
    name: "Personal access token",
    kind: "secret",
    re: /^figd_[A-Za-z0-9_-]{40,}$/,
    risk: "Reads your files and comments.",
    revoke: "Figma → Settings → Security → Personal access tokens → revoke.",
  },
  {
    service: "Sentry",
    name: "Auth token",
    kind: "secret",
    re: /^sntry([su])_([A-Za-z0-9+/=]+)(_[A-Za-z0-9+/=]+)?$/,
    risk: "Uploads source maps and releases, and reads issues, events and their data (organization tokens) or acts as you (user tokens).",
    revoke: "Sentry → Settings → Auth tokens (or Organization tokens) → revoke.",
    facts: (_k, m) => {
      const out: KeyFact[] = [{ label: "Type", value: m[1] === "s" ? "Organization token" : "User auth token" }];
      if (m[1] === "s") {
        const json = b64urlDecode(m[2]);
        try {
          const p = JSON.parse(json ?? "");
          if (p.org) out.push({ label: "Organization (decoded)", value: String(p.org) });
          if (p.url) out.push({ label: "Sentry URL", value: String(p.url) });
        } catch {}
      }
      return out;
    },
  },
  {
    service: "Grafana",
    name: "Service account or Cloud token",
    kind: "secret",
    re: /^gl(sa|c)_[A-Za-z0-9_+/=-]{32,}$/,
    risk: "Reads dashboards and data sources, or manages the stack, within the token's role.",
    revoke: "Grafana → Administration → Service accounts (or Grafana Cloud → Access policies) → delete the token.",
  },
  {
    service: "New Relic",
    name: "User API key",
    kind: "secret",
    re: /^NRAK-[A-Z0-9]{27}$/,
    risk: "Queries your telemetry and changes account configuration via NerdGraph.",
    revoke: "New Relic → API keys → delete.",
  },
  {
    service: "Doppler",
    name: "Token",
    kind: "secret",
    re: /^dp\.(pt|st|sa|ct|scim|audit)\.[A-Za-z0-9]{40,44}$/,
    risk: "Reads secrets from Doppler: a store holding many other keys.",
    revoke: "Doppler dashboard → Access (or the config's Access tab) → revoke.",
  },
  {
    service: "Supabase",
    name: "Key",
    kind: "secret",
    re: /^sb(p|_secret|_publishable)_[A-Za-z0-9_-]{20,}$/,
    risk: "A secret key (sb_secret_) bypasses Row Level Security; a personal access token (sbp_) manages your projects. Publishable keys are for the browser.",
    revoke: "Supabase dashboard → Project settings → API keys (or Account → Access tokens) → delete.",
    facts: (_k, m) => [{ label: "Type", value: m[1] === "p" ? "Personal access token" : m[1] === "_secret" ? "Secret API key" : "Publishable key (public)" }],
  },
  {
    service: "Mapbox",
    name: "Access token",
    kind: "secret",
    re: /^(pk|sk|tk)\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    risk: "Public tokens (pk.) belong in web pages; secret tokens (sk.) can manage styles, tilesets and tokens.",
    revoke: "account.mapbox.com → Tokens → delete or rotate.",
    revokeUrl: "https://account.mapbox.com/access-tokens/",
    facts: (k) => {
      const out: KeyFact[] = [{ label: "Type", value: k.startsWith("pk.") ? "Public token" : k.startsWith("sk.") ? "Secret token" : "Temporary token" }];
      const payload = b64urlDecode(k.split(".")[1]);
      try {
        const p = JSON.parse(payload ?? "");
        if (p.u) out.push({ label: "Account (decoded)", value: String(p.u) });
      } catch {}
      return out;
    },
  },
  {
    service: "Facebook / Meta",
    name: "Access token",
    kind: "token",
    re: /^EAA[A-Za-z0-9]{90,}$/,
    confidence: "likely",
    risk: "Acts as the user, page or app it was issued for, within its permissions.",
    revoke: "Meta for Developers → the app → reset the app secret, or remove the app in the user's settings.",
  },
  {
    service: "age",
    name: "Secret key",
    kind: "secret",
    re: /^AGE-SECRET-KEY-1[QPZRY9X8GF2TVDW0S3JN54KHCE6MUA7L]{58}$/,
    risk: "Decrypts every file encrypted to its public key.",
    revoke: "Generate a new key with age-keygen and re-encrypt the files; old copies stay readable.",
  },
];

/** PEM blocks and service-account JSON files are recognized by their structure */
function structured(input: string): KeyMatch[] {
  const out: KeyMatch[] = [];
  const pem = /-----BEGIN ((?:RSA |EC |DSA |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY(?: BLOCK)?)-----/.exec(input);
  if (pem) {
    out.push({
      service: "Private key",
      name: pem[1].replace(/ BLOCK$/, "").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
      kind: "secret",
      confidence: "certain",
      facts: pem[1].startsWith("ENCRYPTED") ? [{ label: "Encrypted", value: "Yes. It still needs its passphrase, but treat it as exposed." }] : [],
      risk: "Whoever has it can sign, decrypt or log in as whatever trusts the matching public key.",
      revoke: "Generate a new key pair, replace the public key everywhere it's trusted (servers, certificates, deploy keys), then remove the old one.",
    });
  }
  if (/^\s*\{/.test(input)) {
    try {
      const j = JSON.parse(input);
      if (j && j.type === "service_account" && j.private_key) {
        out.push({
          service: "Google Cloud",
          name: "Service account key file",
          kind: "secret",
          confidence: "certain",
          facts: [
            ...(j.client_email ? [{ label: "Service account", value: String(j.client_email) }] : []),
            ...(j.project_id ? [{ label: "Project", value: String(j.project_id) }] : []),
            ...(j.private_key_id ? [{ label: "Key ID", value: String(j.private_key_id) }] : []),
          ],
          risk: "Acts as the service account, with every IAM role it holds in the project (and beyond).",
          revoke: "Google Cloud console → IAM → Service accounts → the account → Keys → delete this key ID.",
          revokeUrl: "https://console.cloud.google.com/iam-admin/serviceaccounts",
        });
      }
    } catch {}
  }
  return out;
}

function jwtMatch(token: string): KeyMatch | null {
  if (!/^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(token)) return null;
  const { facts, payload } = jwtFacts(token);
  if (!payload) return null;
  const iss = String(payload.iss ?? "");
  let service = "JWT";
  let name = "JSON Web Token";
  let kind: KeyKind = "token";
  let risk = "Whoever holds it is treated as its subject until it expires. JWTs are signed, not encrypted: anyone can read these claims.";
  let revoke = "A JWT can't be revoked by itself. Wait for it to expire, or rotate the signing key (which logs everyone out).";
  if (payload.role === "service_role" || payload.role === "anon") {
    service = "Supabase";
    name = payload.role === "anon" ? "anon key (legacy JWT)" : "service_role key (legacy JWT)";
    kind = payload.role === "anon" ? "public" : "secret";
    risk = payload.role === "anon" ? "Public by design: it goes in your web app, and Row Level Security decides what it can do." : "Bypasses Row Level Security: full read and write access to every table.";
    revoke = "Supabase dashboard → Project settings → API → rotate the JWT secret, or move to the new API keys and disable the legacy ones.";
  } else if (/securetoken\.google\.com/.test(iss)) {
    service = "Firebase";
    name = "Firebase Auth ID token";
    revoke = "It expires within an hour; revoke the user's refresh tokens with the Admin SDK (revokeRefreshTokens).";
  } else if (/\.auth0\.com\/?$/.test(iss)) {
    service = "Auth0";
  } else if (/login\.microsoftonline\.com|sts\.windows\.net/.test(iss)) {
    service = "Microsoft Entra ID";
  } else if (/accounts\.google\.com/.test(iss)) {
    service = "Google";
    name = "Google ID token";
  } else if (/clerk\./.test(iss)) {
    service = "Clerk";
  }
  return { service, name, kind, confidence: service === "JWT" ? "certain" : "likely", facts, risk, revoke };
}

export interface Identification {
  input: string;
  matches: KeyMatch[];
  length: number;
  charset: string;
  /** Shannon entropy in bits per character */
  entropy: number;
  /** Looks like an example or placeholder value */
  placeholder: boolean;
  /** Characters that shouldn't be in a key, such as spaces or quotes, were removed before matching */
  cleaned: boolean;
}

export function entropyOf(s: string): number {
  if (!s) return 0;
  const counts = new Map<string, number>();
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let h = 0;
  counts.forEach((n) => {
    const p = n / s.length;
    h -= p * Math.log2(p);
  });
  return h;
}

function charsetOf(s: string): string {
  if (/^[0-9a-f]+$/.test(s)) return "hex (lowercase)";
  if (/^[0-9A-F]+$/.test(s)) return "hex (uppercase)";
  if (/^[A-Z2-7]+=*$/.test(s)) return "base32";
  if (/^[A-Za-z0-9]+$/.test(s)) return "letters and digits (base62)";
  if (/^[A-Za-z0-9_-]+$/.test(s)) return "letters, digits, - and _ (base64url)";
  if (/^[A-Za-z0-9+/]+=*$/.test(s)) return "base64";
  return "mixed";
}

const PLACEHOLDER = /x{6,}|X{6,}|0{8,}|(?:your|my)[_-]?(?:api[_-]?)?(?:key|token|secret)|example|placeholder|dummy|changeme|redacted|<[^>]+>|\.\.\.|…|EXAMPLE/i;

/** Strips quotes, `KEY=`, `Bearer `, `Authorization:` and whitespace people paste along with a key */
export function cleanKey(raw: string): { key: string; cleaned: boolean } {
  let s = raw.trim();
  if (/-----BEGIN /.test(s) || /^\{/.test(s)) return { key: s, cleaned: false };
  const original = s;
  s = s.replace(/^(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*[=:]\s*/, "");
  s = s.replace(/^(?:authorization|x-api-key|api-key)\s*:\s*/i, "");
  s = s.replace(/^(?:bearer|token|basic)\s+/i, "");
  s = s.replace(/^["'`]|["'`,;]+$/g, "").replace(/^["'`]|["'`]$/g, "");
  s = s.replace(/\s+/g, "");
  return { key: s, cleaned: s !== original };
}

export function identifyKey(raw: string): Identification {
  const { key, cleaned } = cleanKey(raw);
  const matches: KeyMatch[] = [...structured(raw.trim())];
  if (!matches.length) {
    for (const f of FORMATS) {
      const m = f.re.exec(key);
      if (!m) continue;
      matches.push({
        service: f.service,
        name: f.name,
        kind: f.kind,
        confidence: f.confidence ?? "certain",
        environment: f.env?.(key),
        facts: f.facts?.(key, m) ?? [],
        risk: f.risk,
        revoke: f.revoke,
        revokeUrl: f.revokeUrl,
      });
    }
    const jwt = jwtMatch(key);
    if (jwt) matches.push(jwt);
    // A 40-character base64 string with no prefix is the classic shape of an AWS secret access key
    if (!matches.length && /^[A-Za-z0-9/+]{40}$/.test(key) && /[A-Z]/.test(key) && /[a-z]/.test(key) && /\d/.test(key)) {
      matches.push({
        service: "AWS",
        name: "Secret access key (by shape only)",
        kind: "secret",
        confidence: "possible",
        facts: [],
        risk: "If it is one, together with its access key ID it can do whatever the IAM user is allowed to. Other services also use 40-character keys.",
        revoke: "Find the access key ID it pairs with (AKIA…) in the same file or config, then rotate it in IAM.",
        revokeUrl: "https://console.aws.amazon.com/iam/home#/users",
      });
    }
  }
  // When several formats match, the more specific (certain) ones come first
  const order: Record<Confidence, number> = { certain: 0, likely: 1, possible: 2 };
  matches.sort((a, b) => order[a.confidence] - order[b.confidence]);
  return { input: key, matches, length: key.length, charset: charsetOf(key), entropy: entropyOf(key), placeholder: PLACEHOLDER.test(key), cleaned };
}

/** Services with at least one recognized format, for the page's list */
export const KNOWN_SERVICES: string[] = Array.from(new Set(FORMATS.map((f) => f.service).filter((s) => s !== "Unknown service").concat(["Private keys (PEM)", "Google Cloud", "Firebase", "Auth0", "Microsoft Entra ID", "Clerk"]))).sort((a, b) => a.localeCompare(b));
