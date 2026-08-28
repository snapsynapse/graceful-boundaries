#!/usr/bin/env node

/**
 * Graceful Boundaries next-step derivation tests.
 *
 * Unit tests for deriveNextStep: the smallest change that raises a
 * service's confirmed conformance level. Pure function over a finished
 * report, so these run offline with no network.
 *
 * Usage: node evals/test-next-step.js
 */

const {
  deriveNextStep,
  CONSTRUCTIVE_FIELDS,
  REQUIRED_LIMIT_ENTRY_FIELDS,
} = require("./check.js");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`PASS  ${name}`);
    passed++;
  } catch (error) {
    console.log(`FAIL  ${name}: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

// ─── No next step ────────────────────────────────────────────────

test("Level 4 has no next step", () => {
  const result = deriveNextStep({
    conformanceLevel: 4,
    limitsDiscovery: [{ path: "/api/limits", found: true, wellFormed: true }],
  });
  assert(result === null, "Level 4 is the highest level and should return null");
});

test("Consistent not-applicable has no next step", () => {
  const result = deriveNextStep({
    conformanceLevel: "not-applicable",
    limitsDiscovery: [
      { path: "/api/limits", found: true, wellFormed: true, conformance: "not-applicable", limitCount: 0 },
    ],
  });
  assert(result === null, "a consistent N/A declaration should return null");
});

// ─── Level 0: no discovery endpoint ──────────────────────────────

test("No limits endpoint points at Level 2", () => {
  const result = deriveNextStep({
    conformanceLevel: 0,
    limitsDiscovery: [
      { path: "/api/limits", found: false, status: 404 },
      { path: "/.well-known/limits", found: false, status: 404 },
    ],
  });
  assert(result !== null, "should produce a next step");
  assert(result.nextLevel === 2, `expected nextLevel 2, got ${result.nextLevel}`);
  assert(result.currentLevel === 0, "should echo the current level");
  assert(result.action.includes("/api/limits"), "should name a discovery path");
  assert(result.summary.startsWith("You are Level 0."), "summary should lead with the current level");
  assert(result.verifiable === true, "Level 2 is passively verifiable");
});

test("Next step carries a guide URL, example, and snippet", () => {
  const result = deriveNextStep({
    conformanceLevel: 0,
    limitsDiscovery: [{ path: "/api/limits", found: false, status: 404 }],
  });
  assert(
    result.guideUrl.startsWith("https://gracefulboundaries.dev/docs/implementation-guide.md#"),
    "guide URL should be an anchored canonical implementation-guide link"
  );
  assert(result.example.length > 0, "should name an example file");
  assert(result.snippet.includes("/api/limits"), "snippet should be pasteable and relevant");
});

// ─── Level 0: malformed discovery endpoint ───────────────────────

test("Malformed limits endpoint reports the specific errors", () => {
  const result = deriveNextStep({
    conformanceLevel: 0,
    limitsDiscovery: [
      {
        path: "/api/limits",
        found: true,
        wellFormed: false,
        errors: ["Limit entry 'scan' missing windowSeconds", "Missing service field"],
      },
    ],
  });
  assert(result.nextLevel === 2, "a malformed endpoint still blocks Level 2");
  assert(result.action.includes("windowSeconds"), "should surface the specific error");
  assert(result.action.includes("Missing service field"), "should surface every error");
  assert(result.action.includes("/api/limits"), "should name the offending path");
});

test("Malformed limits endpoint without errors falls back to required fields", () => {
  const result = deriveNextStep({
    conformanceLevel: 0,
    limitsDiscovery: [{ path: "/api/limits", found: true, wellFormed: false, errors: [] }],
  });
  assert(result.nextLevel === 2, "should still target Level 2");
  for (const field of REQUIRED_LIMIT_ENTRY_FIELDS) {
    assert(result.action.includes(field), `fallback guidance should name ${field}`);
  }
});

// ─── Level 2: constructive guidance ──────────────────────────────

test("Level 2 points at constructive guidance for Level 3", () => {
  const result = deriveNextStep({
    conformanceLevel: 2,
    limitsDiscovery: [{ path: "/api/limits", found: true, wellFormed: true }],
  });
  assert(result.nextLevel === 3, `expected nextLevel 3, got ${result.nextLevel}`);
  for (const field of CONSTRUCTIVE_FIELDS) {
    assert(result.action.includes(field), `should name the ${field} constructive field`);
  }
  assert(result.verifiable === false, "Level 3 requires a live refusal and is not passively verifiable");
});

test("Level 2 next step is honest about passive verification", () => {
  const result = deriveNextStep({
    conformanceLevel: 2,
    limitsDiscovery: [{ path: "/.well-known/limits", found: true, wellFormed: true }],
  });
  assert(result.verifiable === false, "the checker cannot confirm Level 3 without observing a refusal");
});

// ─── Shape ───────────────────────────────────────────────────────

test("Next step shape is stable", () => {
  const result = deriveNextStep({
    conformanceLevel: 0,
    limitsDiscovery: [{ path: "/api/limits", found: false }],
  });
  for (const key of ["currentLevel", "nextLevel", "summary", "action", "guideUrl", "example", "snippet", "verifiable"]) {
    assert(key in result, `next step should carry ${key}`);
  }
  assert(typeof result.snippet === "string", "snippet should be a string");
  assert(typeof result.verifiable === "boolean", "verifiable should be a boolean");
});

test("Missing limitsDiscovery is tolerated", () => {
  const result = deriveNextStep({ conformanceLevel: 0 });
  assert(result !== null, "should not throw on a report with no discovery results");
  assert(result.nextLevel === 2, "an absent discovery lane reads as no endpoint found");
});

// ─── Summary ─────────────────────────────────────────────────────

console.log("");
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
