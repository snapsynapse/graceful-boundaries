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

run();
