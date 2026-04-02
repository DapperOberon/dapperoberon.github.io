import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const thisFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(thisFilePath), "..", "..");
const checkpointRoot = path.join(repoRoot, "checkpoint");
const observabilityDir = path.join(checkpointRoot, "observability");
const jsonReportPath = path.join(observabilityDir, "latest-loop.json");
const mdReportPath = path.join(observabilityDir, "latest-loop.md");
const tasksPath = path.join(checkpointRoot, "AGENT_LOOP_TASKS.md");

const checks = [
  {
    id: "build-css",
    title: "Build CSS pipeline",
    command: "npm run build:css",
    cwd: checkpointRoot,
    guidance: "Fix Tailwind/build pipeline issues or dependency drift."
  },
  {
    id: "config-preflight",
    title: "Runtime config preflight",
    command: "node checkpoint/scripts/preflight_config.mjs",
    cwd: repoRoot,
    guidance: "Fix config completeness and required runtime values."
  },
  {
    id: "smoke-test",
    title: "Smoke + integration checks",
    command: "PORT=8142 bash checkpoint/scripts/smoke_test.sh",
    cwd: repoRoot,
    guidance: "Fix syntax/runtime/integration regressions introduced by recent changes."
  }
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function runCheck(check) {
  const startedAt = new Date();
  const start = Date.now();
  const result = spawnSync(check.command, {
    cwd: check.cwd,
    shell: true,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8
  });
  const endedAt = new Date();
  const durationMs = Date.now() - start;
  const ok = result.status === 0;
  return {
    id: check.id,
    title: check.title,
    command: check.command,
    cwd: path.relative(repoRoot, check.cwd) || ".",
    ok,
    exitCode: result.status ?? 1,
    signal: result.signal ?? null,
    guidance: check.guidance,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationMs,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}

function buildMarkdownReport(report) {
  const lines = [];
  lines.push("# Loop Report");
  lines.push("");
  lines.push(`- Timestamp: \`${report.timestamp}\``);
  lines.push(`- Overall: **${report.ok ? "PASS" : "FAIL"}**`);
  lines.push(`- Passed: ${report.summary.passed}/${report.summary.total}`);
  lines.push("");
  lines.push("## Checks");
  lines.push("");

  for (const check of report.checks) {
    lines.push(`### ${check.ok ? "PASS" : "FAIL"} · ${check.title}`);
    lines.push(`- Id: \`${check.id}\``);
    lines.push(`- Command: \`${check.command}\``);
    lines.push(`- CWD: \`${check.cwd}\``);
    lines.push(`- Exit: \`${check.exitCode}\``);
    lines.push(`- Duration: \`${check.durationMs}ms\``);
    lines.push("");
    lines.push("```text");
    const body = `${check.stdout || ""}${check.stderr || ""}`.trim();
    lines.push(body || "(no output)");
    lines.push("```");
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

function buildTasksMarkdown(report) {
  const failedChecks = report.checks.filter((check) => !check.ok);
  const lines = [];
  lines.push("# Agent Loop Tasks");
  lines.push("");
  lines.push(`Generated: \`${report.timestamp}\``);
  lines.push("");

  if (!failedChecks.length) {
    lines.push("## Status");
    lines.push("");
    lines.push("Loop is green. No blocker tasks from automated checks.");
    lines.push("");
    lines.push("## Keep Tightening");
    lines.push("");
    lines.push("- [ ] Run final manual browser QA sweep (local + production).");
    lines.push("- [ ] Convert any repeated manual QA findings into automated checks.");
    lines.push("- [ ] Keep `PHASE3_QA_CHECKLIST.md` and deployment checklist in sync with actual state.");
    return `${lines.join("\n").trim()}\n`;
  }

  lines.push("## Blockers");
  lines.push("");
  for (const check of failedChecks) {
    lines.push(`- [ ] **${check.title}** (\`${check.id}\`)`);
    lines.push(`  - Fix path: ${check.guidance}`);
    lines.push(`  - Re-run: \`${check.command}\``);
  }
  lines.push("");
  lines.push("## Completion Rule");
  lines.push("");
  lines.push("- [ ] Re-run `node checkpoint/scripts/loop_cycle.mjs` and ensure all checks pass.");
  return `${lines.join("\n").trim()}\n`;
}

function main() {
  ensureDir(observabilityDir);

  const checkResults = checks.map(runCheck);
  const passed = checkResults.filter((item) => item.ok).length;
  const total = checkResults.length;
  const report = {
    timestamp: new Date().toISOString(),
    ok: passed === total,
    summary: {
      total,
      passed,
      failed: total - passed
    },
    checks: checkResults
  };

  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(mdReportPath, buildMarkdownReport(report));
  fs.writeFileSync(tasksPath, buildTasksMarkdown(report));

  const summaryLine = `[checkpoint-loop] ${report.ok ? "PASS" : "FAIL"} (${passed}/${total} checks)`;
  console.log(summaryLine);
  console.log(`[checkpoint-loop] Wrote ${path.relative(repoRoot, jsonReportPath)}`);
  console.log(`[checkpoint-loop] Wrote ${path.relative(repoRoot, mdReportPath)}`);
  console.log(`[checkpoint-loop] Wrote ${path.relative(repoRoot, tasksPath)}`);

  if (!report.ok) {
    process.exit(1);
  }
}

main();
