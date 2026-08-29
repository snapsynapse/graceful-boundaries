# Roadmap

Proposed enhancements for future versions of Graceful Boundaries. These were identified during the v1.1 cycle but deferred to avoid scope expansion before adoption validates the core spec.

The current evidence plan is documented in [adoption-validation.md](adoption-validation.md). New normative fields remain gated on repeated implementation evidence.

## Current: Action Boundaries

Graceful Boundaries 1.3 introduced optional extension discovery and a non-normative Action Boundaries draft. The core Level 1 through Level 4 conformance model remains unchanged.

Action Boundaries covers consequential agent actions that need more than rate-limit communication:

- Delegated authority
- Human approval thresholds
- Recourse paths
- Audit trails
- Fraud and abuse boundaries
- Human escalation

Commercial Boundaries is the first Action Boundaries profile. It focuses on whether buyer agents can safely understand, evaluate, transact, modify, cancel, and resolve commercial relationships. It is deliberately positioned underneath payment processors, checkout protocols, wallets, tokenization, fraud networks, and settlement systems.

The draft lives in [action-boundaries.md](action-boundaries.md). It should remain optional until real implementers validate the field names and threat model.

## Future Candidate: Expanded Limit Taxonomy

### Quota and cost-based limits

Graceful Boundaries 1.4 adds optional metadata for common quota, cost, size, token, duration, burst, and queue constraints. Future work should validate these fields against real deployments and decide whether any should become required for specific profiles.

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

**Current status:** Added as optional metadata in 1.4. The request-per-window model still covers the majority of real-world rate limits, and quota or cost metadata should stay optional until adoption validates the field names.

## Future Candidate: Multi-Limit Interactions

### Cascade limit disclosure

Many services enforce limits at multiple levels (global, per-key, per-endpoint). Graceful Boundaries 1.4 adds optional `limitId`, `limitType`, `scope`, and `windowResetAt` fields, but future versions may need richer per-limit state for large-scale implementations.

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

When an endpoint enforces multiple overlapping limits, Graceful Boundaries 1.4 clarifies that `RateLimit: remaining=N` should report the most constraining active limit. Future work may define an extension for reporting multiple simultaneous budgets.

**Why deferred:** These are advanced scenarios that matter at scale but add complexity for initial adopters. The current spec works for the common case (one primary limit per endpoint).

## Future Candidate: Agent-Oriented Enhancements

### Stack-specific next-step guidance

The checker currently emits a generic Express snippet with a direct link to all middleware examples. A future checker release may accept an explicit stack selection and return the matching Express, FastAPI, Hono, or Workers example.

Do not infer a server stack from weak or absent HTTP headers. Stack-specific output should require an explicit CLI option or positive evidence, retain the generic fallback, and add offline tests for every supported mapping.

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

When an agent processing a batch gets a 429, it does not know by how much the request exceeded the active limit. A future optional field such as `limitExceededBy` could help agents adjust batch strategy. Graceful Boundaries 1.4 already provides `windowResetAt` for reset timing.

**Why deferred:** The current `retryAfterSeconds` field handles the common case. These fields are optimizations for high-volume batch agents.

## Documentation

No documentation-only roadmap items are currently open. Security examples for SC-2 through SC-6 and the offline-versus-live eval workflow are part of the maintained documentation set.

## Completed

- Graceful Boundaries 1.4 defined conservative fallback guidance for unknown limit types that carry `maxRequests` and `windowSeconds`.
- Graceful Boundaries 1.5 added the agent compliance runner in `evals/test-agent-behavior.js`.
- Graceful Boundaries 1.5.2 documented the offline repository and live deployed-service validation lanes.
- Graceful Boundaries 1.5.4 added concrete before-and-after security examples for SC-2 through SC-6.

## Non-Goals

These have been considered and intentionally excluded:

- **Level 5 for content integrity.** Content integrity (SC-9) is a cross-cutting concern, not a higher conformance level. A site can have perfect rate limit communication while cloaking content, or honest content while lacking proactive headers. It's a principle, not a level.
- **Mandating specific CDN behavior.** The spec addresses trust violations, not technology choices. Markdown conversion is useful; content cloaking is the problem.
- **Mandating specific detection thresholds.** The 60% containment threshold is implementation guidance, not a normative requirement. Different contexts may need different thresholds.
