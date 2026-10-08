// Hands-on guide content for the most-used tools: a short intro, step-by-step usage,
// worked examples and an honest list of limitations. Rendered by ToolSeoSection above the
// longer "About this tool" copy in lib/tool-content.ts.
//
// Every example output here was produced by running the tool's own code (or the same
// algorithm) on the example input. If a tool's behavior changes, re-run the examples.

export interface ToolExample {
  title: string;
  input: string;
  output: string;
  note?: string;
}

export interface ToolGuide {
  intro: string;
  howTo: string[];
  examples: ToolExample[];
  limitations: string[];
}

export const toolGuides: Record<string, ToolGuide> = {
  "json-formatter": {
    intro:
      "Paste JSON to validate it and pretty-print it. From the same input you can minify it, browse it as a tree, pull values out with JSONPath, or flatten it to dot-notation keys and back.",
    howTo: [
      "Paste or type JSON into the Input panel. It is parsed as you type, and a parse error appears under the input with the reason.",
      "Read the pretty-printed result in the Formatted tab (2-space indentation), or click Minify for a single-line version. Copy puts the current output on your clipboard; there is no download button, so paste the result into a file if you need one.",
      "Open the Tree tab to expand and collapse nested objects and arrays.",
      "Open the JSONPath tab and type a path that starts with $, such as $.store.book[*].author, to list the matching values and their paths.",
      "Open the Flatten / Unflatten tab. Flatten turns nested keys into dot-notation keys; Unflatten rebuilds nested JSON from a flat object. Each mode has its own Copy button.",
    ],
    examples: [
      {
        title: "Query a document with JSONPath",
        input: `{"store":{"book":[
  {"title":"Clean Code","author":"Robert C. Martin","price":32.5},
  {"title":"Refactoring","author":"Martin Fowler","price":47.99},
  {"title":"The Pragmatic Programmer","author":"David Thomas, Andrew Hunt","price":41}
],"bicycle":{"color":"red","price":199}}}`,
        output: `$.store.book[*].author   → "Robert C. Martin", "Martin Fowler", "David Thomas, Andrew Hunt"
$.store.book[0].title    → "Clean Code"
$.store.book[-1:].title  → "The Pragmatic Programmer"
$.store.book[0,2].title  → "Clean Code", "The Pragmatic Programmer"
$..['price']             → 32.5, 47.99, 41, 199`,
        note: "Recursive descent needs the bracket form ($..['price']); see Limitations.",
      },
      {
        title: "Flatten nested JSON for a spreadsheet or key-value store",
        input: `{"user":{"name":"Ada","address":{"city":"London","zip":"N1 9GU"},"roles":["admin","editor"]}}`,
        output: `{
  "user.name": "Ada",
  "user.address.city": "London",
  "user.address.zip": "N1 9GU",
  "user.roles.0": "admin",
  "user.roles.1": "editor"
}`,
        note: "Array items get numeric keys (roles.0, roles.1).",
      },
      {
        title: "Unflatten dot-notation config back into nested JSON",
        input: `{"server.port":8080,"server.tls.enabled":true,"allowedOrigins.0":"https://example.com","allowedOrigins.1":"https://admin.example.com"}`,
        output: `{
  "server": { "port": 8080, "tls": { "enabled": true } },
  "allowedOrigins": [
    "https://example.com",
    "https://admin.example.com"
  ]
}`,
        note: "Numeric key segments become array indexes. Output shown compacted here; the tool prints it with 2-space indentation.",
      },
    ],
    limitations: [
      "Strict JSON only. Comments, trailing commas and single-quoted strings (JSONC, JSON5) are reported as errors, so strip them first.",
      "Parsing uses the browser's JSON.parse, so integers beyond 2^53 (9007199254740991) lose precision: 12345678901234567890 comes back as 12345678901234567000. Don't round-trip large numeric IDs through the formatter.",
      "If an object has duplicate keys, only the last value is kept and no warning is shown.",
      "Indentation is fixed at 2 spaces.",
      "JSONPath supports $, .name, ['name'], indexes (including negative), [*], unions like [0,2] and slices like [1:3]. Filter expressions such as [?(@.price<10)] are not supported, and recursive descent currently works only in bracket form: $..['price'] works, $..price returns an error.",
      "Your last input is saved in this browser's local storage so it survives a reload. Click Clear when you are done with sensitive data.",
    ],
  },

  "jwt-decoder": {
    intro:
      "Paste a JSON Web Token to see its header and payload as formatted JSON, check whether it has expired, and optionally verify its signature with a secret or public key.",
    howTo: [
      "Paste the token (the three dot-separated parts, without the Bearer prefix) into the JWT Token field.",
      "Read the decoded header and payload. If the payload has an exp claim, a banner shows the expiry time and whether the token has already expired.",
      "To check the signature, open Verify signature and enter the shared secret for HS256/384/512, or the PEM public key (-----BEGIN PUBLIC KEY-----) for RS, PS and ES algorithms.",
      "Optionally enter a target URL to generate a curl command that sends the token as a Bearer header.",
    ],
    examples: [
      {
        title: "Decode an HS256 token",
        input:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJBZGEgTG92ZWxhY2UiLCJpYXQiOjE3MzU2ODk2MDAsImV4cCI6MTczNTY5MzIwMH0.cl_vM2ze74OuhkV2OPDAbdGKgKp_FNVovxwVPSiURZI",
        output: `Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "sub": "user_123", "name": "Ada Lovelace",
           "iat": 1735689600, "exp": 1735693200 }
Expiry:  2025-01-01 01:00 UTC → expired`,
        note: "iat and exp are Unix seconds: issued 2025-01-01 00:00 UTC, valid for one hour.",
      },
      {
        title: "Verify the same token's signature",
        input: `Secret: my-test-secret`,
        output: "Signature valid. Any other secret, or any edit to the header or payload, makes it invalid.",
        note: "A valid signature only proves who signed the token. It says nothing about whether it has expired or who it was issued for.",
      },
      {
        title: "Spot an unsigned token",
        input: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.<payload>.",
        output: `Header: { "alg": "none", "typ": "JWT" }
Verify: no signature to verify`,
        note: 'A token with "alg": "none" and an empty third part has no signature. Your server should reject it.',
      },
    ],
    limitations: [
      "Signature verification accepts a shared secret (HS*) or a PEM-encoded SPKI public key (RS*, PS*, ES*). JWK keys, X.509 certificates and JWKS URLs are not accepted; convert a JWK to PEM first.",
      "Only signed tokens (JWS) are supported. Encrypted tokens (JWE, five parts) cannot be decoded.",
      "The decoder checks exp only. It does not check nbf, iss, aud or any other claim your server validates.",
      "The token you paste is saved in this browser's local storage so it survives a reload. Clear the field after inspecting a real token.",
    ],
  },

  "regex-tester": {
    intro:
      "Test a JavaScript regular expression against sample text, with matches highlighted as you type, a table of every match and its capture groups, a replace preview, and code snippets for JavaScript, Python and Java.",
    howTo: [
      "Type the pattern without surrounding slashes, for example (\\d{4})-(\\d{2})-(\\d{2}).",
      "Toggle the flags you need: i (ignore case), m (^ and $ match at line breaks) and s (. matches newlines).",
      "Paste your test text. Matches are highlighted and listed with their index, length and groups.",
      "Switch to replace mode and enter a replacement such as $3/$2/$1 or $<name> to preview the result.",
      "Copy a code snippet for JavaScript, Python or Java. Check the Python and Java versions, since those engines differ in places.",
    ],
    examples: [
      {
        title: "Extract dates with capture groups",
        input: `Pattern: (\\d{4})-(\\d{2})-(\\d{2})
Text:    Released 2026-10-08, patched 2026-10-15.`,
        output: `Match 1 at index 9:  2026-10-08  groups: 2026, 10, 08
Match 2 at index 29: 2026-10-15  groups: 2026, 10, 15`,
      },
      {
        title: "Reorder with a replacement",
        input: `Pattern: (\\d{4})-(\\d{2})-(\\d{2})
Replace: $3/$2/$1`,
        output: "Released 08/10/2026, patched 15/10/2026.",
      },
      {
        title: "Match whole log lines with the m flag",
        input: `Pattern: ^(ERROR|WARN)\\b.*$   flags: m
Text:
INFO server started
WARN disk at 85%
ERROR db timeout after 30s
INFO request ok`,
        output: `WARN disk at 85%
ERROR db timeout after 30s`,
        note: "Without m, ^ and $ only match at the start and end of the whole text, so this pattern finds nothing.",
      },
    ],
    limitations: [
      "It uses your browser's JavaScript regex engine. PCRE, Python, Go (RE2) and .NET support different features, so a pattern that works here can fail elsewhere and the reverse.",
      "Only the g, i, m and s flags are available. Without u, Unicode property escapes like \\p{L} are not recognized: \\p{L}+ is read as a literal 'p{L}' and does not match 'café'.",
      "The match table and replace preview always find every match, even with g turned off.",
      "Matching runs on the page's main thread with no timeout, so a pattern with catastrophic backtracking, such as (a+)+$ on a long string of a's, can freeze the tab.",
      "Your pattern, test text, flags and replacement are saved in this browser's local storage.",
    ],
  },

  base64: {
    intro:
      "Encode text or files to Base64 and decode Base64 back to text or a downloadable file, in standard or URL-safe form.",
    howTo: [
      "Choose Text or File mode, and Standard or URL-safe alphabet.",
      "In Text mode, type or paste your input and click Encode or Decode. Text is encoded as UTF-8, so accents and emoji round-trip correctly.",
      "In File mode, drop a file (or click to browse) to get its Base64, or paste Base64 into the decode field to download the decoded bytes as a file.",
      "Use Copy to put the output on your clipboard.",
    ],
    examples: [
      {
        title: "Build an HTTP Basic Authorization header",
        input: "user:pass",
        output: "dXNlcjpwYXNz   →   Authorization: Basic dXNlcjpwYXNz",
        note: "Base64 is not encryption; anyone can decode this header. Only send it over HTTPS.",
      },
      {
        title: "Encode non-ASCII text",
        input: "café ✓",
        output: "Y2Fmw6kg4pyT",
        note: "The text is converted to UTF-8 bytes first. The browser's plain btoa() would throw on this input.",
      },
      {
        title: "Standard vs URL-safe",
        input: "<<???>>",
        output: `Standard: PDw/Pz8+Pg==
URL-safe: PDw_Pz8-Pg`,
        note: "URL-safe swaps + for - and / for _ and drops the = padding, as used in JWTs and URL parameters.",
      },
    ],
    limitations: [
      "Text-mode decoding expects the decoded bytes to be UTF-8 text. If they aren't (an image, gzip data), it reports 'Invalid Base64 string' even when the Base64 itself is fine. Use File mode to download the bytes instead.",
      "A data URI prefix such as data:image/png;base64, is not stripped when decoding; remove it first.",
      "Decoded files download as 'decoded-file' with no extension, so rename it to the right type.",
      "Files are read entirely into memory in your browser. Very large files can be slow or crash the tab.",
      "Text input is saved in this browser's local storage.",
    ],
  },

  "uuid-generator": {
    intro:
      "Generate random UUID v4, time-ordered UUID v7, deterministic UUID v5 or NanoID identifiers, one at a time or up to 100 at once.",
    howTo: [
      "Pick a type: UUID v4, UUID v7, UUID v5 or NanoID.",
      "For v4, v7 and NanoID, choose how many to generate (1, 5, 10, 25 or 100). For NanoID, set the length (4 to 64).",
      "For v5, choose a namespace (DNS, URL, OID, X.500 or a custom UUID) and enter the name. v5 always produces exactly one ID, because the same inputs always give the same UUID.",
      "Click Generate, then copy a single ID or the whole list (one per line).",
    ],
    examples: [
      {
        title: "UUID v5 for a domain name",
        input: "Namespace: DNS    Name: example.com",
        output: "cfbff0d1-9375-5685-968c-48ce8b15ae17",
        note: "Any correct v5 implementation returns this same value, so it is a handy check for your own code.",
      },
      {
        title: "Stable ID for a URL",
        input: "Namespace: URL    Name: https://example.com/users/42",
        output: "38fcaf6d-63bc-5c9f-8a4f-de8cf4e651ed",
        note: "Useful for deduplicating imported records or making repeatable test fixtures.",
      },
      {
        title: "Reading the timestamp in a UUID v7",
        input: "A v7 generated at 2026-10-08 12:00:00.000 UTC",
        output: "01a11b62-7600-7xxx-yxxx-xxxxxxxxxxxx",
        note: "The first 12 hex digits are the Unix time in milliseconds (0x01a11b627600 = 1791460800000). The 7 is the version; y is 8, 9, a or b; the x digits are random.",
      },
    ],
    limitations: [
      "UUID v7 uses your device clock and has no counter inside a millisecond. IDs generated in the same millisecond (a bulk batch usually is) are not guaranteed to sort in the order they were generated.",
      "v1, v6 and v8 are not offered. For ULIDs, use the separate ULID Generator.",
      "Bulk generation is capped at 100 IDs per click.",
    ],
  },

  "cron-tester": {
    intro:
      "Check a standard 5-field cron expression: see it described in plain English, broken down field by field, and the next 8 times it will run.",
    howTo: [
      "Type an expression with five fields: minute, hour, day of month, month, day of week. You can also start from a preset.",
      "Read the plain-English description and the field breakdown to confirm each field means what you intended.",
      "Check the list of the next 8 run times. They are shown in your browser's local time zone.",
    ],
    examples: [
      {
        title: "Every 15 minutes during working hours",
        input: "*/15 9-17 * * 1-5",
        output: `Runs every 15 minutes, 9 through 17, Mon through Fri
First run of a weekday: 09:00, last run: 17:45`,
        note: "The hour range 9-17 includes 17, so the job also fires at 17:00, 17:15, 17:30 and 17:45.",
      },
      {
        title: "Weekly maintenance window",
        input: "0 3 * * 0",
        output: "Runs at minute 0, at 03:00, on Sun → every Sunday at 03:00",
      },
      {
        title: "Monthly job",
        input: "30 2 1 * *",
        output: "Runs at minute 30, at 02:00, on the 1st → 02:30 on the 1st of every month",
        note: "The description names the hour (02:00) and the minute separately; the run list shows the actual time, 02:30.",
      },
    ],
    limitations: [
      "Only the classic 5-field format is accepted. Seconds or year fields (Quartz, AWS EventBridge), @daily-style shortcuts, month and weekday names (JAN, MON) and the L, W, # and ? characters all return an error. Write the numeric equivalent instead, for example 0 9 * * 1 for MON.",
      "When both day of month and day of week are restricted, this tester only lists times that match both. Standard cron (Vixie cron, cronie) runs when either matches, so 0 0 1 * 1 runs on the 1st and on every Monday in crontab, but the tester shows only Mondays that fall on the 1st.",
      "Run times are calculated in your browser's time zone. Your server or cloud scheduler may use UTC or another zone, and daylight-saving changes shift local runs.",
      "Only the next 366 days are searched, so a schedule that never fires (0 0 31 2 *) shows no runs.",
      "Your expression is saved in this browser's local storage.",
    ],
  },

  "cidr-calculator": {
    intro:
      "Enter an IPv4 or IPv6 CIDR block to get its network address, mask, address range and host count, with a bit-level view. For IPv4 you can also split the block into equal subnets.",
    howTo: [
      "Type a block in CIDR notation, such as 10.0.0.0/22 or 2001:db8::/48. Any address inside the block works; the calculator finds its network address.",
      "Read the results: network and broadcast address, subnet and wildcard mask, first and last usable host, and total and usable host counts.",
      "Use the binary view to see which bits are network bits and which are host bits.",
      "For IPv4, pick a number of subnets under Split into Subnets to see each resulting block and its host range. Copy all copies the list.",
    ],
    examples: [
      {
        title: "Size a /22",
        input: "10.0.0.0/22",
        output: `Subnet mask:   255.255.252.0
Broadcast:     10.0.3.255
Usable range:  10.0.0.1 – 10.0.3.254
Usable hosts:  1022`,
      },
      {
        title: "Find the block an address belongs to",
        input: "192.168.1.130/25",
        output: `Network:       192.168.1.128
Broadcast:     192.168.1.255
Usable range:  192.168.1.129 – 192.168.1.254 (126 hosts)`,
      },
      {
        title: "Split a /24 into four subnets",
        input: "192.168.10.0/24 → 4 subnets",
        output: `192.168.10.0/26
192.168.10.64/26
192.168.10.128/26
192.168.10.192/26`,
        note: "Each /26 has 62 usable hosts.",
      },
    ],
    limitations: [
      "Usable host counts follow plain IPv4 rules (minus network and broadcast). Cloud providers reserve more: AWS reserves 5 addresses in every VPC subnet, so a /24 there has 251 usable addresses, not 254.",
      "Splitting is IPv4 only, into a power-of-two number of equal subnets, and no smaller than /30. Variable-size (VLSM) plans have to be worked out one block at a time.",
      "It does not check whether two blocks overlap or convert an arbitrary IP range into CIDR blocks.",
      "IPv6 results show the range and address count only, since IPv6 has no broadcast address.",
    ],
  },

  "timestamp-converter": {
    intro:
      "Convert a Unix timestamp to a readable date in UTC, your local time and a dozen world time zones, or turn a date and time back into a Unix timestamp.",
    howTo: [
      "Paste a timestamp into Timestamp → Date, or click Now for the current time. Values with 13 or more characters are read as milliseconds, shorter ones as seconds.",
      "Read the UTC, local and relative rows, and the World Clock for the same moment in other cities. Each row has a Copy button.",
      "To go the other way, pick a date and time under Date → Timestamp. It is read in your device's time zone and converted to Unix seconds.",
    ],
    examples: [
      {
        title: "Seconds to a date",
        input: "1791460800",
        output: "UTC: Thu, 08 Oct 2026 12:00:00 GMT",
      },
      {
        title: "Milliseconds from JavaScript",
        input: "1791460800000",
        output: "UTC: Thu, 08 Oct 2026 12:00:00 GMT",
        note: "Same moment as above. Date.now() returns milliseconds; most APIs and JWT claims use seconds.",
      },
      {
        title: "Date to timestamp",
        input: "2026-10-08 14:00 picked on a device set to Paris time (UTC+2 in October)",
        output: "1791460800",
        note: "The picker uses your device's time zone, so the same wall-clock time gives a different timestamp elsewhere.",
      },
    ],
    limitations: [
      "Seconds versus milliseconds is decided by length alone. Microsecond (16-digit) or nanosecond values are read as milliseconds and give a date tens of thousands of years away; divide them down first.",
      "Date → Timestamp always uses your device's time zone; there is no time zone selector for the input.",
      "The Relative row currently names a unit one step too small for longer gaps (for example, a timestamp 3 days ago shows as 72 minutes ago). Use the UTC row for the exact time.",
    ],
  },

  "diff-checker": {
    intro:
      "Compare two pieces of text line by line, side by side or as a unified diff, with the changed characters highlighted inside each changed line.",
    howTo: [
      "Paste the original text on the left and the changed text on the right, or upload a text file into either side.",
      "Choose Split for side-by-side columns or Unified for a single stream with - and + prefixes.",
      "Turn on Ignore whitespace or Ignore case to hide differences you don't care about.",
    ],
    examples: [
      {
        title: "What changed in a config file",
        input: `Original:            Modified:
PORT=3000            PORT=8080
DEBUG=false          DEBUG=false
DB_HOST=localhost    DB_HOST=db.internal
                     LOG_LEVEL=info`,
        output: `-PORT=3000
+PORT=8080
 DEBUG=false
-DB_HOST=localhost
+DB_HOST=db.internal
+LOG_LEVEL=info`,
      },
      {
        title: "Ignore re-indentation",
        input: `Original: "    return a + b;"   Modified: "  return a + b;"`,
        output: "With Ignore whitespace on: no differences.",
        note: "Useful after a formatter changes indentation. Leave it off for YAML or Python, where indentation changes meaning.",
      },
      {
        title: "Ignore case",
        input: `Original: select id from users   Modified: SELECT id FROM users`,
        output: "With Ignore case on: no differences.",
      },
    ],
    limitations: [
      "The diff is line-based. A block that moved shows as deleted in one place and added in another.",
      "All lines are shown; unchanged regions are not collapsed, so long files mean a lot of scrolling.",
      "There is no copy or patch export for the diff itself.",
      "Line endings are not normalized. A file with Windows (CRLF) endings compared with a Unix (LF) copy shows every line as changed.",
      "Uploaded files are read as text. Binary files are not supported.",
    ],
  },

  "password-generator": {
    intro:
      "Generate random passwords or word-based passphrases in your browser using crypto.getRandomValues, with control over length, character sets and how many to make.",
    howTo: [
      "Choose Random Password or Passphrase.",
      "For a password, set the length (8 to 128) and pick character sets: uppercase, lowercase, numbers and symbols (!@#$%^&*()_+-=[]{}|;:,.<>?).",
      "For a passphrase, set the number of words (3 to 10), the separator, and whether to capitalize words and append a number.",
      "Choose how many to make (1, 5 or 10), click Generate, and copy the result into your password manager.",
    ],
    examples: [
      {
        title: "Default random password",
        input: "Length 20, all four character sets (88 characters)",
        output: "20 random characters, about 129 bits of entropy",
        note: "Every click gives a different result, so no sample is shown. Entropy is length × log2(88).",
      },
      {
        title: "A site that limits length and bans symbols",
        input: "Length 16, uppercase + lowercase + numbers (62 characters)",
        output: "16 random characters, about 95 bits of entropy",
        note: "Adding symbols at the same length gives about 103 bits.",
      },
      {
        title: "Memorable passphrase",
        input: "5 words, hyphen separator, capitalized, number appended",
        output: "Shaped like Agent-Amber-Alarm-Alpha-Actor-42, about 47 bits of entropy",
        note: "The tool shows the entropy for your settings. Each extra word adds about 8 bits.",
      },
    ],
    limitations: [
      "The passphrase word list has 264 words, about 8 bits per word, far fewer than the 7,776-word diceware lists. A 5-word passphrase is about 47 bits, which is fine behind rate limiting but weak for anything that can be attacked offline (a password manager master password, disk encryption). Use 8 or more words, or a random password, there.",
      "Characters are drawn independently, so a password is not guaranteed to contain every selected character type. A 16-character password has roughly a 1 in 7 chance of containing no digit; regenerate if a site insists on one of each.",
      "The Strength label is a simple length and character-type score, not a crack-time estimate.",
    ],
  },
};
