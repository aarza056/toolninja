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
      "The JSON Formatter validates and beautifies JSON data with automatic indentation and syntax highlighting. Paste minified JSON from an API response, config file, or database record to make it instantly human-readable. It catches common errors like trailing commas, missing brackets, and unquoted keys — highlighting exactly where the problem is.",
    useCases: [
      "Inspecting API responses from Postman, curl, or browser DevTools",
      "Formatting config files (package.json, tsconfig.json) before committing",
      "Debugging serialized data from logs, queues, or databases",
      "Minifying JSON before storing in environment variables or payloads",
    ],
    tips: [
      "Paste minified JSON and it auto-formats on input — no button required.",
      "Use the Minify button to compress JSON for size-sensitive environments.",
      "The error indicator shows the exact line and character of syntax problems.",
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
      "The Base64 Encoder/Decoder converts text and binary data to Base64 encoding and back. Base64 represents binary data using 64 printable ASCII characters, making it safe to transmit through text-based protocols like HTTP headers, JSON, XML, and email where raw binary would be corrupted.",
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
      "The Regex Tester lets you write and test JavaScript regular expressions against sample text with live match highlighting. It shows match count, the full match string, and all captured groups. Supports the full JavaScript regex feature set including lookaheads, lookbehinds, named capture groups, and Unicode.",
    useCases: [
      "Validating input formats such as emails, phone numbers, and URLs",
      "Writing parsing logic for structured text like log files or CSV",
      "Extracting data from strings using capture groups",
      "Learning regex syntax interactively with instant visual feedback",
    ],
    tips: [
      "The g flag finds all matches — without it, only the first match is returned.",
      "The i flag makes the pattern case-insensitive.",
      "Named capture groups (?<name>pattern) make extraction code far more readable than numbered groups.",
      "Use ^ and $ anchors to match the full string — without them the pattern can match anywhere.",
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
      "The JWT Decoder parses JSON Web Tokens into their three components: header (algorithm and type), payload (claims), and signature. It decodes the Base64URL-encoded sections and displays them as readable JSON — showing all claims including expiry time (exp), issued-at (iat), issuer (iss), and subject (sub).",
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
      "The Markdown Preview renders GitHub-Flavored Markdown (GFM) in real time. It supports headings, bold and italic text, code blocks, inline code, tables, blockquotes, task lists, strikethrough, and horizontal rules — the full GFM specification used by GitHub, GitLab, Notion, and most documentation platforms.",
    useCases: [
      "Writing and previewing README files before pushing to GitHub",
      "Drafting pull request descriptions with formatted tables and code blocks",
      "Checking table alignment before committing to a documentation site",
      "Writing blog posts in Markdown format before converting or publishing",
    ],
    tips: [
      "Three backticks followed by a language name (```javascript) enables syntax-highlighted code blocks.",
      "Use | pipes to create tables — the preview renders them as proper HTML tables.",
      "- [ ] creates an unchecked task list item, - [x] creates a checked one.",
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
      "The Unix Timestamp Converter translates between Unix epoch timestamps (integer seconds or milliseconds since January 1, 1970 UTC) and human-readable dates. Unix timestamps are the standard time representation in databases, APIs, JWT tokens, server logs, and most programming languages.",
    useCases: [
      "Converting timestamps from API responses or database records to readable dates",
      "Debugging JWT token expiry — the exp and iat claims are Unix timestamps",
      "Generating timestamp values for date range queries in SQL or APIs",
      "Understanding what a numeric timestamp in a log file actually represents",
    ],
    tips: [
      "JavaScript timestamps are in milliseconds — divide by 1000 for Unix seconds.",
      "The year 2038 problem affects 32-bit signed integers, which overflow on January 19, 2038. 64-bit systems are not affected.",
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
    ],
    tips: [
      "16+ characters with all character types is sufficient for most accounts.",
      "For master passwords (password managers, disk encryption), use 24+ characters.",
      "A random 16-character password with full character set has ~95 bits of entropy — essentially uncrackable by brute force.",
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
        a: "Passphrases (4-5 random words like 'correct-horse-battery-staple') are easier to remember and can have comparable entropy to shorter random passwords. For accounts you type frequently without a password manager, a passphrase may be more practical.",
      },
    ],
  },

  "uuid-generator": {
    about:
      "The UUID Generator creates version 4 UUIDs (Universally Unique Identifiers) that are randomly generated per RFC 4122. V4 UUIDs contain 122 bits of randomness, giving a collision probability of roughly 1 in 2^122 — effectively impossible to collide in any real-world application.",
    useCases: [
      "Primary keys for database records in distributed or multi-writer systems",
      "Correlation IDs for tracing requests across microservices and logs",
      "File names for user-uploaded assets to prevent naming collisions",
      "Idempotency keys for payment APIs and write-once operations",
    ],
    tips: [
      "The format is 8-4-4-4-12 hex digits: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx. The 4 indicates version 4, and the y is one of 8, 9, a, or b.",
      "For database primary keys, UUIDs have higher storage overhead than auto-increment integers but work safely in distributed systems without a central coordinator.",
    ],
    faq: [
      {
        q: "Can two generated UUIDs ever be the same?",
        a: "Theoretically yes, but practically no. The probability of a collision between two random v4 UUIDs is 1 in 2^122 (about 5x10^36). To have a 50% chance of a collision, you'd need to generate 2.7x10^18 UUIDs — far beyond any realistic system.",
      },
      {
        q: "What's the difference between UUID v1, v4, and v7?",
        a: "V1 is time-based and includes the machine's MAC address — deterministic but leaks information. V4 is fully random — the most widely used version. V7 is a newer standard that's time-ordered (sortable) while remaining random enough to be collision-safe — better for database index performance.",
      },
      {
        q: "Should I use UUID or auto-increment integers for database IDs?",
        a: "Auto-increment integers are simpler and more storage-efficient. UUIDs are better when you need IDs generated client-side before writing to the database, when merging records from multiple sources, or when you don't want sequential IDs that expose record counts.",
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
      "The Hash Generator computes SHA-1, SHA-256, SHA-384, and SHA-512 cryptographic hashes using the browser's native Web Crypto API. Hashes are deterministic one-way functions: identical inputs always produce identical outputs, but the hash cannot be reversed to recover the original input.",
    useCases: [
      "Verifying file integrity by comparing checksums before and after transfer",
      "Generating content-based cache keys for assets or API responses",
      "Creating deterministic identifiers from arbitrary string inputs",
      "Understanding what algorithm produced a stored hash",
    ],
    tips: [
      "SHA-1 is cryptographically broken — don't use it for security. SHA-256 is the current standard for general-purpose integrity checks.",
      "Two different inputs that produce the same hash are called a collision. SHA-256 and SHA-512 have no known practical collisions.",
      "Hashing is not encryption — you cannot recover the original input. Use it for integrity, not confidentiality.",
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
      "The Number Base Converter translates integers between binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16). These four numeral systems cover the vast majority of computing use cases — from low-level bit manipulation to memory addresses, file permissions, and color codes.",
    useCases: [
      "Converting hex color values (#a855f7) to RGB decimal components",
      "Understanding binary representations when working with bitwise operations",
      "Converting Unix file permission octals (755, 644) to understand what they mean",
      "Working with memory addresses and CPU registers in systems programming",
    ],
    tips: [
      "Hex digits A-F represent decimal 10-15. One hex digit = 4 binary bits (a nibble).",
      "Binary inputs can use spaces for readability (1010 1111) — spaces are ignored during conversion.",
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
      "The JSON to TypeScript converter automatically generates TypeScript interface definitions from any JSON object or array. It handles nested objects, arrays, union types from mixed arrays, and optional fields — saving the tedious manual work of writing types by hand from API responses.",
    useCases: [
      "Creating TypeScript interfaces from API response payloads",
      "Generating types from database query results or fixture data",
      "Getting a typed starting point when adding TypeScript to an existing JavaScript project",
      "Quickly typing third-party API responses you don't control",
    ],
    tips: [
      "Paste a real API response to generate accurate types — the generator infers types from actual values.",
      "For arrays with mixed element types, the generator creates union types (string | number).",
      "Review generated types — null values produce type | null, which may need adjustment based on your API contract.",
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
      "The QR Code Generator creates QR codes from any URL or text string with configurable size, foreground and background colors, and error correction levels. QR codes can store up to approximately 4,000 characters and remain scannable even if part of the code is damaged, depending on the error correction level selected.",
    useCases: [
      "Creating scannable links for print materials, posters, and business cards",
      "Generating QR codes for Wi-Fi credentials (SSID and password)",
      "Linking physical products, labels, or packaging to digital resources",
      "Creating quick-scan links for presentations and conference materials",
    ],
    tips: [
      "Error correction level L is sufficient for clean digital display. Use H for printed codes that might get scratched or partially covered.",
      "Higher error correction makes codes denser and harder to scan from a distance — use the lowest level that works for your use case.",
      "Always test your generated QR code with a phone before printing.",
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
      "The Chmod Calculator converts between symbolic Unix permission notation (rwxr-xr-x) and octal notation (755) for all three permission classes: owner, group, and others. Each class has three bits: read (4), write (2), and execute (1) — the octal digit is their sum.",
    useCases: [
      "Setting correct permissions for web server files (644 for files, 755 for directories)",
      "Debugging 'Permission denied' errors in Linux and macOS environments",
      "Understanding what an octal permission string actually allows before applying it",
      "Writing deployment scripts that configure file permissions correctly",
    ],
    tips: [
      "Never use 777 (rwxrwxrwx) in production — it gives full access to everyone on the system.",
      "Web server files: 644 (rw-r--r--). Directories: 755 (rwxr-xr-x). Private config files: 600 (rw-------).",
      "The execute bit on a directory controls whether users can enter it (cd into it), not just list its contents.",
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
      "The CSS Gradient Generator creates linear, radial, and conic CSS gradients visually with multiple color stops and live code output. It generates copy-paste ready background-image CSS declarations compatible with all modern browsers — no vendor prefixes required for linear and radial gradients.",
    useCases: [
      "Designing hero section backgrounds and full-bleed imagery replacements",
      "Creating button hover states with gradient fills",
      "Building progress bars, loading indicators, and visual meters",
      "Generating brand-consistent gradient palettes for design systems",
    ],
    tips: [
      "Use conic gradients for pie charts and angular progress indicators.",
      "Add a solid fallback color (background-color) before the gradient for older browsers.",
      "Gradients in CSS are treated as images — they can be used anywhere background-image is accepted, including list-style-image.",
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
      "The Color Palette Generator creates harmonious color schemes from any base color using color theory relationships. Choose from complementary, analogous, triadic, split-complementary, tetradic, and monochromatic harmonies. Each palette shows HEX, RGB, and HSL values ready to copy.",
    useCases: [
      "Picking a cohesive UI color scheme from a brand's primary color",
      "Generating accessible foreground/background color pairs",
      "Creating theme variables for design systems and CSS custom properties",
      "Exploring complementary accent colors for data visualizations",
    ],
    tips: [
      "Start with a mid-range saturation (40-60%) for the base — extreme saturation makes harmonics look garish.",
      "Monochromatic palettes (same hue, varied lightness) are the safest for UI backgrounds and text.",
      "Triadic palettes (3 colors 120 degrees apart) create vibrant contrast — use one as dominant, one as accent, one as neutral.",
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
      "The AES/RSA Encryption tool lets you encrypt and decrypt text in-browser using the Web Cryptography API. AES-GCM mode provides authenticated symmetric encryption — ideal for encrypting data with a password. RSA-OAEP provides asymmetric encryption with a generated key pair, useful for understanding public-key cryptography.",
    useCases: [
      "Encrypting sensitive notes or config values before storing them",
      "Learning how AES and RSA encryption work in practice",
      "Testing encrypted payloads for API security implementations",
      "Generating RSA key pairs for development and testing purposes",
    ],
    tips: [
      "AES-GCM includes authentication — a tampered ciphertext will fail to decrypt, not silently produce garbage.",
      "The password you provide is stretched using PBKDF2 before deriving the AES key — a weak password is still a security risk.",
      "RSA is for encrypting small amounts of data (like an AES key). For large data, always use hybrid encryption: RSA + AES.",
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
    ],
    tips: [
      "Browser requests are subject to CORS — cross-origin APIs that don't set Access-Control-Allow-Origin will fail. Use a CORS proxy or test same-origin APIs.",
      "Set Content-Type: application/json when sending JSON bodies so the server parses the body correctly.",
      "For APIs requiring Bearer token auth, add an Authorization header with value: Bearer <your-token>.",
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

  "cidr-calculator": {
    about:
      "The IP/CIDR Calculator computes all subnet details from a CIDR notation like 192.168.1.0/24. Instantly see the network address, broadcast address, subnet mask, wildcard mask, first and last usable host, total host count, and the full binary representation of each address.",
    useCases: [
      "Planning IP address ranges for VPC and cloud network configurations",
      "Verifying subnet masks when setting up routers and firewall rules",
      "Checking if two IPs are in the same subnet during debugging",
      "Learning subnetting and binary IP notation for networking certifications",
    ],
    tips: [
      "A /24 gives 254 usable hosts (256 minus network and broadcast). A /25 splits that into two subnets of 126 usable hosts each.",
      "AWS VPCs reserve 5 addresses per subnet (network, broadcast, and 3 AWS-reserved). Factor this in when choosing your CIDR block.",
      "Use /32 to represent a single host route and /0 to represent the default route (all traffic).",
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

  "git-command-generator": {
    about:
      "The Git Command Generator is a searchable reference for 60+ git commands organized by category — Setup, Branches, Staging, Commits, Remote, Undo, History, Tags, Stash, and Advanced. Search by name or keyword to find the exact command, copy it with one click, and see warning badges on destructive commands that rewrite history.",
    useCases: [
      "Quickly finding the right git syntax without leaving the browser",
      "Learning git commands beyond the basics (reflog, bisect, worktree)",
      "Checking the correct flags for destructive operations before running them",
      "Onboarding new developers to git workflows with a visual reference",
    ],
    tips: [
      "Commands marked with a Caution badge rewrite history — never use them on branches others have already pulled.",
      "Search by concept, not just command name: try 'undo', 'linear', or 'recover' to find commands by what they do.",
      "Your recently copied commands are saved in localStorage for quick re-access.",
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
      "The Meta Tags Generator creates all the HTML meta tags your page needs for SEO, Open Graph (Facebook/LinkedIn), and Twitter Cards. Fill in the fields and watch the live previews update for Google search, Twitter, and LinkedIn simultaneously. A quality checklist tracks what's missing. Copy all generated tags with one click.",
    useCases: [
      "Setting up complete meta tags for a new web page or blog post",
      "Previewing how a page will appear when shared on social media before publishing",
      "Auditing existing pages for missing or incorrect social meta tags",
      "Generating Twitter Card and Open Graph tags for marketing campaigns",
    ],
    tips: [
      "Keep your title under 60 characters — search engines truncate longer titles in results.",
      "The description should be 120-160 characters — enough to describe the page but short enough to display fully.",
      "Your OG image should be 1200×630px for best display across all platforms. Twitter Cards also accept this size.",
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
};
