#!/usr/bin/env node

/**
 * Graceful Boundaries Action Boundaries extension tests.
 *
 * Validates the optional Action Boundaries and Commercial Boundaries
 * document shapes without changing Level 1-4 conformance.
 *
 * Usage: node evals/test-action-boundaries.js
 */

const {
  checkActionBoundariesBody,
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

function validActionBoundary(overrides = {}) {
  return {
    service: "Example Service",
    profile: "action-boundaries",
    version: "1.0.0",
    updatedAt: "2026-05-04T00:00:00Z",
    actions: {
      create_project: {
        status: "requires_approval",
        authorityRequired: "organization",
        policyUrl: "/boundaries/actions#create-project",
      },
      read_status: {
        status: "allowed",
        authorityRequired: "none",
      },
    },
    ...overrides,
  };
}

function validCommercialBoundary(overrides = {}) {
  return {
    service: "Example Store",
    profile: "commercial-boundaries",
    version: "1.0.0",
    updatedAt: "2026-05-04T00:00:00Z",
    commercialTasks: {
      browse_catalog: {
        status: "allowed",
        authorityRequired: "none",
        catalogUrl: "/catalog",
      },
      purchase: {
        status: "requires_approval",
        authorityRequired: "buyer",
        approvalThresholds: [
          { maxAmount: 100, currency: "USD", approval: "buyer_confirmed" },
        ],
        policyUrl: "/boundaries/commercial#purchase",
      },
    },
    payment: {
      acceptedShapes: ["card", "invoice"],
    },
    legibility: {
      priceAvailable: true,
      availabilityAvailable: true,
    },
    recourse: {
      refundAvailable: true,
      refundUrl: "/support/refunds",
    },
    audit: {
      eventLogAvailable: true,
      auditUrl: "/account/activity",
    },
    fraudBoundary: {
      fraudScreeningPerformed: true,
      fraudDetailsDisclosed: false,
    },
    ...overrides,
  };
}

test("Action Boundaries: valid base profile passes", () => {
  const result = checkActionBoundariesBody(validActionBoundary(), "https://example.com");
  assert(result.isValid, result.errors.join(", "));
  assert(result.profile === "action-boundaries", "profile should be action-boundaries");
  assert(result.actionCount === 2, "should count actions");
});

test("Action Boundaries: invalid profile fails", () => {
  const result = checkActionBoundariesBody(
    validActionBoundary({ profile: "payments-boundaries" }),
    "https://example.com"
  );
  assert(!result.isValid, "invalid profile should fail");
  assert(result.errors.some((e) => e.includes("Invalid profile")), "should explain profile error");
});

test("Action Boundaries: invalid action status fails", () => {
  const body = validActionBoundary();
  body.actions.create_project.status = "maybe";
  const result = checkActionBoundariesBody(body, "https://example.com");
  assert(!result.isValid, "invalid status should fail");
  assert(result.errors.some((e) => e.includes("invalid status")), "should explain status error");
});

test("Action Boundaries: invalid authority fails", () => {
  const body = validActionBoundary();
  body.actions.create_project.authorityRequired = "payment_processor";
  const result = checkActionBoundariesBody(body, "https://example.com");
  assert(!result.isValid, "invalid authority should fail");
  assert(result.errors.some((e) => e.includes("invalid authorityRequired")), "should explain authority error");
});

test("Action Boundaries: malformed updatedAt fails", () => {
  const result = checkActionBoundariesBody(
    validActionBoundary({ updatedAt: "next quarter" }),
    "https://example.com"
  );
  assert(!result.isValid, "invalid timestamp should fail");
  assert(result.errors.some((e) => e.includes("updatedAt")), "should explain timestamp error");
});

test("Action Boundaries: unsafe machine-actionable URL fails", () => {
  const body = validActionBoundary();
  body.actions.create_project.policyUrl = "https://attacker.example/policy";
  const result = checkActionBoundariesBody(body, "https://example.com");
  assert(!result.isValid, "cross-origin policyUrl should fail");
  assert(result.errors.some((e) => e.includes("URL must be relative or same-origin")), "should explain URL error");
});

test("Action Boundaries: humanUrl may be cross-origin", () => {
  const body = validActionBoundary({ humanUrl: "https://support.example.com/help" });
  const result = checkActionBoundariesBody(body, "https://example.com");
  assert(result.isValid, result.errors.join(", "));
});

test("Action Boundaries: unknown extra fields are allowed", () => {
  const body = validActionBoundary({ deploymentNotes: "Internal policy v7" });
  body.actions.create_project.extraContext = "Requires delegated account owner.";
  const result = checkActionBoundariesBody(body, "https://example.com");
  assert(result.isValid, result.errors.join(", "));
});

test("Action Boundaries: missing actions object fails", () => {
  const body = validActionBoundary({ actions: undefined });
  const result = checkActionBoundariesBody(body, "https://example.com");
  assert(!result.isValid, "missing actions should fail");
  assert(result.errors.some((e) => e.includes("actions")), "should explain actions error");
});

test("Commercial Boundaries: valid purchase profile passes", () => {
  const result = checkActionBoundariesBody(validCommercialBoundary(), "https://example.com");
  assert(result.isValid, result.errors.join(", "));
  assert(result.profile === "commercial-boundaries", "profile should be commercial-boundaries");
  assert(result.actionCount === 2, "should count commercial tasks");
});

test("Commercial Boundaries: invalid approval threshold fails", () => {
  const body = validCommercialBoundary();
  body.commercialTasks.purchase.approvalThresholds[0].maxAmount = "100";
  const result = checkActionBoundariesBody(body, "https://example.com");
  assert(!result.isValid, "invalid threshold should fail");
  assert(result.errors.some((e) => e.includes("maxAmount")), "should explain threshold error");
});

test("Commercial Boundaries: unsafe recourse URL fails", () => {
  const body = validCommercialBoundary();
  body.recourse.refundUrl = "https://attacker.example/refunds";
  const result = checkActionBoundariesBody(body, "https://example.com");
  assert(!result.isValid, "cross-origin refundUrl should fail");
  assert(result.errors.some((e) => e.includes("recourse.refundUrl")), "should identify recourse URL");
});

test("Commercial Boundaries: invalid audit field fails", () => {
  const body = validCommercialBoundary();
  body.audit.eventLogAvailable = { enabled: true };
  const result = checkActionBoundariesBody(body, "https://example.com");
  assert(!result.isValid, "invalid audit field should fail");
  assert(result.errors.some((e) => e.includes("audit.eventLogAvailable")), "should identify audit field");
});

test("Commercial Boundaries: invalid fraud boundary field fails", () => {
  const body = validCommercialBoundary();
  body.fraudBoundary.fraudDetailsDisclosed = { score: "hidden" };
  const result = checkActionBoundariesBody(body, "https://example.com");
  assert(!result.isValid, "invalid fraud boundary field should fail");
  assert(result.errors.some((e) => e.includes("fraudBoundary.fraudDetailsDisclosed")), "should identify fraud field");
});

test("Commercial Boundaries: missing commercialTasks object fails", () => {
  const body = validCommercialBoundary({ commercialTasks: undefined });
  const result = checkActionBoundariesBody(body, "https://example.com");
  assert(!result.isValid, "missing commercialTasks should fail");
  assert(result.errors.some((e) => e.includes("commercialTasks")), "should explain commercialTasks error");
});

// ─── Summary ─────────────────────────────────────────────────────

console.log("");
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
