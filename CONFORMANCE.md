# Conformance

Graceful Boundaries defines five conformance levels plus a "no agentic surface" baseline. Each level is independently testable via the eval suite at `evals/`.

## Levels

| Level | Key requirement |
|---|---|
| N/A | No agentic interaction surface — the service does not expose an HTTP API or agentic surface that callers consume programmatically |
| 0 | Limits exist but are not described per the spec — operational behavior only, no normative response bodies |
| 1 | All non-success responses include `error`, `detail`, `why`. 429 responses also include `limit` and `retryAfterSeconds`. |
| 2 | Level 1 + a discoverable limits endpoint at `/.well-known/limits` (or the path advertised in `Link: rel="limits"`) returning a structured limits document |
| 3 | Level 2 + constructive guidance fields where applicable: `cachedResultUrl`, `alternativeEndpoint`, `upgradeUrl`. Guidance MUST be honest (point at working alternatives, not dead ends). |
| 4 | Level 3 + proactive `RateLimit` headers on success responses, per RFC 9239-equivalent semantics, so callers can adapt before hitting refusal |

A higher level subsumes all lower levels. A Level 3 service is also Level 2, 1, and not N/A.

## Verifier

The reference verifier is `evals/check.js`. Run against any HTTPS service:

```bash
node evals/check.js https://example.com
node evals/check.js https://example.com --json
node evals/check.js https://example.com --limits-path /custom-limits
```

A passing run reports the highest level the service satisfies. The verifier is the conformance target — any implementation passing the eval suite is conformant.

## Test suite

`evals/` ships 200 tests across 9 files:

| File | Coverage |
|---|---|
| `test-conformance.js` | End-to-end level checks |
| `test-response-classes.js` | Response class structure |
| `test-refusal.js` | Refusal body shape (`error`, `detail`, `why`, `limit`, `retryAfterSeconds`) |
| `test-discovery.js` | Limits discovery endpoint |
| `test-action-boundaries.js` | Action boundary fields |
| `test-agentic-surfaces.js` | Agent-facing surface inventory |
| `test-proactive-headers.js` | Level 4 proactive headers |
| `test-html-refusal.js` | HTML refusal binding |
| `test-security.js` | Security-case responses (SC-1 through SC-16) |

Run all: `npm test`. No npm dependencies — vanilla Node.js.

## Reference implementation

Siteline (https://siteline.to/) is the canonical Level 4 reference implementation.

```bash
node evals/check.js https://siteline.to
```

When proposing a normative change that would alter Siteline's level, coordinate the release with Siteline so the reference stays current.

## Independent verifiers

Anyone may build a conformant verifier. The eval suite is the agreement target. The hosted verifier at https://gracefulboundaries.dev/ is published for convenience and MUST NOT be treated as the only authoritative implementation.

## What conformance does not assert

- **Safety.** Conformance verifies form. It does not assert that the service is benign, well-operated, or appropriate for any use case.
- **Fairness.** Conformance does not evaluate whether the limit values are reasonable, only whether they are communicated correctly.
- **Availability.** Conformance does not measure uptime, latency, or operational quality.
- **Authorization correctness.** Conformance does not validate that the service's authorization decisions are correct, only that refusals are well-formed.

## Reporting findings

When `evals/check.js` reports a level lower than claimed, file a finding in the service operator's issue tracker with the failing test output. The eval suite produces machine-readable JSON via `--json` for inclusion in tickets.

## Versioning

Conformance is versioned with the spec. A service claiming "Level 3 conformance" SHOULD specify the spec version (e.g. "Level 3 against Graceful Boundaries 1.4.0"). Major spec version increments require re-evaluation; minor and patch versions are backward-compatible.
