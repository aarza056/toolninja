// The /tools/curl-to-code/<language> pages: one per target language people search for ("curl to
// python", "convert curl to javascript", "curl to php"), each with notes specific to that language.

export interface CurlLanguagePage {
  slug: string;
  /** LANGUAGES id in lib/curl-generators.ts */
  lang: string;
  name: string;
  library: string;
  notes: string[];
  faq: { q: string; a: string }[];
}

export const CURL_LANGUAGE_PAGES: CurlLanguagePage[] = [
  {
    slug: "python",
    lang: "python-requests",
    name: "Python",
    library: "requests",
    notes: [
      "-H headers become the headers dict; -d / --data becomes data=, sent as-is like curl does.",
      "-u user:password becomes an Authorization: Basic header; requests can also take auth=(user, password).",
      "If the body is JSON, you can swap data= for json= with a dict — requests then sets Content-Type for you.",
      "Prefer async code? Pick Python (httpx) — same shape, and httpx.AsyncClient works with await.",
    ],
    faq: [
      { q: "How do I convert a curl command to Python requests?", a: "Paste the command above and pick Python (requests). Each -H becomes an entry in the headers dict, -d becomes the data argument, and -X sets the method passed to requests.request()." },
      { q: "Why does my converted request get a 415 or 400 error?", a: "The API usually expects JSON. Keep the Content-Type: application/json header from the curl command, or pass the body with json= instead of data=." },
    ],
  },
  {
    slug: "javascript",
    lang: "js-fetch",
    name: "JavaScript",
    library: "fetch",
    notes: [
      "The output uses the Fetch API, built into browsers and Node.js 18+, with await.",
      "-H headers go into the headers object and -d into body; -X sets method (curl defaults to POST when there's a body).",
      "Calling the API from a browser page? The server must allow your origin with CORS headers — curl never checks CORS, browsers do.",
      "response.text() is used so non-JSON replies don't throw; switch to response.json() when the API returns JSON.",
    ],
    faq: [
      { q: "Why does the fetch version fail with a CORS error when curl works?", a: "Browsers enforce CORS and curl doesn't. The API has to return Access-Control-Allow-Origin for your site; otherwise call it from your server instead of the browser." },
      { q: "Does fetch send cookies like curl -b?", a: "The Cookie header from -b is copied, but browsers ignore a manually set Cookie header. In the browser use credentials: \"include\"; in Node.js the header is sent as written." },
    ],
  },
  {
    slug: "node",
    lang: "node-axios",
    name: "Node.js",
    library: "axios",
    notes: [
      "The output uses axios; Node.js 18+ also has fetch built in — switch to JavaScript (fetch) if you'd rather avoid a dependency.",
      "axios parses JSON responses automatically into res.data.",
      "-u user:password becomes a Basic Authorization header; axios also accepts auth: { username, password }.",
    ],
    faq: [
      { q: "Do I need axios to make HTTP requests in Node.js?", a: "No. Node.js 18 and later include fetch. axios adds automatic JSON parsing, interceptors and timeouts, which is why many projects still use it." },
      { q: "How do I send JSON with axios?", a: "Pass an object as data and axios serializes it and sets Content-Type: application/json. The converter keeps the body exactly as curl sent it." },
    ],
  },
  {
    slug: "php",
    lang: "php-curl",
    name: "PHP",
    library: "cURL",
    notes: [
      "PHP's cURL extension mirrors the command line: CURLOPT_HTTPHEADER for -H, CURLOPT_POSTFIELDS for -d, CURLOPT_CUSTOMREQUEST for -X.",
      "Values are written as single-quoted PHP strings, so a $ in a token or password isn't treated as a variable.",
      "For -k / --insecure you'd set CURLOPT_SSL_VERIFYPEER to false — the converter leaves verification on on purpose.",
    ],
    faq: [
      { q: "How do I convert curl to PHP?", a: "Paste the command and pick PHP (cURL). The result uses curl_setopt_array with the URL, method, headers and body from your command." },
      { q: "Should I use Guzzle instead of PHP cURL?", a: "Guzzle is nicer for bigger projects (PSR-7, middleware, retries). The plain cURL output has no dependencies and runs on any PHP install with the curl extension." },
    ],
  },
  {
    slug: "go",
    lang: "go-http",
    name: "Go",
    library: "net/http",
    notes: [
      "Uses only the standard library: http.NewRequest, req.Header.Set and http.DefaultClient.",
      "The body is wrapped in strings.NewReader; for large or streamed bodies use an io.Reader of your own.",
      "Set a timeout in production: http.DefaultClient has none — create &http.Client{Timeout: 10 * time.Second}.",
    ],
    faq: [
      { q: "How do I convert a curl command to Go?", a: "Paste it and pick Go (net/http). You get a complete main package that builds the request, sets every header and prints the status and body." },
      { q: "Why add a timeout to the Go client?", a: "http.DefaultClient waits forever. A stuck server would hang your program, so production code should always use a client with a Timeout." },
    ],
  },
  {
    slug: "java",
    lang: "java",
    name: "Java",
    library: "HttpClient",
    notes: [
      "Uses java.net.http.HttpClient (Java 11+), no extra libraries.",
      "Java refuses to set Host, Connection, Content-Length, Expect and Upgrade itself, so those curl headers are left out.",
      "The body goes through HttpRequest.BodyPublishers.ofString; use ofFile for an upload from disk.",
    ],
    faq: [
      { q: "Why do I get \"restricted header name\" in Java?", a: "HttpClient manages Host, Connection, Content-Length and a few others itself and throws if you set them. The converter drops them; the client sends correct values automatically." },
      { q: "Can I use this with Java 8?", a: "No — java.net.http arrived in Java 11. On Java 8 use HttpURLConnection or a library like OkHttp or Apache HttpClient." },
    ],
  },
  {
    slug: "csharp",
    lang: "csharp",
    name: "C#",
    library: "HttpClient",
    notes: [
      "Uses HttpClient and HttpRequestMessage with top-level statements (.NET 6+).",
      "Content-Type moves onto the StringContent: .NET throws if you put it on the request headers.",
      "Reuse one HttpClient for your whole app (or IHttpClientFactory) — creating one per request exhausts sockets.",
    ],
    faq: [
      { q: "Why can't I add Content-Type to HttpClient request headers?", a: "In .NET, Content-Type is a content header. Set it through the HttpContent, e.g. new StringContent(body, Encoding.UTF8, \"application/json\"), which is what the converter does." },
      { q: "Is it OK to create a new HttpClient for every call?", a: "No. Each instance holds its own connections, and creating many can exhaust sockets. Keep a single instance or use IHttpClientFactory." },
    ],
  },
  {
    slug: "ruby",
    lang: "ruby",
    name: "Ruby",
    library: "Net::HTTP",
    notes: [
      "Uses Net::HTTP from the standard library — no gems needed.",
      "Values are single-quoted Ruby strings, so #{...} in a token isn't interpolated.",
      "use_ssl is switched on automatically for https URLs.",
    ],
    faq: [
      { q: "How do I convert curl to Ruby?", a: "Paste the command and pick Ruby (Net::HTTP). The request class matches the method (Net::HTTP::Post for -X POST), headers are set with request[...] and the body with request.body." },
      { q: "Should I use Faraday or HTTParty instead?", a: "They're friendlier for larger apps. Net::HTTP ships with Ruby, so the converted code runs anywhere without adding a gem." },
    ],
  },
  {
    slug: "rust",
    lang: "rust",
    name: "Rust",
    library: "reqwest",
    notes: [
      "Uses reqwest's blocking client, so it runs in a plain main(); enable the \"blocking\" feature in Cargo.toml.",
      "For async code use reqwest::Client with .await and a runtime like tokio — the builder calls are the same.",
      "Errors propagate with ?, and main returns Result so you see what failed.",
    ],
    faq: [
      { q: "How do I convert a curl command to Rust?", a: "Paste it and pick Rust (reqwest). You get a request builder with the method, URL, each header and the body, plus the Cargo.toml line it needs." },
      { q: "Blocking or async reqwest?", a: "Blocking is simplest for scripts and CLIs. In an async web service use reqwest::Client inside your tokio runtime instead." },
    ],
  },
  {
    slug: "powershell",
    lang: "powershell",
    name: "PowerShell",
    library: "Invoke-RestMethod",
    notes: [
      "In Windows PowerShell 5.1, curl is an alias for Invoke-WebRequest, so pasted curl commands fail — this converts them properly.",
      "Invoke-RestMethod parses JSON responses into objects automatically.",
      "Values use single quotes, so $ and backticks in tokens aren't expanded.",
    ],
    faq: [
      { q: "Why doesn't curl work in PowerShell?", a: "In Windows PowerShell 5.1, curl is an alias for Invoke-WebRequest, which has different parameters. Use curl.exe to run real curl, or convert the command to Invoke-RestMethod here." },
      { q: "Invoke-RestMethod or Invoke-WebRequest?", a: "Invoke-RestMethod returns the parsed body (JSON becomes objects). Invoke-WebRequest returns the whole response, including status code and headers." },
    ],
  },
  {
    slug: "swift",
    lang: "swift",
    name: "Swift",
    library: "URLSession",
    notes: [
      "Uses URLSession with async/await (iOS 15+, macOS 12+).",
      "Headers are set with setValue(_:forHTTPHeaderField:), the body as UTF-8 Data.",
      "Calling plain http:// URLs from an app needs an App Transport Security exception.",
    ],
    faq: [
      { q: "How do I convert curl to Swift?", a: "Paste the command and pick Swift (URLSession). You get a URLRequest with the method, headers and body, sent with try await URLSession.shared.data(for:)." },
      { q: "Why does my request fail with an ATS error?", a: "App Transport Security blocks plain HTTP by default. Use https, or add an exception for that domain in Info.plist." },
    ],
  },
];
