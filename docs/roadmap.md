# Roadmap

Proposed enhancements for future versions of Graceful Boundaries. These were identified during the v1.1 cycle but deferred to avoid scope expansion before adoption validates the core spec.

## v1.3: Action Boundaries

Graceful Boundaries 1.3 introduces optional extension discovery and a non-normative Action Boundaries draft. The core Level 1 through Level 4 conformance model remains unchanged.

Action Boundaries covers consequential agent actions that need more than rate-limit communication:

- Delegated authority
- Human approval thresholds
- Recourse paths
- Audit trails
- Fraud and abuse boundaries
- Human escalation

Commercial Boundaries is the first Action Boundaries profile. It focuses on whether buyer agents can safely understand, evaluate, transact, modify, cancel, and resolve commercial relationships. It is deliberately positioned underneath payment processors, checkout protocols, wallets, tokenization, fraud networks, and settlement systems.

The draft lives in [action-boundaries.md](action-boundaries.md). It should remain optional until real implementers validate the field names and threat model.

## v1.2: Expanded Limit Taxonomy

### Quota and cost-based limits

The current spec only expresses limits as requests-per-window. Services with cost-based limits (API calls consume "credits" or "tokens") or fixed-allocation quotas (10GB/month) cannot express this in the discovery endpoint.

**Proposed new limit types:**

| Type | Meaning |
|---|---|
| `quota` | Fixed allocation per billing period (distinct from windowed rate limits) |
| `cost-limit` | Resource-based limits where each request consumes variable units (e.g., tokens, credits) |
| `burst-rate` | Allowance for short spikes beyond the window constraint (e.g., "100/hour but max 5/second") |

**Proposed discovery fields:**

```json
{
  "type": "quota",
  "maxRequests": 1000000,
  "windowSeconds": 2592000,
  "description": "1M tokens per month",
  "costMetric": "tokens"
}
```

**Why deferred:** This is scope expansion that adds complexity before the core spec has adoption. The request-per-window model covers the majority of real-world rate limits. Quota and cost metadata should be validated against real implementations before standardizing.

### Unknown limit type fallback guidance

The spec says unknown types SHOULD be treated as "opaque constraints." This is too vague for agent developers. Future versions should specify that agents encountering unknown types SHOULD parse `maxRequests` and `windowSeconds` if present and treat violations as windowed rate limits.

## v1.2: Multi-Limit Interactions

### Cascade limit disclosure

Many services enforce limits at multiple levels (global, per-key, per-endpoint). The spec doesn't address how limits interact or which limit was exceeded when a 429 is returned.

**Proposed refusal field:**

```json
{
  "error": "rate_limit_exceeded",
  "limitType": "ip-rate",
  "detail": "..."
}
```

The `limitType` field tells agents which specific limit was exceeded, enabling smarter retry decisions (e.g., "wait for IP window" vs. "the whole service is saturated").

### Multiple limits in proactive headers

When an endpoint enforces multiple overlapping limits, which limit should `RateLimit: remaining=N` report? The spec should clarify that the most-restrictive remaining budget SHOULD be reported.

**Why deferred:** These are advanced scenarios that matter at scale but add complexity for initial adopters. The current spec works for the common case (one primary limit per endpoint).

## v1.2: Agent-Oriented Enhancements

### Agent-capable endpoint flag

The discovery endpoint doesn't signal which endpoints are designed for machine consumption vs. human-only. An `agentCapable: false` flag would let agents skip endpoints they shouldn't call.

```json
{
  "endpoint": "/admin/dashboard",
  "method": "GET",
  "agentCapable": false,
  "limits": [...]
}
```

**Why deferred:** Adds complexity before adoption justifies it. Services can signal this through authentication requirements and documentation today.

### Request context in 429 responses

When an agent processing a batch gets a 429, it doesn't know details about which specific constraint was exceeded or by how much. Optional fields like `limitExceededBy` and `windowResetAt` (unix timestamp) would help agents adjust batch strategy.

**Why deferred:** The current `retryAfterSeconds` field handles the common case. These fields are optimizations for high-volume batch agents.

### Agent compliance self-checker

A test harness (`evals/test-agent-behavior.js`) that validates an agent's response handling — does it parse refusal bodies correctly, respect `retryAfterSeconds`, handle edge cases (negative seconds, zero remaining)?

This is tooling rather than spec work, but would improve ecosystem quality.

## Documentation

### Security audit worked examples

The security audit (SECURITY-AUDIT.md) lists threats but doesn't show concrete attack/mitigation examples. Adding before/after comparisons would make SC-2 through SC-6 more actionable for implementers.

### Eval suite workflow documentation

Clarify the two-phase testing workflow in CONTRIBUTING.md: unit tests (offline, CI-friendly) → live checker (validates deployed service). Currently these are documented separately but the workflow connecting them isn't explicit.

## Non-Goals

These have been considered and intentionally excluded:

- **Level 5 for content integrity.** Content integrity (SC-9) is a cross-cutting concern, not a higher conformance level. A site can have perfect rate limit communication while cloaking content, or honest content while lacking proactive headers. It's a principle, not a level.
- **Mandating specific CDN behavior.** The spec addresses trust violations, not technology choices. Markdown conversion is useful; content cloaking is the problem.
- **Mandating specific detection thresholds.** The 60% containment threshold is implementation guidance, not a normative requirement. Different contexts may need different thresholds.
