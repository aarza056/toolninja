"use client";

import { useState, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { parseMultipleDockerRuns } from "@/lib/docker-parser";
import { generateComposeYaml, generateMultiServiceCompose, getServiceName } from "@/lib/docker-to-yaml";
import { analyzeBestPractices } from "@/lib/docker-analyzer";
import { composeToDockerRun } from "@/lib/compose-parser";
import { DOCKER_EXAMPLES } from "@/lib/docker-examples";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Shield,
  Activity,
  Wrench,
} from "lucide-react";

type Mode = "run-to-compose" | "compose-to-run";

const CATEGORY_ICONS = {
  security: Shield,
  reliability: Activity,
  performance: Zap,
  maintainability: Wrench,
};

const SEVERITY_COLORS = {
  error: "text-red-400",
  warning: "text-yellow-400",
  tip: "text-blue-400",
};

const SCORE_RING = (score: number) => {
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-yellow-400";
  if (score >= 50) return "text-orange-400";
  return "text-red-400";
};

export default function DockerConverterClient() {
  const [mode, setMode] = useState<Mode>("run-to-compose");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [ignoredFlags, setIgnoredFlags] = useState<string[]>([]);
  const [showBestPractices, setShowBestPractices] = useState(true);
  const [practicesData, setPracticesData] = useState<ReturnType<typeof analyzeBestPractices> | null>(null);
  const [multiCommands, setMultiCommands] = useState<{ name: string; command: string }[]>([]);
  const [serviceCount, setServiceCount] = useState(0);

  const convert = useCallback(() => {
    setError("");
    setWarnings([]);
    setIgnoredFlags([]);
    setPracticesData(null);
    setMultiCommands([]);

    if (!input.trim()) {
      setOutput("");
      return;
    }

    if (mode === "run-to-compose") {
      const results = parseMultipleDockerRuns(input);
      const validResults = results.filter((r) => r.service.image);

      if (validResults.length === 0) {
        setError("No valid docker run command found. Make sure your command starts with 'docker run' and includes an image name.");
        setOutput("");
        return;
      }

      setServiceCount(validResults.length);
      const allWarnings = validResults.flatMap((r) => r.warnings);
      const allIgnored = validResults.flatMap((r) => r.ignoredFlags);
      setWarnings(Array.from(new Set(allWarnings)));
      setIgnoredFlags(Array.from(new Set(allIgnored)));

      if (validResults.length === 1) {
        const { service } = validResults[0];
        const name = getServiceName(service);
        const yaml = generateComposeYaml(service, name);
        setOutput(yaml);
        setPracticesData(analyzeBestPractices(service));
      } else {
        const yaml = generateMultiServiceCompose(validResults);
        setOutput(yaml);
        const firstService = validResults[0].service;
        setPracticesData(analyzeBestPractices(firstService));
      }
    } else {
      const result = composeToDockerRun(input);
      if (result.error) {
        setError(result.error);
        setOutput("");
        return;
      }
      if (result.commands.length === 0) {
        setError("No services found in the compose file.");
        setOutput("");
        return;
      }
      setMultiCommands(result.commands);
      setOutput(result.commands.map((c) => `# ${c.name}\n${c.command}`).join("\n\n"));
      setServiceCount(result.commands.length);
    }
  }, [input, mode]);

  const loadExample = (example: (typeof DOCKER_EXAMPLES)[0]) => {
    setMode("run-to-compose");
    setInput(example.command);
    setOutput("");
    setError("");
    setWarnings([]);
    setIgnoredFlags([]);
    setPracticesData(null);
    setMultiCommands([]);
  };

  const reset = () => {
    setInput("");
    setOutput("");
    setError("");
    setWarnings([]);
    setIgnoredFlags([]);
    setPracticesData(null);
    setMultiCommands([]);
    setServiceCount(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      convert();
    }
  };

  return (
    <ToolLayout
      title="Docker Run to Compose"
      description="Convert docker run commands to docker-compose.yml and back"
    >
      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode("run-to-compose"); reset(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "run-to-compose"
              ? "bg-purple-600 text-white"
              : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-white/10"
          }`}
        >
          docker run → Compose
        </button>
        <button
          onClick={() => { setMode("compose-to-run"); reset(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "compose-to-run"
              ? "bg-purple-600 text-white"
              : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-white/10"
          }`}
        >
          Compose → docker run
        </button>
      </div>

      {/* Examples row */}
      {mode === "run-to-compose" && (
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Load example</p>
          <div className="flex flex-wrap gap-2">
            {DOCKER_EXAMPLES.map((ex) => (
              <button
                key={ex.name}
                onClick={() => loadExample(ex)}
                className="px-3 py-1.5 rounded-md text-xs bg-[#1a1a1a] border border-white/10 text-gray-300 hover:text-white hover:border-purple-500/50 transition-colors"
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 uppercase tracking-wide">
              {mode === "run-to-compose" ? "docker run command(s)" : "docker-compose.yml"}
            </label>
            <button
              onClick={reset}
              className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} />
              Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "run-to-compose"
                ? `docker run -d \\
  --name myapp \\
  --restart unless-stopped \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  myapp:1.0.0`
                : `services:
  web:
    image: nginx:1.25.3
    ports:
      - "80:80"
    restart: unless-stopped`
            }
            className="w-full h-72 bg-[#111] border border-white/10 rounded-lg p-4 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
          />
          <p className="text-xs text-gray-600">
            {mode === "run-to-compose"
              ? "Separate multiple commands with a blank line. Ctrl+Enter to convert."
              : "Paste your docker-compose.yml. Ctrl+Enter to convert."}
          </p>
        </div>

        {/* Output */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 uppercase tracking-wide">
              {mode === "run-to-compose" ? "docker-compose.yml" : "docker run command(s)"}
              {serviceCount > 0 && (
                <span className="ml-2 text-purple-400">({serviceCount} service{serviceCount !== 1 ? "s" : ""})</span>
              )}
            </label>
            {output && <CopyButton text={output} />}
          </div>
          <div className="relative h-72">
            <textarea
              readOnly
              value={output}
              placeholder="Output will appear here..."
              className="w-full h-full bg-[#111] border border-white/10 rounded-lg p-4 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Convert button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={convert}
          className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
        >
          Convert
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-3">
              <AlertTriangle size={14} className="text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-300">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ignored flags */}
      {ignoredFlags.length > 0 && (
        <div className="mt-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} className="text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">Unsupported flags (no Compose equivalent)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ignoredFlags.map((f, i) => (
              <code key={i} className="text-xs px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300">
                {f}
              </code>
            ))}
          </div>
        </div>
      )}

      {/* Best practices panel */}
      {practicesData && (
        <div className="mt-6 border border-white/10 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowBestPractices((p) => !p)}
            className="w-full flex items-center justify-between p-4 bg-[#111] hover:bg-[#1a1a1a] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold tabular-nums ${SCORE_RING(practicesData.score)}`}>
                {practicesData.score}
              </span>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Best Practices Score</p>
                <p className="text-xs text-gray-500">
                  {practicesData.passed.length} passed · {practicesData.failed.length} failed
                </p>
              </div>
            </div>
            {showBestPractices ? (
              <ChevronUp size={16} className="text-gray-500" />
            ) : (
              <ChevronDown size={16} className="text-gray-500" />
            )}
          </button>

          {showBestPractices && (
            <div className="p-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Failed checks */}
              {practicesData.failed.map((p) => {
                const Icon = CATEGORY_ICONS[p.category];
                return (
                  <div
                    key={p.id}
                    className="flex items-start gap-3 p-3 bg-[#0f0f0f] border border-white/5 rounded-lg"
                  >
                    <XCircle size={14} className={`${SEVERITY_COLORS[p.severity]} mt-0.5 shrink-0`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon size={12} className="text-gray-500 shrink-0" />
                        <p className="text-xs font-medium text-white truncate">{p.title}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{p.description}</p>
                    </div>
                  </div>
                );
              })}
              {/* Passed checks */}
              {practicesData.passed.map((p) => {
                const Icon = CATEGORY_ICONS[p.category];
                return (
                  <div
                    key={p.id}
                    className="flex items-start gap-3 p-3 bg-[#0f0f0f] border border-white/5 rounded-lg opacity-60"
                  >
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon size={12} className="text-gray-500 shrink-0" />
                        <p className="text-xs font-medium text-white truncate">{p.title}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Compose-to-run multi output */}
      {mode === "compose-to-run" && multiCommands.length > 1 && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-400">Individual service commands:</p>
          {multiCommands.map((cmd) => (
            <div key={cmd.name} className="border border-white/10 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-white/5">
                <span className="text-xs font-medium text-purple-400">{cmd.name}</span>
                <CopyButton text={cmd.command} />
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap bg-[#0d0d0d]">
                {cmd.command}
              </pre>
            </div>
          ))}
        </div>
      )}
    </ToolLayout>
  );
}
