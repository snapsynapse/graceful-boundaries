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
const { parseArgs, validateBaseUrl, isUnreachable } = require("./check.js");
const { renderLlmsFull, SOURCES: LLMS_FULL_SOURCES } = require("../scripts/build-llms-full.js");

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

/**
 * Latest released version in CHANGELOG.md: the first `## [x.y.z]` heading that
 * follows `## Unreleased`. Content under Unreleased is permitted and skipped,
 * so pending entries can be recorded before a version is cut.
 */
function latestChangelogRelease(changelog) {
  const match = changelog.match(/## Unreleased\b[\s\S]*?\n## \[([^\]]+)\]/);
  return match ? match[1] : null;
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
  const packageVersion = JSON.parse(readRepoFile("package.json")).version;
  const guideVersion = guide.match(/^guide-version: (\S+)$/m);

  assert(surfaces.includes("human-verifiable-assistant-guide"), "profile must be disclosed");
  assert(surfaces.includes("0.3.0"), "profile version must be disclosed");
  assert(guideVersion, "guide version metadata must be present");
  assert(
    surfaces.includes(`- Guide version: \`${guideVersion[1]}\``),
    "current guide version must be disclosed"
  );
  assert(
    guide.split("\n").includes(`applies-to: graceful-boundaries ${packageVersion}`),
    "assistant guide applicability must match the package version"
  );
  assert(
    surfaces.includes("https://gracefulboundaries.dev/.well-known/assistant-guide.txt"),
    "canonical guide URL must be disclosed"
  );
  assert(guide.includes("verifier-conformance: human-verifiable-assistant-guide-verifier >=0.3.0, <0.4.0"));

  const canonical = "https://clawhub.ai/snapsynapse/skills/graceful-boundaries";
  for (const file of ["README.md", "index.html", "PROJECT_CONTEXT.md"]) {
    const content = readRepoFile(file);
    assert(content.includes(canonical), `${file} must link to the canonical ClawHub listing`);
    assert(!content.includes("https://clawhub.ai/snapsynapse/graceful-boundaries"), `${file} must not use the legacy ClawHub path`);
  }
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

test("checker CLI rejects invalid target URLs before network access", () => {
  for (const value of ["not-a-url", "example.com", "ftp://example.com", "https://"]) {
    const validation = validateBaseUrl(value);
    assert.strictEqual(validation.ok, false, `expected ${value} to be rejected`);
    assert(validation.error.includes("https://"), "error should show the expected URL form");
    const options = parseArgs(["node", "evals/check.js", value]);
    assert.strictEqual(options.baseUrl, null);
    assert(options.errors.length === 1, `expected one parse error for ${value}`);
  }
  assert.deepStrictEqual(validateBaseUrl("https://example.com/"), { ok: true, url: "https://example.com" });

  const result = spawnSync(process.execPath, ["evals/check.js", "not-a-url"], { cwd: repoRoot, encoding: "utf8" });
  assert.strictEqual(result.status, 1, `expected exit 1, got ${result.status}`);
  assert(result.stderr.includes('Invalid URL "not-a-url"'), result.stderr);
  assert(!result.stderr.includes("Checking limits discovery"), "invalid URLs should fail before network checks");
  assert(!result.stdout.includes("Confirmed conformance level"), "invalid URLs must not receive a level");
});

test("unreachable targets are distinguished from Level 0", () => {
  assert.strictEqual(isUnreachable([
    { path: "/api/limits", status: 0, found: false, error: "fetch failed", networkError: true },
    { path: "/.well-known/limits", status: 0, found: false, error: "fetch failed", networkError: true },
  ]), true);
  assert.strictEqual(isUnreachable([
    { path: "/api/limits", status: 0, found: false, error: "fetch failed", networkError: true },
    { path: "/.well-known/limits", status: 404, found: false },
  ]), false, "any HTTP response means the service was reached");
  assert.strictEqual(isUnreachable([
    { path: "/api/limits", status: 200, found: false, error: "Unexpected token <", networkError: false },
  ]), false, "a non-JSON 200 body is reachable, not a network failure");
  assert.strictEqual(isUnreachable([]), false);
});

test("checker CLI exits 3 with no level when the target is unreachable", () => {
  // Port 9 (discard) on loopback refuses connections without external network access.
  const result = spawnSync(
    process.execPath,
    ["evals/check.js", "http://127.0.0.1:9", "--json", "--min-level", "2"],
    { cwd: repoRoot, encoding: "utf8", timeout: 30000 }
  );
  assert.strictEqual(result.status, 3, `expected exit 3, got ${result.status}: ${result.stderr}`);
  const report = JSON.parse(result.stdout);
  assert.strictEqual(report.reachable, false);
  assert.strictEqual(report.conformanceLevel, null);
  assert.strictEqual(report.nextStep, null);
  assert(report.notes.some((note) => note.includes("No conformance level assigned")), "report should explain the missing level");
});

test("checker usage shows the invoking command", () => {
  const direct = spawnSync(process.execPath, ["evals/check.js"], { cwd: repoRoot, encoding: "utf8" });
  assert.strictEqual(direct.status, 1);
  assert(direct.stderr.includes("Usage: node evals/check.js <base-url>"), direct.stderr);
  const viaBin = spawnSync(process.execPath, ["bin/cli.js", "check"], { cwd: repoRoot, encoding: "utf8" });
  assert.strictEqual(viaBin.status, 1);
  assert(viaBin.stderr.includes("Usage: npx graceful-boundaries check <base-url>"), viaBin.stderr);
});

test("llms-full.txt matches its generated sources", () => {
  const committed = readRepoFile("llms-full.txt");
  assert.strictEqual(committed, renderLlmsFull(repoRoot), "llms-full.txt is stale; run npm run build:llms-full");
  for (const source of LLMS_FULL_SOURCES) {
    assert(committed.includes(`Source: ${source.path} `), `llms-full.txt must include ${source.path}`);
  }
  assert(readRepoFile("llms.txt").includes("https://gracefulboundaries.dev/llms-full.txt"), "llms.txt must link llms-full.txt");
});

test("security.txt is RFC 9116 shaped, unexpired, and matches SECURITY.md", () => {
  const text = readRepoFile(".well-known/security.txt");
  const fields = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Za-z-]+): (.+)$/);
    if (match) (fields[match[1]] ||= []).push(match[2]);
  }
  assert(fields.Contact && fields.Contact.length > 0, "Contact is required");
  assert(fields.Expires && fields.Expires.length === 1, "exactly one Expires is required");
  const expires = Date.parse(fields.Expires[0]);
  assert(!Number.isNaN(expires), "Expires must be an RFC 3339 timestamp");
  assert(expires > Date.now(), `security.txt expired on ${fields.Expires[0]}; refresh Expires`);
  assert(expires - Date.now() <= 366 * 24 * 3600 * 1000, "Expires should be at most a year ahead (RFC 9116 section 2.5.5)");
  assert.deepStrictEqual(fields.Canonical, ["https://gracefulboundaries.dev/.well-known/security.txt"]);
  const policy = readRepoFile("SECURITY.md");
  for (const contact of fields.Contact) {
    assert(/^(mailto:|https:\/\/)/.test(contact), `Contact must be a mailto: or https: URI: ${contact}`);
    assert(policy.includes(contact.replace(/^mailto:/, "")), `SECURITY.md must name ${contact}`);
  }
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
    "CITATION.cff": /^version: (\S+)$/m,
  };

  for (const [file, pattern] of Object.entries(checks)) {
    const match = readRepoFile(file).match(pattern);
    assert(match, `${file} must disclose a machine-checkable release version`);
    assert.strictEqual(match[1], packageVersion, `${file} version must match package.json`);
  }

  const latest = latestChangelogRelease(readRepoFile("CHANGELOG.md"));
  assert(latest, "CHANGELOG.md must list the latest release after Unreleased");
  assert.strictEqual(latest, packageVersion, "latest changelog release must match package.json");

  const specDate = readRepoFile("spec.md").match(/^\*\*Date:\*\* (\d{4}-\d{2}-\d{2})$/m);
  assert(specDate, "spec.md must disclose an ISO release date");
  const citation = readRepoFile("CITATION.cff");
  const preferredCitation = citation.split(/^preferred-citation:\n/m)[1] || "";
  assert(new RegExp(`^  version: ${packageVersion.replace(/\./g, "\\.")}$`, "m").test(preferredCitation), "preferred specification citation must match the released version");
  assert(new RegExp(`^date-released: "${specDate[1]}"$`, "m").test(citation), "root citation must match the released date");
  assert(new RegExp(`^  date-released: "${specDate[1]}"$`, "m").test(preferredCitation), "preferred citation must match the released date");
  const dateChecks = {
    "CHANGELOG.md": new RegExp(`^## \\[${packageVersion.replace(/\./g, "\\.")}\\] - (${specDate[1]})$`, "m"),
    "index.html": new RegExp(`<time datetime="(${specDate[1]})">`),
    "llms.txt": new RegExp(`^- Updated: (${specDate[1]})$`, "m"),
    "MANIFEST.yaml": new RegExp(`^date: (${specDate[1]})$`, "m"),
  };
  for (const [file, pattern] of Object.entries(dateChecks)) {
    assert(pattern.test(readRepoFile(file)), `${file} release date must match spec.md`);
  }

  const manifestSpecUrl = readRepoFile("MANIFEST.yaml").match(/^spec_url: (\S+)$/m);
  assert(manifestSpecUrl, "MANIFEST.yaml must disclose the canonical public spec URL");
  assert.strictEqual(
    manifestSpecUrl[1],
    "https://gracefulboundaries.dev/spec.md",
    "canonical public spec URL must use the deployed markdown endpoint"
  );
  const specUrlSurfaces = [
    "RELEASE_CHECKLIST.md",
    "schema/limits.schema.json",
    "schema/refusal.schema.json",
    "schema/refusal-429.schema.json",
    "examples/middleware/express/graceful-boundaries.js",
    "examples/middleware/fastapi/graceful_boundaries.py",
    "examples/middleware/hono/graceful-boundaries.js",
    "examples/middleware/workers/graceful-boundaries.js",
    "examples/middleware/workers/README.md",
  ];
  for (const file of specUrlSurfaces) {
    const content = readRepoFile(file);
    assert(content.includes(manifestSpecUrl[1]), `${file} must use the canonical public spec URL`);
    assert(
      !/https:\/\/gracefulboundaries\.dev\/spec(?!\.md)/.test(content),
      `${file} must not reference an undeployed spec URL`
    );
  }
  // Index policy (ops/search-indexing.md): HTML sitemap membership is reserved
  // for canonical HTML search targets. The spec is published as raw markdown at
  // the canonical URL asserted above, and is deliberately not an index target.
  // Freshness agreement for "/" is enforced by scripts/check-search.mjs.
  const sitemap = readRepoFile("sitemap.xml");
  assert(
    !sitemap.includes(`<loc>${manifestSpecUrl[1]}</loc>`),
    "sitemap.xml must not list the raw spec URL as an HTML index target"
  );
  const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepStrictEqual(
    sitemapLocs,
    ["https://gracefulboundaries.dev/"],
    "sitemap.xml must list exactly the canonical HTML search targets"
  );
});

test("changelog release lookup tolerates a populated Unreleased section", () => {
  const populated = [
    "# Changelog",
    "",
    "## Unreleased",
    "",
    "### Added",
    "- A pending entry recorded before the version is cut.",
    "",
    "### Fixed",
    "- Another pending entry.",
    "",
    "## [1.5.3] - 2026-07-21",
    "",
    "### Fixed",
    "- Something released.",
    "",
    "## [1.5.2] - 2026-07-21",
    "",
  ].join("\n");
  assert.strictEqual(
    latestChangelogRelease(populated),
    "1.5.3",
    "entries under Unreleased must not hide the latest release"
  );

  const empty = "# Changelog\n\n## Unreleased\n\n## [1.5.3] - 2026-07-21\n";
  assert.strictEqual(latestChangelogRelease(empty), "1.5.3", "empty Unreleased must still resolve");

  const noRelease = "# Changelog\n\n## Unreleased\n\n### Added\n- Only pending work.\n";
  assert.strictEqual(latestChangelogRelease(noRelease), null, "a changelog with no release must not match");
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

  // A rebuild must remove stale upload inputs from earlier producer versions.
  const outputDir = path.join(repoRoot, "build", "clawhub-graceful-boundaries");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "skill-card.md"), "Stale registry-generated card\n");
  fs.writeFileSync(path.join(outputDir, "SKILL-builder.md"), "Not part of the audit package\n");
  const build = spawnSync(process.execPath, ["scripts/build-clawhub-package.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.strictEqual(build.status, 0, build.stderr || build.stdout);

  assert.deepStrictEqual(
    fs.readdirSync(outputDir).sort(),
    ["MANIFEST.yaml", "SKILL.md"],
    "ClawHub upload must contain exactly the audit skill and derived manifest; ClawHub generates skill-card.md"
  );
  assert.strictEqual(fs.readFileSync(path.join(outputDir, "SKILL.md"), "utf8"), readRepoFile("SKILL.md"));

  const consumerManifest = fs.readFileSync(path.join(outputDir, "MANIFEST.yaml"), "utf8");
  const packageVersion = JSON.parse(readRepoFile("package.json")).version;
  assert(consumerManifest.includes(`registry_version: ${packageVersion}`), "consumer manifest version must match package.json");
  assert(consumerManifest.includes(`hash: sha256:${sha256(readRepoFile("SKILL.md"))}`), "consumer manifest hash must match SKILL.md");
  assert(/^license: MIT-0$/m.test(consumerManifest), "ClawHub artifact must disclose its accepted MIT-0 grant");
  assert(/^license_text: MIT-0$/m.test(consumerManifest), "consumer text is distributed under MIT-0");
  assert(/^license_code_examples: MIT-0$/m.test(consumerManifest), "consumer examples are distributed under MIT-0");
  assert(/^  license_text: CC-BY-4.0$/m.test(consumerManifest), "origin must preserve the canonical text license");
  assert(/^  license_code_examples: MIT$/m.test(consumerManifest), "origin must preserve the canonical code license");
  assert(!consumerManifest.includes("prepared-not-published"), "consumer manifest must not embed transient publication status");
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
  assert(/uses: actions\/upload-artifact@[a-f0-9]{40}\b/.test(workflow), "adopter revalidation must retain JSON evidence through a pinned action");
  assert(workflow.includes("timeout-minutes:"), "live adopter checks must have a bounded job timeout");
  for (const file of [".github/workflows/test.yml", ".github/workflows/adopter-revalidation.yml"]) {
    const content = readRepoFile(file);
    const uses = [...content.matchAll(/uses: (\S+)/g)].map((match) => match[1]);
    assert(uses.length > 0, `${file} must declare its actions`);
    assert(uses.every((ref) => /^[\w-]+\/[\w-]+@[a-f0-9]{40}$/.test(ref)), `${file} actions must use immutable SHAs`);
    assert(/^permissions:\n  contents: read\n/m.test(content), `${file} must default to read-only contents permission`);
    assert(content.includes("persist-credentials: false"), `${file} must not persist checkout credentials`);
  }
});

test("public docs disclose the current unit test count", () => {
  const count = countUnitTests();
  const expected = `${count} tests`;
  for (const file of ["README.md", "CONFORMANCE.md", "AGENTS.md", "CLAUDE.md", "index.html", "RELEASE_CHECKLIST.md", ".github/PULL_REQUEST_TEMPLATE.md"]) {
    assert(readRepoFile(file).includes(expected), `${file} must include ${expected}`);
  }
});

run();
