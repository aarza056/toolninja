export interface GitignoreTemplate {
  id: string;
  label: string;
  category: "Language" | "Framework" | "Editor" | "OS" | "Tool";
  content: string;
}

export const gitignoreTemplates: GitignoreTemplate[] = [
  {
    id: "node",
    label: "Node.js",
    category: "Language",
    content: `node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.pnp/
.pnp.js
dist/
build/
coverage/
*.tsbuildinfo`,
  },
  {
    id: "python",
    label: "Python",
    category: "Language",
    content: `__pycache__/
*.py[cod]
*$py.class
*.egg-info/
.eggs/
dist/
build/
venv/
.venv/
env/
.env
*.egg
.mypy_cache/
.pytest_cache/
.ruff_cache/
.coverage
htmlcov/`,
  },
  {
    id: "java",
    label: "Java",
    category: "Language",
    content: `*.class
*.jar
*.war
*.ear
target/
.gradle/
build/
!gradle/wrapper/gradle-wrapper.jar
hs_err_pid*`,
  },
  {
    id: "go",
    label: "Go",
    category: "Language",
    content: `*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
vendor/
go.work`,
  },
  {
    id: "rust",
    label: "Rust",
    category: "Language",
    content: `/target/
Cargo.lock
**/*.rs.bk
*.pdb`,
  },
  {
    id: "ruby",
    label: "Ruby",
    category: "Language",
    content: `*.gem
*.rbc
/.config
/coverage/
/InstalledFiles
/pkg/
/spec/reports/
/tmp/
.bundle/
vendor/bundle
Gemfile.lock`,
  },
  {
    id: "php",
    label: "PHP",
    category: "Language",
    content: `/vendor/
composer.phar
.env
.env.local
.phpunit.result.cache`,
  },
  {
    id: "csharp",
    label: "C# / .NET",
    category: "Language",
    content: `bin/
obj/
*.user
*.suo
.vs/
*.dll
*.pdb`,
  },
  {
    id: "nextjs",
    label: "Next.js",
    category: "Framework",
    content: `.next/
out/
next-env.d.ts`,
  },
  {
    id: "react",
    label: "React",
    category: "Framework",
    content: `build/
.eslintcache`,
  },
  {
    id: "vue",
    label: "Vue",
    category: "Framework",
    content: `dist/
.cache/`,
  },
  {
    id: "django",
    label: "Django",
    category: "Framework",
    content: `*.log
local_settings.py
db.sqlite3
db.sqlite3-journal
/staticfiles/
/media/`,
  },
  {
    id: "rails",
    label: "Ruby on Rails",
    category: "Framework",
    content: `/log/*
/tmp/*
!/log/.keep
!/tmp/.keep
/storage/*
!/storage/.keep
/public/assets`,
  },
  {
    id: "laravel",
    label: "Laravel",
    category: "Framework",
    content: `/vendor/
/storage/*.key
/bootstrap/cache/*
/public/storage
/public/hot
.env`,
  },
  {
    id: "terraform",
    label: "Terraform",
    category: "Tool",
    content: `**/.terraform/*
*.tfstate
*.tfstate.*
crash.log
*.tfvars
override.tf
override.tf.json
.terraformrc
terraform.rc`,
  },
  {
    id: "docker",
    label: "Docker",
    category: "Tool",
    content: `*.env
docker-compose.override.yml`,
  },
  {
    id: "env",
    label: "Environment / Secrets",
    category: "Tool",
    content: `.env
.env.local
.env.*.local
*.pem
*.key`,
  },
  {
    id: "vscode",
    label: "VS Code",
    category: "Editor",
    content: `.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
*.code-workspace`,
  },
  {
    id: "jetbrains",
    label: "JetBrains (IntelliJ/WebStorm/PyCharm)",
    category: "Editor",
    content: `.idea/
*.iml
*.iws
out/`,
  },
  {
    id: "sublime",
    label: "Sublime Text",
    category: "Editor",
    content: `*.sublime-workspace
*.sublime-project`,
  },
  {
    id: "vim",
    label: "Vim",
    category: "Editor",
    content: `*.swp
*.swo
*~
.netrwhist`,
  },
  {
    id: "macos",
    label: "macOS",
    category: "OS",
    content: `.DS_Store
.AppleDouble
.LSOverride
._*
.Spotlight-V100
.Trashes`,
  },
  {
    id: "windows",
    label: "Windows",
    category: "OS",
    content: `Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/
*.lnk`,
  },
  {
    id: "linux",
    label: "Linux",
    category: "OS",
    content: `*~
.fuse_hidden*
.directory
.Trash-*
.nfs*`,
  },
];

export function buildGitignore(selectedIds: string[]): string {
  const selected = gitignoreTemplates.filter((t) => selectedIds.includes(t.id));
  if (selected.length === 0) return "";

  return selected
    .map((t) => `### ${t.label} ###\n${t.content}`)
    .join("\n\n") + "\n";
}
