export interface Faq {
  q: string;
  a: string;
}

export interface ToolContent {
  about: string;
  useCases: string[];
  tips?: string[];
  faq?: Faq[];
}

export const toolContent: Record<string, ToolContent> = {
  "json-formatter": {
    about:
      "The ToolNinja JSON Formatter is a free online JSON formatter, validator and beautifier. Paste any JSON string and instantly format it with proper indentation, syntax highlighting, and clear error messages if your JSON is invalid.\n\nUse it as a JSON beautifier to make minified API responses readable, as a JSON validator to catch syntax errors like trailing commas, unquoted keys, or mismatched brackets, or as a JSON minifier to compress formatted JSON for production use. The tree view mode lets you explore deeply nested structures visually, and JSONPath query support lets you extract specific values without writing any code.\n\nThe Flatten tab converts nested JSON into single-level dot-notation keys (e.g. `user.address.city`) — useful for CSV export, spreadsheet import, or flat key-value config formats — and Unflatten does the reverse, rebuilding a nested object (including arrays) from flat dot-notation keys.\n\nWhether you're debugging an API response, validating config files, or pretty printing JSON for documentation — the ToolNinja JSON formatter handles it instantly with no page reloads.\n\nEverything runs 100% in your browser. Your JSON data — including any sensitive API keys, tokens or private data — never leaves your machine. No login required.",
    useCases: [
      "Inspecting API responses from Postman, curl, or browser DevTools",
      "Formatting config files (package.json, tsconfig.json) before committing",
      "Debugging serialized data from logs, queues, or databases",
      "Minifying JSON before storing in environment variables or payloads",
      "Flattening nested JSON into dot-notation keys for CSV or spreadsheet export",
      "Rebuilding a nested object from flat, dot-notation config keys",
    ],
    tips: [
      "Paste minified JSON and it auto-formats on input — no button required.",
      "Use the Minify button to compress JSON for size-sensitive environments.",
      "The error indicator shows the exact line and character of syntax problems.",
      "Flatten turns array indices into numeric key segments (e.g. items.0.name) — Unflatten automatically rebuilds them back into real arrays.",
    ],
    faq: [
      {
        q: "What's the difference between JSON formatting and minification?",
        a: "Formatting adds whitespace and indentation to make JSON human-readable. Minification strips all unnecessary whitespace to reduce file size — useful for API payloads, localStorage, and environment variables where every byte matters.",
      },
      {
        q: "Why does my JSON show a validation error?",
        a: "The most common causes are: trailing commas after the last array item or object key (invalid in JSON, valid in JS), single-quoted strings (JSON requires double quotes), unquoted object keys, or undefined/NaN values (not valid JSON types).",
      },
      {
        q: "Is my data sent to a server when I paste it here?",
        a: "No. The formatter runs entirely in your browser using JavaScript. Your JSON never leaves your device. There are no analytics, no logging, and no server-side processing of any kind.",
      },
      {
        q: "Can I format JSON that contains comments?",
        a: "Standard JSON does not allow comments. If your file is JSONC (JSON with Comments), used by tsconfig.json and VS Code settings, you'll need to strip the comments first. The formatter will flag them as syntax errors.",
      },
    ],
  },

  "base64": {
    about:
      "The ToolNinja Base64 tool is a free online Base64 encoder and decoder. Encode any text or data to Base64 format, or decode Base64 strings back to plain text — instantly, with no page reload.\n\nUse the Base64 encoder when you need to embed binary data in JSON APIs, create data URIs for images in CSS or HTML, encode credentials for HTTP Basic Authentication headers, or prepare data for email transmission. Use the Base64 decoder to inspect encoded strings in API responses, JWT token segments, or any Base64 encoded content you encounter during development.\n\nSupports both standard Base64 and Base64URL encoding (used in JWT tokens and URLs). The tool automatically handles padding and correctly encodes all Unicode characters.\n\nRuns entirely in your browser — your data never leaves your machine. No login, no server, no tracking.",
    useCases: [
      "Encoding credentials for HTTP Basic Authentication headers",
      "Embedding small images as data URIs directly in HTML or CSS",
      "Storing binary data safely inside JSON or XML payloads",
      "Decoding Base64-encoded strings from API responses or JWT tokens",
    ],
    tips: [
      "Standard Base64 uses + and / — URL-safe Base64 replaces them with - and _ for use in query strings and JWT tokens.",
      "Every 3 bytes of input produce exactly 4 Base64 characters. = padding characters make the output length a multiple of 4.",
      "Base64 increases data size by ~33%. Don't use it for large files.",
    ],
    faq: [
      {
        q: "Is Base64 a form of encryption?",
        a: "No. Base64 is encoding, not encryption. It is trivially reversible by anyone — there is no key, no secret, and no security involved. Never use it to protect sensitive data.",
      },
      {
        q: "What's the difference between Base64 and Base64 URL-safe?",
        a: "Standard Base64 uses + and / which have special meaning in URLs. URL-safe Base64 replaces + with - and / with _ so the encoded string can be used in URLs and HTTP headers without additional percent-encoding.",
      },
      {
        q: "Why does my decoded Base64 show garbled characters?",
        a: "This usually means the original data was binary (an image, file, or compressed payload) rather than plain text. Binary data can't be displayed as readable text — you'd need to save it as a file to use it.",
      },
      {
        q: "How do I Base64-encode a file, not just text?",
        a: "Use the Image to Base64 tool for images. For arbitrary files, you can use the command line: on macOS/Linux run `base64 filename`, on Windows run `certutil -encode filename output.txt`.",
      },
    ],
  },

  "url-encoder": {
    about:
      "The URL Encoder converts special characters in URLs and query strings to their percent-encoded equivalents (%20 for space, %3D for =, etc.) and back. Percent-encoding is required by RFC 3986 to ensure URLs remain valid when they contain characters outside the ASCII safe set.",
    useCases: [
      "Encoding query parameter values before appending them to a URL",
      "Decoding URLs copied from browser DevTools, logs, or curl output",
      "Building API request strings that contain special characters",
      "Decoding what a suspicious or complex-looking URL actually contains",
    ],
    tips: [
      "Encode only the query parameter values — not the entire URL. Encoding slashes and colons in the domain will break the URL.",
      "Spaces encode to %20 in standard percent-encoding and to + in application/x-www-form-urlencoded (HTML form data).",
      "Most modern browsers auto-encode URLs when you paste them, but HTTP clients like curl do not.",
    ],
    faq: [
      {
        q: "What is the difference between encodeURI and encodeURIComponent in JavaScript?",
        a: "encodeURI encodes a full URL — it leaves characters like /, ?, #, and & untouched because they are structural. encodeURIComponent encodes a query parameter value — it encodes everything except letters, digits, and - _ . ~ . Use encodeURIComponent for individual values, encodeURI for full URLs.",
      },
      {
        q: "Why does my URL break when I include an ampersand or equals sign in a query value?",
        a: "Ampersands (&) separate query parameters, and equals signs (=) separate keys from values. If those characters appear inside a parameter value, they must be percent-encoded (%26 and %3D respectively) so the server doesn't misinterpret them as parameter delimiters.",
      },
      {
        q: "When should I use + instead of %20 for spaces?",
        a: "The + sign represents a space only in the application/x-www-form-urlencoded format used by HTML forms. In standard URL percent-encoding (RFC 3986), spaces must be encoded as %20. Most modern APIs accept either, but %20 is more universally correct.",
      },
      {
        q: "Which characters are safe in a URL without encoding?",
        a: "Unreserved characters that never need encoding: A-Z, a-z, 0-9, hyphen (-), underscore (_), period (.), tilde (~). Everything else — including spaces, brackets, quotes, and non-ASCII characters — must be percent-encoded in query parameter values.",
      },
    ],
  },

  "regex-tester": {
    about:
      "The ToolNinja Regex Tester is a free online regular expression tester with live match highlighting. Test any regex pattern against a string and see all matches highlighted in real time as you type — no button press needed.\n\nWhether you need to quickly regex test a pattern, debug a complex regular expression, or use it as a regex web tool for JavaScript development — the results appear instantly. The match table shows every match with its exact index, length, and capture groups so you can verify your pattern precisely.\n\nUse it to test email validation regex, URL matching patterns, phone number formats, date patterns, and anything else your project requires. Replace mode lets you preview regex substitutions before using them in code. Supports all JavaScript regex flags: global (g), case-insensitive (i), multiline (m), and dotAll (s). A fast, privacy-first regex101 alternative.\n\nRuns 100% in your browser — your test strings and patterns never leave your machine. No login, no account required.",
    useCases: [
      "Testing email validation, URL matching and phone number regex patterns",
      "Using ready-made patterns for common validations — no regex knowledge needed",
      "Debugging complex regular expressions with live match highlighting",
      "Verifying regex capture groups before using them in JavaScript or Python code",
      "Testing regex replace patterns to preview substitution results",
      "Extracting data from logs, configuration files and API responses",
      "Learning regex syntax interactively with 40+ example patterns across 7 categories",
      "Understanding an unfamiliar regex pattern you inherited, using the plain-English 'Explain this regex' breakdown",
    ],
    tips: [
      "The g flag finds all matches — without it, only the first match is returned.",
      "The i flag makes the pattern case-insensitive.",
      "Named capture groups (?<name>pattern) make extraction code far more readable than numbered groups.",
      "Use ^ and $ anchors to match the full string — without them the pattern can match anywhere.",
      "Click 'Explain this regex' to get a token-by-token plain-English breakdown of any pattern, including quantifiers, groups, and character classes.",
    ],
    faq: [
      {
        q: "Why does my regex work in Python but not here?",
        a: "This tester uses JavaScript regex syntax. Python, PCRE, and .NET regex engines have slightly different syntax for features like lookaheads, named groups, and character class shorthands. For example, Python uses (?P<name>) for named groups while JavaScript uses (?<name>).",
      },
      {
        q: "What's the difference between .* and .*? (greedy vs lazy)?",
        a: ".* is greedy — it matches as many characters as possible. .*? is lazy — it matches as few characters as possible. Greedy matching is the default and often causes unexpected over-matching, especially in HTML parsing.",
      },
      {
        q: "How do I match a literal dot, bracket, or other special character?",
        a: "Escape it with a backslash: \\. matches a literal period, \\( matches a literal parenthesis. The characters that need escaping in regex are: . * + ? ^ $ { } [ ] | ( ) \\",
      },
      {
        q: "Why does my regex cause the page to freeze?",
        a: "Catastrophic backtracking — a regex engine can get stuck in exponential time on certain pattern and input combinations. Patterns like (a+)+ on a string like 'aaaaaab' are classic examples. Simplify nested quantifiers to fix it.",
      },
    ],
  },

  "color-converter": {
    about:
      "The Color Converter translates colors between HEX (#a855f7), RGB (rgb(168, 85, 247)), and HSL (hsl(280, 89%, 65%)) formats with a live color preview swatch. All three formats are valid CSS — the choice between them depends on context and readability preference.",
    useCases: [
      "Converting brand color hex codes from design tools into CSS variables",
      "Generating lighter or darker color variants by adjusting HSL lightness",
      "Matching colors between Figma (hex), Tailwind (HSL), and raw CSS",
      "Translating colors from color pickers that output RGB to the format your codebase uses",
    ],
    tips: [
      "HSL is the most intuitive format for programmatically generating color palettes — adjusting only the L value gives you tints and shades.",
      "HEX shorthand (#fff) is 3-digit when each pair of hex digits is the same — #aabbcc = #abc.",
      "CSS accepts all three formats interchangeably — use whichever is most readable in context.",
    ],
    faq: [
      {
        q: "When should I use HEX vs RGB vs HSL in CSS?",
        a: "HEX is the most compact and widely used in design tokens and design tools. RGB is useful when you need to programmatically manipulate color channels or add alpha transparency (rgba). HSL is the most human-readable for adjusting hue, saturation, and lightness — ideal for design systems and dynamic theming.",
      },
      {
        q: "What is the difference between RGB and RGBA?",
        a: "RGBA adds a fourth channel for alpha (opacity), where 0 is fully transparent and 1 is fully opaque. For example, rgba(168, 85, 247, 0.5) is 50% transparent purple. HEX also supports alpha as an 8-digit code (#a855f780), though browser support is slightly older.",
      },
      {
        q: "Why does the same HEX color look different on different screens?",
        a: "Color rendering varies with screen color profiles (sRGB, P3, etc.), brightness settings, and panel technology. OLED screens have deeper blacks and more saturated colors than IPS panels. Always test color choices on multiple devices for important UI work.",
      },
      {
        q: "How do I choose colors that meet WCAG accessibility contrast requirements?",
        a: "WCAG 2.1 requires a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text against its background. Use the Color Palette Generator to explore combinations, and verify contrast ratios with a dedicated accessibility checker. High-lightness colors on white and low-lightness colors on dark backgrounds typically pass.",
      },
    ],
  },

  "lorem-ipsum": {
    about:
      "The Lorem Ipsum Generator creates placeholder text for UI mockups, wireframes, and design prototypes. The classic lorem ipsum text is derived from Cicero's 'de Finibus Bonorum et Malorum' (45 BC), deliberately scrambled so readers focus on layout rather than content. Generate by paragraphs, sentences, or word count.",
    useCases: [
      "Filling text areas in design mockups before real copy is written",
      "Testing how a layout handles varying content lengths",
      "Generating seed data for development databases",
      "Simulating realistic-looking content for screenshots and demos",
    ],
    tips: [
      "Use paragraph mode for body copy, word mode for short labels and button text.",
      "Vary the paragraph count to test how your layout handles both short and long content.",
    ],
    faq: [
      {
        q: "Why is Lorem Ipsum used instead of real text?",
        a: "Placeholder text lets designers and reviewers focus on layout, typography, and visual hierarchy without being distracted by the meaning of the words. Real text — even 'placeholder text' — invites copy editing. Lorem ipsum is nonsense, so the eye skips past it to assess the design.",
      },
      {
        q: "What language is Lorem Ipsum from?",
        a: "It is scrambled Latin from Cicero's philosophical treatise 'de Finibus Bonorum et Malorum' (On the Ends of Good and Evil), written in 45 BC. The most famous passage beginning 'Lorem ipsum dolor sit amet...' is a corrupted and rearranged excerpt from that text.",
      },
      {
        q: "When is Lorem Ipsum not appropriate?",
        a: "Avoid lorem ipsum in usability testing — participants may be confused by nonsense text and it can obscure UX problems related to readability or comprehension. Also avoid it in accessibility reviews, localization previews, and any design where text length is a critical constraint.",
      },
      {
        q: "Are there alternatives to Lorem Ipsum for specific contexts?",
        a: "Yes: for e-commerce, use product-like names and descriptions. For social apps, use realistic fake usernames and short posts. For dashboards, use plausible numbers and dates. Contextual placeholder content catches more design issues because it matches the shape and length of real data.",
      },
    ],
  },

  "jwt-decoder": {
    about:
      "The ToolNinja JWT Decoder is a free online JSON Web Token decoder. Paste any JWT and instantly see the decoded header, payload, and signature in color-coded sections — purple for header, blue for payload, red for signature.\n\nUse it to decode JWT tokens when debugging authentication issues, inspect JWT claims like sub, iat, exp, and aud, check JWT expiry time in human readable format, or verify the token structure before implementing JWT validation in your code. The expiry countdown tells you immediately if a token is still valid or has already expired.\n\nUnlike some online JWT tools, ToolNinja's JWT decoder runs 100% in your browser using JavaScript — your token, including any sensitive claims like user IDs, roles, and permissions, never leaves your machine. It's a privacy-first alternative to jwt.io for developers who work with sensitive authentication tokens.\n\nNo login, no account, no server calls. Just paste and decode.",
    useCases: [
      "Debugging authentication failures by inspecting what claims the token contains",
      "Checking whether a token is expired without waiting for an API call to fail",
      "Understanding what data your identity provider (Auth0, Cognito, Clerk) puts in the payload",
      "Verifying the algorithm field in the header during a security review",
    ],
    tips: [
      "JWTs are Base64URL-encoded, not encrypted. Anyone who has the token can read the payload.",
      "The exp claim is a Unix timestamp — compare it to the current time to check expiry.",
      "Never store sensitive user data (passwords, SSNs, credit cards) in JWT claims.",
      "The signature validates that the token was issued by the expected server — but you need the secret key to verify it.",
      "Click 'Use in a cURL request' to quickly test an endpoint with this token, or convert straight to Python/JavaScript code",
    ],
    faq: [
      {
        q: "Does this tool verify the JWT signature?",
        a: "No. Signature verification requires the secret key or public key, which should never be shared with a browser-based tool. This decoder only reads the header and payload. Use your backend or a library like jsonwebtoken to verify signature integrity.",
      },
      {
        q: "What does 'Token Expired' mean?",
        a: "The exp (expiration) claim in the payload is a Unix timestamp. If the current time is past that timestamp, the token is expired and most APIs will reject it with a 401 Unauthorized response. You need to re-authenticate to get a fresh token.",
      },
      {
        q: "Is it safe to paste my production JWT here?",
        a: "The decoder runs entirely in your browser — nothing is sent to a server. That said, production JWTs contain real user data and grant access to real systems. Treat them like passwords: don't paste them into unfamiliar tools, and rotate them if you suspect exposure.",
      },
      {
        q: "What's the difference between HS256 and RS256?",
        a: "HS256 (HMAC-SHA256) uses a shared secret — both the issuer and verifier need the same key. RS256 (RSA-SHA256) uses a key pair — the issuer signs with a private key and anyone can verify with the public key. RS256 is preferred for multi-service architectures because services can verify tokens without holding the signing secret.",
      },
    ],
  },

  "markdown-preview": {
    about:
      "The Markdown Preview renders GitHub-Flavored Markdown (GFM) in real time. It supports headings, bold and italic text, code blocks, inline code, tables, blockquotes, task lists, strikethrough, and horizontal rules — the full GFM specification used by GitHub, GitLab, Notion, and most documentation platforms.\n\nA Contents panel automatically extracts every heading into a clickable table of contents, using the same lowercase-hyphenated anchor scheme GitHub itself generates — so the structure you see here matches how the headings will actually link once the document is on GitHub. Click any entry to jump straight to that section in the preview.",
    useCases: [
      "Writing and previewing README files before pushing to GitHub",
      "Drafting pull request descriptions with formatted tables and code blocks",
      "Checking table alignment before committing to a documentation site",
      "Writing blog posts in Markdown format before converting or publishing",
      "Exporting a finished document as a PDF via the browser's print dialog, or as standalone HTML",
      "Navigating a long document's structure via the auto-generated table of contents while editing",
    ],
    tips: [
      "Three backticks followed by a language name (```javascript) enables syntax-highlighted code blocks.",
      "Use | pipes to create tables — the preview renders them as proper HTML tables.",
      "- [ ] creates an unchecked task list item, - [x] creates a checked one.",
      "Export PDF opens a clean, print-formatted version in a new tab and triggers your browser's print dialog — choose 'Save as PDF' as the destination.",
      "The Contents button only appears once your document has at least one heading — it's hidden for short documents where a table of contents wouldn't help.",
    ],
    faq: [
      {
        q: "What is GitHub Flavored Markdown (GFM)?",
        a: "GFM is a superset of standard CommonMark Markdown that adds tables, strikethrough (~~text~~), task lists (- [ ]), fenced code blocks with language identifiers, and autolinks. It is the spec used by GitHub, GitLab, and most developer documentation platforms. This tool renders GFM spec.",
      },
      {
        q: "How do I add syntax highlighting to code blocks?",
        a: "Open a fenced code block with three backticks followed immediately by the language name: ```javascript, ```python, ```sql, etc. The renderer uses the language identifier to apply syntax coloring. Without a language name, the block is rendered as plain monospace text.",
      },
      {
        q: "Why doesn't my Markdown table render correctly?",
        a: "Tables require a header row, a separator row of dashes (---), and content rows — all separated by pipe characters (|). Every row must have the same number of columns. The separator row controls alignment: --- for left, :---: for center, ---: for right.",
      },
      {
        q: "What is the difference between Markdown and MDX?",
        a: "Markdown is a plain-text format converted to HTML. MDX (Markdown + JSX) is an extension that lets you import and use React components inside Markdown files — primarily used in Next.js, Gatsby, and Astro documentation sites. Standard Markdown processors don't understand JSX syntax.",
      },
    ],
  },

  "timestamp-converter": {
    about:
      "The Unix Timestamp Converter translates between Unix epoch timestamps (integer seconds or milliseconds since January 1, 1970 UTC) and human-readable dates. Unix timestamps are the standard time representation in databases, APIs, JWT tokens, server logs, and most programming languages.\n\nA World Clock section shows the converted timestamp across a dozen major time zones simultaneously — UTC, US and European cities, and key Asia-Pacific zones — so you can see what a given moment looks like for a distributed team or a global user base without opening a separate timezone converter.",
    useCases: [
      "Converting timestamps from API responses or database records to readable dates",
      "Debugging JWT token expiry — the exp and iat claims are Unix timestamps",
      "Generating timestamp values for date range queries in SQL or APIs",
      "Understanding what a numeric timestamp in a log file actually represents",
      "Checking what a scheduled job or meeting time looks like across a distributed team's time zones",
    ],
    tips: [
      "JavaScript timestamps are in milliseconds — divide by 1000 for Unix seconds.",
      "The year 2038 problem affects 32-bit signed integers, which overflow on January 19, 2038. 64-bit systems are not affected.",
      "The World Clock grid updates automatically whenever you convert a timestamp — no separate lookup needed.",
    ],
    faq: [
      {
        q: "Why does JavaScript use milliseconds but most APIs use seconds?",
        a: "Unix time was originally defined in seconds for 32-bit systems. JavaScript's Date.now() returns milliseconds to provide sub-second precision for web performance APIs and animations. When calling REST APIs, always check the documentation — most use second-precision Unix timestamps, while JavaScript timestamps need dividing by 1000.",
      },
      {
        q: "What is the Year 2038 problem?",
        a: "Unix time stored as a 32-bit signed integer overflows on January 19, 2038 at 03:14:07 UTC. Any system still using 32-bit timestamps for dates beyond that point will wrap around to a negative number, representing a date in 1901. 64-bit systems and modern databases are not affected — the overflow doesn't occur until the year 292 billion.",
      },
      {
        q: "How do I convert a JavaScript Date object to a Unix timestamp?",
        a: "Use Date.now() for the current time in milliseconds, or new Date().getTime(). To get Unix seconds: Math.floor(Date.now() / 1000). To convert a specific date: Math.floor(new Date('2024-01-15').getTime() / 1000). To go the other direction: new Date(unixSeconds * 1000).",
      },
      {
        q: "What is the difference between UTC and local time in timestamps?",
        a: "Unix timestamps are always UTC (Coordinated Universal Time) — they represent seconds since January 1, 1970 UTC regardless of timezone. When you display a timestamp as a human-readable date, it gets converted to local time by default. Always store and compare timestamps in UTC; apply timezone offsets only for display.",
      },
    ],
  },

  "password-generator": {
    about:
      "The Password Generator creates cryptographically secure random passwords using the browser's built-in crypto.getRandomValues() API — the same source of entropy used by operating systems and security software. Unlike Math.random(), this is suitable for security-critical use cases.",
    useCases: [
      "Generating strong unique passwords for new accounts",
      "Creating API keys and secrets during development setup",
      "Producing bulk temporary passwords for user onboarding scripts",
      "Testing password strength requirements in your own app's validation logic",
      "Generating a memorable diceware-style passphrase for a master password or disk encryption",
    ],
    tips: [
      "16+ characters with all character types is sufficient for most accounts.",
      "For master passwords (password managers, disk encryption), use 24+ characters.",
      "A random 16-character password with full character set has ~95 bits of entropy — essentially uncrackable by brute force.",
      "Switch to Passphrase mode for a password you actually need to type or remember — NIST SP 800-63B (2025) recommends passphrases as a practical alternative to complex random strings.",
    ],
    faq: [
      {
        q: "How random are these passwords?",
        a: "They use crypto.getRandomValues(), the browser's cryptographically secure pseudorandom number generator (CSPRNG). This is the same entropy source used by TLS, SSH key generation, and operating system security functions — suitable for any security purpose.",
      },
      {
        q: "What makes a password 'strong'?",
        a: "Strength comes from entropy — the number of possible combinations. Length has more impact than character set complexity. A 20-character lowercase password has more entropy than a 12-character password with symbols. Uniqueness matters too — reusing passwords across sites makes any one breach expose all your accounts.",
      },
      {
        q: "Are generated passwords stored anywhere?",
        a: "No. Passwords are generated locally in your browser and never transmitted anywhere. The page has no backend, no analytics, and no network requests during password generation. Closing the tab permanently discards the passwords.",
      },
      {
        q: "Should I use a passphrase instead of a random password?",
        a: "Passphrases (4-5 random words like 'correct-horse-battery-staple') are easier to remember and can have comparable entropy to shorter random passwords. For accounts you type frequently without a password manager, a passphrase may be more practical — use the Passphrase mode above to generate one.",
      },
    ],
  },

  "uuid-generator": {
    about:
      "The ToolNinja UUID Generator generates UUID v4, UUID v7, and NanoID identifiers instantly — individually or in bulk up to 100 at a time.\n\nUUID v4 is fully random and the classic default. UUID v7 encodes a millisecond timestamp in its first 48 bits, making generated IDs sort chronologically — this has become the default recommendation for new database primary keys in 2026 because it avoids the random-insert performance penalty v4 causes on B-tree indexes. NanoID produces a much shorter, URL-safe random string — the better choice for public-facing identifiers like share links and invite codes, where a 36-character UUID is overkill.\n\nGenerate a single ID for quick use, or bulk generate up to 100 for seeding test databases or fixture data. 100% browser-based using the Web Crypto API for true cryptographic randomness. No login, no server calls required.",
    useCases: [
      "Primary keys for database records in distributed or multi-writer systems",
      "Correlation IDs for tracing requests across microservices and logs",
      "File names for user-uploaded assets to prevent naming collisions",
      "Idempotency keys for payment APIs and write-once operations",
      "Short, URL-safe public identifiers (share links, invite codes) using NanoID mode",
      "Time-sortable primary keys using UUID v7 mode, without the database index fragmentation v4 causes",
    ],
    tips: [
      "The format is 8-4-4-4-12 hex digits: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx. The 4 indicates version 4, and the y is one of 8, 9, a, or b.",
      "For database primary keys, UUIDs have higher storage overhead than auto-increment integers but work safely in distributed systems without a central coordinator.",
      "For a new project in 2026 with no legacy v4 data to stay consistent with, default to UUID v7 for primary keys and NanoID for anything user-facing.",
    ],
    faq: [
      {
        q: "Can two generated UUIDs ever be the same?",
        a: "Theoretically yes, but practically no. The probability of a collision between two random v4 UUIDs is 1 in 2^122 (about 5x10^36). To have a 50% chance of a collision, you'd need to generate 2.7x10^18 UUIDs — far beyond any realistic system.",
      },
      {
        q: "What's the difference between UUID v1, v4, and v7?",
        a: "V1 is time-based and includes the machine's MAC address — deterministic but leaks information. V4 is fully random — historically the most widely used version. V7 encodes a millisecond timestamp in the first 48 bits, so generated IDs sort chronologically, which avoids the random-insert performance penalty v4 causes on database indexes — it's now the recommended default for new database primary keys.",
      },
      {
        q: "When should I use NanoID instead of a UUID?",
        a: "NanoID is a better fit for identifiers users actually see or type — share links, invite codes, short URLs — where a 36-character UUID is unnecessarily long. It's not time-ordered, so don't use it as a high-write table's primary key unless you also keep a separate created_at column for ordering.",
      },
      {
        q: "Should I use UUID or auto-increment integers for database IDs?",
        a: "Auto-increment integers are simpler and more storage-efficient. UUIDs are better when you need IDs generated client-side before writing to the database, when merging records from multiple sources, or when you don't want sequential IDs that expose record counts. If you do use UUIDs for a primary key, prefer v7 over v4 for better index locality.",
      },
      {
        q: "Is GUID the same as UUID?",
        a: "Yes. GUID (Globally Unique Identifier) is Microsoft's term for the same concept. A GUID and a UUID v4 are interchangeable in most contexts, though GUIDs are sometimes written without hyphens and may use uppercase hex digits.",
      },
    ],
  },

  "diff-checker": {
    about:
      "The Diff Checker compares two blocks of text line-by-line and highlights additions in green and removals in red, matching the familiar format of git diff output. It handles any plain text — code, config files, JSON, prose, or data — and shows the count of added and removed lines.",
    useCases: [
      "Comparing two versions of a config file to spot unintended changes",
      "Reviewing API response changes between environments (staging vs production)",
      "Checking what changed between two drafts of a document",
      "Validating data migrations by comparing before and after snapshots",
    ],
    tips: [
      "Paste minified JSON into the JSON Formatter first to make the diff more readable.",
      "Lines that changed will appear as a removal (red) followed by an addition (green) — there's no in-line word diff.",
    ],
    faq: [
      {
        q: "What is the difference between unified diff and inline diff formats?",
        a: "Unified diff (the git diff format) shows deletions and additions with - and + prefixes in a single stream with context lines. Inline diff shows both old and new text side by side, color-coding changes within each line. This tool uses the inline format for easy visual comparison.",
      },
      {
        q: "How does this differ from git diff?",
        a: "git diff compares file versions tracked by Git, with context about commits and branches. This tool compares any two plain text inputs directly — no Git repository or history required. It's useful for one-off comparisons where you have the two versions in clipboard or text form.",
      },
      {
        q: "Why do I see false differences caused by line endings?",
        a: "Windows uses CRLF (\\r\\n) line endings while Unix/macOS use LF (\\n). If one version came from Windows and the other from Unix, every line appears different even if the content is identical. The fix is to normalize line endings before comparing: in VS Code, click the CRLF indicator in the status bar to convert.",
      },
      {
        q: "Can I compare binary files or images with this tool?",
        a: "No. The diff checker is for plain text. Binary files (images, PDFs, compiled binaries) contain arbitrary bytes that render as mojibake or are completely invisible when treated as text. For binary comparison you need specialized tools like file hash comparison or binary diff utilities.",
      },
    ],
  },

  "css-animations": {
    about:
      "The CSS Animations library provides copy-paste ready HTML and CSS animation combinations with live previews. All animations use pure @keyframes with no JavaScript dependencies, no build tools, and no external libraries — paste the code and it works. Categories include buttons, loaders, text effects, cards, backgrounds, and micro-interactions.",
    useCases: [
      "Adding polished hover and loading animations without importing a library",
      "Building animated UI components for prototypes and demos quickly",
      "Learning CSS animation techniques by reading and modifying working examples",
      "Finding inspiration for motion design in web interfaces",
    ],
    tips: [
      "Add animation-play-state: paused with a :hover selector to pause animations on hover.",
      "Use @media (prefers-reduced-motion: reduce) to disable animations for users who have requested reduced motion in their OS settings.",
      "CSS animations are GPU-accelerated when using transform and opacity — avoid animating layout properties like width, height, or top.",
    ],
    faq: [
      {
        q: "What is the difference between CSS transitions and CSS animations?",
        a: "CSS transitions animate a property from one state to another when a trigger occurs (like :hover). They go in one direction with a start and end state. CSS animations use @keyframes to define multiple intermediate steps, can loop, can play automatically without a trigger, and offer full control over timing and direction.",
      },
      {
        q: "Why should I prefer animating transform and opacity instead of layout properties?",
        a: "Animating properties like width, height, top, or left triggers layout recalculation on every frame — an expensive operation. Animating transform (translate, scale, rotate) and opacity is handled by the GPU compositor and does not touch the layout engine, resulting in smoother 60fps animations with far less CPU overhead.",
      },
      {
        q: "How do I respect prefers-reduced-motion for accessibility?",
        a: "Wrap motion-heavy styles in a media query: @media (prefers-reduced-motion: no-preference) { /* animation here */ }. Users who enable 'reduce motion' in their OS accessibility settings will not receive the animation. Alternatively, use @media (prefers-reduced-motion: reduce) to explicitly disable or slow down animations for those users.",
      },
      {
        q: "How do I pause a CSS animation on hover?",
        a: "Add animation-play-state: paused to the :hover rule of the animated element: .element:hover { animation-play-state: paused; }. This freezes the animation at its current frame and resumes from there when the cursor leaves.",
      },
    ],
  },

  "hash-generator": {
    about:
      "The ToolNinja Hash Generator is a free online hash calculator supporting MD5, SHA-1, SHA-256, SHA-512 and other cryptographic hash algorithms. Enter any text and instantly generate its hash value — useful for checksums, data integrity verification, and security research.\n\nUse the MD5 generator for file checksums and non-security fingerprinting, the SHA-256 generator for data integrity verification and digital signatures, or SHA-512 when you need maximum hash length. All hashing runs using the Web Crypto API built into your browser for accurate, standard-compliant results.\n\nCommon use cases include verifying downloaded file integrity by comparing checksums, generating content hashes for cache busting in web development, creating hash-based identifiers, and understanding how different algorithms compare in output length and security properties.\n\nA File mode hashes an uploaded file directly — drag it in and get its checksum without needing a command-line tool, useful for verifying a download against a publisher's published SHA-256 sum. The file itself is read and hashed entirely in your browser and never uploaded anywhere.\n\nEverything runs 100% in your browser. Your input data — no matter how sensitive — never leaves your machine. No login required.",
    useCases: [
      "Verifying file integrity by comparing checksums before and after transfer",
      "Generating content-based cache keys for assets or API responses",
      "Creating deterministic identifiers from arbitrary string inputs",
      "Understanding what algorithm produced a stored hash",
      "Computing an HMAC signature to verify a webhook payload from Stripe, GitHub, or similar services",
      "Checking a downloaded file against a publisher's published checksum without a command-line tool",
    ],
    tips: [
      "SHA-1 is cryptographically broken — don't use it for security. SHA-256 is the current standard for general-purpose integrity checks.",
      "Two different inputs that produce the same hash are called a collision. SHA-256 and SHA-512 have no known practical collisions.",
      "Hashing is not encryption — you cannot recover the original input. Use it for integrity, not confidentiality.",
      "Switch to HMAC mode and paste the raw request body plus your webhook secret to verify a Stripe/GitHub signature header matches — compare the result byte-for-byte, not just visually.",
      "Use File mode to verify a download's checksum directly — no need to open a terminal for a one-off sha256sum check.",
    ],
    faq: [
      {
        q: "What is the difference between SHA-256 and SHA-512?",
        a: "SHA-256 produces a 256-bit (64 hex character) hash and is the most widely used hash function. SHA-512 produces a 512-bit (128 hex character) hash and offers a larger security margin. For most applications SHA-256 is sufficient. SHA-512 can be faster on 64-bit processors for large inputs due to its 64-bit word size.",
      },
      {
        q: "Can I reverse a hash back to the original input?",
        a: "No. Cryptographic hash functions are one-way — they are specifically designed to be computationally infeasible to reverse. The only practical attack is a brute-force or dictionary search, which is why short or common inputs (like simple passwords) can sometimes be looked up in rainbow tables.",
      },
      {
        q: "Is SHA-256 the same as HMAC-SHA256?",
        a: "No. SHA-256 is a plain hash function — given the same input, anyone gets the same output. HMAC-SHA256 is a keyed message authentication code that incorporates a secret key into the hash. HMAC output depends on both the message and the key, so only parties with the key can verify the hash. JWT uses HMAC-SHA256 for signature generation.",
      },
      {
        q: "Why is MD5 not included?",
        a: "MD5 is cryptographically broken — practical collision attacks exist, meaning two different inputs can be crafted to produce the same hash. It should not be used for security purposes. SHA-256 is the correct replacement. MD5 persists in legacy file checksums, but for any new use case choose SHA-256 or better.",
      },
    ],
  },

  "number-base-converter": {
    about:
      "The Number Base Converter translates integers between binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16). These four numeral systems cover the vast majority of computing use cases — from low-level bit manipulation to memory addresses, file permissions, and color codes.\n\nA Bitwise Operations panel takes the converted value as operand A and computes AND, OR, XOR, NOT, and left/right shifts against a second operand — with a selectable 8/16/32/64-bit width so results match the fixed-width behavior most languages actually use, rather than JavaScript's arbitrary-precision BigInt default.",
    useCases: [
      "Converting hex color values (#a855f7) to RGB decimal components",
      "Understanding binary representations when working with bitwise operations",
      "Converting Unix file permission octals (755, 644) to understand what they mean",
      "Working with memory addresses and CPU registers in systems programming",
      "Computing an AND/OR/XOR/shift result at a specific bit width without opening a REPL",
    ],
    tips: [
      "Hex digits A-F represent decimal 10-15. One hex digit = 4 binary bits (a nibble).",
      "Binary inputs can use spaces for readability (1010 1111) — spaces are ignored during conversion.",
      "Match the bit width to your target language's integer type (e.g. 32 for a C int, 64 for a Java long) — AND/OR/XOR/NOT results depend on it, since they're computed within that fixed width rather than arbitrary precision.",
    ],
    faq: [
      {
        q: "Why do computers use binary instead of decimal?",
        a: "Computer hardware is built from transistors that are either on (1) or off (0). Binary maps directly to this two-state physical reality. Decimal would require 10 distinct voltage levels per digit — far more complex and error-prone to build reliably at the scale of billions of transistors.",
      },
      {
        q: "What is hexadecimal primarily used for in programming?",
        a: "Hex is a compact representation of binary — each hex digit maps exactly to 4 bits. It appears in: memory addresses (0x7ffe8a3b), color codes (#ff5500), byte values in networking (MAC addresses, IP packets), and bitmask constants. It bridges the gap between the unreadable binary and the less-compact decimal.",
      },
      {
        q: "How do I mentally convert binary to hex without calculating?",
        a: "Group binary digits in sets of 4 from the right: 1010 1111 = AF in hex. Each group of 4 bits maps to one hex digit: 0000=0, 0001=1, ..., 1010=A, 1011=B, 1100=C, 1101=D, 1110=E, 1111=F. Memorizing these 16 mappings makes binary-to-hex conversion instant.",
      },
      {
        q: "How does 2's complement affect negative numbers in binary?",
        a: "Computers represent negative integers using 2's complement: flip all bits of the positive number, then add 1. For an 8-bit integer, -1 is 11111111 and -128 is 10000000. This system makes addition hardware work for both positive and negative numbers without special cases. This is why uint8 goes 0-255 but int8 goes -128 to 127.",
      },
    ],
  },

  "string-case-converter": {
    about:
      "The String Case Converter transforms text between every common programming naming convention: camelCase, PascalCase, snake_case, SCREAMING_SNAKE_CASE, kebab-case, COBOL-CASE, dot.case, Title Case, UPPERCASE, and lowercase. It intelligently splits compound words regardless of the source format.",
    useCases: [
      "Renaming variables when switching languages (Python uses snake_case, JS uses camelCase)",
      "Converting API field names to match your codebase's convention",
      "Transforming database column names into JSON keys for API responses",
      "Normalizing user-supplied input strings to a consistent internal format",
    ],
    tips: [
      "Input can be any mix of formats — the converter handles camelCase, PascalCase, snake_case, and space-separated words as input.",
      "kebab-case is required for CSS class names and HTML attributes. camelCase is required for JavaScript identifiers.",
    ],
    faq: [
      {
        q: "Why do different programming languages use different naming conventions?",
        a: "Naming conventions evolved independently with each language's community. Python's PEP 8 standardized snake_case for readability. JavaScript inherited camelCase from Java. CSS adopted kebab-case because hyphens are not operators in CSS. Databases favor snake_case for SQL compatibility. Each convention also reflects the language's syntax constraints — hyphens are invalid in JS identifiers, for example.",
      },
      {
        q: "What is the difference between camelCase and PascalCase?",
        a: "Both concatenate words without separators and capitalize the first letter of each word — except camelCase keeps the very first letter lowercase (myVariableName) while PascalCase capitalizes everything (MyClassName). PascalCase is also called UpperCamelCase or StudlyCase. In most languages, PascalCase is for types and classes while camelCase is for variables and functions.",
      },
      {
        q: "When should I use SCREAMING_SNAKE_CASE?",
        a: "SCREAMING_SNAKE_CASE (all caps with underscores) is the standard for constants and environment variables — MAX_RETRIES, DATABASE_URL, API_KEY. The all-caps convention signals that the value should not change at runtime. In Python it's the recommended style for module-level constants per PEP 8.",
      },
      {
        q: "How does the converter handle already-mixed input?",
        a: "The converter tokenizes the input by splitting on case transitions (camelCase), underscores, hyphens, and spaces — then rejoins the tokens in the target format. So 'myAPIKey', 'my_api_key', 'my-api-key', and 'My Api Key' all produce the same token list [my, api, key] before being reformatted.",
      },
    ],
  },

  "json-to-typescript": {
    about:
      "The JSON to TypeScript converter automatically generates TypeScript interface definitions from any JSON object or array. It handles nested objects, arrays, union types from mixed arrays, and optional fields — saving the tedious manual work of writing types by hand from API responses.\n\nBeyond TypeScript, it also generates Python dataclasses, Go structs, and Zod schemas from the same JSON — switch languages with one click, quicktype-style, without re-pasting your sample data. The Zod output goes a step further than a plain type: it's runtime-checkable validation code, with string fields that look like an email, URL, UUID, or ISO datetime automatically getting the matching Zod validator (z.string().email(), .url(), .uuid(), .datetime()) instead of a bare z.string().",
    useCases: [
      "Creating TypeScript interfaces from API response payloads",
      "Generating types from database query results or fixture data",
      "Getting a typed starting point when adding TypeScript to an existing JavaScript project",
      "Quickly typing third-party API responses you don't control",
      "Generating Python dataclasses or Go structs from the same JSON response for a polyglot backend",
      "Generating a Zod schema to validate API responses at runtime, not just type them at compile time",
    ],
    tips: [
      "Paste a real API response to generate accurate types — the generator infers types from actual values.",
      "For arrays with mixed element types, the generator creates union types (string | number).",
      "Review generated types — null values produce type | null, which may need adjustment based on your API contract.",
      "Switch the language tab to Python, Go, or Zod to generate dataclasses, structs, or a runtime schema from the exact same JSON input.",
      "Zod's format detection (email, URL, UUID, datetime) is based on the sample values you paste — always double check it against your actual API contract rather than trusting it blindly.",
    ],
    faq: [
      {
        q: "Can generated interfaces replace manually written types?",
        a: "They give you a solid starting point, but should be reviewed. The generator infers types from a single sample — it can't know that a field is optional (it may just be missing from that response), that an array can be empty, or that a field typed as string | null is actually always a string in production. Treat generated types as a draft.",
      },
      {
        q: "How are null values handled in generated types?",
        a: "If a field's value is null in the sample JSON, the generator produces the type null. In practice this is almost always wrong — the field is usually string | null or number | null based on non-null values in other responses. Check each nullable field and update the type to match your actual API contract.",
      },
      {
        q: "How are deeply nested objects handled?",
        a: "Nested objects generate nested interfaces. For example, { user: { name: 'Alice', role: { id: 1 } } } produces an interface Root with a user: User property, a User interface with name: string and role: Role, and a Role interface with id: number. The depth is unlimited.",
      },
      {
        q: "How are arrays of mixed types handled?",
        a: "Mixed-type arrays produce union types: an array like [1, 'hello', true] generates (number | string | boolean)[]. Homogeneous arrays produce clean types like string[]. If you see unexpected union types, check whether your sample data truly contains mixed element types or whether you need to provide a more representative sample.",
      },
    ],
  },

  "json-yaml": {
    about:
      "The JSON <-> YAML Converter transforms data between JSON (JavaScript Object Notation) and YAML (YAML Ain't Markup Language) formats instantly. YAML uses indentation for structure and is favored for config files due to readability. JSON uses braces and brackets and is the standard for APIs and data interchange.",
    useCases: [
      "Converting Docker Compose or Kubernetes manifests between YAML and JSON",
      "Transforming GitHub Actions or CI/CD pipeline configs",
      "Reading YAML config files in tools and runtimes that only accept JSON",
      "Migrating application config from one format to the other",
    ],
    tips: [
      "YAML is a superset of JSON — valid JSON is also valid YAML, but YAML supports additional features like anchors (&) and aliases (*) that JSON does not.",
      "YAML indentation must be consistent — mixing tabs and spaces causes parse errors.",
    ],
    faq: [
      {
        q: "When should I use YAML vs JSON for config files?",
        a: "YAML is preferred for human-edited config files: it supports comments, is less noisy (no quotes around simple strings, no braces), and is easier to read at a glance. JSON is preferred for machine-generated or API-transmitted data: it is stricter, has no ambiguity, and is natively supported in every language without a library. Use YAML where humans write it, JSON where machines do.",
      },
      {
        q: "Does YAML support all JSON features?",
        a: "YAML is a superset of JSON — every valid JSON document is also valid YAML. YAML adds features JSON lacks: comments (#), multi-line strings (| and >), anchors and aliases (&name and *name for reuse), and more flexible quoting rules. The reverse is not true: YAML anchors and unquoted strings don't translate to JSON.",
      },
      {
        q: "Why does my YAML parse to unexpected types?",
        a: "YAML auto-detects types from context. Bare values like true, false, null, yes, no, on, off are parsed as booleans or null. Numbers without quotes become integers or floats. Strings that look like those values must be quoted: 'true', 'no', '1.0'. This is a common YAML gotcha — always quote values that should stay as strings.",
      },
      {
        q: "What are YAML anchors and aliases?",
        a: "Anchors (&name) mark a value for reuse, and aliases (*name) reference it later in the same file. For example, defaults: &defaults env: production followed by staging: <<: *defaults env: staging merges the defaults and overrides env. This DRY pattern is common in complex CI/CD and Kubernetes configs, but is not supported in JSON.",
      },
    ],
  },

  "qr-code-generator": {
    about:
      "The QR Code Generator creates QR codes from any URL or text string with configurable size, foreground and background colors, and error correction levels. QR codes can store up to approximately 4,000 characters and remain scannable even if part of the code is damaged, depending on the error correction level selected.\n\nYou can also embed a center logo — upload a small image and it's composited onto the middle of the code with a clean background pad behind it. Adding a logo automatically switches error correction to H (~30% damage recovery), since the logo itself covers part of the code's data area and needs that extra recovery margin to stay reliably scannable.",
    useCases: [
      "Creating scannable links for print materials, posters, and business cards",
      "Generating QR codes for Wi-Fi credentials (SSID and password) so guests can join without typing a password",
      "Linking physical products, labels, or packaging to digital resources",
      "Creating quick-scan links for presentations and conference materials",
      "Building digital business cards with the Contact (vCard) mode for conference badges",
      "Generating event invites with the Event mode so scanning adds the date directly to a calendar",
      "Adding a brand logo to a QR code for marketing materials without breaking scannability",
    ],
    tips: [
      "Error correction level L is sufficient for clean digital display. Use H for printed codes that might get scratched or partially covered.",
      "Higher error correction makes codes denser and harder to scan from a distance — use the lowest level that works for your use case.",
      "Always test your generated QR code with a phone before printing.",
      "Keep an embedded logo modest in size — a large overlay is the most common reason a logo'd QR code stops scanning, even at error correction H.",
    ],
    faq: [
      {
        q: "What is the maximum amount of data a QR code can store?",
        a: "A QR code can store up to 7,089 numeric digits, 4,296 alphanumeric characters, or 2,953 bytes of binary data. In practice, URLs are the most common use case and most URLs fit comfortably. Shorter URLs produce less dense codes that scan more reliably from a distance.",
      },
      {
        q: "What do the error correction levels L, M, Q, H mean?",
        a: "Error correction levels control how much damage a QR code can sustain and still be readable. L (Low): 7% damage recovery. M (Medium): 15%. Q (Quartile): 25%. H (High): 30%. Higher levels make codes denser. Use L for clean digital displays, M or Q for print, and H for logo-overlaid or potentially damaged codes.",
      },
      {
        q: "Why does my QR code fail to scan?",
        a: "Common causes: insufficient contrast between foreground and background (needs at least 50% contrast ratio), code is too small relative to the scanning distance, error correction too low for a damaged or complex design, or camera focus issues. Test with multiple phones and apps. Always use a dark foreground on a light background.",
      },
      {
        q: "Can I embed a logo in the middle of a QR code?",
        a: "Yes, because QR codes have built-in error correction. If the logo covers less than ~30% of the code area and you use Error Correction Level H, the code remains scannable despite the obscured region. Design tools that generate logo QR codes exploit this property — the logo sits in the covered area and error correction reconstructs the missing data.",
      },
      {
        q: "How do I make a WiFi QR code?",
        a: "Switch to the WiFi tab, enter your network name (SSID), password, and encryption type, and the QR code updates live. Scanning it with a phone camera offers to join the network directly — no need to say the password out loud or type it on a screen.",
      },
      {
        q: "How do I make a QR code for my contact info?",
        a: "Switch to the Contact tab and fill in name, phone, email, and optionally company, title, and website. This generates a vCard-format QR code — scanning it on most phones offers to save the details directly to Contacts, which is why it works well on business cards and conference badges.",
      },
    ],
  },

  "html-entity": {
    about:
      "The HTML Entity Encoder converts special characters like <, >, &, and \" to their HTML entity equivalents (&lt; &gt; &amp; &quot;) and back. HTML entities are required to display reserved markup characters as literal text rather than having them interpreted as HTML tags.",
    useCases: [
      "Preventing XSS vulnerabilities when rendering user-supplied content in HTML",
      "Displaying code samples containing HTML tags in documentation or blog posts",
      "Preparing text from databases or APIs for safe insertion into HTML",
      "Encoding special characters for use in HTML attributes",
    ],
    tips: [
      "Always encode user-supplied content before inserting it into HTML — this is one of the most important XSS prevention techniques.",
      "Named entities (&amp;) are more readable than numeric entities (&#38;) — use named where available.",
      "Modern frameworks like React escape HTML automatically — manual encoding is mainly needed for raw HTML string construction.",
    ],
    faq: [
      {
        q: "What is an HTML entity?",
        a: "An HTML entity is a special sequence of characters that represents a symbol in HTML. Entities start with & and end with ;. Named entities like &amp;, &lt;, &gt;, &quot; are human-readable. Numeric entities like &#38; (decimal) or &#x26; (hex) reference the Unicode code point directly and work for any character.",
      },
      {
        q: "Why is HTML encoding important for security?",
        a: "If user-supplied text containing < or > characters is inserted into HTML without encoding, it can be interpreted as HTML tags — creating an XSS (Cross-Site Scripting) vulnerability. An attacker can inject <script> tags that execute arbitrary JavaScript in other users' browsers. Encoding converts < to &lt; so it renders as text, not a tag.",
      },
      {
        q: "Do I need HTML entities in React or Vue?",
        a: "Usually no. React and Vue escape all text content automatically when you use JSX or template expressions ({{ }}). The risk only appears when using dangerouslySetInnerHTML (React) or v-html (Vue) — those bypass escaping deliberately and require you to sanitize or encode input yourself.",
      },
      {
        q: "What is the difference between &nbsp; and a regular space?",
        a: "&nbsp; (non-breaking space) is a space that prevents line breaks at that position and is not collapsed by HTML (regular spaces adjacent to each other collapse to one). Use &nbsp; between words you want to keep together on one line (like '10&nbsp;kg') or when you need multiple consecutive spaces that won't be collapsed by the HTML renderer.",
      },
    ],
  },

  "cron-tester": {
    about:
      "The CRON Expression Tester parses cron schedule expressions and previews the next upcoming run times in human-readable format. Cron expressions have five fields controlling minute, hour, day-of-month, month, and day-of-week, with special characters for ranges, steps, and lists.",
    useCases: [
      "Verifying that a scheduled job will run at the expected times before deploying",
      "Debugging why a cron job isn't firing when expected",
      "Building cron expressions interactively without memorizing field order",
      "Checking run frequency — how many times per hour, day, or week a schedule runs",
    ],
    tips: [
      "The classic 5-field format is: minute hour day month weekday (0-59, 0-23, 1-31, 1-12, 0-7).",
      "*/5 in the minute field means 'every 5 minutes'. 0,30 means 'at minute 0 and 30'.",
      "Some platforms (AWS EventBridge, Quartz) add a 6th field for seconds or year — check your platform's documentation.",
    ],
    faq: [
      {
        q: "What does */5 mean in a cron expression?",
        a: "The */ syntax means 'every N units'. */5 in the minute field fires at minutes 0, 5, 10, 15, ..., 55. In the hour field it fires every 5 hours. The step value after the slash divides the full range into intervals. You can also restrict the range: 0-30/5 fires every 5 minutes only during the first half of each hour.",
      },
      {
        q: "Why is 0 and 7 both Sunday in the weekday field?",
        a: "Different cron implementations historically used either 0 or 7 for Sunday. Most modern cron parsers accept both — 0 and 7 are treated as Sunday. Monday is 1, Tuesday is 2, and so on through Saturday as 6. To avoid ambiguity, use 1-5 for weekdays and 0 or 6 for weekend days.",
      },
      {
        q: "What is the difference between @daily, @weekly, and a manual expression?",
        a: "@daily is shorthand for 0 0 * * * (midnight every day). @weekly is 0 0 * * 0 (midnight every Sunday). @hourly is 0 * * * * (top of every hour). @monthly is 0 0 1 * * (midnight on the 1st). These named schedules are more readable than manual expressions and are supported by most modern cron implementations.",
      },
      {
        q: "Does cron run in UTC or local time?",
        a: "Standard cron (as configured in /etc/crontab and user crontabs) runs in the server's local timezone. Cloud schedulers (AWS EventBridge, Google Cloud Scheduler, GitHub Actions) typically run in UTC. Always specify the timezone explicitly in platform schedulers to avoid surprises around daylight saving time transitions.",
      },
    ],
  },

  "http-status-codes": {
    about:
      "The HTTP Status Codes reference lists all standard HTTP response status codes with their official IANA-registered meanings. Status codes are grouped into five classes: 1xx informational, 2xx success, 3xx redirection, 4xx client error, and 5xx server error. Use the search to find any code instantly.",
    useCases: [
      "Looking up what a specific error code means during API debugging",
      "Choosing the correct status code when designing an API endpoint",
      "Understanding redirect behavior differences (301 vs 302 vs 307 vs 308)",
      "Distinguishing client errors (4xx, the caller's fault) from server errors (5xx, your fault)",
    ],
    tips: [
      "301 is a permanent redirect (browsers and search engines cache it). 302 is temporary. Use 308 for permanent redirects where the method must be preserved.",
      "404 means the resource doesn't exist. 403 means it exists but you're not allowed. 401 means you need to authenticate first.",
      "429 Too Many Requests is the correct code for rate limiting — pair it with a Retry-After header.",
    ],
    faq: [
      {
        q: "What is the difference between 401 and 403?",
        a: "401 Unauthorized means the request lacks valid authentication — you need to log in or provide a token. 403 Forbidden means the server understood the request and knows who you are, but you are not allowed to access that resource. A logged-in non-admin hitting an admin page gets 403, not 401.",
      },
      {
        q: "What is the difference between 301 and 302 redirects for SEO?",
        a: "301 is a permanent redirect — browsers and search engines cache it and transfer most link equity (PageRank) to the destination. 302 is temporary — search engines re-check the original URL each time and don't transfer link equity. Use 301 when a page has permanently moved, 302 for A/B tests and temporary maintenance pages.",
      },
      {
        q: "When should I return 404 vs 410?",
        a: "404 Not Found means the resource doesn't exist — the URL may have been valid in the past or may be valid in the future. 410 Gone signals that the resource permanently no longer exists and will not return. Search engines drop 410 URLs from their index faster than 404 URLs, making 410 the better choice for permanently deleted content.",
      },
      {
        q: "What HTTP status code should I use for a rate limit response?",
        a: "429 Too Many Requests is the correct code for rate limiting per RFC 6585. Always include a Retry-After header indicating when the client can retry (either a number of seconds or an HTTP date). Some APIs historically used 503 Service Unavailable for rate limiting, but 429 is the standard.",
      },
    ],
  },

  "chmod-calculator": {
    about:
      "The ToolNinja Chmod Calculator is a free online Linux file permission calculator. Convert between symbolic notation (rwxr-xr-x) and octal values (755, 644, 777) visually by clicking checkboxes — no need to memorize octal values or permission combinations.\n\nUse it as a chmod calculator to find the right permission for any file or directory. Calculate chmod 755 for web server directories and executable scripts, chmod 644 for standard files and config files, chmod 600 for private SSH keys and sensitive credentials, or chmod 777 when you need full access (and understand the security implications). The Linux permission calculator shows Owner, Group and Other permissions side by side so you can see exactly what each user class can do.\n\nWhether you're working with rwxr-xr-x permissions and need the octal equivalent, or have an octal value and need to understand what symbolic permissions it represents — the chmod converter handles both directions instantly. Also supports special permission bits: setuid, setgid and sticky bit.\n\nA recursive command builder generates the exact chmod command for applying a permission to an entire directory tree — either a single chmod -R for uniform permissions, or a pair of find + chmod commands when directories and files need different permissions (the standard convention: directories keep execute so they can be traversed, files usually do not).\n\nRuns entirely in your browser — no login, no server calls. Your permission calculations stay completely private.",
    useCases: [
      "Setting correct permissions for web server files (644 for files, 755 for directories)",
      "Debugging 'Permission denied' errors in Linux and macOS environments",
      "Understanding what an octal permission string actually allows before applying it",
      "Writing deployment scripts that configure file permissions correctly",
      "Generating a find + chmod command pair to fix an entire directory tree with correct file vs. directory permissions",
    ],
    tips: [
      "Never use 777 (rwxrwxrwx) in production — it gives full access to everyone on the system.",
      "Web server files: 644 (rw-r--r--). Directories: 755 (rwxr-xr-x). Private config files: 600 (rw-------).",
      "The execute bit on a directory controls whether users can enter it (cd into it), not just list its contents.",
      "When fixing permissions recursively, use the split find + chmod commands rather than a single chmod -R — applying the same octal to both files and directories almost always makes files incorrectly executable.",
    ],
    faq: [
      {
        q: "What does the execute bit mean on a directory vs a file?",
        a: "On a file, the execute bit (x) allows the file to be run as a program or script. On a directory, it grants 'search' permission — the ability to traverse the directory (cd into it and access files inside by name). Without execute permission on a directory, you cannot cd into it or access any file inside, even if you can list it with read permission.",
      },
      {
        q: "What is the difference between chmod 644 and chmod 755?",
        a: "644 (rw-r--r--): owner can read and write, group and others can only read. This is the correct permission for web-served files — the web server can read them, but nothing can execute or modify them. 755 (rwxr-xr-x): owner can do everything, group and others can read and execute. Correct for directories and executable scripts.",
      },
      {
        q: "What is the setuid/setgid bit and when is it used?",
        a: "The setuid bit (4 in the leading digit, e.g. 4755) causes an executable to run with the owner's permissions rather than the caller's. The classic example is /usr/bin/passwd — ordinary users can change their passwords because passwd runs as root. setgid (2) does the same for group. These are powerful and should be used sparingly.",
      },
      {
        q: "Why do I get 'Permission denied' even as a sudo user?",
        a: "sudo grants root privileges for specific commands, but 'Permission denied' on a file read doesn't always mean permission bits — it can also mean the file's filesystem is mounted noexec or noread, SELinux/AppArmor is blocking access despite permissions, the file is owned by a different user than expected, or there is a permission issue on a parent directory.",
      },
    ],
  },

  "css-gradient": {
    about:
      "The CSS Gradient Generator creates linear, radial, and conic CSS gradients visually with multiple color stops and live code output. It generates copy-paste ready background-image CSS declarations compatible with all modern browsers — no vendor prefixes required for linear and radial gradients.\n\nThe \"From Image\" option extracts a gradient directly from an uploaded photo — it pulls the dominant colors out of the image and arranges them by hue into a ready-to-use linear gradient, a fast way to get a palette that actually matches a hero image or brand photo instead of picking colors from scratch.",
    useCases: [
      "Designing hero section backgrounds and full-bleed imagery replacements",
      "Creating button hover states with gradient fills",
      "Building progress bars, loading indicators, and visual meters",
      "Generating brand-consistent gradient palettes for design systems",
      "Extracting a matching gradient directly from a product photo or hero image",
    ],
    tips: [
      "Use conic gradients for pie charts and angular progress indicators.",
      "Add a solid fallback color (background-color) before the gradient for older browsers.",
      "Gradients in CSS are treated as images — they can be used anywhere background-image is accepted, including list-style-image.",
      "Use \"From Image\" to seed color stops from a photo, then fine-tune the extracted stops manually — it's a fast starting point, not a final answer.",
    ],
    faq: [
      {
        q: "What is the difference between linear, radial, and conic gradients?",
        a: "Linear gradients transition along a straight line (top to bottom, left to right, or any angle). Radial gradients radiate outward from a center point in an ellipse or circle. Conic gradients transition around a center point (like a pie chart or color wheel). Each serves different design purposes and they can be layered using multiple background-image values.",
      },
      {
        q: "How do I make a gradient with a hard color stop (no blend)?",
        a: "Set two color stops at the same position: background: linear-gradient(red 50%, blue 50%). This creates an instant cut between red and blue at the 50% mark with no blending transition. You can use this technique to create stripes, sharp boundaries, and checkerboard patterns.",
      },
      {
        q: "Can I animate a CSS gradient?",
        a: "CSS does not natively animate background gradients — they transition as discrete steps rather than smoothly interpolating. The workaround is to animate background-position on an oversized gradient: make a gradient twice as wide as the element and use animation to shift the background-position. This simulates a moving gradient efficiently.",
      },
      {
        q: "Do CSS gradients require vendor prefixes?",
        a: "No — not for modern browser targets (Chrome 26+, Firefox 16+, Safari 7+, Edge 12+). The -webkit- prefix for gradients was needed before 2013. If you're supporting very old Safari on iOS, you may encounter the old -webkit-linear-gradient syntax, but for any target from the last 10 years the unprefixed syntax is sufficient.",
      },
    ],
  },

  "image-to-base64": {
    about:
      "The Image to Base64 converter encodes image files (PNG, JPEG, GIF, SVG, WebP) to Base64 data URIs. A data URI embeds the image bytes directly in HTML or CSS, eliminating the need for a separate HTTP request. Supports drag-and-drop and click-to-upload.",
    useCases: [
      "Embedding small icons and logos in CSS to eliminate extra network requests",
      "Including images in HTML email templates (many clients block external image URLs)",
      "Storing images inline in JSON payloads or API responses",
      "Creating fully self-contained single-file HTML documents with embedded assets",
    ],
    tips: [
      "Data URIs increase file size by ~33% and bypass browser caching — only use them for small images (under ~5KB).",
      "SVGs are better included as inline <svg> elements than Base64 data URIs, since inline SVGs are directly styleable with CSS.",
      "The generated data URI format is: data:[mediatype];base64,[data] — paste it directly as an img src or CSS url().",
    ],
    faq: [
      {
        q: "Why do data URIs make images larger?",
        a: "Base64 encoding represents every 3 bytes of binary data as 4 ASCII characters — a 33% overhead. Additionally, the data: prefix and MIME type add a few extra bytes. Browser caching also doesn't apply to inline data URIs, so they are reloaded (though decoded inline) on every page load. Limit use to images smaller than 2-5KB.",
      },
      {
        q: "Can I use a data URI as an img src?",
        a: "Yes. Set the src attribute to the full data URI: <img src=\"data:image/png;base64,...\" alt=\"\">. The browser decodes and displays it as a regular image. The same URI works in CSS: background-image: url('data:image/png;base64,...').",
      },
      {
        q: "Does data URI embedding help with performance?",
        a: "Only for very small images. Each data URI eliminates one HTTP request, which was a meaningful win in the HTTP/1.1 era. With HTTP/2 multiplexing, multiple images load in a single connection, reducing the benefit of inlining. Use data URIs for tiny icons and logos; let HTTP/2 handle everything else as separate requests.",
      },
      {
        q: "Why does my SVG data URI not work in CSS backgrounds?",
        a: "SVGs in CSS background-image require URL encoding rather than Base64 when used as inline SVGs (without encoding, the < > and # characters break the URL). Either encode the SVG with Base64 (data:image/svg+xml;base64,...) or URL-encode the raw SVG text. The Base64 approach is universally supported and safer.",
      },
    ],
  },

  "sql-formatter": {
    about:
      "The SQL Formatter beautifies raw SQL queries with consistent indentation, keyword casing, and clause alignment. Paste minified or hand-written SQL and get readable, properly indented output in seconds. Supports MySQL, PostgreSQL, SQLite, BigQuery, Trino, and standard SQL dialects.",
    useCases: [
      "Formatting auto-generated SQL from ORMs before adding to code review",
      "Cleaning up long queries copied from database logs or profilers",
      "Standardizing keyword casing across a team's SQL codebase",
      "Making complex JOINs and subqueries readable for debugging",
    ],
    tips: [
      "Choose the correct dialect — MySQL uses backtick identifiers while PostgreSQL uses double quotes.",
      "Uppercase keywords (SELECT, FROM, WHERE) are the SQL standard and improve readability.",
      "After formatting, review for implicit joins (comma-separated FROM tables) and replace with explicit JOINs.",
    ],
    faq: [
      {
        q: "Does SQL formatting change the meaning or behavior of my query?",
        a: "No. SQL formatting only changes whitespace and keyword casing — it has no effect on query semantics or execution. The database parses and executes the formatted query identically to the original. Keyword case, indentation, and line breaks are all ignored by SQL parsers.",
      },
      {
        q: "Why do I need to select the correct SQL dialect?",
        a: "SQL dialects have syntax differences that affect parsing. MySQL uses backtick identifiers (SELECT \`column\`) while PostgreSQL and standard SQL use double quotes (SELECT \"column\"). BigQuery has its own syntax for arrays and structs. Selecting the wrong dialect may produce incorrect formatting or fail to parse dialect-specific syntax like window functions or CTEs.",
      },
      {
        q: "What is keyword case normalization and why does it matter?",
        a: "SQL keywords are case-insensitive — select, SELECT, and Select are identical to the parser. Normalization enforces a consistent convention: UPPERCASE is the traditional SQL style and distinguishes keywords from identifiers at a glance. lowercase is sometimes preferred in modern style guides. The formatter applies your chosen convention uniformly across the entire query.",
      },
      {
        q: "Can the formatter handle stored procedures, triggers, and CTEs?",
        a: "Yes for CTEs (WITH clauses) — most formatters handle these well. Stored procedures and triggers use procedural extensions (PL/pgSQL, T-SQL, PL/SQL) that vary significantly between databases and are harder to parse universally. Complex procedural code may format partially or not at all — focus formatting efforts on the SQL SELECT/INSERT/UPDATE/DELETE portions.",
      },
    ],
  },

  "color-palette": {
    about:
      "The Color Palette Generator creates harmonious color schemes from any base color using color theory relationships. Choose from complementary, analogous, triadic, split-complementary, tetradic, and monochromatic harmonies. Each palette shows HEX, RGB, and HSL values ready to copy.\n\nEvery swatch also shows a WCAG AA contrast badge, comparing the color against both white and black text and picking whichever passes — so you can see at a glance which palette colors are safe to use as a background behind body text and which need to stay decorative-only.",
    useCases: [
      "Picking a cohesive UI color scheme from a brand's primary color",
      "Generating accessible foreground/background color pairs",
      "Creating theme variables for design systems and CSS custom properties",
      "Exploring complementary accent colors for data visualizations",
      "Checking which palette colors pass WCAG AA before using them behind text",
    ],
    tips: [
      "Start with a mid-range saturation (40-60%) for the base — extreme saturation makes harmonics look garish.",
      "Monochromatic palettes (same hue, varied lightness) are the safest for UI backgrounds and text.",
      "Triadic palettes (3 colors 120 degrees apart) create vibrant contrast — use one as dominant, one as accent, one as neutral.",
      "The WCAG AA badge on each swatch shows the best of white-text or black-text contrast — a failing badge means avoid that color as a text background.",
    ],
    faq: [
      {
        q: "What is color theory and how does it apply to UI design?",
        a: "Color theory is the study of how colors relate to each other and affect human perception. It describes which colors look harmonious together (based on their positions on the color wheel) and how color choices affect mood, contrast, and readability. In UI design, color theory guides palette selection to ensure brand colors, backgrounds, text, and accents work together without clashing.",
      },
      {
        q: "What is the difference between complementary and analogous colors?",
        a: "Complementary colors sit opposite each other on the color wheel (e.g. purple and yellow). They create strong contrast and visual tension — effective for call-to-action buttons and emphasis. Analogous colors are adjacent on the wheel (e.g. blue, blue-green, green). They are naturally harmonious and calming — good for backgrounds and multi-element layouts.",
      },
      {
        q: "How do I create accessible color combinations?",
        a: "WCAG 2.1 requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text (18px+ or 14px+ bold). Use your palette colors for text/background pairs and verify the contrast ratio with an accessibility checker. Generally: dark text on light backgrounds or light text on dark backgrounds. Mid-range colors (50% lightness) are hardest to make accessible on either.",
      },
      {
        q: "What is the 60-30-10 rule for color usage?",
        a: "The 60-30-10 rule is a design guideline for distributing colors in a composition. 60% is the dominant color (usually neutral: white, gray, dark background). 30% is the secondary color (brand or complementary). 10% is the accent color (draws attention to CTAs and key UI elements). This ratio creates visual balance while giving highlights enough contrast to stand out.",
      },
    ],
  },

  "jwt-generator": {
    about:
      "The JWT Generator creates signed JSON Web Tokens directly in your browser using the WebCrypto API. Enter a secret key and custom claims (payload), and it generates a valid HS256-signed JWT with correct base64url encoding. Nothing is sent to any server.",
    useCases: [
      "Generating test tokens for local API development without running auth servers",
      "Creating JWTs with specific expiry and claims for manual integration testing",
      "Learning JWT structure by experimenting with header, payload, and signature",
      "Mocking authentication flows in frontend prototypes",
    ],
    tips: [
      "Always include exp (expiry) and iat (issued-at) claims — most JWT libraries reject tokens without them.",
      "The secret key strength is critical: use at least 256 bits (32 bytes) of random data for HS256.",
      "Never use the same secret in production as in testing — rotate keys when moving between environments.",
    ],
    faq: [
      {
        q: "Is my secret key safe when using this tool?",
        a: "Yes. The JWT is signed entirely in your browser using the WebCrypto API. Your secret key and payload never leave your device — there is no network request.",
      },
      {
        q: "What is the difference between HS256 and RS256?",
        a: "HS256 uses a single shared secret for both signing and verification (symmetric). RS256 uses a private key to sign and a public key to verify (asymmetric), which is safer when the verifier is a different party from the signer.",
      },
      {
        q: "Why does my JWT have three dot-separated parts?",
        a: "A JWT consists of three base64url-encoded parts: the header (algorithm and token type), the payload (claims), and the signature. They are concatenated with dots: header.payload.signature.",
      },
      {
        q: "Can I use this JWT in production?",
        a: "You can use the format, but never hardcode secrets generated or tested here in production systems. Always load secrets from environment variables or a secrets manager.",
      },
    ],
  },

  "crypto-tools": {
    about:
      "The AES/RSA Encryption tool lets you encrypt and decrypt text in-browser using the Web Cryptography API. AES-GCM mode provides authenticated symmetric encryption — ideal for encrypting data with a password. RSA-OAEP provides asymmetric encryption with a generated key pair, useful for understanding public-key cryptography.\n\nAES-GCM also has a File mode — drag in any file and get back an encrypted download, or drag in a previously encrypted file to decrypt it back to the original. The file is read, encrypted or decrypted, and re-downloaded entirely in your browser; it's never uploaded anywhere, which is the same privacy guarantee the text mode already had, just extended to arbitrary file contents.",
    useCases: [
      "Encrypting sensitive notes or config values before storing them",
      "Learning how AES and RSA encryption work in practice",
      "Testing encrypted payloads for API security implementations",
      "Generating RSA key pairs for development and testing purposes",
      "Encrypting a file with a password before sending it somewhere you don't fully trust",
    ],
    tips: [
      "AES-GCM includes authentication — a tampered ciphertext will fail to decrypt, not silently produce garbage.",
      "The password you provide is stretched using PBKDF2 before deriving the AES key — a weak password is still a security risk.",
      "RSA is for encrypting small amounts of data (like an AES key). For large data, always use hybrid encryption: RSA + AES.",
      "File mode uses the same AES-GCM + PBKDF2 scheme as text mode — the same password requirements and authentication guarantees apply.",
    ],
    faq: [
      {
        q: "What is the difference between AES-GCM and AES-CBC?",
        a: "AES-GCM (Galois/Counter Mode) is an authenticated encryption mode — it simultaneously encrypts and produces an authentication tag. If the ciphertext is tampered with, decryption fails with an error. AES-CBC (Cipher Block Chaining) only encrypts — it provides no authentication, so tampering can go undetected. Always prefer AES-GCM for new implementations.",
      },
      {
        q: "How secure is browser-based encryption?",
        a: "The cryptographic operations themselves are as secure as any native application — this tool uses the browser's Web Crypto API, which calls the operating system's cryptographic primitives. The risk is in the environment: a compromised browser extension or XSS vulnerability could intercept your keys or plaintext. For highly sensitive data, use dedicated offline tools.",
      },
      {
        q: "What is PBKDF2 and why is it used for password-based encryption?",
        a: "PBKDF2 (Password-Based Key Derivation Function 2) turns a human-chosen password into a cryptographic key. It does this by hashing the password thousands of times (this tool uses 100,000 iterations of SHA-256), making brute-force attacks extremely slow. A password that takes 1 millisecond to hash would take 100 seconds for an attacker to test one guess at 100,000 iterations.",
      },
      {
        q: "When should I use RSA vs AES encryption?",
        a: "Use AES for encrypting data of any size with a shared secret or password. Use RSA for key exchange — to securely send an AES key to someone using their public key, without a pre-shared secret. In practice, hybrid encryption (generate a random AES key, encrypt data with AES, encrypt the AES key with RSA) combines both: RSA for the key exchange, AES for the bulk data.",
      },
    ],
  },

  "http-request": {
    about:
      "The HTTP Request Builder lets you construct and fire HTTP requests from your browser — set the method, URL, custom headers, and request body, then inspect the response status, headers, and body. It is a lightweight alternative to Postman for quick API testing without leaving the browser.",
    useCases: [
      "Testing REST API endpoints during development without installing desktop tools",
      "Quickly verifying authentication headers and response formats",
      "Debugging webhook payloads by sending POST requests with custom bodies",
      "Checking CORS headers and response codes from public APIs",
      "Importing an existing Postman collection to quickly test a request without opening Postman",
      "Copying the current request as a curl command to run from a terminal or paste into a bug report",
    ],
    tips: [
      "Browser requests are subject to CORS — cross-origin APIs that don't set Access-Control-Allow-Origin will fail. Use a CORS proxy or test same-origin APIs.",
      "Set Content-Type: application/json when sending JSON bodies so the server parses the body correctly.",
      "For APIs requiring Bearer token auth, add an Authorization header with value: Bearer <your-token>.",
      "Export any request as a Postman collection to share with teammates who use Postman",
      "Use 'Copy as cURL' then 'Convert to another language' to get the same request as ready-to-run JavaScript, Python, PHP, or Go code.",
    ],
    faq: [
      {
        q: "Why do I get a CORS error even though the API works in my app?",
        a: "CORS (Cross-Origin Resource Sharing) errors occur when a browser blocks a request to a different domain that hasn't explicitly allowed your origin. Your app works because it runs on the same domain as the API, or the API is configured to allow your app's domain. Browser-based testing tools run from a different origin (the tool's URL), which the API may not allowlist. Native HTTP clients like curl and Postman bypass CORS entirely because they're not browsers.",
      },
      {
        q: "What is the difference between GET, POST, PUT, PATCH, and DELETE?",
        a: "GET retrieves data — idempotent, no body. POST creates a new resource — non-idempotent (calling twice creates two records). PUT replaces a resource completely — idempotent. PATCH partially updates a resource — may or may not be idempotent depending on implementation. DELETE removes a resource — idempotent. HEAD is like GET but returns only headers, no body.",
      },
      {
        q: "How do I send a JSON body in a POST request?",
        a: "Set the method to POST, add a header Content-Type: application/json, and paste your JSON into the body field. The Content-Type header tells the server how to parse the body. Without it, many APIs return a 400 Bad Request or silently ignore the body.",
      },
      {
        q: "What is the difference between query parameters and a request body?",
        a: "Query parameters are appended to the URL (e.g. /api/users?page=2&limit=10) and are visible in logs and browser history — use for filtering and pagination. The request body carries data in the message payload, not the URL — use for creating/updating resources and for sensitive data that shouldn't appear in logs. GET requests conventionally have no body; POST/PUT/PATCH use the body.",
      },
    ],
  },

  "html-formatter": {
    about:
      "The HTML Formatter prettifies raw or minified HTML with consistent indentation and line breaks, making it easy to read and debug. The minifier strips all unnecessary whitespace to reduce page size. Works entirely in the browser — paste and format instantly.",
    useCases: [
      "Cleaning up auto-generated HTML from frameworks or templating engines",
      "Making scraped or API-returned HTML readable for inspection",
      "Minifying HTML before production deployment to reduce page weight",
      "Formatting email templates before sending to HTML email editors",
    ],
    tips: [
      "HTML minification saves bandwidth but can break whitespace-sensitive elements like <pre> and inline <span>s — review output carefully.",
      "Self-closing void elements (img, br, input) don't need a closing slash in HTML5, but the formatter preserves your style.",
      "After formatting, validate with an HTML validator to catch unclosed tags and structural issues.",
    ],
    faq: [
      {
        q: "Does HTML formatting affect how the page renders in a browser?",
        a: "Rarely. Browsers collapse consecutive whitespace (spaces, tabs, newlines) to a single space in most contexts, so indentation and extra line breaks have no visual effect. The exceptions are elements inside <pre> tags and elements with white-space: pre in CSS — these render whitespace literally. The formatter preserves content inside <pre> blocks to avoid breaking preformatted text.",
      },
      {
        q: "What are void elements and why don't they have closing tags?",
        a: "Void elements are HTML elements that cannot have children — <img>, <br>, <input>, <hr>, <meta>, <link>, <area>, <base>, <col>, <embed>, <param>, <source>, <track>, <wbr>. Because they never contain content, a separate closing tag is meaningless. HTML5 dropped the requirement for the self-closing slash (/>), though it's still valid.",
      },
      {
        q: "How much size does HTML minification actually save?",
        a: "Whitespace removal typically saves 5-20% of raw HTML size. On a typical HTML page the savings are modest — the bigger gains come from gzip/Brotli compression (60-80% reduction) which already handles repetitive whitespace efficiently. Minification is more valuable when gzip is not applied, such as in email HTML or HTML embedded in JavaScript strings.",
      },
      {
        q: "Can I use this to format JSX or template syntax like Handlebars?",
        a: "The formatter parses standard HTML — JSX attributes ({expressions}), Angular directives, and template tags ({{ }}, {% %}) are treated as attribute values or text content and generally pass through intact. However, JSX-specific syntax like self-closing non-void elements (<MyComponent />) may not be preserved correctly since the parser treats them as standard HTML. Use a JSX-aware formatter for React code.",
      },
    ],
  },

  "config-validator": {
    about:
      "The YAML/TOML/JSON Validator checks your config files for syntax errors and converts between all three formats. Paste any config and instantly see if it is valid — errors show the exact line and problem. Use the converter to transform between formats for different tools and frameworks.",
    useCases: [
      "Validating CI/CD pipeline configs (GitHub Actions, GitLab CI) before pushing",
      "Checking Kubernetes YAML manifests and Helm chart values files",
      "Converting package.json configs to YAML for tools that require it",
      "Debugging TOML config files for Rust projects, Hugo, and TOML-based tools",
    ],
    tips: [
      "YAML is indent-sensitive — tabs are invalid, use spaces. Mixing 2-space and 4-space indentation causes parser errors.",
      "TOML keys are unquoted by default; quote them with double quotes only if they contain special characters.",
      "JSON does not support comments, trailing commas, or single-quoted strings — all common JSONC extensions that trip up validators.",
    ],
    faq: [
      {
        q: "What is the difference between YAML and TOML?",
        a: "YAML uses indentation for structure and supports complex nested data with minimal punctuation — great for deeply nested configs like Kubernetes manifests. TOML uses explicit section headers ([section]) and key = value pairs — closer to INI format and easier to understand at a glance for flat configs. TOML is preferred for Rust (Cargo.toml), Hugo, and pip. YAML dominates in CI/CD and container orchestration.",
      },
      {
        q: "Why does YAML treat 'on', 'off', 'yes', 'no' as booleans?",
        a: "YAML 1.1 (the version most parsers implement) treats on, off, yes, and no as boolean true/false in addition to true and false. This trips up Docker Compose and Ansible configs where you might legitimately use 'yes' or 'no' as string values. The fix is to quote them: 'yes', 'no'. YAML 1.2 removed this behavior, but parser support for 1.2 is inconsistent.",
      },
      {
        q: "How do I add comments to config files?",
        a: "YAML and TOML both use # for comments — everything after # on a line is ignored. JSON does not support comments at all (it's in the spec). If you need comments in JSON-like files, use JSONC (JSON with Comments) supported by VS Code settings and tsconfig.json, or JSON5. Neither is valid JSON and they require a JSONC-aware parser.",
      },
      {
        q: "What is TOML and what is it used for?",
        a: "TOML (Tom's Obvious, Minimal Language) is a config format designed to be simple to parse and easy to read. It uses [section] headers and key = value pairs. It's the native format for Rust's Cargo.toml (package manifest), the Hugo static site generator, Python's pyproject.toml, and various other modern tools that favor explicit over implicit structure.",
      },
    ],
  },

  "text-diff": {
    about:
      "The Text Diff tool shows inline character-level differences between two text inputs. Unlike line-based diff tools, it highlights exactly which characters were added, removed, or changed within each word — ideal for comparing short strings, config values, API responses, or variable names.",
    useCases: [
      "Spotting typos between two similar strings or error messages",
      "Comparing two versions of a config value or environment variable",
      "Finding subtle differences in API endpoint URLs or query strings",
      "Reviewing changes in auto-generated code or template output",
    ],
    tips: [
      "For large files with many line changes, use the Diff Checker tool instead — it handles line-level comparison better.",
      "The inline view is best for strings under 500 characters where character-level context matters most.",
      "Copy either the original or modified text to compare against a clipboard value quickly.",
    ],
    faq: [
      {
        q: "What is the difference between character, word, and line diff modes?",
        a: "Character diff highlights individual character insertions and deletions — best for spotting single-character typos and invisible character differences. Word diff groups changes by word boundaries — best for prose and natural language. Line diff compares entire lines — best for code and config files where a whole line is typically one logical unit. Choose the granularity that matches your content.",
      },
      {
        q: "When should I use text diff vs the Diff Checker tool?",
        a: "Use this Text Diff tool for short to medium strings where character-level granularity matters: variable names, error messages, URLs, connection strings. Use the Diff Checker for comparing large files or multi-line code blocks where you want the familiar git-style line-by-line view with context lines and change counts per line.",
      },
      {
        q: "How does the diff algorithm work?",
        a: "This tool uses the Myers diff algorithm, the same algorithm used by git. It finds the shortest edit script (minimum number of insertions and deletions) to transform the original text into the modified text. The algorithm runs in O(ND) time where N is the text length and D is the number of differences — it's extremely fast even for large inputs.",
      },
      {
        q: "Why do I see differences when the texts look identical?",
        a: "Common invisible culprits: different line endings (CRLF vs LF), leading or trailing whitespace, zero-width characters (U+200B, U+FEFF BOM), smart quotes vs straight quotes, or non-breaking spaces (&nbsp;) that look like regular spaces. The character diff mode is the best way to find these — it will reveal the hidden character as an added or removed character.",
      },
    ],
  },

  "xpath-tester": {
    about:
      "The ToolNinja XPath Tester is a free online XPath evaluator and debugger. Paste any XML or HTML document, enter an XPath expression, and instantly see all matching nodes highlighted with their values, types, and positions — directly in your browser.\n\nXPath (XML Path Language) is the standard query language for navigating XML and HTML documents. Use this XPath tester online to select elements by tag name, filter by attribute values, traverse parent-child relationships with axis expressions (child::, parent::, ancestor::, descendant::), or extract text content and attribute values.\n\nThe tool supports all XPath 1.0 expressions: location paths, predicates, wildcards, node tests, and built-in functions (string(), number(), count(), contains(), starts-with(), and more). Switch between XML and HTML mode — HTML mode uses the browser's DOMParser in HTML mode so you can test XPath against real web content.\n\nPerfect for web scraping, XML data extraction, XSLT development, API XML parsing, and learning XPath syntax. Everything runs 100% in your browser using the native document.evaluate() API — your data never leaves your machine.",
    useCases: [
      "Testing XPath selectors for web scraping scripts before running them",
      "Debugging XPath expressions in XSLT stylesheets or XML transformation pipelines",
      "Extracting data from XML API responses or SOAP envelopes",
      "Learning XPath syntax with instant visual feedback on a real document",
      "Validating XPath queries for Selenium, Playwright, or Robot Framework tests",
      "Inspecting HTML structure to find reliable XPath selectors for browser automation",
    ],
    tips: [
      "Use // to search anywhere in the document: //div[@class='price'] finds all divs with that class regardless of nesting.",
      "Predicates with position() or [n] select specific nodes: //li[1] selects the first list item, //li[last()] selects the last.",
      "The text() node test selects text content: //h1/text() returns just the text inside h1 tags, not the element itself.",
      "Use @attribute to select by attribute: //*[@id='main'] selects any element with id='main'. @* selects all attributes.",
      "contains() handles partial matches: //a[contains(@href, 'github')] finds links where the href includes 'github'.",
    ],
    faq: [
      {
        q: "What is XPath and when should I use it?",
        a: "XPath (XML Path Language) is a query language for selecting nodes from XML and HTML documents. Use it when you need to extract specific elements from XML APIs or feeds, write web scraping selectors, define locators for browser automation (Selenium, Playwright), or build XSLT transformations. CSS selectors are often simpler for HTML, but XPath is more powerful — it can navigate upward in the tree (parent/ancestor axes), select by text content, and handle XML namespaces.",
      },
      {
        q: "What is the difference between / and // in XPath?",
        a: "A single / is a direct child step — /root/child means 'child is a direct child of root'. Double // is the descendant-or-self axis shorthand — //child means 'child anywhere in the document'. Use // when you don't know or don't care how deeply nested the target element is. Be careful with // on large documents as it scans every node.",
      },
      {
        q: "Why does my XPath expression return no results on HTML?",
        a: "HTML documents may have a default namespace or case differences that trip up XPath. Ensure you're using HTML mode in the tester. Common issues: HTML tag names are uppercase in some parsers (use local-name() or uppercase), elements may be nested differently than expected, or the document uses namespaces that need to be declared. Try a simpler expression first (//*) to verify the document parsed correctly.",
      },
      {
        q: "What is the difference between XPath and CSS selectors?",
        a: "CSS selectors can only traverse downward (parent to child/descendant). XPath can navigate in any direction — up to parents and ancestors, sideways to siblings, and down to children and descendants. XPath can also select by text content (text()), by attribute value with functions like contains(), and works on both XML and HTML. Use CSS selectors for simple HTML selection; use XPath when you need to navigate upward, match text content, or work with XML.",
      },
    ],
  },

  "cidr-calculator": {
    about:
      "The ToolNinja CIDR Calculator is a free online subnet calculator and IP range calculator. Enter any CIDR notation (e.g. 192.168.1.0/24) to instantly calculate the subnet mask, network address, broadcast address, first and last usable host, and total number of hosts — all displayed with a full binary breakdown.\n\nWhether you need to calculate CIDR from an IP address, convert IP to CIDR notation, find CIDR ranges for a network, or use it as a subnetting CIDR calculator — ToolNinja handles every scenario directly in your browser. The CIDR to IP range calculator shows the complete host range so you can immediately see which addresses fall within your subnet.\n\nUse it as an ip to cidr calculator when configuring cloud VPCs in AWS, GCP or Azure, as a subnet CIDR calculator for firewall rules, or as a subnetting calculator for network planning. The binary display makes it ideal for learning how CIDR notation and subnet masks work at the bit level.\n\nEverything runs 100% in your browser — no login, no server calls, no data ever leaves your machine.\n\nA Split into Subnets tool takes your calculated network and divides it into equal-sized smaller subnets in one step, showing the CIDR, broadcast address, and usable range for each — handy when you've settled on a parent block and need to carve it up across multiple availability zones or network segments.",
    useCases: [
      "Calculating subnet ranges for AWS VPC, GCP VPC or Azure Virtual Network CIDR blocks",
      "Converting IP addresses to CIDR notation for firewall rules and security groups",
      "Subnetting large networks into smaller CIDR ranges for network segmentation",
      "Verifying CIDR to IP range calculations before deploying network infrastructure",
      "Learning how CIDR notation and subnet masks work with the binary display",
      "Calculating how many hosts fit in a given subnet for capacity planning",
      "Splitting a parent CIDR block into equal subnets for multi-AZ VPC layouts",
    ],
    tips: [
      "A /24 gives 254 usable hosts (256 minus network and broadcast). A /25 splits that into two subnets of 126 usable hosts each.",
      "AWS VPCs reserve 5 addresses per subnet (network, broadcast, and 3 AWS-reserved). Factor this in when choosing your CIDR block.",
      "Use /32 to represent a single host route and /0 to represent the default route (all traffic).",
      "Use Split into Subnets when planning a multi-AZ VPC — dividing a /22 into four /24s gives one clean subnet per zone.",
    ],
    faq: [
      {
        q: "What does CIDR stand for and what problem does it solve?",
        a: "CIDR stands for Classless Inter-Domain Routing. Before CIDR, IP addresses were assigned in fixed classes (A, B, C) which wasted huge blocks of addresses. CIDR replaced this with variable-length subnet masking (VLSM) — the /prefix notation lets you specify exactly how many bits are the network portion, enabling fine-grained allocation and more efficient use of the IP address space.",
      },
      {
        q: "How do I choose the right subnet size for my use case?",
        a: "Calculate the number of hosts you need and choose the smallest prefix that accommodates them, plus growth room. Formula: usable hosts = 2^(32 - prefix) - 2. For 100 hosts you need /25 (126 usable). For 500 hosts you need /23 (510 usable). In cloud environments, choose larger than you think you need — subnets cannot be resized after creation without disruption.",
      },
      {
        q: "What is the difference between the network address and the broadcast address?",
        a: "The network address is the first IP in a subnet (all host bits are 0) — it identifies the subnet itself and cannot be assigned to a host. The broadcast address is the last IP (all host bits are 1) — packets sent to it are delivered to all hosts in the subnet. Both are reserved; usable host addresses are everything between them.",
      },
      {
        q: "What are the private IP address ranges and when do I use them?",
        a: "RFC 1918 defines three private ranges: 10.0.0.0/8 (16.7M addresses), 172.16.0.0/12 (1M addresses), and 192.168.0.0/16 (65K addresses). These are non-routable on the public internet — use them for internal networks, VPCs, and home LANs. Traffic to/from these ranges must go through NAT to reach the internet. 169.254.0.0/16 is link-local (APIPA), used when DHCP fails.",
      },
    ],
  },

  "docker-run-to-compose": {
    about:
      "The Docker Run to Compose Converter is a free online tool that instantly converts docker run commands into production-ready docker-compose.yml files. Paste any docker run command — including complex ones with multiple flags — and get a complete Compose service definition with correct YAML structure, named volumes, networks, environment variables, healthchecks, resource limits, and all standard Docker options.\n\nIt also works in reverse: paste a docker-compose.yml and get the equivalent docker run commands for every service, useful for quick debugging or running individual services outside of Compose.\n\nThe built-in Best Practices Scorer analyzes your service configuration and scores it out of 100 across four categories: security (privileged mode, root user, hardcoded secrets), reliability (restart policy, healthchecks, pinned image tags), performance (memory limits), and maintainability (named volumes, custom networks). Each failed check explains the issue and the recommended fix.\n\nSupports multi-service input: paste multiple docker run commands separated by blank lines and the tool generates a complete multi-service docker-compose.yml with shared volumes and network declarations.\n\nWhen converting a single-service docker run command, you can also switch the output to Kubernetes mode to get an equivalent Deployment + Service YAML manifest — image, ports, environment variables, and resource limits map directly, with bind-mount volumes and restart policies called out as comments since they have no direct Kubernetes equivalent.\n\nEverything runs 100% in your browser. No login, no server, no data ever leaves your machine.",
    useCases: [
      "Converting a working docker run command to a Compose file to commit to source control",
      "Generating docker-compose.yml for an existing containerized app from its run script",
      "Auditing a container's configuration for security and reliability issues with the best practices scorer",
      "Learning Compose syntax by seeing exactly how run flags map to YAML keys",
      "Converting Compose services back to docker run commands for quick one-off debugging",
      "Combining multiple docker run commands into a multi-service Compose stack",
      "Getting a starting Kubernetes Deployment + Service manifest from an existing docker run command",
    ],
    tips: [
      "Separate multiple docker run commands with a blank line to generate a multi-service compose file in one step.",
      "Pin image tags (e.g. nginx:1.25.3 instead of nginx:latest) to prevent unexpected breakage when upstream releases a new version.",
      "Use ${VARIABLE} syntax in your environment values and a .env file to keep secrets out of the compose file.",
      "The best practices scorer shows all checks even when passed — expand it to see what your service is already doing right.",
      "Switch to Kubernetes mode after converting a single-service command to get a Deployment + Service YAML starting point.",
    ],
    faq: [
      {
        q: "What Docker run flags are not supported in Compose?",
        a: "--rm is intentionally ignored (containers in Compose are not auto-removed; they restart based on the restart policy instead). --gpus requires the deploy.resources syntax in Compose v3.8+ and is flagged as unsupported. Flags that have no Compose equivalent are listed in the 'unsupported flags' section after conversion.",
      },
      {
        q: "Why should I use docker-compose.yml instead of docker run scripts?",
        a: "Compose files are declarative, version-controllable, and self-documenting. A docker run command is imperative and easy to lose. Compose also handles service dependencies, shared networks, named volumes, and environment files natively — things you'd otherwise script by hand. docker compose up -d starts all services; docker compose down stops and removes them cleanly.",
      },
      {
        q: "What does the best practices score measure?",
        a: "The score starts at 100 and deducts points for each failed check: no pinned image tag (-15), no restart policy (-10), privileged mode (-20), no memory limit (-10), host network mode (-15), absolute-path bind mounts (-5), no healthcheck (-10), root user (-10), hardcoded secrets in environment (-15), no custom network (-5). A score of 80+ indicates a well-configured service.",
      },
      {
        q: "Does the Compose file generated work with Docker Compose v1 (docker-compose) and v2 (docker compose)?",
        a: "Yes. The generated YAML does not include a version: field, which is the recommended practice as of Docker Compose v2. The spec-compliant format works with both docker compose (Compose v2, plugin) and docker-compose (Compose v1, standalone), though Compose v1 is deprecated.",
      },
    ],
  },

  "git-command-generator": {
    about:
      "The Git Command Generator is a searchable reference for 60+ git commands organized by category — Setup, Branches, Staging, Commits, Remote, Undo, History, Tags, Stash, and Advanced. Search by name or keyword to find the exact command, copy it with one click, and see warning badges on destructive commands that rewrite history.\n\nAn Explain a command mode flips the direction: paste any git command — including one with flags or arguments that do not exactly match a stored example — and get a plain-English breakdown of the subcommand and every flag, with dangerous flags (--hard, --force, -D, --no-verify, and more) called out explicitly. It correctly expands bundled short flags too, so `git clean -fdx` is explained as -f, -d, and -x individually rather than as one opaque token.",
    useCases: [
      "Quickly finding the right git syntax without leaving the browser",
      "Learning git commands beyond the basics (reflog, bisect, worktree)",
      "Checking the correct flags for destructive operations before running them",
      "Onboarding new developers to git workflows with a visual reference",
      "Understanding exactly what an unfamiliar git command from a tutorial, Stack Overflow answer, or teammate actually does before running it",
    ],
    tips: [
      "Commands marked with a Caution badge rewrite history — never use them on branches others have already pulled.",
      "Search by concept, not just command name: try 'undo', 'linear', or 'recover' to find commands by what they do.",
      "Your recently copied commands are saved in localStorage for quick re-access.",
      "Paste a command into Explain mode before running it if you are not 100% sure what a flag does — it flags anything that can discard work before you find out the hard way.",
    ],
    faq: [
      {
        q: "What is the difference between git reset and git revert?",
        a: "git revert creates a new commit that undoes a previous commit — it's safe to use on shared branches because it doesn't rewrite history. git reset moves the HEAD pointer backward, effectively removing commits from the history — this rewrites history and is destructive. Only use git reset on commits that haven't been pushed to a shared branch.",
      },
      {
        q: "When should I use git rebase instead of git merge?",
        a: "Use rebase when you want a linear, clean commit history — your commits are replayed on top of the target branch as if they were written there. Use merge when you want to preserve the true divergence history with a merge commit. The golden rule: never rebase branches that others have already pulled from, as it rewrites the commit hashes they reference.",
      },
      {
        q: "What does git stash do and when should I use it?",
        a: "git stash temporarily saves your uncommitted changes (both staged and unstaged) to a stack, leaving your working directory clean. Use it when you need to quickly switch branches or pull changes without committing half-finished work. Run git stash pop to restore the most recent stash, or git stash list to see all stored stashes.",
      },
      {
        q: "How do I recover commits after a git reset --hard?",
        a: "Use git reflog — it logs every position HEAD has been at, even after hard resets. Find the commit hash you want to recover in the reflog output, then run git checkout <hash> to inspect it, or git reset --hard <hash> to restore your branch to that state. The reflog is local and expires after 90 days by default.",
      },
    ],
  },

  "markdown-table-generator": {
    about:
      "The Markdown Table Generator lets you build tables in a visual spreadsheet-style editor without memorizing Markdown syntax. Add and remove rows and columns, toggle per-column alignment (left, center, right), import data from a CSV file, and export as Markdown, HTML, or a live rendered preview.",
    useCases: [
      "Creating comparison tables for README files and documentation",
      "Converting CSV data to Markdown for GitHub wikis and pull request descriptions",
      "Building HTML tables for web content without writing raw HTML",
      "Generating formatted tables for blog posts and technical writing",
    ],
    tips: [
      "Press Tab in the last cell to automatically add a new row.",
      "Import a CSV file to populate the table — headers in the first row are treated as column names.",
      "Use the alignment buttons under each header to control text alignment in Markdown and the exported HTML.",
    ],
    faq: [
      {
        q: "How do I add rows and columns quickly?",
        a: "Use the + and – buttons in the toolbar to add or remove rows and columns. Pressing Tab in the last cell of the last row also automatically adds a new row. For large datasets, importing a CSV file is the fastest approach.",
      },
      {
        q: "Does Markdown support table cell merging (colspan/rowspan)?",
        a: "Standard GitHub Flavored Markdown (GFM) does not support cell merging. Markdown tables are limited to basic rectangular grids. If you need merged cells, use the HTML export — HTML tables support colspan and rowspan, which you can add manually after export.",
      },
      {
        q: "What CSV format does the importer accept?",
        a: "The importer accepts comma-separated values where the first row is treated as column headers. Quoted fields (surrounded by double quotes) are supported. Line endings can be CRLF or LF. Import files with .csv extension or plain text files formatted as CSV.",
      },
      {
        q: "Will the Markdown table render correctly on GitHub?",
        a: "Yes. The generator produces GitHub Flavored Markdown (GFM) table syntax, which renders in GitHub README files, wikis, pull request descriptions, and issue comments. The column alignment (left, center, right) is controlled by the colon position in the separator row, which GFM supports fully.",
      },
    ],
  },

  "meta-tags-generator": {
    about:
      "The Meta Tags Generator creates all the HTML meta tags your page needs for SEO, Open Graph (Facebook/LinkedIn), Twitter Cards, and schema.org structured data. Fill in the fields and watch the live previews update for Google search, Twitter, and LinkedIn simultaneously. A quality checklist tracks what's missing. Copy all generated tags with one click.\n\nIt also generates a matching JSON-LD structured data block (WebSite, Article, or Person schema, based on the OG type you select) — the format Google actually parses for rich results, separate from meta tags entirely.",
    useCases: [
      "Setting up complete meta tags for a new web page or blog post",
      "Previewing how a page will appear when shared on social media before publishing",
      "Auditing existing pages for missing or incorrect social meta tags",
      "Generating Twitter Card and Open Graph tags for marketing campaigns",
      "Adding schema.org JSON-LD markup so search engines understand the page as an Article, WebSite, or Person",
    ],
    tips: [
      "Keep your title under 60 characters — search engines truncate longer titles in results.",
      "The description should be 120-160 characters — enough to describe the page but short enough to display fully.",
      "Your OG image should be 1200×630px for best display across all platforms. Twitter Cards also accept this size.",
      "The JSON-LD block follows the OG type field — set it to 'article' for blog posts to get Article schema instead of generic WebSite schema.",
    ],
    faq: [
      {
        q: "What is the difference between Open Graph and Twitter Card tags?",
        a: "Open Graph (og:) tags were created by Facebook and are used by Facebook, LinkedIn, Slack, Discord, WhatsApp, and most other platforms to generate link previews. Twitter Card (twitter:) tags are specific to Twitter/X. Both use similar fields — title, description, image — but different property names. Many platforms fall back to og: tags if twitter: tags are absent, so setting both is recommended.",
      },
      {
        q: "Do meta keywords still matter for SEO?",
        a: "No. Google and most major search engines stopped using the meta keywords tag as a ranking signal around 2009. Including it does no harm, but it provides no SEO benefit. Focus on the meta description — while it doesn't directly affect rankings either, a compelling description improves click-through rates from search results.",
      },
      {
        q: "What is the ideal OG image size?",
        a: "The recommended Open Graph image size is 1200×630 pixels (1.91:1 aspect ratio). This displays correctly on Facebook, LinkedIn, Twitter, and Slack. Minimum size is 200×200px, but smaller images may be displayed as a small thumbnail rather than a full-width card. Use PNG or JPG format; keep the file size under 1MB.",
      },
      {
        q: "When should I use noindex or nofollow?",
        a: "noindex tells search engines not to include the page in search results — use it for admin pages, duplicate content, thank-you pages, and staging environments. nofollow tells search engines not to follow the links on the page — use it sparingly, typically on user-generated content pages. Avoid noindexing pages you want to rank. Combining both (noindex, nofollow) is the most restrictive setting.",
      },
    ],
  },

  "unicode-explorer": {
    about:
      "The Unicode Explorer lets you look up any Unicode character by symbol, name, or code point. Enter a character to see its official Unicode name, code point (decimal and hex), UTF-8 encoding, HTML entity, and Unicode block. Search by name to find the right symbol for your content.",
    useCases: [
      "Finding the correct Unicode code point for special characters in source code",
      "Identifying mystery characters in logs, API responses, or user input",
      "Getting HTML entity values for symbols in web content",
      "Exploring emoji code points and Unicode blocks for internationalization work",
    ],
    tips: [
      "You can search by name (e.g., 'snowflake', 'arrow left') to find symbols without knowing their code point.",
      "Paste a string with multiple characters to inspect all of them at once — useful for debugging encoding issues.",
      "Zero-width characters (U+200B, U+FEFF) are invisible but can cause comparison bugs — the explorer will reveal them.",
    ],
    faq: [
      {
        q: "What is Unicode and why was it created?",
        a: "Unicode is a universal character encoding standard that assigns a unique number (code point) to every character in every writing system — over 140,000 characters covering 150+ scripts, plus emoji, symbols, and control characters. Before Unicode, dozens of incompatible encodings (ASCII, Latin-1, Shift-JIS, GB2312) made text exchange between systems and languages unreliable. Unicode, now in version 15+, is the universal standard for all modern text.",
      },
      {
        q: "What is the difference between Unicode and UTF-8?",
        a: "Unicode is the character set — the assignment of numbers to characters. UTF-8 is one encoding of those numbers into bytes. UTF-8 uses 1-4 bytes per character: ASCII characters (U+0000-U+007F) use 1 byte; Latin and common symbols use 2; most CJK characters use 3; rare characters and emoji use 4. UTF-8 is backward-compatible with ASCII and is the dominant encoding on the web.",
      },
      {
        q: "What are zero-width characters and why do they cause bugs?",
        a: "Zero-width characters are Unicode code points that occupy no visual space: U+200B (Zero Width Space), U+200C (Zero Width Non-Joiner), U+200D (Zero Width Joiner), U+FEFF (BOM). They are invisible in most editors and UIs. They cause comparison bugs because 'hello' and 'hel​lo' look identical but are not string-equal. They appear in text copied from PDFs, web pages, and word processors.",
      },
      {
        q: "How do I type or insert Unicode characters I can't find on my keyboard?",
        a: "On Windows: hold Alt and type the decimal code on the numpad (Alt+0169 for copyright). Or use Win+. for the emoji picker, or type the hex code in Word then press Alt+X. On macOS: System Preferences > Keyboard > Show Emoji & Symbols, or use the Character Viewer. In code: use escape sequences — \\u00A9 in JavaScript/Python, &#169; or &copy; in HTML.",
      },
    ],
  },

  "json-diff": {
    about:
      "The JSON Diff Checker compares two JSON objects structurally and shows exactly what was added, removed, or changed — path by path, using JSONPath-style notation like $.user.email or $.items[2].price. Unlike a line-by-line text diff, it understands JSON structure: keys in a different order are treated as identical, and only real content differences are reported.\n\nUse it to compare API responses before and after a change, verify a config file migration didn't silently alter values, or review what a deploy actually changed in a serialized data blob. Each difference is color-coded — green for additions, red for removals, yellow for changes — with the exact old and new values shown inline.\n\nEverything runs 100% in your browser. Your JSON never leaves your machine — no server calls, no logging.",
    useCases: [
      "Comparing an API response before and after a backend change to catch unintended field changes",
      "Verifying a config file or feature flag migration didn't alter values it shouldn't have",
      "Reviewing what changed between two versions of a serialized state object during debugging",
      "Checking that a refactor produces byte-for-byte equivalent JSON output regardless of key order",
    ],
    tips: [
      "Key order never affects the result — only real value differences are reported, unlike a plain text diff.",
      "Arrays are compared index by index, so inserting an item in the middle of an array will show every later item as 'changed' — this is a known limitation of positional array diffing.",
      "The path shown for each difference (e.g. $.user.roles[1]) can be pasted directly into a JSONPath-aware tool to locate the value.",
    ],
    faq: [
      {
        q: "How is this different from a regular text diff tool?",
        a: "A text diff (like ToolNinja's Diff Checker) compares JSON as plain text line by line — so reformatting, reordering keys, or changing whitespace shows up as a difference even when the data is identical. The JSON Diff Checker parses both inputs and compares the actual data structure, so key order and formatting never produce false positives — only genuine content differences are reported.",
      },
      {
        q: "Why does reordering array items show as many changes instead of one?",
        a: "Arrays are compared by position (index 0 vs index 0, index 1 vs index 1, and so on), not by content matching. If you insert or remove an item in the middle of an array, every item after that position will appear as 'changed' even though most of them didn't really change — they just shifted position. This is standard behavior for positional diffing; a content-aware array diff would need to identify moved items, which this tool doesn't attempt.",
      },
      {
        q: "What does the path notation like $.user.address[0].city mean?",
        a: "It's JSONPath-style notation describing where in the JSON structure the difference occurs. $ is the root object, .user.address means the address property of the user object, and [0] means the first item in that array, followed by .city for the city property within it. It's the same notation used by JSONPath query tools.",
      },
      {
        q: "Is my data uploaded anywhere when I use this tool?",
        a: "No. Both JSON inputs are parsed and compared entirely in your browser using JavaScript. Nothing is sent to a server — this is safe to use with real API responses, even ones containing sensitive data.",
      },
    ],
  },

  "contrast-checker": {
    about:
      "The Color Contrast Checker calculates the WCAG contrast ratio between a foreground and background color and checks it against the official accessibility thresholds — AA and AAA, for normal text, large text, and UI components/graphics. Enter any two colors as hex or rgb() and see a live preview of how real text and buttons would actually look.\n\nWCAG 2.x defines minimum contrast ratios so text remains readable for users with low vision or color blindness: 4.5:1 for normal text at AA, 3:1 for large text, and stricter 7:1 / 4.5:1 thresholds at the AAA level. This tool computes the exact ratio using the WCAG relative luminance formula and tells you plainly which levels your color pair passes or fails — plus suggests an adjusted foreground shade that would pass AA if your current pair fails.\n\nRuns entirely in your browser — no login, no server calls.",
    useCases: [
      "Verifying text and background color combinations meet WCAG AA before shipping a design",
      "Auditing an existing design system's color tokens for accessibility compliance",
      "Checking button and UI component contrast against the 3:1 non-text threshold",
      "Finding a passing shade quickly when a brand color fails contrast against its background",
    ],
    tips: [
      "AA is the legal minimum most accessibility standards (ADA, EN 301 549) reference — aim for AA at minimum, AAA where practical for body text.",
      "Large text (18pt+/24px+, or 14pt/18.66px+ bold) has a lower bar (3:1) because bigger glyphs remain legible at lower contrast.",
      "UI components like button borders, icons, and form field outlines only need to meet the 3:1 threshold, not the stricter text ratios.",
      "Use the swap button to quickly check the reverse combination — useful when deciding between light-on-dark and dark-on-light variants.",
    ],
    faq: [
      {
        q: "What's the difference between WCAG AA and AAA?",
        a: "AA is the standard most accessibility regulations require (4.5:1 for normal text, 3:1 for large text) — it's the widely-adopted baseline. AAA is a stricter, optional standard (7:1 normal, 4.5:1 large) intended for content where readability is especially critical. Most products target AA; AAA is aspirational for body copy on content-heavy sites.",
      },
      {
        q: "How is the contrast ratio actually calculated?",
        a: "It's derived from the WCAG relative luminance formula, which weights each RGB channel by how the human eye perceives brightness (green contributes most, blue least), then compares the lighter and darker of the two colors: (L1 + 0.05) / (L2 + 0.05). The result ranges from 1:1 (identical colors, no contrast) to 21:1 (pure black on pure white, maximum contrast).",
      },
      {
        q: "Why does my brand color fail contrast, and what should I do?",
        a: "Many brand colors (especially mid-tone blues, purples, and reds) sit right in the range that fails against both black and white text at small sizes. Common fixes: darken or lighten the color slightly for text use while keeping the original for logos/graphics, increase the text size so it qualifies as 'large text' with a lower threshold, or use the brand color only for large UI elements where the 3:1 threshold applies.",
      },
      {
        q: "Does passing WCAG contrast guarantee my design is accessible?",
        a: "No — contrast is one of many accessibility requirements. It doesn't account for color blindness (two colors can have great contrast but still be indistinguishable to someone with color vision deficiency if they differ only in hue), font legibility, or screen reader compatibility. Treat this as one check among a broader accessibility review, not a complete audit.",
      },
    ],
  },

  "csv-json": {
    about:
      "The CSV ↔ JSON Converter converts in both directions instantly — paste CSV, get a JSON array of objects; paste a JSON array, get CSV. It correctly handles quoted fields containing commas, embedded quotes, and newlines per the standard CSV format, and supports comma, semicolon, tab, or pipe delimiters for exports from different regional spreadsheet settings.\n\nUpload a .csv file directly, or paste JSON and get CSV back — useful when an API returns JSON but you need to hand a spreadsheet to a non-technical teammate, or when you have a CSV export that needs to become structured JSON for a script or API payload.\n\nRuns 100% in your browser. Your data — including anything from a spreadsheet with sensitive rows — never leaves your machine.",
    useCases: [
      "Converting a CSV export from Excel or Google Sheets into JSON for an API payload or script",
      "Turning a JSON array from an API response into a CSV file to share with a non-technical teammate",
      "Handling European-format CSVs that use semicolons instead of commas as the delimiter",
      "Quickly inspecting the structure of a CSV file by seeing it as JSON objects with named keys",
    ],
    tips: [
      "The first row of your CSV is always treated as the header row — those become the JSON object keys.",
      "When converting JSON to CSV, the column headers are the union of all keys across every object, so it's fine if some objects are missing a field.",
      "Nested objects or arrays inside JSON values are stringified into the CSV cell — CSV itself has no concept of nested structure.",
      "Switch the delimiter to semicolon if you're opening the CSV in a European-locale version of Excel, which uses commas as decimal separators.",
    ],
    faq: [
      {
        q: "How does the converter handle commas inside a CSV field?",
        a: "Standard CSV wraps any field containing the delimiter, a quote character, or a newline in double quotes — e.g. \"Smith, John\" for a value containing a comma. This tool follows that convention on both parsing and export, so fields with embedded commas or quotes round-trip correctly as long as the source CSV was quoted properly.",
      },
      {
        q: "What happens to nested JSON objects or arrays when converting to CSV?",
        a: "CSV is inherently flat — it has no way to represent nested structure. When a JSON value is an object or array, it gets serialized as a JSON string inside that CSV cell (e.g. {\"street\":\"Main St\"}) rather than being flattened into separate columns. If you need flattened columns, restructure the JSON to be flat before converting.",
      },
      {
        q: "Why do some rows have empty cells after converting JSON to CSV?",
        a: "If your JSON array contains objects with different sets of keys, the CSV header row is the union of every key seen across all objects. Any object missing a particular key gets an empty cell in that column — this keeps every row the same width, which CSV requires.",
      },
      {
        q: "Can I convert a CSV that uses tabs instead of commas (TSV)?",
        a: "Yes — select Tab from the delimiter dropdown before pasting or uploading your file. The same parser handles comma, semicolon, tab, and pipe-delimited files; just make sure the selected delimiter matches your source file's actual separator.",
      },
    ],
  },

  "favicon-generator": {
    about:
      "The Favicon Generator takes a single uploaded image and renders it into every standard favicon size a modern site needs: 16×16 and 32×32 for browser tabs, 48×48 for the Windows taskbar, 180×180 for Apple touch icons (iOS home screen), and 192×192 / 512×512 for Android and web app manifests.\n\nEach size is generated on an HTML canvas — the image is scaled to fit and centered, with an optional solid background fill for source images with transparency that need a solid favicon. Download each size individually or all at once, and copy the exact HTML <link> tags to paste into your site's <head>.\n\nA Web App Manifest section generates the actual site.webmanifest file the HTML snippet already links to — set your app name, short name, theme color, background color, and display mode, and get a ready-to-download manifest referencing the 192×192 and 512×512 icons that were just generated, making your site properly installable as a PWA rather than just having the right icon sizes sitting unused.\n\nProcessing happens entirely in your browser via the Canvas API — your image is never uploaded to a server.",
    useCases: [
      "Generating a complete favicon set from a single logo file for a new site launch",
      "Re-generating favicons after a logo redesign without manually resizing in an image editor",
      "Producing the specific sizes required for PWA manifests (192×192, 512×512) alongside classic favicons",
      "Adding a solid background to a transparent logo so it reads clearly as a small favicon",
      "Generating a complete site.webmanifest to make a site installable as a PWA",
    ],
    tips: [
      "Start with a square source image at least 512×512px — the generator scales down cleanly but can't add detail when scaling up from a small source.",
      "If your logo has transparency and looks washed out as a tiny favicon, enable the solid background option and pick a color that matches your brand.",
      "Browsers and OSes cache favicons aggressively — after replacing your favicon files, a hard refresh or cache-busting query string may be needed to see the update.",
      "The 512×512 size doubles as your PWA manifest icon — keep it if you have (or plan to add) a web app manifest.",
      "Use standalone display mode in the manifest if you want the PWA to open without browser chrome (address bar, tabs) — browser is the right choice if you just want the installability without changing how it looks when opened.",
    ],
    faq: [
      {
        q: "Why do I need so many different favicon sizes?",
        a: "Different platforms request different sizes for different contexts: browsers use 16×16 and 32×32 for tabs and bookmarks, Windows uses 48×48 for taskbar pins, iOS uses 180×180 when you 'Add to Home Screen', and Android/PWA manifests use 192×192 and 512×512 for home screen icons and splash screens. Providing all of them ensures your icon looks sharp everywhere instead of being stretched from a single small file.",
      },
      {
        q: "Do I still need a favicon.ico file?",
        a: "Modern browsers all support PNG favicons referenced via <link rel=\"icon\">, which is what this tool generates — a .ico file is no longer strictly required for current browser versions. Some very old browsers or crawlers still fall back to requesting /favicon.ico by default, so keeping one at your site root as a fallback doesn't hurt, but PNG favicons with proper <link> tags are sufficient for virtually all modern traffic.",
      },
      {
        q: "What's the difference between the apple-touch-icon and the regular favicon?",
        a: "The apple-touch-icon (180×180) is what iOS uses specifically when a user adds your site to their home screen — it appears as a full app-like icon, so it should not have transparency (iOS fills transparent areas with black). The smaller favicon sizes are used for browser tabs and bookmarks and can keep transparency.",
      },
      {
        q: "Why does my icon look pixelated at 16×16 even though the source image was high resolution?",
        a: "At very small sizes, fine detail in a logo simply can't render clearly — this is a physical limit of a 16×16 pixel grid, not a bug in the generator. Simplify complex logos (remove fine text or thin lines) for the smallest sizes, or accept that the 16px favicon will always be a simplified impression of the full logo.",
      },
    ],
  },

  "fake-data-generator": {
    about:
      "The Fake Data Generator lets you define a custom schema — field name plus type — and instantly generates realistic-looking mock data as JSON or CSV. Choose from 20 field types including names, emails, phone numbers, UUIDs, addresses, companies, job titles, dates, and Lorem-style text.\n\nUse it to populate a frontend with realistic test data before a real API exists, generate CSV fixtures for a data pipeline test, or quickly produce a batch of sample records for a demo. An optional seed value makes output reproducible — the same seed with the same schema always generates identical data, useful for consistent test fixtures across CI runs.\n\nAll generation happens in your browser using JavaScript — no data is sent anywhere, and there's no rate limit like hosted mock-data APIs often impose.",
    useCases: [
      "Populating a frontend UI with realistic-looking data before the real backend API is ready",
      "Generating CSV fixtures for testing a data import or ETL pipeline",
      "Creating reproducible test data for CI by setting a fixed seed value",
      "Producing quick demo datasets (users, products, orders) for a presentation or prototype",
    ],
    tips: [
      "Set a seed value to get the exact same generated data every time — useful for deterministic test fixtures instead of random data that changes each run.",
      "Field names become JSON object keys or CSV column headers directly — use camelCase or snake_case to match what your API or database expects.",
      "Generate up to 500 rows per run — for larger datasets, generate in multiple batches or increase the row count and re-download.",
      "Switch to CSV output to get a file you can drag straight into Excel, Google Sheets, or a database import tool.",
    ],
    faq: [
      {
        q: "Is the generated data safe to use — does it resemble real people?",
        a: "The names, emails, and addresses are drawn from small fixed lists of common placeholder values (similar to how Lorem Ipsum works for text) combined randomly — they are not sourced from real user records and any resemblance to a real person is coincidental, the same as with any synthetic test data generator.",
      },
      {
        q: "What does the seed value actually do?",
        a: "Without a seed, each generation uses fresh randomness and produces different data every time. With a seed, the generator uses that value to initialize a deterministic pseudo-random sequence — the same seed plus the same field schema and row count will always produce identical output, which is useful when you need a stable fixture that doesn't change between test runs.",
      },
      {
        q: "Can I generate nested JSON objects, like an address object inside a user object?",
        a: "Not directly — each field generates a single flat value (string, number, boolean, or date). For nested structures, generate the flat fields you need and restructure the JSON afterward, or generate separate arrays (users, addresses) and join them in your own code.",
      },
      {
        q: "How is this different from a hosted service like Mockaroo?",
        a: "The core schema-to-mock-data workflow is similar, but this tool runs entirely client-side with no account, no row limits tied to a free tier, and no data ever leaves your browser. Hosted services offer a wider variety of field types and API-based generation for live mock endpoints — for a quick one-off dataset without signing up, this tool covers the common field types you'd need.",
      },
    ],
  },

  "gitignore-generator": {
    about:
      "The .gitignore Generator builds a combined .gitignore file from curated templates for languages, frameworks, editors, and operating systems. Select Node.js, Python, VS Code, macOS — or any combination — and get a ready-to-use file with clearly labeled sections for each stack you picked.\n\nStarting a repository without a proper .gitignore leads to committed node_modules folders, IDE config files, and OS junk files that clutter every future diff. This generator front-loads that decision so it's done correctly from the first commit.",
    useCases: [
      "Setting up a new repository's .gitignore correctly from the very first commit",
      "Combining multiple stacks — e.g. a Python backend with a Node.js frontend — into one file",
      "Adding editor and OS ignores (VS Code, JetBrains, macOS, Windows) to an existing project that's missing them",
      "Quickly checking what a standard .gitignore for a given language typically excludes",
    ],
    tips: [
      "Combine categories freely — most real projects need at least a language template, an editor template, and an OS template together.",
      "If you're already tracking a file that a new .gitignore excludes, adding it to .gitignore alone won't stop tracking it — run git rm --cached <file> first.",
      "Re-generate and diff against your existing .gitignore periodically — new tooling (a new editor, a new framework) often needs its own ignore rules added later.",
    ],
    faq: [
      {
        q: "Why doesn't adding a file to .gitignore remove it from the repository?",
        a: ".gitignore only affects untracked files — it tells Git which new files to ignore, not what to do with files already being tracked. If a file was committed before you added it to .gitignore, Git keeps tracking it. Untrack it first with git rm --cached <file> (this removes it from tracking but keeps it on your disk), then commit — the .gitignore rule takes effect from that point forward.",
      },
      {
        q: "Should I commit a .gitignore file to a public repository?",
        a: "Yes, always — a .gitignore file itself contains no sensitive information (it just lists patterns), and committing it ensures every contributor gets the same ignore rules automatically instead of relying on their own local, uncommitted ignore list.",
      },
      {
        q: "What's the difference between .gitignore and a global gitignore?",
        a: "A repository's .gitignore is committed and shared with everyone who clones it — use it for anything specific to the project (build output, dependency folders). A global gitignore (configured via git config --global core.excludesfile) applies to every repository on your machine and is not shared — use it for personal editor/OS files so you don't have to add them to every project's .gitignore individually.",
      },
      {
        q: "Why is node_modules ignored instead of committed?",
        a: "node_modules can be regenerated exactly from package.json and the lockfile via npm install, and it's often hundreds of megabytes of third-party code that changes with every dependency update. Committing it would bloat the repository's history permanently and create massive, unreviewable diffs on every install. The lockfile (package-lock.json / yarn.lock) is committed instead — that's what makes the install reproducible.",
      },
    ],
  },

  "json-schema-generator": {
    about:
      "The JSON Schema Generator infers a JSON Schema (draft-07) directly from a sample JSON object — no manual schema authoring required. It detects types for every field, including nested objects and arrays, and marks fields present in your sample as required by default.\n\nJSON Schema is the standard way to formally describe the shape of JSON data — used for API request/response validation, form generation, and configuration file validation across the JavaScript, Python, and Java ecosystems alike. Generating one from a real example is far faster than hand-writing the schema from a specification document.",
    useCases: [
      "Generating a starting JSON Schema from a real API response to use with a validation library (Ajv, jsonschema, etc.)",
      "Documenting the expected shape of a request or response body for API documentation",
      "Creating a schema to validate configuration files against before your application loads them",
      "Producing a schema other tools (form generators, mock servers) can consume from real example data",
    ],
    tips: [
      "Generated schemas mark every field present in your sample as required — uncheck 'Mark all present fields as required' if your sample happens to have every optional field filled in.",
      "Arrays with mixed-type elements produce a schema based on the first element's shape — review array schemas manually if your data has genuinely heterogeneous array contents.",
      "A generated schema is a draft, not a final spec — add format validators (email, date-time, uri) and value constraints (minimum, maxLength, pattern) by hand for fields that need them.",
    ],
    faq: [
      {
        q: "Can a schema generated from one example be trusted as complete?",
        a: "Treat it as a solid first draft, not a final schema. It reflects only the fields and types present in the one sample you provided — if a field is sometimes null, sometimes absent, or sometimes a different type across different real responses, the generated schema won't capture that variation. Validate against several real examples and adjust the schema for fields you know vary.",
      },
      {
        q: "What is JSON Schema actually used for?",
        a: "JSON Schema formally describes what valid JSON should look like — required fields, types, formats, and constraints. It's used to validate API requests before processing them, validate API responses in tests, generate documentation and client SDKs, auto-generate form UIs, and validate configuration files at load time. Libraries like Ajv (JavaScript), jsonschema (Python), and everit-org/json-schema (Java) all validate against the same standard.",
      },
      {
        q: "Why does the schema say type: 'integer' for some numbers and 'number' for others?",
        a: "JSON Schema draft-07 distinguishes whole numbers (integer) from numbers with a fractional component (number). The generator checks each numeric value in your sample: 30 produces integer, 30.5 produces number. If a field is sometimes a whole number and sometimes has decimals across different real responses, use number in the schema since it's the broader type that also accepts integers.",
      },
    ],
  },

  "curl-to-code": {
    about:
      "The cURL to Code converter parses a curl command — including headers, method, body, and basic auth — and generates equivalent, ready-to-run code in JavaScript (fetch), Node.js (axios), Python (requests), PHP (cURL), or Go (net/http).\n\ncURL is still the default way API documentation shows example requests, but translating that into the language you're actually working in is tedious and error-prone by hand — especially with multiple headers and a JSON body. This tool does the translation instantly.",
    useCases: [
      "Converting a curl example from API documentation into the language your project actually uses",
      "Turning a request copied from browser DevTools ('Copy as cURL') into a script for testing or automation",
      "Quickly prototyping an API call in Python or Go without hand-translating headers and body syntax",
      "Sharing a runnable code snippet with a teammate who doesn't want to run a raw curl command",
    ],
    tips: [
      "Paste multi-line curl commands (with trailing backslashes) copied directly from a terminal or browser DevTools — they're handled automatically.",
      "Basic auth (-u user:pass) is converted into an Authorization: Basic header automatically, matching what curl does under the hood.",
      "Switch the language tab after pasting once — the same parsed command regenerates instantly in every supported language.",
      "From the HTTP Request Builder, use 'Copy as cURL' then 'Convert to another language' to deep-link a request you built visually straight into this tool.",
    ],
    faq: [
      {
        q: "Does this tool actually execute the curl command?",
        a: "No — it only parses the command's text (method, URL, headers, body) and generates equivalent source code. Nothing is sent over the network. This makes it safe to paste commands containing real tokens or credentials, since nothing leaves your browser either during parsing or in the generated code.",
      },
      {
        q: "What curl flags are supported?",
        a: "The parser handles -X/--request, -H/--header, -d/--data (and its variants), -u/--user (basic auth), -b/--cookie, --url, -A/--user-agent, and common no-argument flags like -k, -s, -L, and --compressed (safely ignored since they don't affect the generated code's request semantics). Multipart form uploads (-F) and more exotic flags aren't currently translated.",
      },
      {
        q: "Why does the generated Authorization header show a Base64 string instead of my username and password?",
        a: "That's exactly what curl -u user:pass does internally — HTTP Basic Authentication sends credentials as Base64-encoded text in the Authorization header, not encrypted. The generated code reproduces the same header curl itself would send. Note that Base64 is trivially reversible, so Basic Auth should only ever be used over HTTPS.",
      },
      {
        q: "Can I convert code back into a curl command?",
        a: "Not with this tool directly, but the HTTP Request Builder's 'Copy as cURL' button does the reverse — build a request visually with the method, URL, headers, and body fields, and it generates the equivalent curl command for you.",
      },
    ],
  },

  "env-file-tool": {
    about:
      "The Env File Tool parses a .env file, flags duplicate keys before they cause a confusing bug, converts it to JSON, and generates a safe-to-commit .env.example with every value stripped but every key preserved.\n\nA missing or outdated .env.example is one of the most common onboarding friction points on a team — a new developer clones the repo, runs the app, and it fails with no clear indication of which environment variables were actually required. This tool keeps that file trivially easy to regenerate from the real .env.",
    useCases: [
      "Generating an up-to-date .env.example whenever new environment variables are added, so onboarding a new teammate doesn't require guessing",
      "Catching duplicate keys in a .env file — the last one silently wins, which is a common source of 'why isn't my config taking effect' bugs",
      "Converting a .env file to JSON for tooling that expects configuration as JSON rather than KEY=value pairs",
      "Auditing exactly which keys a .env file defines before sharing a sanitized version with a teammate or in documentation",
    ],
    tips: [
      "Regenerate .env.example every time you add a new environment variable — a stale one is worse than none, since it silently omits a variable someone actually needs to set.",
      "The duplicate-key check exists because .env parsers universally let the last occurrence of a key win with no warning — this is one of the most common invisible config bugs.",
      "Quoted values ('...' or \"...\") have their quotes stripped automatically when converting to JSON, matching how most .env parser libraries (dotenv, python-dotenv) behave.",
      "Never paste a production .env with real secrets into a tool you haven't verified is client-side only — this one is, but make that check a habit.",
    ],
    faq: [
      {
        q: "Is it safe to paste a .env file with real secrets into this tool?",
        a: "Yes — parsing, duplicate detection, and both conversions run entirely in JavaScript in your browser. Nothing is uploaded to a server. That said, treat any tool handling real secrets with healthy caution generally, and prefer generating the .env.example from a copy with placeholder values if you're at all unsure.",
      },
      {
        q: "Why does a duplicate key in .env not cause an error when I run my app?",
        a: "Virtually every .env parser (dotenv for Node, python-dotenv for Python, and others) silently lets the last occurrence of a duplicate key win, with no warning printed. This means a duplicate can sit in a .env file for months, quietly overriding an earlier value, until someone spends an hour debugging why a config change 'isn't taking effect' — when in fact a later duplicate line was overriding it the whole time.",
      },
      {
        q: "What exactly goes into the generated .env.example?",
        a: "Every key found in your .env file, each set to an empty value (KEY=), with no actual secrets included. This preserves the complete list of what needs to be configured — which is the entire point of an example file — without exposing any real credentials, API keys, or connection strings.",
      },
      {
        q: "Does this tool support export KEY=value syntax?",
        a: "Yes — the export prefix (used so a .env file can also be sourced directly in a shell with source .env) is stripped automatically during parsing, so both export DATABASE_URL=... and DATABASE_URL=... parse identically.",
      },
    ],
  },

  "mermaid-editor": {
    about:
      "The Mermaid Diagram Editor renders flowcharts, sequence diagrams, class diagrams, state diagrams, Gantt charts, pie charts, and entity-relationship diagrams from plain text — using the same Mermaid syntax that renders natively in GitHub, GitLab, and Notion markdown.\n\nWriting a diagram as text instead of dragging boxes in a GUI means it can live in version control, get reviewed in a pull request like any other code change, and stay in sync with the codebase it documents — rather than going stale in a separate design tool nobody remembers to update.",
    useCases: [
      "Drafting a sequence diagram for an API flow or a system design doc before writing the implementation",
      "Writing architecture diagrams that live in the repository as text and get reviewed in pull requests",
      "Creating a flowchart to document a decision process or onboarding workflow",
      "Exporting a diagram as SVG or PNG to drop into a slide deck or external documentation",
    ],
    tips: [
      "Diagrams written in Mermaid syntax render natively in GitHub and GitLab markdown — write it once here, verify it looks right, then paste it straight into a README's code fence.",
      "Start from one of the built-in templates (Flowchart, Sequence, Class, State, Gantt, Pie, ER) and modify it — it's faster than writing Mermaid syntax from a blank page.",
      "SVG export stays crisp at any zoom level for documentation; PNG export is better for pasting directly into tools that don't render SVG well, like some slide software.",
      "Keep node labels short — Mermaid's automatic layout engine handles long labels by making the diagram wider, which can push it off the page in exports.",
    ],
    faq: [
      {
        q: "Where else can I use the diagrams I write here?",
        a: "Anywhere Mermaid is supported natively — GitHub and GitLab render ```mermaid code fences directly in markdown (READMEs, issues, pull requests), as does Notion. Paste the exact same syntax you wrote here into any of those and it renders identically, no image export required.",
      },
      {
        q: "Why did my diagram fail to render?",
        a: "Mermaid syntax is diagram-type-specific — a flowchart uses graph TD or graph LR as its first line, a sequence diagram uses sequenceDiagram, and so on. The most common cause of a render failure is mixing syntax from two different diagram types, or a typo in an arrow (-->) or connector. Start from the matching template and modify incrementally to isolate what broke.",
      },
      {
        q: "Is Mermaid the same as diagrams made in Lucidchart or draw.io?",
        a: "Different approach entirely. Lucidchart and draw.io are GUI-based, drag-and-drop diagramming tools that produce a proprietary file format. Mermaid diagrams are plain text — which means they diff cleanly in version control, can be generated programmatically, and don't require a specific paid tool to open and edit. The tradeoff is layout control: Mermaid's automatic layout engine positions elements for you, rather than pixel-perfect manual placement.",
      },
      {
        q: "Can I control the exact position of each node?",
        a: "Not precisely — Mermaid uses an automatic layout algorithm rather than manual positioning, which is the core tradeoff for writing diagrams as text instead of dragging shapes. You can influence layout indirectly through diagram direction (TD, LR, etc.) and the order nodes are declared, but pixel-level control isn't part of the Mermaid model.",
      },
    ],
  },

  "word-counter": {
    about:
      "The Word Counter gives you live word, character, sentence, and paragraph counts as you type or paste text, plus reading time and speaking time estimates. It also surfaces the most frequently used words in your text, excluding common stop words — a quick way to spot repetition before publishing.",
    useCases: [
      "Checking a blog post or article against a publication's word count requirement",
      "Verifying a meta description or title fits within a character limit before publishing",
      "Estimating how long a presentation script will take to deliver out loud",
      "Spotting overused words in a draft before final edits",
    ],
    tips: [
      "Reading time is estimated at 200 words per minute, the commonly cited average adult silent-reading speed.",
      "Speaking time is estimated at 130 words per minute, closer to a natural spoken pace than reading pace.",
      "The frequent-words list filters out common stop words (the, and, is, etc.) so it surfaces words that actually reflect your content's topic.",
    ],
    faq: [
      {
        q: "How is reading time calculated?",
        a: "Reading time uses a standard estimate of 200 words per minute, a commonly cited average for adult silent reading of general text. It's an estimate — actual reading speed varies by content density, reader familiarity with the topic, and whether the text includes code or technical jargon.",
      },
      {
        q: "Why is my character count different from what my editor shows?",
        a: "Character counts can differ based on whether an editor counts newline characters, tab characters, or Unicode combining characters (like accents) as one character or several. This tool counts every character in the string exactly as stored, including whitespace, matching JavaScript's native string length.",
      },
      {
        q: "Does this tool count words the same way as Microsoft Word or Google Docs?",
        a: "Very close, but not always identical — word counters differ slightly in how they handle hyphenated words, em-dashes, and numbers with punctuation. This tool splits on whitespace, which matches most word processors for standard prose but may count a hyphenated compound word as one word where another tool counts it as two.",
      },
      {
        q: "Is my text uploaded anywhere?",
        a: "No. All counting happens in JavaScript in your browser. Nothing is sent to a server, which makes it safe to paste unpublished drafts or confidential text.",
      },
    ],
  },

  "svg-optimizer": {
    about:
      "The SVG Optimizer strips the invisible bloat that design tools like Illustrator, Figma, and Inkscape add to exported SVG files — comments, metadata, editor-specific namespaces, empty groups, and excessive coordinate precision — often shrinking file size by 50% or more without any visible change to the image.\n\nExported SVGs frequently carry editor cruft that serves the editor, not the browser: Inkscape and Sodipodi namespaces recording tool state, XML comments, <title> and <desc> elements duplicating alt text, and path coordinates specified to 6+ decimal places when 2 is visually indistinguishable.",
    useCases: [
      "Shrinking icon sets exported from Figma or Illustrator before adding them to a project",
      "Cleaning up SVGs before inlining them directly in HTML or JSX, where every byte is duplicated per use",
      "Removing Inkscape/Sodipodi editor metadata that leaks tool version and workspace info",
      "Reducing SVG file size for faster page loads on image-heavy sites",
    ],
    tips: [
      "2 decimal places of coordinate precision is visually indistinguishable from the original in almost all cases — try 1 for icons if you want to push size down further.",
      "Removing width/height (keeping only viewBox) makes an SVG scale cleanly to any container size via CSS — useful for icon components.",
      "Always spot-check the visual preview after optimizing — aggressive precision rounding can occasionally distort very small or highly detailed paths.",
    ],
    faq: [
      {
        q: "Will optimizing change how my SVG looks?",
        a: "The default settings (2 decimal places, removing comments/metadata/empty groups) are chosen to be visually lossless for the vast majority of SVGs. Reducing precision further, or removing width/height on an SVG that relies on them for layout, can occasionally cause visible differences — always check the before/after preview.",
      },
      {
        q: "Why is my exported SVG so much larger than it needs to be?",
        a: "Design tools optimize for editability, not file size — they preserve full undo history context, layer names, tool-specific metadata (Inkscape/Sodipodi namespaces), and high-precision coordinates from every anchor point adjustment. None of that is needed for the SVG to render correctly in a browser.",
      },
      {
        q: "Is this the same as running SVGO?",
        a: "It targets the same class of bloat — comments, metadata, editor namespaces, empty elements, coordinate precision — using a lighter, browser-native implementation rather than the full SVGO plugin pipeline. For typical icon and illustration exports, the size reduction is comparable; SVGO's more advanced optimizations (path merging, attribute-to-CSS conversion) aren't included.",
      },
      {
        q: "Can I optimize an SVG that has embedded raster images or fonts?",
        a: "Yes, but the savings will be smaller in percentage terms — this tool optimizes SVG markup (paths, groups, metadata), not embedded base64-encoded images or font data, which typically account for most of the file size when present.",
      },
    ],
  },

  "slug-generator": {
    about:
      "The Slug Generator converts titles or arbitrary text into clean, URL-safe slugs — lowercase, hyphen-separated, with accented characters transliterated to their closest ASCII equivalent (café becomes cafe, not café or c%C3%A9af%C3%A9). Paste multiple lines to batch-convert an entire list of titles at once.",
    useCases: [
      "Generating a URL slug for a new blog post or documentation page title",
      "Batch-converting a spreadsheet export of article titles into slugs for a CMS import",
      "Creating consistent, readable URLs from product names for an e-commerce catalog",
      "Cleaning up user-submitted titles before using them in a URL path",
    ],
    tips: [
      "Batch mode processes one line at a time — paste an entire list of titles to get a matching list of slugs instantly.",
      "Accented and non-Latin characters are transliterated where possible (café → cafe) rather than stripped, keeping the slug readable.",
      "Set a max length to keep slugs from becoming unreasonably long for titles with many words — the cut respects word boundaries via the separator.",
    ],
    faq: [
      {
        q: "Why use hyphens instead of underscores in a slug?",
        a: "Google has confirmed it treats hyphens as word separators in URLs but treats underscores as joining characters, meaning 'my-post-title' is read as three words while 'my_post_title' may be read as one token. Hyphens are the SEO-conventional choice; underscores are mainly seen in older systems or specific frameworks that expect them.",
      },
      {
        q: "What happens to special characters and emoji in the title?",
        a: "Accented Latin characters are transliterated to their closest plain-ASCII equivalent (é → e, ñ → n). Characters with no reasonable ASCII equivalent — emoji, symbols, most non-Latin scripts — are stripped and treated as word breaks, collapsing into the surrounding separator.",
      },
      {
        q: "Should slugs match the page title exactly?",
        a: "Not necessarily — slugs are commonly shortened versions of the full title, dropping filler words (a, the, of) to keep the URL concise. Search engines don't require an exact match between title and slug, but including your primary keyword in the slug is still a commonly cited on-page SEO practice.",
      },
      {
        q: "Can I change a slug after a page is already published and indexed?",
        a: "You can, but it breaks the existing URL unless you add a redirect. Changing a published slug without a 301 redirect from the old URL to the new one loses any search ranking and backlinks the original URL had accumulated. If you must change it, always redirect the old slug to the new one.",
      },
    ],
  },

  "robots-txt-generator": {
    about:
      "The robots.txt Generator builds a complete robots.txt file from per-bot User-agent rules — Allow and Disallow paths, optional crawl-delay, and sitemap links — with a one-click preset to block the most common AI training crawlers (GPTBot, Google-Extended, ClaudeBot, CCBot, and others) by name.\n\nrobots.txt remains the standard, actually-honored mechanism for controlling crawler access: OpenAI and Anthropic both officially point to robots.txt (not the newer, largely unsupported llms.txt proposal) for managing how their crawlers interact with your site.",
    useCases: [
      "Setting up a robots.txt for a new site with sensible defaults for admin/API paths",
      "Blocking specific AI training crawlers (GPTBot, Google-Extended, CCBot) while still allowing search engine indexing",
      "Declaring sitemap locations so crawlers discover your full page list efficiently",
      "Building different crawl rules for different bots — e.g. stricter rules for aggressive scrapers than for Googlebot",
    ],
    tips: [
      "One User-agent group can list multiple bots on separate lines above shared Allow/Disallow rules — you don't need a separate group per bot unless the rules actually differ.",
      "robots.txt is a request, not enforcement — well-behaved crawlers (Googlebot, Bingbot, and the major AI crawlers) respect it, but nothing stops a scraper from ignoring it entirely.",
      "Use the 'Block AI crawlers' preset as a starting point, then remove any bots you actually want indexing your content for AI-powered search or citation.",
    ],
    faq: [
      {
        q: "Does blocking AI crawlers in robots.txt actually work?",
        a: "For crawlers that respect the standard — OpenAI's GPTBot, Anthropic's ClaudeBot, Google-Extended — yes, since both OpenAI and Anthropic have officially stated they honor robots.txt for managing crawler access. It won't stop crawlers that don't respect the file at all, which does happen with some more aggressive or less reputable scrapers.",
      },
      {
        q: "Should I use llms.txt instead of or alongside robots.txt?",
        a: "As of 2026, llms.txt has real adoption among documentation platforms but is not honored by the major AI systems — Google has stated it has no plans to support it, and OpenAI/Anthropic point to robots.txt instead. robots.txt is the mechanism that actually controls crawler access today; llms.txt does not reliably improve AI visibility.",
      },
      {
        q: "What's the difference between Disallow and noindex?",
        a: "Disallow in robots.txt tells a crawler not to fetch a path at all — but if another page links to it, search engines may still index the URL without visiting it, showing it in results with no description. A noindex meta tag (set on the page itself) explicitly tells search engines not to include the page in results, but requires the crawler to fetch the page to see the tag — the two mechanisms solve different problems and are sometimes used together incorrectly.",
      },
      {
        q: "Do I need a separate robots.txt for each subdomain?",
        a: "Yes — robots.txt only applies to the exact host and scheme it's served from. A file at example.com/robots.txt has no effect on blog.example.com or a different subdomain; each needs its own robots.txt at its own root.",
      },
    ],
  },

  "csp-builder": {
    about:
      "The CSP Header Builder & Analyzer helps with both directions of Content-Security-Policy work: build a policy visually by setting allowed sources per directive (script-src, style-src, img-src, and more), or paste an existing policy to check it for common misconfigurations like 'unsafe-inline', 'unsafe-eval', and wildcard sources that undermine CSP's core protection.\n\nCSP is one of the most effective browser-level defenses against XSS, but it's also one of the most commonly misconfigured security headers — a policy with 'unsafe-inline' in script-src provides close to zero XSS protection while looking like a real security control.",
    useCases: [
      "Building a starting CSP for a new project's security headers, directive by directive",
      "Auditing an existing CSP (your own, or a security scan's report) for directives that silently undermine XSS protection",
      "Generating both the HTTP header and equivalent <meta> tag versions of the same policy",
      "Understanding what a specific CSP directive actually restricts before adding it to production",
    ],
    tips: [
      "Set CSP via the HTTP header, not the <meta> tag, whenever possible — frame-ancestors, report-uri, and sandbox are silently ignored in the <meta> tag form.",
      "'unsafe-inline' in script-src is the single most common CSP mistake — it defeats most of CSP's XSS protection while still looking like a real policy. Use nonces or hashes for inline scripts you can't externalize.",
      "Start restrictive (default-src 'self') and add specific sources as you find real violations in the browser console, rather than starting permissive and trying to tighten later.",
    ],
    faq: [
      {
        q: "What does Content-Security-Policy actually protect against?",
        a: "CSP's primary purpose is mitigating Cross-Site Scripting (XSS) — even if an attacker manages to inject a <script> tag into your page (via a stored XSS bug, for example), a correctly configured CSP prevents that script from executing because it didn't come from an allowed source. It also restricts other risky behaviors: framing (clickjacking), form submission targets, and base URI manipulation.",
      },
      {
        q: "Why does 'unsafe-inline' defeat the purpose of CSP?",
        a: "CSP's core XSS defense works by only allowing scripts from trusted, explicitly listed sources. 'unsafe-inline' tells the browser to allow ANY inline <script> tag or inline event handler to execute — which is exactly the mechanism most XSS attacks use to run injected code. A policy with 'unsafe-inline' in script-src is only marginally better than no CSP at all for XSS purposes.",
      },
      {
        q: "What should I use instead of 'unsafe-inline' for scripts I can't move to external files?",
        a: "Use a nonce (a random, per-request token added to both the CSP header and the script tag: <script nonce=\"random123\">) or a hash of the exact script content (CSP allows 'sha256-<hash>' as a source). Both let specific inline scripts run without opening the door to arbitrary injected scripts, since an attacker can't guess the nonce or produce content matching the hash.",
      },
      {
        q: "Do I need report-uri or report-to in my CSP?",
        a: "Not strictly required, but strongly recommended for production — it tells the browser to send a report whenever the policy blocks something, which is how you discover legitimate resources your policy is accidentally blocking (or catch real attack attempts) without waiting for a user to report a broken page. Set it via the HTTP header, since it's ignored in the <meta> tag form.",
      },
    ],
  },

  "image-compressor": {
    about:
      "The Image Compressor shrinks JPEG, PNG, and WebP images directly in your browser using the Canvas API — no upload, no server round-trip, no waiting on a queue. Drop in an image, pick an output format and quality level, and optionally cap the maximum width or height, and you get a compressed file with a live before/after size comparison.\n\nThis is the same core operation tools like TinyPNG or Squoosh perform, but entirely client-side: the image is decoded into a canvas, re-encoded at your chosen quality, and never transmitted anywhere. That matters for screenshots containing sensitive data, unreleased product images, or any asset you'd rather not hand to a third-party server.\n\nConverting between formats is also supported — compress a PNG down to WebP for smaller file size, or force JPEG output when you need broad compatibility and don't need transparency.",
    useCases: [
      "Shrinking screenshots and product images before adding them to a blog post or PR description",
      "Converting PNG screenshots to WebP for smaller page weight without a build step",
      "Resizing oversized camera photos down to a sane max width before uploading",
      "Compressing images for email attachments that have strict size limits",
    ],
    tips: [
      "WebP typically gives the smallest file size at equivalent visual quality — use it unless you specifically need JPEG or PNG compatibility.",
      "PNG output ignores the quality slider since PNG compression is lossless; use JPEG or WebP if you need to trade quality for size.",
      "Setting a max width/height resizes proportionally — you don't need to know the exact target dimensions, just the upper bound.",
    ],
    faq: [
      {
        q: "Does compressing an image reduce its dimensions?",
        a: "Not unless you set a max width or height. By default, compression only reduces file size by re-encoding at a lower quality — the pixel dimensions stay the same. Use the max width/height option if you also want to downscale.",
      },
      {
        q: "Why is my PNG still large after compression?",
        a: "PNG is a lossless format, so the quality slider has no effect on it. If you need a smaller file, convert to WebP or JPEG — both support lossy compression and will typically produce a much smaller file for photographic content.",
      },
      {
        q: "Is my image uploaded anywhere?",
        a: "No. The entire compression process happens in your browser using the HTML Canvas API. Your image file never leaves your device or gets sent to any server.",
      },
    ],
  },

  "graphql-formatter": {
    about:
      "The GraphQL Query Formatter beautifies and minifies GraphQL operations — queries, mutations, subscriptions, and fragment definitions — with correct handling of the parts of GraphQL syntax that trip up naive formatters: inline fragments (`... on Type`), named fragment spreads (`...FragmentName`), directives (`@include`, `@skip`), aliases, and nested input object literals.\n\nPaste a minified or inconsistently indented GraphQL document and get back cleanly indented output with consistent brace placement. Or switch to Minify mode to strip an operation down to the smallest valid form for sending over the wire.\n\nEverything runs client-side with a purpose-built tokenizer — your GraphQL schema and queries, which often reveal internal API structure, never leave your browser.",
    useCases: [
      "Cleaning up a GraphQL query copied from browser DevTools' Network tab before sharing it in a bug report",
      "Formatting queries pasted from a minified GraphQL Playground or Apollo Studio export",
      "Minifying GraphQL operations before embedding them in application code to save bytes",
      "Reviewing a teammate's PR that adds a new GraphQL operation by formatting it consistently first",
    ],
    tips: [
      "Inline fragments (`... on User { ... }`) and named fragment spreads (`...UserFields`) are formatted correctly — most simple indenters break on these.",
      "Minify mode is useful for embedding queries in source code where you want a single-line string rather than a template literal.",
      "Comments (lines starting with #) are preserved by the formatter but stripped by the minifier, matching how GraphQL servers treat them.",
    ],
    faq: [
      {
        q: "Does this validate my GraphQL against a schema?",
        a: "No — this is a syntax formatter, not a schema validator. It reformats whatever valid GraphQL syntax you paste in, but doesn't check field names, types, or arguments against an actual schema.",
      },
      {
        q: "What's the difference between an inline fragment and a fragment spread?",
        a: "An inline fragment (`... on User { name }`) is defined right where it's used, typically to select type-specific fields on a union or interface. A fragment spread (`...UserFields`) references a separately defined `fragment UserFields on User { ... }` block elsewhere in the document. Both use the `...` syntax but format differently, which this tool handles correctly.",
      },
      {
        q: "Can I format a whole .graphql schema file, not just an operation?",
        a: "The formatter is built for operations (queries, mutations, subscriptions, fragments) rather than SDL schema definitions (type User { ... }). Simple SDL will often format reasonably, but it isn't the primary target.",
      },
    ],
  },

  "url-parser": {
    about:
      "The URL Parser breaks any URL down into its component parts — protocol, credentials, host, port, path, query parameters, and hash — and displays them individually, making it easy to see exactly what a long or unfamiliar URL actually contains.\n\nThe query string side works as a live builder: parameters are shown as editable rows, so you can add, remove, or edit them and watch the full URL rebuild in real time. A one-click button adds the standard five UTM parameters (utm_source, utm_medium, utm_campaign, utm_term, utm_content) for building campaign tracking links without typing them by hand.\n\nParsing uses the browser's native URL API, so behavior matches exactly what your JavaScript code would see when constructing a `new URL()` — no surprises when you copy the result into application code.",
    useCases: [
      "Decomposing a long URL with tracking parameters to see what data it's actually carrying",
      "Building a UTM-tagged marketing link without hand-editing a query string",
      "Debugging why a URL isn't parsing the way your application code expects",
      "Adding, removing, or renaming query parameters on an existing URL without starting from scratch",
    ],
    tips: [
      "Use \"Add UTM params\" to quickly scaffold the five standard utm_* parameters, then edit their values for your campaign.",
      "The parsed breakdown updates live as you type — useful for spotting an unexpected extra parameter or malformed segment.",
      "Editing a query parameter's key or value immediately rebuilds the full URL shown at the bottom, so you can copy it as soon as it looks right.",
    ],
    faq: [
      {
        q: "Can I edit the host or path directly, not just query parameters?",
        a: "The protocol, host, path, and other base components are shown as a read-only breakdown for inspection. To change them, edit the full URL text field directly — only the query parameters have a dedicated editable table.",
      },
      {
        q: "What happens if I paste an invalid URL?",
        a: "The parser uses the browser's native URL API, so it flags anything that isn't a valid absolute URL (missing protocol, malformed syntax) rather than guessing at a partial parse.",
      },
      {
        q: "Are UTM parameters the only thing the query builder supports?",
        a: "No — the UTM button is a shortcut for a common case. You can add, edit, or remove any query parameter by key and value, not just UTM ones.",
      },
    ],
  },

  "image-color-picker": {
    about:
      "The Image Color Palette Extractor analyzes an uploaded image and pulls out its most dominant colors, ranked by how much of the image they cover. Drop in a photo, screenshot, or design mockup and get back a ranked palette of HEX and RGB values — plus a ready-to-copy block of CSS custom properties.\n\nUnder the hood, the image is downscaled onto a canvas and every sampled pixel is bucketed into a coarse RGB grid so that near-identical shades count as the same color, then buckets are sorted by frequency. This gives a genuinely representative palette rather than just the first few unique pixel values.\n\nEverything happens in-browser via the Canvas API — the image itself is never uploaded anywhere.",
    useCases: [
      "Pulling a brand color palette out of a logo or existing marketing image",
      "Generating a matching UI theme from a hero photo or product shot",
      "Extracting CSS custom properties directly from a design mockup screenshot",
      "Checking what colors actually dominate a photo before using it in a design",
    ],
    tips: [
      "Increase the color count slider if the image has subtle variation you want captured — the default 6 favors the most visually dominant shades.",
      "Semi-transparent pixels are excluded from analysis, so palettes extracted from PNGs with transparency reflect only the visible content.",
      "Use the CSS Variables export to paste extracted colors directly into a stylesheet as `--color-1`, `--color-2`, etc.",
    ],
    faq: [
      {
        q: "How are the dominant colors determined?",
        a: "The image is sampled on a canvas and each pixel's color is grouped into a coarse RGB bucket so visually similar shades count together, rather than treating every slightly different pixel as a unique color. Buckets are then ranked by how many pixels fall into them.",
      },
      {
        q: "Does image size affect extraction speed or accuracy?",
        a: "The image is downscaled internally before sampling, so large images process quickly without materially changing the resulting palette — the dominant colors of a downscaled version match the full-resolution image closely.",
      },
      {
        q: "Is the image uploaded to a server for analysis?",
        a: "No. Extraction runs entirely client-side using the Canvas API's pixel data. The image file never leaves your browser.",
      },
    ],
  },

  "jwt-keypair-generator": {
    about:
      "The JWT Key Pair Generator creates asymmetric key pairs for signing JSON Web Tokens with RSA (RS256/384/512, PS256/384/512) or ECDSA (ES256/384/512) algorithms, using the browser's native WebCrypto API. Unlike HMAC-based JWTs which share a single secret between signer and verifier, these algorithms let you keep a private key for signing and distribute a public key for verification — the setup required by OAuth providers, OpenID Connect, and most production JWT-based auth systems.\n\nBoth keys are exported in two formats: PEM (the classic `-----BEGIN...-----` text format used by most server libraries and CLI tools) and JWK (JSON Web Key, used by JWKS endpoints and browser-native crypto APIs). Pick your algorithm and, for RSA, a key size (2048 or 4096-bit), and get all four key representations at once.\n\nKey generation happens entirely in your browser via WebCrypto — private keys are never transmitted anywhere, but treat any private key generated on a shared or untrusted machine with the same caution you'd apply to a production secret.",
    useCases: [
      "Generating an RS256 key pair for signing JWTs in a Node.js or Python auth service",
      "Creating an ES256 key pair for a JWKS endpoint used by OpenID Connect clients",
      "Producing test key pairs for local development without touching production key material",
      "Getting both PEM and JWK formats of the same key without running separate conversion tools",
    ],
    tips: [
      "ES256 (ECDSA) produces much shorter keys and signatures than RS256 for equivalent security — prefer it for new systems if your libraries support it.",
      "2048-bit RSA is the current minimum recommended size; use 4096-bit only if a specific compliance requirement calls for it, since it's slower and produces larger tokens.",
      "Never paste a generated private key into a public repository, client-side code, or a chat tool — treat it exactly like a database password.",
    ],
    faq: [
      {
        q: "What's the difference between RS256, PS256, and ES256?",
        a: "RS256 and PS256 are both RSA-based (PS256 uses the more modern RSA-PSS padding scheme instead of PKCS#1 v1.5). ES256 uses ECDSA on elliptic curves, producing much smaller keys and signatures for equivalent security. Most modern systems prefer ES256 for its size, but RS256 remains the most widely supported across older libraries.",
      },
      {
        q: "Which key do I use for signing vs. verifying?",
        a: "The private key signs tokens and must be kept secret on your auth server. The public key verifies tokens and can be shared freely — it's typically published at a JWKS endpoint so any service can verify tokens without holding the private key.",
      },
      {
        q: "Should I use this to generate production keys?",
        a: "The cryptography (WebCrypto's RSA and ECDSA implementations) is sound and suitable for real use, but for production systems, prefer generating keys on the server or infrastructure that will actually hold the private key, using your standard key-management process — minimizing how many places a private key is ever displayed or copied.",
      },
    ],
  },

  "ssh-key-generator": {
    about:
      "The SSH Key Generator creates Ed25519 or RSA key pairs directly in your browser using the WebCrypto API, formatted exactly as OpenSSH expects — no separate conversion step needed. The public key comes out as a single-line `ssh-ed25519 AAAA...` or `ssh-rsa AAAA...` string ready to paste into a server's authorized_keys file or a Git host's SSH key settings. The private key comes out ready to save as-is: Ed25519 keys are written in the real OPENSSH PRIVATE KEY container format, and RSA keys as PKCS8 PEM, which OpenSSH (7.6+) reads natively.\n\nBoth formats were verified byte-for-byte against the real ssh-keygen tool during development — the public keys and SHA256 fingerprints it derives from ToolNinja-generated private keys match exactly, confirming genuine interoperability rather than just visually-plausible output.\n\nEd25519 is the modern recommendation for new keys: shorter, faster, and free of several implementation pitfalls that have affected RSA and ECDSA over the years. RSA remains available for the (increasingly rare) systems that don't yet support Ed25519.",
    useCases: [
      "Generating a new Ed25519 key for a fresh GitHub, GitLab, or server SSH setup",
      "Creating a dedicated deploy key for a CI/CD pipeline without touching your personal key",
      "Getting an RSA key pair for a legacy system that doesn't support Ed25519",
      "Generating a disposable key pair for testing SSH configuration locally",
    ],
    tips: [
      "Prefer Ed25519 over RSA for any new key — it's shorter, faster to verify, and the current best-practice default across GitHub, GitLab, and OpenSSH itself.",
      "The private key never leaves your browser during generation, but once downloaded it's a real credential — store it like any other SSH private key (correct file permissions, never committed to a repo).",
      "Add a comment (typically an email or hostname) to make it easy to identify which key is which later, especially if you'll have several in your authorized_keys file.",
    ],
    faq: [
      {
        q: "Is this actually compatible with real SSH clients and servers?",
        a: "Yes — both the Ed25519 and RSA output were verified directly against ssh-keygen during development: deriving the public key from a ToolNinja-generated private key with `ssh-keygen -y` produces an identical result, and `ssh-keygen -l` computes the same SHA256 fingerprint. The keys are genuinely standard, not just formatted to look correct.",
      },
      {
        q: "Why does the RSA private key look different from the Ed25519 one?",
        a: "Ed25519 keys are written in the newer OPENSSH PRIVATE KEY container format (the same one `ssh-keygen` produces by default today). RSA keys are written as PKCS8 PEM (`BEGIN PRIVATE KEY`), which modern OpenSSH (7.6 and later) reads directly without conversion — both are fully standard, just different historical formats for the two algorithms.",
      },
      {
        q: "Should I use 2048-bit or 4096-bit RSA?",
        a: "2048-bit is the current baseline and is still considered secure — most systems default to it. 4096-bit adds a meaningful security margin at the cost of slower key operations and a larger key size; use it only if a specific compliance requirement calls for it. For new keys generally, Ed25519 is preferable to either.",
      },
      {
        q: "Is my private key ever sent anywhere?",
        a: "No. Key generation happens entirely client-side via the browser's WebCrypto API. Nothing is transmitted to a server at any point — but once you copy or download the key, treat the file itself with the same care as any other SSH private key.",
      },
    ],
  },

  "totp-generator": {
    about:
      "The TOTP / 2FA Code Generator produces live, auto-refreshing time-based one-time-password codes from a Base32 secret — the same codes an app like Google Authenticator or Authy would show, computed with the standard RFC 6238 algorithm directly in your browser. Paste in a secret (or generate a random one), and a 6- or 8-digit code updates automatically with a countdown showing exactly when it'll refresh.\n\nIt also builds and parses `otpauth://` URLs — the same format encoded into 2FA setup QR codes — so you can round-trip between a raw secret and the URL format your app or documentation actually uses. SHA-1, SHA-256, and SHA-512 are all supported, along with custom digit counts and refresh periods for testing non-default configurations.\n\nThe entire computation — HMAC, dynamic truncation, and the final code — runs through the Web Crypto API in your browser. Your secret is never transmitted anywhere, which matters given that a TOTP secret is exactly as sensitive as the 2FA codes it produces.",
    useCases: [
      "Testing a 2FA integration during development without reaching for your phone every 30 seconds",
      "Generating a backup code source when setting up a new service's two-factor authentication",
      "Debugging a TOTP implementation by comparing computed codes against expected values",
      "Verifying an otpauth:// URL is correctly formatted before embedding it in a QR code",
    ],
    tips: [
      "Most consumer apps (Google Authenticator, Authy) use SHA-1, 6 digits, and a 30-second period — only change these if you know your target system uses something different.",
      "Use the otpauth:// import field to quickly load a secret straight from a URL you've copied out of a QR code payload or a service's manual setup instructions.",
      "Treat any secret you paste in here as sensitive — anyone with the secret can generate valid 2FA codes for that account.",
    ],
    faq: [
      {
        q: "Is this the same algorithm my phone's authenticator app uses?",
        a: "Yes — TOTP is a standardized algorithm (RFC 6238) built on HMAC-based one-time passwords (HOTP). Any correct implementation, whether it's Google Authenticator, Authy, or this tool, produces the identical code for the same secret, algorithm, digit count, and time period, because the math is fully specified by the standard rather than app-specific.",
      },
      {
        q: "What's the difference between the secret and the otpauth:// URL?",
        a: "The secret is the raw Base32-encoded key used in the HMAC computation — the actual sensitive credential. The otpauth:// URL wraps that secret together with metadata (account label, issuer name, algorithm, digits, period) in the single format that QR codes for 2FA setup encode, so a scanning app knows how to configure itself, not just what the secret is.",
      },
      {
        q: "Why would I ever need SHA-256 or SHA-512, or a period other than 30 seconds?",
        a: "The overwhelming majority of consumer 2FA uses SHA-1/6-digit/30-second by default, but the TOTP standard supports alternatives, and some enterprise or custom systems use them deliberately for a longer security margin or a different refresh cadence. These options exist here mainly for testing and verifying non-default TOTP configurations, not everyday use.",
      },
      {
        q: "Is it safe to generate real account 2FA codes with an online tool?",
        a: "The computation is 100% client-side — your secret is never sent to a server — but the safest practice for a production account's actual ongoing 2FA is still a dedicated authenticator app or hardware key, since this tool has no persistent, encrypted secret storage the way a real authenticator app does. It's best suited for testing, debugging, and one-off verification rather than as your daily-driver authenticator.",
      },
    ],
  },

  "htaccess-to-nginx": {
    about:
      "The .htaccess to Nginx Converter translates Apache's .htaccess directives into nginx server block syntax — RewriteRule and RewriteCond chains, Redirect/RedirectMatch, ErrorDocument, DirectoryIndex, Options -Indexes, <Files> blocks, and basic auth. It's built to get the handful of patterns that account for most real .htaccess files right, rather than attempting a mechanical, line-for-line translation that produces subtly broken nginx config.\n\nThat matters most for a few extremely common idioms that don't translate literally: forcing HTTPS, stripping or adding a www prefix, and the standard WordPress front-controller block. All three involve RewriteCond capture groups interacting with RewriteRule's own capture groups in ways that collide if translated naively — this tool handles those cases specifically, and for the WordPress pattern emits nginx's own recommended `try_files` idiom rather than an if-based port, since nginx's documentation itself favors try_files over if-based file-existence checks for exactly this scenario.\n\nAnything it doesn't have a confident translation for — a specific PHP handler directive, an unusual flag combination, RewriteBase — is called out explicitly as a warning rather than silently dropped or guessed at, so you know exactly what still needs manual attention.",
    useCases: [
      "Migrating a WordPress or PHP site's .htaccess rules when moving from Apache to nginx",
      "Converting a force-HTTPS or www-redirect rule without hand-translating the regex capture groups",
      "Getting a starting nginx config from an inherited .htaccess file with unclear history",
      "Checking which .htaccess directives have no direct nginx equivalent before a server migration",
    ],
    tips: [
      "The WordPress front-controller pattern (RewriteCond !-f, !-d, then a catch-all RewriteRule to index.php) is detected and converted to nginx's recommended try_files block — the standard, idiomatic form rather than a literal port.",
      "Review every warning the tool surfaces before deploying — they mark directives Apache and nginx handle fundamentally differently, not just cosmetic differences.",
      "PHP handling in nginx requires a dedicated `location ~ \\.php$` block passing requests to php-fpm — there's no direct equivalent to Apache's AddHandler, so the tool provides a starting template rather than a false translation.",
    ],
    faq: [
      {
        q: "Will this produce a 100% working nginx config from any .htaccess file?",
        a: "For the common cases — redirects, rewrites, error pages, directory index, basic auth, simple <Files> blocks — yes, with correct handling of the tricky capture-group interactions in host/scheme redirects. For anything unusual, the tool flags it as needing manual review rather than guessing, since a confidently wrong nginx directive is worse than an honest gap.",
      },
      {
        q: "Why can't nginx's if directive just be a direct swap for RewriteCond?",
        a: "Apache chains multiple RewriteCond lines with implicit AND logic before a RewriteRule, and each cond's capture groups (%1, %2) are available to the rule's target. nginx's if doesn't chain the same way, and capture groups from a regex condition and from a rewrite pattern in the same scope can collide under the same $1 numbering — this tool handles the common single-condition cases correctly and flags multi-condition chains for manual review.",
      },
      {
        q: "Why does the WordPress rule get converted to try_files instead of an if block?",
        a: "nginx's own documentation explicitly recommends try_files over if-based file-existence checks for exactly this \"serve the file if it exists, otherwise route to index.php\" pattern — it's both more efficient and avoids nginx's well-documented if-directive quirks. Converting to the idiomatic form is more useful than a literal, more fragile port of the Apache logic.",
      },
    ],
  },

  "color-blindness-simulator": {
    about:
      "The Color Blindness Simulator shows you exactly how an uploaded image looks to someone with any of seven types of color vision deficiency — protanopia, deuteranopia, and tritanopia (complete loss of red, green, or blue cone function respectively), their milder anomalous counterparts, and achromatopsia (complete color blindness). Upload an image once and switch between all seven simulations instantly, with the original shown side-by-side for direct comparison.\n\nThe simulation uses published color-transformation matrices (Machado, Oliveira & Fernandes, 2009) applied in linearized RGB space — the same general approach used by established simulation tools — rather than a naive approximation, so the color shifts it shows genuinely reflect how each deficiency affects perception (reds shifting toward brown/yellow under protanopia, blues and yellows becoming hard to distinguish under tritanopia, and so on).\n\nColor vision deficiency affects roughly 1 in 12 men and 1 in 200 women worldwide, overwhelmingly the red-green forms — which makes checking a design against it a real accessibility concern, not an edge case. Everything runs on-canvas in your browser; the image is never uploaded anywhere.",
    useCases: [
      "Checking whether a chart or data visualization's color coding is still distinguishable for red-green color blindness",
      "Reviewing a UI mockup or brand palette before it ships to catch color-only signals (error states, status indicators)",
      "Understanding what a specific type of color vision deficiency actually looks like, for design education",
      "Auditing marketing or product imagery for color-dependent information that colorblind users would miss",
    ],
    tips: [
      "Deuteranomaly and protanomaly (the anomalous, partial forms) are far more common than full dichromacy — check those first if you're prioritizing which simulation matters most.",
      "If a design relies on color alone to convey information (red vs. green status, for instance), that's the pattern most likely to break under any red-green deficiency — pair color with an icon, label, or pattern as well.",
      "Achromatopsia is rare (roughly 1 in 30,000) but useful as a stress test — if your design is still readable in pure grayscale, it's in good shape for contrast-driven accessibility generally.",
    ],
    faq: [
      {
        q: "How accurate is this simulation compared to what someone with color blindness actually sees?",
        a: "It uses published, peer-reviewed color transformation matrices (Machado, Oliveira & Fernandes, 2009) applied in linear RGB space, the same general method used by established simulation tools — it's a well-regarded approximation, not an exact replica of any individual's vision, since color vision deficiency varies in severity between people even within the same category.",
      },
      {
        q: "What's the difference between protanopia and protanomaly?",
        a: "The '-opia' forms (protanopia, deuteranopia, tritanopia) mean complete loss of function in one cone type — no red, green, or blue sensitivity at all. The '-omaly' forms (protanomaly, deuteranomaly, tritanomaly) mean that cone type still functions but with reduced sensitivity, producing a milder version of the same color confusion. Anomalous forms are significantly more common than complete dichromacy.",
      },
      {
        q: "Is my image uploaded to a server?",
        a: "No. All simulation happens on an HTML canvas in your browser — the image file itself never leaves your device or gets transmitted anywhere.",
      },
    ],
  },

  "barcode-generator": {
    about:
      "The Barcode Generator creates Code 128, EAN-13, and UPC-A barcodes directly in your browser — no server round-trip, and no external barcode library shipped to your browser either; the encoding logic is implemented from the published Code 128 and EAN/UPC specifications. Code 128 handles any printable ASCII text (letters, numbers, punctuation) via Subset B, while EAN-13 and UPC-A handle the numeric product codes used in retail, auto-computing and validating the check digit.\n\nDuring development, the encoder's output was verified byte-for-byte against a widely-used reference barcode library for a range of test inputs — matching not just visually, but at the level of individual black/white module widths — before being reimplemented independently for this tool. That verification step matters for a barcode specifically, since a single incorrect module makes the whole thing unscannable while still looking plausible to the eye.\n\nAdjust bar width and height, then download the result as a PNG ready to drop into a label, document, or product listing.",
    useCases: [
      "Generating a Code 128 barcode for an internal inventory or asset-tracking label",
      "Creating an EAN-13 barcode from a product's GTIN for packaging or an e-commerce listing",
      "Producing a UPC-A barcode for a US retail product without a subscription barcode service",
      "Quickly checking whether a 12 or 13-digit product code's check digit is actually valid",
    ],
    tips: [
      "EAN-13 and UPC-A both accept the code with or without its check digit — leave it off and the tool computes the correct one automatically.",
      "Code 128 (Subset B) covers printable ASCII, making it the right choice for anything that isn't a pure numeric product code — asset tags, internal SKUs, alphanumeric identifiers.",
      "Increase bar width before printing at small sizes — thin bars are the most common reason a printed barcode fails to scan reliably.",
    ],
    faq: [
      {
        q: "What's the difference between EAN-13 and UPC-A?",
        a: "UPC-A is a 12-digit code used primarily in the US and Canada; EAN-13 is its 13-digit international superset. A UPC-A code is actually identical, bar-for-bar, to an EAN-13 code with a leading zero — any EAN-13 scanner can read a UPC-A barcode without special handling, which is why this tool implements UPC-A internally as exactly that case.",
      },
      {
        q: "Why does Code 128 support text but EAN-13/UPC-A only support digits?",
        a: "Code 128 is a general-purpose symbology designed to encode arbitrary text efficiently — it's what's used for things like shipping labels and internal tracking codes. EAN-13 and UPC-A are retail product-identification standards with a fixed, numeric structure (including a mandatory check digit) defined by GS1, so they're deliberately numeric-only by specification, not a limitation of this tool.",
      },
      {
        q: "Can I use a barcode generated here for actual retail products?",
        a: "The encoding is standards-compliant and verified against a reference implementation, but a real GTIN/UPC number for retail sale needs to be officially registered through GS1 (or a reseller) to be globally unique and legally usable on a product — this tool generates a correct barcode for whatever number you provide, but doesn't allocate or validate ownership of that number.",
      },
    ],
  },

  "xml-formatter": {
    about:
      "The XML Formatter prettifies, minifies, and structurally validates XML — the same category of tool as ToolNinja's JSON and HTML formatters, built for XML's specific quirks. CDATA sections (`<![CDATA[ ... ]]>`) are preserved exactly as written rather than reformatted, since their contents are explicitly meant to be treated as opaque, unparsed text. Before formatting, the tool also walks the tag structure and flags unclosed or mismatched tags with a specific error, rather than silently producing malformed output.\n\nXML still underpins a huge amount of real infrastructure — SOAP APIs, RSS/Atom feeds, Android layouts, Maven/Ant build files, SVG, configuration formats for countless enterprise systems — and a minified or inconsistently-indented XML payload is exactly as unreadable as minified JSON without a formatter.",
    useCases: [
      "Pretty-printing a minified SOAP request or response for debugging",
      "Formatting an RSS or Atom feed to inspect its structure",
      "Cleaning up an Android layout XML or Maven pom.xml copied from elsewhere",
      "Minifying XML before storing it in a database column or sending it over the wire",
      "Catching an unclosed or mismatched tag before it causes a confusing downstream parser error",
    ],
    tips: [
      "CDATA sections are left completely untouched during formatting — their content is meant to be opaque to the XML parser, and reformatting it would change its meaning.",
      "The structural validator catches unclosed and mismatched tags specifically — it's a syntax check, not a schema (XSD/DTD) validator, so it won't catch a tag that's well-formed but semantically wrong for a given format.",
      "Minify before storing XML in a database column or config value — it can meaningfully shrink payload size on high-volume systems still using XML for interchange.",
    ],
    faq: [
      {
        q: "Does this validate XML against an XSD schema?",
        a: "No — it performs structural validation (checking that every tag is properly opened and closed, correctly nested) rather than schema validation. A document can be well-formed XML and still violate a specific XSD or DTD schema; this tool only catches the former.",
      },
      {
        q: "Why does my CDATA content stay as one long line instead of getting indented?",
        a: "CDATA sections are designed to hold content — often HTML, code, or other markup — that should not be parsed or altered by the XML processor. Reformatting the whitespace inside a CDATA block would change what that content actually represents, so the formatter deliberately leaves it exactly as written.",
      },
      {
        q: "Is my XML data uploaded anywhere?",
        a: "No. Parsing, validation, and formatting all run in your browser via JavaScript. Your XML — which may contain sensitive API payloads or internal config — never leaves your device.",
      },
    ],
  },

  "iban-validator": {
    about:
      "The IBAN Validator & Generator checks whether an International Bank Account Number is structurally valid using the same MOD-97-10 checksum algorithm (ISO 7064) that every real IBAN is built on, plus a per-country length check across 35+ IBAN-using countries. Paste any IBAN and instantly see whether it passes, along with its country, check digits, and BBAN broken out separately.\n\nThe generator side produces random test IBANs that pass the real checksum for a chosen country — useful for populating a form, testing validation logic, or exercising a payment integration's IBAN field without needing a real bank account number. Generated IBANs are not tied to any real account; they're structurally valid but synthetic, the same approach used by other IBAN test-data generators.\n\nEverything runs client-side — no IBAN you paste in, real or generated, is transmitted anywhere.",
    useCases: [
      "Validating an IBAN a user entered in a form before submitting it to a payment processor",
      "Generating test IBANs for a specific country to exercise payment-form validation logic",
      "Checking whether an IBAN's check digits are internally consistent before troubleshooting a failed transfer",
      "Learning how the MOD-97 checksum in an IBAN actually works",
    ],
    tips: [
      "A failed checksum almost always means a typo somewhere in the number — re-check digit-by-digit rather than assuming the whole IBAN is fabricated.",
      "Generated test IBANs pass the checksum and have correct length, but are not real, bank-issued accounts — never use them for anything beyond testing your own form or integration logic.",
      "The length check only runs for countries in the built-in list — an unrecognized country code skips that check but still validates the checksum.",
    ],
    faq: [
      {
        q: "What does the MOD-97 checksum actually verify?",
        a: "It confirms the IBAN's digits are internally self-consistent per the ISO 7064 MOD 97-10 algorithm — the same math every bank's IBAN validation uses. It does not confirm the account actually exists, is open, or belongs to any particular person; checksum validity and account existence are two completely different things.",
      },
      {
        q: "Can I use a generated test IBAN to actually send or receive money?",
        a: "No. A generated IBAN passes the structural checksum and length check, but it's randomly generated — it doesn't correspond to any real bank or account. It's meant purely for testing form validation and API integrations, not for any real transaction.",
      },
      {
        q: "Why did a real IBAN I typed in fail validation?",
        a: "The most common cause by far is a single mistyped or transposed digit — even one wrong character anywhere in the IBAN will fail the checksum. Double-check the number character by character against its source, paying particular attention to easily confused characters like 0/O and 1/I.",
      },
    ],
  },

  "meeting-planner": {
    about:
      "The Meeting Planner lays out working hours across multiple time zones on a single grid, so you can see at a glance when a meeting time actually overlaps with everyone's reasonable working hours instead of mentally converting each person's local time one at a time. Pick a reference time zone and date, add the cities you're scheduling across, and each row shows that city's local hour for every hour of the reference day — color-coded as working hours, awake-but-off-hours, or likely asleep.\n\nEvery time lookup goes through the browser's Intl API rather than manual UTC-offset math, so daylight saving time transitions are handled correctly automatically — including the case where two zones are on opposite sides of a DST transition on the day you're planning around, which is exactly the scenario naive offset arithmetic gets wrong.\n\nClick any hour column to see the exact local time it represents for every added city at once, including whether it falls on the previous or next calendar day for a given time zone.",
    useCases: [
      "Finding a meeting time that falls in working hours for a distributed team across 3+ time zones",
      "Checking whether a proposed call time would wake someone up in another region",
      "Planning an on-call handoff or deployment window across time zones",
      "Scheduling around a specific city's business hours without doing manual offset arithmetic",
    ],
    tips: [
      "The working-hours coloring (9am–6pm) is a fixed, general default, not a per-person customizable schedule — treat it as a starting point for the conversation, not a hard rule for everyone's actual calendar.",
      "A city showing a +1 or -1 marker on an hour cell means that hour falls on the next or previous calendar day in that time zone relative to your reference date — worth calling out explicitly when proposing a time.",
      "Because every conversion goes through the browser's own timezone database, results stay correct across DST transitions without needing a manual update.",
    ],
    faq: [
      {
        q: "Does this account for daylight saving time automatically?",
        a: "Yes — every time zone lookup uses the browser's Intl API against the specific date you've selected, which resolves the correct UTC offset for that exact day including any DST rules in effect. This avoids the classic bug where a fixed offset table gives the wrong answer for part of the year.",
      },
      {
        q: "Why do the 'working hours' look different from my team's actual schedule?",
        a: "The 9am–6pm coloring is a general-purpose default meant to make the grid readable at a glance, not a customizable per-person calendar. Use it to narrow down a reasonable window, then confirm the specific time works against each person's actual schedule.",
      },
      {
        q: "What does clicking an hour column actually show?",
        a: "It highlights that hour in the reference time zone and shows a summary of exactly what local time it corresponds to in every city you've added, including a note when that hour falls on the previous or next day in a given time zone — useful for double-checking before you send a calendar invite.",
      },
    ],
  },

  "package-json-inspector": {
    about:
      "The package.json Script Inspector reads a pasted package.json and surfaces two things that matter for supply-chain risk but are easy to miss scrolling through the raw file: which npm lifecycle scripts run automatically (without anyone explicitly asking for them), and which dependencies aren't pinned to an exact version.\n\nnpm executes preinstall, install, and postinstall scripts automatically the moment npm install runs — with the full privileges of whoever's running it, before any test suite or code review happens. That combination is exactly why these specific scripts have been the recurring vector in real npm supply-chain worms, most recently the keyv/cacheable compromise in August 2026. This tool flags every lifecycle script present, explains what triggers it automatically versus what only runs when explicitly invoked, and calls out ones worth a closer look before you trust an install.\n\nIt also flags dependencies pinned with a range (^, ~), a bare tag (*, latest), or installed directly from a git URL rather than the npm registry — each of which means a compromised maintainer account could ship a bad version that gets pulled in on your next install without you doing anything differently.",
    useCases: [
      "Checking an unfamiliar package's install-time behavior before adding it to a project",
      "Auditing your own project's package.json for lifecycle scripts you forgot were there",
      "Reviewing dependency pinning practices before a security audit",
      "Understanding exactly what changed in a suspicious dependency update",
    ],
    tips: [
      "preinstall and postinstall are the two scripts worth the most scrutiny — they run automatically and are the most common vector for supply-chain malware in real incidents.",
      "A dependency pinned with ^ or ~ isn't inherently dangerous, but it does mean the exact version installed can change between two people running npm install at different times — worth knowing before debugging a 'works on my machine' issue.",
      "A dependency installed directly from a git URL skips the npm registry entirely, including whatever minimal review and provenance signals the registry provides — treat it with the same scrutiny as vendoring code directly.",
    ],
    faq: [
      {
        q: "Does flagging a script mean it's actually malicious?",
        a: "No — plenty of legitimate packages use preinstall or postinstall for real reasons, like compiling a native addon. The flag means 'this runs automatically, so it's worth knowing it's there and understanding why' — not an accusation. The point is visibility, since the same automatic-execution mechanism that's convenient for legitimate build steps is also what supply-chain malware relies on.",
      },
      {
        q: "Why does an unpinned dependency matter if the package hasn't been compromised?",
        a: "It's not about the package being compromised right now — it's about what happens if its maintainer's account ever is. A range-pinned (^1.2.0) or tag-pinned (latest) dependency will silently pull in whatever the compromised account publishes on your very next install, with no action from you. An exact-pinned dependency (1.2.0) requires someone to deliberately bump the version, which is at least one more chance to notice something's wrong.",
      },
      {
        q: "Does this tool check my dependencies against a list of known-malicious packages?",
        a: "No, deliberately — a hardcoded list of compromised packages goes stale within days of a new incident and would give false confidence once it's outdated. Instead, this tool focuses on structural risk factors (auto-running scripts, loose version pinning) that stay relevant regardless of which specific package is compromised this week.",
      },
    ],
  },

  "readme-badge-generator": {
    about:
      "The README Badge Generator builds shields.io badge URLs and ready-to-paste Markdown/HTML — either a fully custom badge (any label, message, color, and style) or one of several common \"live\" badges that pull real data from npm, GitHub, or PyPI, like a package's current version, weekly download count, or star count.\n\nCustom badges use shields.io's static badge endpoint directly, so you get full control over the label and message text. The live badges use shields.io's service-specific endpoints for npm, GitHub, and PyPI, which means the badge image updates on its own as the underlying data changes — the version badge always shows the current published version, the star count badge always shows the current count, without regenerating anything.\n\nBoth Markdown and HTML output are provided, since most READMEs are Markdown but some project documentation sites render badges via raw HTML.",
    useCases: [
      "Adding a build-status, license, or version badge to a new project's README",
      "Generating a live npm version or download-count badge that stays accurate without manual updates",
      "Building a custom badge for something project-specific, like a coverage percentage or a deployment environment label",
      "Getting both Markdown and HTML badge snippets for a documentation site that needs the HTML form",
    ],
    tips: [
      "Live badges (npm version, GitHub stars, etc.) update automatically as the underlying data changes — you never need to regenerate or replace them after adding them once.",
      "For custom badges, a literal hyphen in your label or message text is automatically escaped correctly — you don't need to work around shields.io's `-` segment separator yourself.",
      "The for-the-badge style reads better at a glance in a README's top badge row; flat or flat-square tends to look better inline with body text.",
    ],
    faq: [
      {
        q: "Do the live badges (npm version, GitHub stars) need to be regenerated when the data changes?",
        a: "No — that's the point of using shields.io's live endpoints instead of a static image. The badge URL always points at shields.io, which fetches current data from npm or GitHub's API every time the image is requested, so it reflects the current value automatically whenever your README is viewed.",
      },
      {
        q: "What's the difference between the Markdown and HTML output?",
        a: "They render identically — both just wrap the same shields.io image URL, optionally linking it to a URL. Markdown (![alt](url)) is what nearly all README.md files use; HTML (<img src=...>) is for documentation sites or platforms that render raw HTML instead of Markdown, or where you need HTML-only attributes shields.io's Markdown form doesn't cover.",
      },
      {
        q: "Can I use any color name, or only the presets shown?",
        a: "The color presets cover the common shields.io named colors, but you can type any valid CSS color name or hex code (without the #) into the color field directly — the presets are just a shortcut for the most commonly used ones.",
      },
    ],
  },
};
