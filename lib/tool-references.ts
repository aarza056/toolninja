export interface ToolReference {
  title: string;
  intro?: string;
  columns: string[];
  rows: string[][];
  note?: string;
}

function ipFromNum(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function cidrRows(): string[][] {
  const rows: string[][] = [];
  for (let p = 8; p <= 32; p++) {
    const mask = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
    const total = Math.pow(2, 32 - p);
    const usable = p >= 31 ? total : total - 2;
    rows.push([`/${p}`, ipFromNum(mask), ipFromNum(~mask >>> 0), total.toLocaleString("en-US"), usable.toLocaleString("en-US")]);
  }
  return rows;
}

export const toolReferences: Record<string, ToolReference> = {
  "cidr-calculator": {
    title: "CIDR to subnet mask cheat sheet",
    intro: "Every IPv4 prefix length from /8 to /32 with its subnet mask, wildcard mask, and address count.",
    columns: ["CIDR", "Subnet mask", "Wildcard mask", "Addresses", "Usable hosts"],
    rows: cidrRows(),
    note: "Usable hosts excludes the network and broadcast addresses. /31 (point-to-point links, RFC 3021) and /32 (a single host) use every address.",
  },
  "chmod-calculator": {
    title: "Common chmod permissions",
    columns: ["Octal", "Symbolic", "Owner / Group / Others", "Typical use"],
    rows: [
      ["777", "rwxrwxrwx", "all / all / all", "Avoid — anyone can modify or execute"],
      ["775", "rwxrwxr-x", "all / all / read+exec", "Shared project directories"],
      ["755", "rwxr-xr-x", "all / read+exec / read+exec", "Directories, scripts, binaries"],
      ["750", "rwxr-x---", "all / read+exec / none", "Directories restricted to a group"],
      ["700", "rwx------", "all / none / none", "Private directories, ~/.ssh"],
      ["664", "rw-rw-r--", "read+write / read+write / read", "Files edited by a group"],
      ["644", "rw-r--r--", "read+write / read / read", "Regular files, web content"],
      ["640", "rw-r-----", "read+write / read / none", "Config files readable by a service group"],
      ["600", "rw-------", "read+write / none / none", "Private keys, .env, ~/.ssh/id_*"],
      ["400", "r--------", "read / none / none", "Read-only secrets, AWS .pem key files"],
    ],
    note: "Each digit is the sum of read (4), write (2), and execute (1) for owner, group, and others. On a directory, execute means \"can enter it\".",
  },
  "regex-tester": {
    title: "Regex cheat sheet",
    columns: ["Pattern", "Matches", "Example"],
    rows: [
      [".", "Any character except a newline", "a.c → abc, a-c"],
      ["\\d  \\w  \\s", "Digit, word character [A-Za-z0-9_], whitespace", "\\d{3} → 404"],
      ["\\D  \\W  \\S", "The opposite of \\d, \\w, \\s", "\\S+ → a non-space run"],
      ["[abc]  [^abc]  [a-z]", "One of / none of / a range of characters", "[aeiou] → vowels"],
      ["^  $", "Start / end of the string (or line with the m flag)", "^\\d+$ → digits only"],
      ["\\b", "Word boundary", "\\bcat\\b → cat, not concat"],
      ["*  +  ?", "0 or more / 1 or more / 0 or 1", "colou?r → color, colour"],
      ["{n}  {n,}  {n,m}", "Exactly n / at least n / between n and m", "\\d{2,4}"],
      ["*?  +?", "Lazy — match as little as possible", "<.+?> → one tag"],
      ["( )", "Capturing group", "(\\d+)-(\\d+)"],
      ["(?: )", "Non-capturing group", "(?:https?)://"],
      ["(?<name> )", "Named capturing group", "(?<year>\\d{4})"],
      ["a|b", "Either a or b", "cat|dog"],
      ["(?= )  (?! )", "Lookahead / negative lookahead", "\\d+(?=px) → 12 in 12px"],
      ["(?<= )  (?<! )", "Lookbehind / negative lookbehind", "(?<=\\$)\\d+ → 5 in $5"],
      ["\\.  \\*  \\(", "Escape a special character to match it literally", "\\.com"],
    ],
    note: "Flags: g (all matches), i (case-insensitive), m (^ and $ match per line), s (. matches newlines), u (Unicode).",
  },
  "xpath-tester": {
    title: "XPath cheat sheet",
    columns: ["Expression", "Selects", "Example"],
    rows: [
      ["/", "From the document root", "/html/body"],
      ["//", "Anywhere below the current node", "//a"],
      [".  ..", "Current node / parent node", "../@id"],
      ["@attr", "An attribute", "//a/@href"],
      ["*  @*", "Any element / any attribute", "//div/*"],
      ["[n]  [last()]", "The nth (1-based) / last matching node", "//li[1]"],
      ["[@attr='v']", "Elements whose attribute equals a value", "//input[@type='email']"],
      ["[contains(@class,'x')]", "Attribute contains a substring", "//div[contains(@class,'card')]"],
      ["[starts-with(@id,'x')]", "Attribute starts with a prefix", "//*[starts-with(@id,'user-')]"],
      ["text()", "The text node of an element", "//h1/text()"],
      ["[text()='x']  [normalize-space()='x']", "Exact text (normalize-space trims whitespace)", "//button[normalize-space()='Save']"],
      ["following-sibling::", "Later siblings", "//label/following-sibling::input"],
      ["ancestor::", "Parents, grandparents, …", "//span/ancestor::form"],
      ["|", "Union of two node sets", "//h1 | //h2"],
      ["count()", "Number of matching nodes", "count(//li)"],
    ],
    note: "XPath indexes start at 1, not 0. Matching a class with [@class='x'] fails when the element has several classes — use contains() instead.",
  },
};
