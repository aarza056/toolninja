---
title: "standard_init_linux.go:211: exec user process caused: no such file or directory ? Docker Fix"
description: "The most common cause of this Docker error is Windows CRLF line endings in shell scripts. Learn how to detect, fix, and prevent it with .gitattributes and Dockerfile workarounds."
date: "2026-05-22"
author: "ToolNinja"
coverEmoji: "🐳"
tags: ["docker", "linux", "shell", "containers", "crlf", "entrypoint error", "docker no such file"]
relatedTools: ["chmod-calculator"]
faqs:
  - q: "Why does this error only happen on Linux but not on my Windows machine?"
    a: "On Windows, Docker Desktop runs a Linux VM internally, but your source files are written with Windows CRLF line endings. The Linux kernel inside Docker sees #!/bin/bash\\r and can?t find an interpreter named /bin/bash\\r ? so it throws ?no such file or directory?."
  - q: "Can I fix this inside the Dockerfile instead of changing the source file?"
    a: "Yes. Add RUN sed -i ?s/\\r//? /app/entrypoint.sh before the ENTRYPOINT instruction. However, fixing it at the source with .gitattributes is strongly preferred so the problem doesn?t recur."
  - q: "How do I check if my script has CRLF line endings without running Docker?"
    a: "Run file entrypoint.sh on Linux/macOS ? it will say ?with CRLF line terminators? if affected. On Windows, run cat -A entrypoint.sh and look for ^M characters at line ends."
  - q: "Does this error only affect entrypoint scripts or other files too?"
    a: "Any executable file Docker tries to run can trigger it ? entrypoint.sh, start.sh, Python scripts with a shebang line. The shebang interpreter path contains a \\r that makes it unresolvable on Linux."
---

## The Exact Error

\standard_init_linux.go:211: exec user process caused: no such file or directory
\
Or in newer Docker versions:
\exec /app/entrypoint.sh: no such file or directory
\
> Quick summary: Docker?s Linux kernel is trying to execute your shell script but can?t find the interpreter. The script physically exists ? the problem is invisible Windows-style line endings (CRLF) that corrupt the shebang line.

---

## Why This Error Happens

Your \entrypoint.sh\ starts with \#!/bin/bash\. When the Linux kernel executes this file, it reads that first line to determine which interpreter to use. If your script was created or edited on Windows, each line ends with \\n\ (carriage return + newline) instead of the Unix-standard \
\ (newline only).

The kernel sees \#!/bin/bash\r\ and looks for a program at the path \/bin/bash\r\, which doesn?t exist. The \\ is invisible in most text editors but it?s there.

This is compounded by Git?s \utocrlf=true\ setting on Windows, which converts LF to CRLF on checkout even if the file was committed correctly.

---

## Step-by-Step Diagnosis

### Step 1 ? Confirm the script exists in the container

\\ash
docker run --entrypoint /bin/sh yourimage -c "ls -la /app/entrypoint.sh"
\
If the file exists, the error is almost certainly line endings.

### Step 2 ? Detect CRLF endings

\\ash
file entrypoint.sh
# CRLF: "Bourne-Again shell script, ASCII text, with CRLF line terminators"

cat -A entrypoint.sh | head -5
# CRLF shows as ^M:  #!/bin/bash^M
\
### Step 3 ? Check your Git autocrlf setting

\\ash
git config core.autocrlf
# "true" on Windows = converting LF to CRLF on checkout (problem)
# "input" = correct behavior
\
---

## Solutions

### Solution 1 ? Fix with sed

\\ash
sed -i 's/\r//' entrypoint.sh
\
### Solution 2 ? Use dos2unix

\\ash
dos2unix entrypoint.sh
\
### Solution 3 ? Fix in VS Code

Click \CRLF\ in the bottom-right status bar and select \LF\. Save.

### Solution 4 ? Fix permanently with .gitattributes

\\gitattributes
*.sh text eol=lf
Dockerfile text eol=lf
docker-compose.yml text eol=lf
\
\\ash
git rm -r --cached .
git add .
git commit -m "fix: normalize line endings via .gitattributes"
\
### Solution 5 ? Fix inside the Dockerfile

\\dockerfile
RUN sed -i 's/\r//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
\
---

## Quick Reference

| Symptom | Likely Cause | Fix |
|---|---|---|
| no such file on existing script | CRLF in shebang | \sed -i 's/\r//' script.sh\ |
| Error only in Docker, works on Windows | Git autocrlf conversion | \.gitattributes *.sh eol=lf\ |
| ^M visible in cat -A | CRLF line endings | \dos2unix script.sh\ |
| Recurs after fixing | Git re-converting | Set core.autocrlf=input |

---

## Prevent This Error in the Future

1. Set .gitattributes before the first commit for every Docker project.
2. Set \git config --global core.autocrlf input\ ? strips CR on commit, never adds it.
3. Add a Dockerfile RUN sed as a safety net even after fixing the source.

---

## Use ToolNinja to Debug Faster

After fixing line endings, verify that file permissions are correct ? shell scripts need execute (+x) permission. The chmod calculator gives you the right value without memorizing octal notation.

🔧 **[Chmod Calculator ? toolninja.io/tools/chmod-calculator](https://toolninja.io/tools/chmod-calculator)**
