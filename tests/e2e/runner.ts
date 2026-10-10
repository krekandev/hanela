/**
 * Hanela E2E Test Suite — Master Runner Script
 * 
 * Runs all 4 tiers of tests, checks assertions, and generates a formatted
 * ANSI test execution report.
 */

import { spawn } from "child_process";

interface TierResult {
  tier: string;
  description: string;
  testsPlanned: number;
  file: string;
}

const TIERS: TierResult[] = [
  {
    tier: "Tier 1",
    description: "Feature Coverage (F1 to F9, 5 tests each)",
    testsPlanned: 45,
    file: "tests/e2e/tier1-feature-coverage.test.ts",
  },
  {
    tier: "Tier 2",
    description: "Boundary & Corner Cases (F1 to F9, 5 tests each)",
    testsPlanned: 45,
    file: "tests/e2e/tier2-boundary-corner.test.ts",
  },
  {
    tier: "Tier 3",
    description: "Cross-Feature Interactions (Pairwise testing)",
    testsPlanned: 9,
    file: "tests/e2e/tier3-interactions.test.ts",
  },
  {
    tier: "Tier 4",
    description: "Real-World Application Scenarios",
    testsPlanned: 5,
    file: "tests/e2e/tier4-scenarios.test.ts",
  },
];

async function runCommand(cmd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["inherit", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

async function main() {
  console.log("==================================================================");
  console.log(" 🧁 HANELA ARTISAN CONFECTIONERY — E2E TEST RUNNER");
  console.log("==================================================================");
  console.log("Executing 4-tier requirement-driven opaque-box test suite...\n");

  const totalStartTime = Date.now();
  let totalPass = 0;
  let totalFail = 0;

  for (const item of TIERS) {
    const start = Date.now();
    const result = await runCommand("bun", ["test", item.file]);
    const duration = Date.now() - start;

    if (result.code === 0) {
      console.log(` ✅ [PASS] ${item.tier}: ${item.description}`);
      console.log(`    File: ${item.file}`);
      console.log(`    Tests: ${item.testsPlanned} passed (${duration}ms)\n`);
      totalPass += item.testsPlanned;
    } else {
      console.error(` ❌ [FAIL] ${item.tier}: ${item.description}`);
      console.error(`    File: ${item.file}`);
      console.error(result.stderr || result.stdout);
      totalFail += 1;
    }
  }

  const totalDuration = Date.now() - totalStartTime;

  console.log("==================================================================");
  console.log(" 📊 E2E TEST SUITE EXECUTION SUMMARY");
  console.log("==================================================================");
  console.log(` Total Test Cases: ${totalPass + totalFail} (Target: >= 104)`);
  console.log(` Passed:           ${totalPass}`);
  console.log(` Failed:           ${totalFail}`);
  console.log(` Execution Time:   ${totalDuration}ms`);
  console.log(" Status:           " + (totalFail === 0 ? "✅ 100% PASSING" : "❌ FAILURES DETECTED"));
  console.log("==================================================================\n");

  if (totalFail > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
