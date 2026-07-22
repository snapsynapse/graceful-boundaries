#!/usr/bin/env node

/**
 * Graceful Boundaries agentic surface release checks.
 *
 * These tests cover repository-published assistant surfaces that are not
 * exercised by the HTTP conformance validators directly.
 *
 * Usage: node evals/test-agentic-surfaces.js
 */

const assert = require("node:assert");
const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { parseArgs } = require("./check.js");

const repoRoot = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;
const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

async function run() {
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`PASS  ${name}`);
      passed++;
    } catch (error) {
      console.log(`FAIL  ${name}: ${error.message}`);
      failed++;
    }
  }

  console.log("");
  console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function countUnitTests() {
  const evalsDir = path.join(repoRoot, "evals");
  const staticTests = fs.readdirSync(evalsDir)
    .filter((file) => /^test-.*\.js$/.test(file))
    .reduce((count, file) => {
      const content = fs.readFileSync(path.join(evalsDir, file), "utf8");
      return count + (content.match(/^\s*test\(/gm) || []).length;
    }, 0);
  const limitsExamples = fs.readdirSync(path.join(repoRoot, "examples", "limits"))
    .filter((file) => file.endsWith(".json")).length;
  const schemaDynamicTests = Math.max(0, limitsExamples * 2 - 2);
  const { AGENT_FIXTURES } = require("./test-agent-behavior.js");

  return staticTests + schemaDynamicTests + AGENT_FIXTURES.length;
}

test("assistant guide copies are byte-identical", () => {
  const rootGuide = readRepoFile("assistant-guide.txt");
  const wellKnownGuide = readRepoFile(".well-known/assistant-guide.txt");
  assert.strictEqual(rootGuide, wellKnownGuide, "assistant guide copies must remain byte-identical");
});

test("GuideCheck verification SHA is disclosed consistently", () => {
  const guideHash = sha256(readRepoFile("assistant-guide.txt"));
  const disclosureFiles = [
    "README.md",
    "llms.txt",
    "docs/agentic-surfaces.md",
  ];

  for (const file of disclosureFiles) {
    const content = readRepoFile(file);
    assert(
      content.includes(guideHash),
      `${file} must include current assistant-guide SHA-256 ${guideHash}`
    );
  }
});

test("agentic surfaces disclosure names the GuideCheck implementation", () => {
  const guide = readRepoFile("assistant-guide.txt");
  const surfaces = readRepoFile("docs/agentic-surfaces.md");

  assert(surfaces.includes("human-verifiable-assistant-guide"), "profile must be disclosed");
  assert(surfaces.includes("0.3.0"), "profile version must be disclosed");
  assert(surfaces.includes("1.1.0"), "guide version must be disclosed");
  assert(
    surfaces.includes("https://gracefulboundaries.dev/.well-known/assistant-guide.txt"),
    "canonical guide URL must be disclosed"
  );
  assert(guide.includes("verifier-conformance: human-verifiable-assistant-guide-verifier >=0.3.0, <0.4.0"));
});

test("checker CLI parses --check-cloaking as an explicit advisory flag", () => {
  const options = parseArgs([
    "node",
    "evals/check.js",
    "https://example.com/",
    "--json",
    "--check-cloaking",
    "--limits-path",
    "/api/limits",
  ]);

  assert.strictEqual(options.baseUrl, "https://example.com");
  assert.strictEqual(options.json, true);
  assert.strictEqual(options.checkCloaking, true);
  assert.strictEqual(options.limitsPath, "/api/limits");
});

test("checker CLI rejects malformed --min-level values", () => {
  for (const value of ["2abc", "99", "foo", "-1", "1.5"]) {
    const options = parseArgs([
      "node",
      "evals/check.js",
      "https://example.com/",
      "--min-level",
      value,
    ]);
    assert(
      options.errors.some((error) => error.includes("--min-level")),
      `expected --min-level error for ${value}`
    );
    assert.strictEqual(options.minLevel, null);
  }

  const valid = parseArgs([
    "node",
    "evals/check.js",
    "https://example.com/",
    "--min-level",
    "4",
  ]);
  assert.deepStrictEqual(valid.errors, []);
  assert.strictEqual(valid.minLevel, 4);
});

test("checker CLI exits before network access for invalid --min-level", () => {
  const result = spawnSync(
    process.execPath,
    ["evals/check.js", "https://example.com", "--min-level", "2abc"],
    { cwd: repoRoot, encoding: "utf8" }
  );

  assert.strictEqual(result.status, 1, `expected exit 1, got ${result.status}`);
  assert(result.stderr.includes("--min-level must be an integer from 0 to 4"), result.stderr);
  assert(!result.stderr.includes("Checking limits discovery"), "invalid arguments should fail before network checks");
});

test("GitHub Action passes inputs through environment variables", () => {
  const action = readRepoFile("action.yml");
  const runBlock = action.split("run: |")[1] || "";
  assert(action.includes("INPUT_URL: ${{ inputs.url }}"), "url input must be assigned through env");
  assert(action.includes('ARGS=("$INPUT_URL" --min-level "$INPUT_MIN_LEVEL")'), "run script must quote env vars");
  assert(!action.includes('ARGS=("${{ inputs.url }}"'), "run script must not interpolate url directly");
  assert(!action.includes('${{ inputs.limits-path }}"'), "run script must not interpolate limits-path directly");
  assert(!action.includes('${{ inputs.json }}"'), "run script must not interpolate json directly");
  assert(!/\$\{\{\s*inputs\./.test(runBlock), "run block must not interpolate action inputs directly");
});

test("release version is consistent across published surfaces", () => {
  const packageVersion = JSON.parse(readRepoFile("package.json")).version;
  const checks = {
    "spec.md": /^\*\*Version:\*\* (\S+)$/m,
    "README.md": /version-(\d+\.\d+\.\d+)-blue/,
    "index.html": /<span class="version">v(\d+\.\d+\.\d+)<\/span>/,
    "llms.txt": /^- Version: (\S+)$/m,
    "MANIFEST.yaml": /^spec_version: (\S+)$/m,
    "CLAUDE.md": /Spec version \*\*(\d+\.\d+\.\d+)\*\*/,
    "PROJECT_CONTEXT.md": /Spec version \*\*(\d+\.\d+\.\d+)\*\*/,
  };

  for (const [file, pattern] of Object.entries(checks)) {
    const match = readRepoFile(file).match(pattern);
    assert(match, `${file} must disclose a machine-checkable release version`);
    assert.strictEqual(match[1], packageVersion, `${file} version must match package.json`);
  }

  const changelog = readRepoFile("CHANGELOG.md");
  const latest = changelog.match(/## Unreleased\s+## \[([^\]]+)\]/);
  assert(latest, "CHANGELOG.md must place the latest release immediately after Unreleased");
  assert.strictEqual(latest[1], packageVersion, "latest changelog release must match package.json");

  const specDate = readRepoFile("spec.md").match(/^\*\*Date:\*\* (\d{4}-\d{2}-\d{2})$/m);
  assert(specDate, "spec.md must disclose an ISO release date");
  const dateChecks = {
    "CHANGELOG.md": new RegExp(`^## \\[${packageVersion.replace(/\./g, "\\.")}\\] - (${specDate[1]})$`, "m"),
    "index.html": new RegExp(`<time datetime="(${specDate[1]})">`),
    "llms.txt": new RegExp(`^- Updated: (${specDate[1]})$`, "m"),
    "MANIFEST.yaml": new RegExp(`^date: (${specDate[1]})$`, "m"),
  };
  for (const [file, pattern] of Object.entries(dateChecks)) {
    assert(pattern.test(readRepoFile(file)), `${file} release date must match spec.md`);
  }
});

test("Skill Provenance manifest hashes match both skill files", () => {
  const manifest = readRepoFile("MANIFEST.yaml");
  const blocks = manifest.split(/\n  - name: /).slice(1);

  for (const skillFile of ["SKILL.md", "SKILL-builder.md"]) {
    const block = blocks.find((candidate) => candidate.includes(`\n    file: ${skillFile}\n`));
    assert(block, `MANIFEST.yaml must inventory ${skillFile}`);
    const declared = block.match(/\n    sha256: ([a-f0-9]{64})\n/);
    assert(declared, `MANIFEST.yaml must declare a SHA-256 for ${skillFile}`);
    assert.strictEqual(declared[1], sha256(readRepoFile(skillFile)), `${skillFile} hash must match MANIFEST.yaml`);
  }
});

test("adopter revalidation workflow covers every registered service", () => {
  const adopters = readRepoFile("ADOPTERS.md");
  const workflow = readRepoFile(".github/workflows/adopter-revalidation.yml");
  const urls = [...adopters.matchAll(/\[[^\]]+\]\((https:\/\/[^)]+)\)\s*\|\s*[0-4]/g)]
    .map((match) => match[1]);

  assert(urls.length > 0, "ADOPTERS.md must contain at least one registered service");
  for (const url of urls) {
    assert(workflow.includes(`url: ${url}`), `${url} must be present in the adopter revalidation matrix`);
  }
  assert(workflow.includes("schedule:"), "adopter revalidation must run on a schedule");
  assert(workflow.includes("workflow_dispatch:"), "adopter revalidation must support manual runs");
  assert(workflow.includes("actions/upload-artifact@v4"), "adopter revalidation must retain JSON evidence");
  assert(workflow.includes("timeout-minutes:"), "live adopter checks must have a bounded job timeout");
});

test("public docs disclose the current unit test count", () => {
  const count = countUnitTests();
  const expected = `${count} tests`;
  for (const file of ["README.md", "CONFORMANCE.md", "AGENTS.md", "CLAUDE.md", "index.html", "RELEASE_CHECKLIST.md", ".github/PULL_REQUEST_TEMPLATE.md"]) {
    assert(readRepoFile(file).includes(expected), `${file} must include ${expected}`);
  }
});

run();
