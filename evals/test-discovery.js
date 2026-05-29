#!/usr/bin/env node

/**
 * Graceful Boundaries discovery endpoint structure tests.
 *
 * Unit tests for limits discovery response body validation:
 * field presence, limit entry structure, and edge cases.
 *
 * Usage: node evals/test-discovery.js
 */

const {
  checkLimitsBody,
  REQUIRED_LIMIT_ENTRY_FIELDS,
  isExtensionUrlSafe,
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

// ─── Valid discovery bodies ──────────────────────────────────────

test("Fully conforming discovery body", () => {
  const result = checkLimitsBody({
    service: "Siteline",
    description: "AI agent readiness scanner.",
    conformance: "level-4",
    limits: {
      scan: {
        endpoint: "/api/scan",
        method: "GET",
        limits: [
          { type: "ip-rate", maxRequests: 10, windowSeconds: 3600, description: "10 scans per IP per hour." },
          { type: "resource-dedup", maxRequests: 1, windowSeconds: 86400, description: "One scan per domain per day." },
        ],
      },
    },
  });
  assert(result.isValid, "should be valid");
  assert(result.hasService, "should have service");
  assert(result.hasDescription, "should have description");
  assert(result.limitCount === 1, `expected 1 endpoint, got ${result.limitCount}`);
  assert(result.entryErrors.length === 0, "should have no entry errors");
});

test("Empty limits object is valid", () => {
  const result = checkLimitsBody({
    service: "My Blog",
    description: "No API.",
    conformance: "not-applicable",
    limits: {},
  });
  assert(result.isValid, "empty limits should be valid");
  assert(result.limitCount === 0, "should have 0 endpoints");
});

test("Multiple endpoints all valid", () => {
  const result = checkLimitsBody({
    service: "Multi API",
    description: "Multiple endpoints.",
    limits: {
      scan: {
        endpoint: "/api/scan",
        method: "GET",
        limits: [
          { type: "ip-rate", maxRequests: 10, windowSeconds: 3600, description: "10 per hour" },
        ],
      },
      result: {
        endpoint: "/api/result",
        method: "GET",
        limits: [
          { type: "ip-rate", maxRequests: 60, windowSeconds: 60, description: "60 per minute" },
        ],
      },
    },
  });
  assert(result.isValid, "should be valid");
  assert(result.limitCount === 2, `expected 2 endpoints, got ${result.limitCount}`);
});

// ─── Missing top-level fields ────────────────────────────────────

test("Missing 'service' field fails", () => {
  const result = checkLimitsBody({
    limits: {},
  });
  assert(!result.isValid, "should fail without service");
  assert(!result.hasService, "should flag missing service");
  assert(result.errors.some((e) => e.includes("service")), "should report missing service");
});

test("Missing 'description' field fails", () => {
  const result = checkLimitsBody({
    service: "Test",
    limits: {},
  });
  assert(!result.isValid, "should fail without description");
  assert(!result.hasDescription, "should flag missing description");
  assert(result.errors.some((e) => e.includes("description")), "should report missing description");
});

test("Missing 'limits' object fails", () => {
  const result = checkLimitsBody({
    service: "Test",
  });
  assert(!result.isValid, "should fail without limits");
  assert(result.errors.some((e) => e.includes("limits")), "should report missing limits");
});

test("'limits' as array fails", () => {
  const result = checkLimitsBody({
    service: "Test",
    limits: [],
  });
  assert(!result.isValid, "array limits should fail");
});

test("Null body fails", () => {
  const result = checkLimitsBody(null);
  assert(!result.isValid, "null should fail");
});

// ─── Malformed limit entries ─────────────────────────────────────

test("Entry missing 'endpoint' fails", () => {
  const result = checkLimitsBody({
    service: "Test",
    limits: {
      scan: {
        method: "GET",
        limits: [
          { type: "ip-rate", maxRequests: 10, windowSeconds: 3600, description: "10 per hour" },
        ],
      },
    },
  });
  assert(!result.isValid, "should fail without endpoint");
  assert(result.entryErrors.some((e) => e.includes("endpoint")), "should report missing endpoint");
});

test("Entry missing 'limits' array fails", () => {
  const result = checkLimitsBody({
    service: "Test",
    limits: {
      scan: {
        endpoint: "/api/scan",
        method: "GET",
      },
    },
  });
  assert(!result.isValid, "should fail without limits array");
  assert(result.entryErrors.some((e) => e.includes("limits")), "should report missing limits array");
});

test("Entry missing 'method' fails", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test API.",
    limits: {
      scan: {
        endpoint: "/api/scan",
        limits: [
          { type: "ip-rate", maxRequests: 10, windowSeconds: 3600, description: "10 per hour" },
        ],
      },
    },
  });
  assert(!result.isValid, "should fail without method");
  assert(result.entryErrors.some((e) => e.includes("method")), "should report missing method");
});

test("Limit entry missing 'type' fails", () => {
  const result = checkLimitsBody({
    service: "Test",
    limits: {
      scan: {
        endpoint: "/api/scan",
        limits: [
          { maxRequests: 10, windowSeconds: 3600, description: "10 per hour" },
        ],
      },
    },
  });
  assert(!result.isValid, "should fail without type");
  assert(result.entryErrors.some((e) => e.includes("type")), "should report missing type");
});

test("Limit entry missing 'maxRequests' fails", () => {
  const result = checkLimitsBody({
    service: "Test",
    limits: {
      scan: {
        endpoint: "/api/scan",
        limits: [
          { type: "ip-rate", windowSeconds: 3600, description: "10 per hour" },
        ],
      },
    },
  });
  assert(!result.isValid, "should fail without maxRequests");
  assert(result.entryErrors.some((e) => e.includes("maxRequests")), "should report missing maxRequests");
});

test("Limit entry missing 'windowSeconds' fails", () => {
  const result = checkLimitsBody({
    service: "Test",
    limits: {
      scan: {
        endpoint: "/api/scan",
        limits: [
          { type: "ip-rate", maxRequests: 10, description: "10 per hour" },
        ],
      },
    },
  });
  assert(!result.isValid, "should fail without windowSeconds");
});

test("Limit entry missing 'description' fails", () => {
  const result = checkLimitsBody({
    service: "Test",
    limits: {
      scan: {
        endpoint: "/api/scan",
        limits: [
          { type: "ip-rate", maxRequests: 10, windowSeconds: 3600 },
        ],
      },
    },
  });
  assert(!result.isValid, "should fail without description");
});

test("Limit entry with string maxRequests fails", () => {
  const result = checkLimitsBody({
    service: "Test",
    limits: {
      scan: {
        endpoint: "/api/scan",
        limits: [
          { type: "ip-rate", maxRequests: "10", windowSeconds: 3600, description: "10 per hour" },
        ],
      },
    },
  });
  assert(!result.isValid, "string maxRequests should fail");
});

test("Multiple errors reported across entries", () => {
  const result = checkLimitsBody({
    service: "Test",
    limits: {
      scan: {
        endpoint: "/api/scan",
        limits: [
          { type: "ip-rate", maxRequests: 10, windowSeconds: 3600, description: "ok" },
          { type: "cooldown" }, // missing 3 fields
        ],
      },
      result: {
        limits: [], // missing endpoint
      },
    },
  });
  assert(!result.isValid, "should fail with multiple errors");
  assert(result.entryErrors.length >= 2, `expected >=2 errors, got ${result.entryErrors.length}`);
});

// ─── Changelog and feed discovery (v1.1) ─────────────────────────

test("v1.1: changelog URL passes", () => {
  const result = checkLimitsBody({
    service: "Siteline",
    description: "Scanner.",
    changelog: "https://siteline.to/api/v1/changelog.json",
    limits: {},
  }, "https://siteline.to");
  assert(result.isValid, "should be valid");
  assert(result.hasChangelog, "should detect changelog");
  assert(result.warnings.every((w) => !w.includes("changelog")), "no changelog warnings");
});

test("v1.1: feed URL passes", () => {
  const result = checkLimitsBody({
    service: "Siteline",
    description: "Scanner.",
    feed: "https://siteline.to/feed.json",
    limits: {},
  }, "https://siteline.to");
  assert(result.isValid, "should be valid");
  assert(result.hasFeed, "should detect feed");
  assert(result.warnings.every((w) => !w.includes("feed")), "no feed warnings");
});

test("v1.1: empty changelog warns", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {},
    changelog: "",
  });
  assert(result.isValid, "still valid — changelog is optional");
  assert(result.warnings.some((w) => w.includes("changelog")), "should warn about empty changelog");
});

test("v1.1: non-string changelog warns", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {},
    changelog: 123,
  });
  assert(result.isValid, "still valid");
  assert(result.warnings.some((w) => w.includes("changelog")), "should warn about non-string changelog");
});

test("v1.4: changelog and feed URLs use strict same-origin URL validation", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {},
    changelog: "//attacker.example/changelog.json",
    feed: "/%2f%2fattacker.example/feed.xml",
  }, "https://example.com");
  assert(result.isValid, "unsafe optional URLs warn instead of breaking discovery");
  assert(result.warnings.some((w) => w.includes("changelog")), "should warn about unsafe changelog");
  assert(result.warnings.some((w) => w.includes("feed")), "should warn about unsafe feed");
});

test("v1.1: body without changelog/feed has no false positives", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {},
  });
  assert(!result.hasChangelog, "should not detect changelog");
  assert(!result.hasFeed, "should not detect feed");
});

// ─── Extension discovery (v1.3) ─────────────────────────────────

test("v1.3: extension discovery links pass with relative URLs", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {},
    extensions: {
      actionBoundaries: "/.well-known/action-boundaries",
      commercialBoundaries: "/.well-known/commercial-boundaries",
    },
  });
  assert(result.isValid, "should be valid");
  assert(result.hasExtensions, "should detect extensions");
  assert(result.extensions.keys.length === 2, "should preserve extension keys");
});

test("v1.3: extension discovery links pass with same-origin absolute URLs", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {},
    extensions: {
      actionBoundaries: "https://example.com/.well-known/action-boundaries",
    },
  }, "https://example.com");
  assert(result.isValid, "same-origin extension URL should be valid");
});

test("v1.3: cross-origin extension discovery links fail", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {},
    extensions: {
      actionBoundaries: "https://attacker.example/.well-known/action-boundaries",
    },
  }, "https://example.com");
  assert(!result.isValid, "cross-origin extension URL should fail");
  assert(result.errors.some((e) => e.includes("extensions.actionBoundaries")), "should report extension key");
});

test("v1.3: unknown extension keys are allowed", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {},
    extensions: {
      futureProfile: "/.well-known/future-profile",
    },
  });
  assert(result.isValid, "unknown extension keys should be valid");
  assert(result.extensions.keys.includes("futureProfile"), "should include unknown extension key");
});

test("v1.3: missing extensions do not affect core discovery validity", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {},
  });
  assert(result.isValid, "core discovery remains valid without extensions");
  assert(!result.hasExtensions, "should not detect absent extensions");
});

test("v1.3: extensions must be an object when present", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {},
    extensions: [],
  });
  assert(!result.isValid, "array extensions should fail");
  assert(result.errors.some((e) => e.includes("extensions")), "should report extensions error");
});

test("v1.4: protocol-relative extension URLs fail", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {},
    extensions: {
      actionBoundaries: "//attacker.example/.well-known/action-boundaries",
    },
  }, "https://example.com");
  assert(!result.isValid, "protocol-relative URL should fail");
  assert(result.errors.some((e) => e.includes("extensions.actionBoundaries")), "should identify extension key");
});

test("v1.4: encoded protocol-relative extension URLs fail", () => {
  assert(!isExtensionUrlSafe("/%2f%2fattacker.example/path", "https://example.com"), "encoded // should fail");
  assert(!isExtensionUrlSafe("/%5c%5cattacker.example/path", "https://example.com"), "encoded backslash should fail");
});

test("v1.4: encoded backslash URL variants fail", () => {
  const badUrls = [
    "/%5c%5cattacker.example/x",
    "/%2f%5cattacker.example/x",
    "/safe%5cpath",
  ];
  for (const url of badUrls) {
    assert(!isExtensionUrlSafe(url, "https://example.com"), `${url} should fail`);
  }
});

test("v1.4: extension URLs with backslashes, whitespace, controls, and malformed absolutes fail", () => {
  const badUrls = [
    "/safe\\evil",
    " /safe",
    "/safe ",
    "/safe\npath",
    "https://[bad-url",
    "http://example.com/.well-known/action-boundaries",
  ];
  for (const url of badUrls) {
    assert(!isExtensionUrlSafe(url, "https://example.com"), `${JSON.stringify(url)} should fail`);
  }
});

test("v1.4: valid same-origin https URL passes", () => {
  assert(isExtensionUrlSafe("https://example.com/.well-known/action-boundaries", "https://example.com"));
});

test("v1.4: same-origin URL canonicalization edge cases pass", () => {
  assert(isExtensionUrlSafe("HTTPS://Example.com:443/path", "https://example.com"), "scheme, host case, and default port should pass");

  const unicodeOrigin = new URL("https://bücher.example").origin;
  assert(isExtensionUrlSafe("https://bücher.example/limits", unicodeOrigin), "same-origin Unicode hostname should pass");
  assert(!isExtensionUrlSafe("https://bücher.example.evil/limits", unicodeOrigin), "lookalike Unicode hostname should fail");
});

// ─── returnsCached flag (v1.1) ───────────────────────────────────

test("v1.1: resource-dedup with returnsCached: true passes", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {
      scan: {
        endpoint: "/api/scan",
        method: "GET",
        limits: [
          { type: "resource-dedup", maxRequests: 1, windowSeconds: 86400, description: "One per day.", returnsCached: true },
        ],
      },
    },
  });
  assert(result.isValid, "should be valid");
  assert(result.warnings.every((w) => !w.includes("returnsCached")), "no returnsCached warnings");
});

test("v1.1: returnsCached with non-boolean warns", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {
      scan: {
        endpoint: "/api/scan",
        method: "GET",
        limits: [
          { type: "resource-dedup", maxRequests: 1, windowSeconds: 86400, description: "One per day.", returnsCached: "yes" },
        ],
      },
    },
  });
  assert(result.isValid, "still valid — returnsCached is optional");
  assert(result.warnings.some((w) => w.includes("returnsCached") && w.includes("boolean")), "should warn about type");
});

test("v1.1: returnsCached on non-dedup limit warns", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {
      scan: {
        endpoint: "/api/scan",
        method: "GET",
        limits: [
          { type: "ip-rate", maxRequests: 10, windowSeconds: 3600, description: "10 per hour.", returnsCached: true },
        ],
      },
    },
  });
  assert(result.isValid, "still valid");
  assert(result.warnings.some((w) => w.includes("returnsCached") && w.includes("resource-dedup")), "should warn about misplaced flag");
});

// ─── Optional limit metadata (v1.4) ──────────────────────────────

test("v1.4: optional quota and cost limit metadata passes", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {
      generate: {
        endpoint: "/api/generate",
        method: "POST",
        limits: [
          {
            type: "cost-limit",
            limitId: "generation-token-budget",
            limitType: "cost-limit",
            scope: "user",
            maxRequests: 100000,
            windowSeconds: 2592000,
            costMetric: "tokens",
            maxInputBytes: 100000,
            maxInputTokens: 32000,
            maxOutputTokens: 8000,
            maxDurationSeconds: 60,
            maxQueueDepth: 10,
            windowResetAt: "2026-06-01T00:00:00Z",
            description: "100k tokens per user per month.",
          },
          {
            type: "quota",
            maxRequests: 10,
            windowSeconds: 2592000,
            description: "10 generated reports per month.",
          },
          {
            type: "burst-rate",
            maxRequests: 5,
            windowSeconds: 1,
            description: "Short burst cap.",
          },
        ],
      },
    },
  });
  assert(result.isValid, result.errors.join(", "));
  assert(result.warnings.length === 0, `unexpected warnings: ${result.warnings.join(", ")}`);
});

test("v1.4: windowResetAt accepts ISO string and Unix timestamp", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {
      generate: {
        endpoint: "/api/generate",
        method: "POST",
        limits: [
          {
            type: "quota",
            maxRequests: 10,
            windowSeconds: 3600,
            windowResetAt: "2026-05-29T20:00:00Z",
            description: "Hourly quota.",
          },
          {
            type: "burst-rate",
            maxRequests: 2,
            windowSeconds: 1,
            windowResetAt: 0,
            description: "Burst guard.",
          },
        ],
      },
    },
  });
  assert(result.isValid, result.errors.join(", "));
  assert(!result.warnings.some((w) => w.includes("windowResetAt")), "valid reset timestamps should not warn");
});

test("v1.4: malformed optional limit metadata warns", () => {
  const result = checkLimitsBody({
    service: "Test",
    description: "Test service.",
    limits: {
      generate: {
        endpoint: "/api/generate",
        method: "POST",
        limits: [
          {
            type: "cost-limit",
            limitId: 123,
            maxRequests: 100,
            windowSeconds: 3600,
            costMetric: "",
            maxInputBytes: -1,
            maxQueueDepth: "10",
            windowResetAt: false,
            description: "Malformed metadata.",
          },
        ],
      },
    },
  });
  assert(result.isValid, "optional metadata warnings should not break discovery");
  assert(result.warnings.some((w) => w.includes("limitId")), "should warn on limitId");
  assert(result.warnings.some((w) => w.includes("costMetric")), "should warn on costMetric");
  assert(result.warnings.some((w) => w.includes("maxInputBytes")), "should warn on maxInputBytes");
  assert(result.warnings.some((w) => w.includes("maxQueueDepth")), "should warn on maxQueueDepth");
  assert(result.warnings.some((w) => w.includes("windowResetAt")), "should warn on windowResetAt");
});

// ─── Summary ─────────────────────────────────────────────────────

console.log("");
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
