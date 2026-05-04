#!/usr/bin/env node

/**
 * Graceful Boundaries security constraint tests.
 *
 * Validates that conforming responses follow the security
 * considerations (SC-1 through SC-15) from the spec.
 *
 * Usage: node evals/test-security.js
 */

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

// ─── SC-2: why must not reveal mechanisms ────────────────────────

function whyRevealsImplementation(why) {
  const lower = (why || "").toLowerCase();
  const mechanismPatterns = [
    /regex/,
    /rfc\s*1918/,
    /cidr/,
    /waf\s*rule/,
    /firewall/,
    /redis/,
    /postgres/,
    /jwt/,
    /hmac/,
    /sha\d/,
    /bcrypt/,
    /ip\s*range/,
    /supabase/,
    /vercel/,
    /cloudflare/,
    /nginx/,
    /header\s+x-/,
    /cookie\s+\w+=/,
    /session\s*id/,
    /api\s*key\s*format/,
    /token\s*format/,
    /sliding\s*window/,
    /leaky\s*bucket/,
    /token\s*bucket/,
  ];
  return mechanismPatterns.some((p) => p.test(lower));
}

test("SC-2: good why (category only)", () => {
  assert(!whyRevealsImplementation("Blocks requests to non-public addresses."));
  assert(!whyRevealsImplementation("Prevents the service from being used as a proxy."));
  assert(!whyRevealsImplementation("Rate limits keep the service available for everyone."));
  assert(!whyRevealsImplementation("This prevents the email system from being used to send spam."));
});

test("SC-2: bad why (reveals mechanism)", () => {
  assert(whyRevealsImplementation("Validates URLs against RFC 1918 ranges."));
  assert(whyRevealsImplementation("Uses a WAF rule on the X-Forwarded-For header."));
  assert(whyRevealsImplementation("Redis sliding window rate limiter with 60s TTL."));
  assert(whyRevealsImplementation("JWT tokens are validated with HMAC-SHA256."));
  assert(whyRevealsImplementation("Rate limited via Cloudflare firewall rules."));
  assert(whyRevealsImplementation("Stored in Supabase Postgres with row-level security."));
});

// ─── SC-3: expected must use positive descriptions ───────────────

function expectedUsesNegation(expected) {
  const lower = (expected || "").toLowerCase();
  return /\bnot\b/.test(lower) || /\bno\b/.test(lower) || /\bexclude/.test(lower) ||
    /\bblock/.test(lower) || /\breject/.test(lower) || /\bforbid/.test(lower) ||
    /\bdisallow/.test(lower) || /\bprohibit/.test(lower);
}

test("SC-3: good expected (positive)", () => {
  assert(!expectedUsesNegation("A public URL."));
  assert(!expectedUsesNegation("A valid email address."));
  assert(!expectedUsesNegation("A domain name or result ID."));
});

test("SC-3: bad expected (reveals filter by negation)", () => {
  assert(expectedUsesNegation("Not a private IP, not localhost."));
  assert(expectedUsesNegation("No special characters allowed."));
  assert(expectedUsesNegation("Rejected patterns: 127.x, 10.x, 192.168.x"));
});

// ─── SC-4: discovery must not list non-public endpoints ──────────

test("SC-4: limits endpoint excludes internal paths", () => {
  const limitsPayload = {
    limits: {
      scan: { endpoint: "/api/scan" },
      result: { endpoint: "/api/result" },
    },
  };
  const endpoints = Object.values(limitsPayload.limits).map((e) => e.endpoint);
  const internalPatterns = [/admin/, /internal/, /debug/, /health/, /_private/];

  endpoints.forEach((ep) => {
    internalPatterns.forEach((p) => {
      assert(!p.test(ep), `endpoint ${ep} matches internal pattern ${p}`);
    });
  });
});

test("SC-4: internal endpoints in discovery fail", () => {
  const badEndpoints = ["/api/admin/users", "/internal/metrics", "/debug/state"];
  const internalPatterns = [/admin/, /internal/, /debug/];

  badEndpoints.forEach((ep) => {
    const matchesInternal = internalPatterns.some((p) => p.test(ep));
    assert(matchesInternal, `${ep} should be flagged as internal`);
  });
});

// ─── SC-5: resource existence sensitivity ────────────────────────

test("SC-5: uniform 404 for sensitive resources", () => {
  const neverExisted = {
    error: "not_found",
    detail: "Resource not found.",
  };
  const expired = {
    error: "not_found",
    detail: "Resource not found.",
  };
  // For sensitive resources, both responses SHOULD be identical
  assert(neverExisted.error === expired.error, "error should match");
  assert(neverExisted.detail === expired.detail, "detail should match");
});

test("SC-5: distinct 404 acceptable for public resources", () => {
  const neverExisted = {
    error: "result_not_found",
    detail: "This domain has not been scanned yet.",
    scanAvailable: true,
  };
  const expired = {
    error: "result_not_found",
    detail: "This result has expired.",
  };
  // For public resources, distinction is acceptable
  assert(neverExisted.detail !== expired.detail, "public resources may distinguish");
});

// ─── SC-6: guidance URL origin restrictions ──────────────────────

function isRelativeOrSameOrigin(url, origin) {
  if (!url) return true; // null/undefined is fine (field absent)
  if (url.startsWith("/")) return true; // relative
  try {
    const parsed = new URL(url);
    return parsed.origin === origin;
  } catch {
    return true; // malformed = not cross-origin
  }
}

test("SC-6: relative paths are safe", () => {
  assert(isRelativeOrSameOrigin("/api/result?id=test", "https://example.com"));
  assert(isRelativeOrSameOrigin("/api/scan?url=foo", "https://example.com"));
});

test("SC-6: same-origin absolute URLs are safe", () => {
  assert(isRelativeOrSameOrigin("https://example.com/api/result", "https://example.com"));
});

test("SC-6: cross-origin URLs in machine-actionable fields fail", () => {
  assert(!isRelativeOrSameOrigin("https://evil.com/steal", "https://example.com"));
  assert(!isRelativeOrSameOrigin("https://attacker.io/redirect", "https://example.com"));
});

test("SC-6: cross-origin allowed in humanUrl/upgradeUrl", () => {
  // humanUrl and upgradeUrl MAY be cross-origin (browser navigation)
  const body = {
    humanUrl: "https://different-domain.com/signup",
    upgradeUrl: "https://billing.example.com/plans",
    alternativeEndpoint: "/api/result?id=test", // MUST be same-origin
  };
  // humanUrl cross-origin: acceptable
  assert(!isRelativeOrSameOrigin(body.humanUrl, "https://example.com"), "humanUrl may be cross-origin");
  // alternativeEndpoint: must be relative or same-origin
  assert(isRelativeOrSameOrigin(body.alternativeEndpoint, "https://example.com"), "alternativeEndpoint must be safe");
});

// ─── SC-8: scanUrl is not a trust bypass ─────────────────────────

test("SC-8: scanUrl should be treated as untrusted input by agents", () => {
  const body = {
    error: "result_not_found",
    scanUrl: "/api/scan?url=https://internal-server.local",
  };
  // The scan endpoint itself must validate the URL
  // An agent following scanUrl should still expect the scan endpoint
  // to reject internal URLs via its own SSRF protection
  assert(typeof body.scanUrl === "string", "scanUrl is present");
  // The point: scanUrl does NOT bypass scan endpoint validation
  // This test documents the expectation, not a mechanism
});

// ─── SC-11: action boundaries must not disclose controls ─────────

function actionBoundaryRevealsControlMechanism(text) {
  const lower = (text || "").toLowerCase();
  return [
    /fraud\s*score/,
    /risk\s*score/,
    /device\s*fingerprint/,
    /model\s*threshold/,
    /classifier/,
    /rule\s*id/,
    /ip\s*reputation/,
    /velocity\s*rule/,
    /approval\s*secret/,
  ].some((p) => p.test(lower));
}

test("SC-11: action boundaries disclose categories, not control mechanisms", () => {
  assert(!actionBoundaryRevealsControlMechanism("Purchases above the configured approval threshold require buyer confirmation."));
  assert(!actionBoundaryRevealsControlMechanism("High-risk orders may require human review."));
});

test("SC-11: action boundary control mechanism disclosure fails", () => {
  assert(actionBoundaryRevealsControlMechanism("Orders fail when the fraud score exceeds the model threshold."));
  assert(actionBoundaryRevealsControlMechanism("Blocked by device fingerprint and IP reputation rule id 712."));
});

// ─── SC-12: declared intent is not authority ─────────────────────

function boundaryClaimsAuthorityVerification(body) {
  const text = JSON.stringify(body || {}).toLowerCase();
  return /\bverified\s*buyer\b/.test(text) ||
    /\bauthenticated\s*organization\b/.test(text) ||
    /\bauthority\s*verified\b/.test(text) ||
    /\bidentity\s*confirmed\b/.test(text);
}

test("SC-12: authorityRequired declarations are not verification claims", () => {
  const boundary = {
    action: "purchase",
    status: "requires_approval",
    authorityRequired: "buyer",
  };
  assert(!boundaryClaimsAuthorityVerification(boundary), "declaration should not claim verification");
});

test("SC-12: authority verification claims fail in boundary docs", () => {
  const boundary = {
    action: "purchase",
    status: "allowed",
    detail: "Caller is a verified buyer and identity confirmed.",
  };
  assert(boundaryClaimsAuthorityVerification(boundary), "verification claims should be flagged");
});

// ─── SC-13: recourse links must stay same-origin ─────────────────

test("SC-13: recourse machine-actionable links are relative or same-origin", () => {
  assert(isRelativeOrSameOrigin("/support/refunds", "https://example.com"));
  assert(isRelativeOrSameOrigin("https://example.com/account/disputes", "https://example.com"));
});

test("SC-13: cross-origin recourse machine-actionable links fail", () => {
  assert(!isRelativeOrSameOrigin("https://attacker.example/refunds", "https://example.com"));
});

// ─── SC-14: audit docs must not leak event details ───────────────

function auditBoundaryLeaksPrivateEventData(body) {
  const text = JSON.stringify(body || {}).toLowerCase();
  return /\bbuyeremail\b/.test(text) ||
    /\bcustomeremail\b/.test(text) ||
    /\borderid\b/.test(text) ||
    /\bpaymentid\b/.test(text) ||
    /\bauthenticationtoken\b/.test(text) ||
    /\bsessionid\b/.test(text);
}

test("SC-14: audit boundaries describe capability only", () => {
  const boundary = {
    audit: {
      eventLogAvailable: true,
      auditUrl: "/account/activity",
    },
  };
  assert(!auditBoundaryLeaksPrivateEventData(boundary), "audit capability should not leak event data");
});

test("SC-14: audit event identifiers and personal data fail", () => {
  const boundary = {
    audit: {
      eventLogAvailable: true,
      orderId: "ord_123",
      buyerEmail: "buyer@example.com",
    },
  };
  assert(auditBoundaryLeaksPrivateEventData(boundary), "private event data should be flagged");
});

// ─── SC-15: declarations are not verification ────────────────────

function boundaryClaimsVerifiedTrust(text) {
  const lower = (text || "").toLowerCase();
  return /\bcertified\b/.test(lower) ||
    /\bverified\s*trust\b/.test(lower) ||
    /\brecommended\s*merchant\b/.test(lower) ||
    /\btrusted\s*seller\b/.test(lower) ||
    /\bapproved\s*vendor\b/.test(lower);
}

test("SC-15: boundary docs may declare policy without trust claims", () => {
  assert(!boundaryClaimsVerifiedTrust("This document declares supported actions and approval requirements."));
});

test("SC-15: verified trust claims fail", () => {
  assert(boundaryClaimsVerifiedTrust("This is a certified trusted seller."));
  assert(boundaryClaimsVerifiedTrust("Recommended merchant and approved vendor."));
});

// ─── Summary ─────────────────────────────────────────────────────

console.log("");
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
