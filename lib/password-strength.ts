// A small sample of the most frequently leaked/reused passwords (widely published breach-analysis
// lists). Not exhaustive — this is a quick, obvious-case check, not a real breach-database lookup.
const COMMON_PASSWORDS = new Set([
  "123456", "123456789", "12345678", "12345", "1234567", "qwerty", "password",
  "111111", "123123", "abc123", "1234567890", "1q2w3e4r", "qwertyuiop",
  "monkey", "dragon", "letmein", "trustno1", "iloveyou", "admin", "welcome",
  "login", "passw0rd", "master", "hello", "freedom", "whatever", "qazwsx",
  "123321", "000000", "password1", "qwerty123", "zaq12wsx", "football",
  "baseball", "superman", "michael", "shadow", "sunshine", "princess",
  "flower", "hottie", "loveme", "jordan23", "starwars", "cheese", "secret",
  "summer", "internet", "samsung", "amanda", "access", "yankees", "ashley",
  "bailey", "jennifer", "hunter", "fuckyou", "2000", "test", "batman",
  "tr0ub4dor&3", "p@ssw0rd", "p@ssword", "letmein123", "changeme",
]);

const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890"];

function hasSequential(pwd: string, minRun = 4): boolean {
  const lower = pwd.toLowerCase();
  let run = 1;
  for (let i = 1; i < lower.length; i++) {
    const diff = lower.charCodeAt(i) - lower.charCodeAt(i - 1);
    if (diff === 1 || diff === -1) {
      run++;
      if (run >= minRun) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

function hasRepeats(pwd: string, minRun = 4): boolean {
  let run = 1;
  for (let i = 1; i < pwd.length; i++) {
    if (pwd[i] === pwd[i - 1]) {
      run++;
      if (run >= minRun) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

function hasKeyboardPattern(pwd: string, minRun = 4): boolean {
  const lower = pwd.toLowerCase();
  for (const row of KEYBOARD_ROWS) {
    const rev = row.split("").reverse().join("");
    for (let i = 0; i <= row.length - minRun; i++) {
      const forward = row.slice(i, i + minRun);
      const backward = rev.slice(i, i + minRun);
      if (lower.includes(forward) || lower.includes(backward)) return true;
    }
  }
  return false;
}

function charsetSize(pwd: string): number {
  let size = 0;
  if (/[a-z]/.test(pwd)) size += 26;
  if (/[A-Z]/.test(pwd)) size += 26;
  if (/[0-9]/.test(pwd)) size += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) size += 32; // rough estimate for common symbol set
  return size || 1;
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  entropyBits: number;
  warnings: string[];
}

const SCORE_LABELS = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

/** A charset-size^length entropy estimate, same basic approach most strength meters use, with
 * pattern-based penalties layered on top (common passwords, sequences, repeats, keyboard walks)
 * since raw entropy alone rates "qwertyuiop1234" as strong despite being trivially guessable. */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) return { score: 0, label: "", entropyBits: 0, warnings: [] };

  const warnings: string[] = [];
  let entropyBits = password.length * Math.log2(charsetSize(password));

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    warnings.push("This is one of the most commonly leaked passwords — treat it as instantly guessable no matter how it scores otherwise.");
    entropyBits = Math.min(entropyBits, 10);
  }
  if (hasSequential(password)) {
    warnings.push("Contains a sequential run of characters (like abcd or 1234) — easy to guess.");
    entropyBits *= 0.6;
  }
  if (hasRepeats(password)) {
    warnings.push("Contains a repeated character run (like aaaa) — reduces effective randomness.");
    entropyBits *= 0.7;
  }
  if (hasKeyboardPattern(password)) {
    warnings.push("Contains a keyboard-adjacent pattern (like qwerty or asdf).");
    entropyBits *= 0.7;
  }
  if (password.length < 8) {
    warnings.push("Under 8 characters — most guidance now recommends at least 12.");
  }

  let score: PasswordStrengthResult["score"];
  if (entropyBits < 28) score = 0;
  else if (entropyBits < 36) score = 1;
  else if (entropyBits < 60) score = 2;
  else if (entropyBits < 80) score = 3;
  else score = 4;

  return { score, label: SCORE_LABELS[score], entropyBits: Math.round(entropyBits), warnings };
}
