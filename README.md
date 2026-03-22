# Graceful Boundaries

A specification for how services communicate their operational limits to humans and autonomous agents.

[![License: CC-BY-4.0](https://img.shields.io/badge/License-CC--BY--4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](spec.md)
[![Tests](https://img.shields.io/badge/tests-104%20passing-brightgreen.svg)](#evaluate-conformance)
[![Status](https://img.shields.io/badge/status-Draft-orange.svg)](spec.md)

## The problem

Every unclear response generates follow-up traffic. A vague `429` causes blind retries. A vague `403` causes re-attempts with different credentials. A generic `500` causes indefinite retries. When autonomous agents are the caller, the waste compounds: agents retry faster, probe more systematically, and lack the human judgment to know when to stop.

Most services enforce rate limits but communicate them poorly. A `429 Too Many Requests` with `Retry-After: 60` tells a retry loop what to do. It doesn't tell an autonomous agent whether to retry, use a cached result, try a different endpoint, or inform the human. It doesn't tell a developer what the limits are before they hit them. It doesn't tell anyone *why* the limit exists.

## What Graceful Boundaries does

The specification addresses three gaps that existing standards cover separately but no specification combines:

1. **Proactive discovery** -- limits are machine-readable before they are hit
2. **Structured refusal** -- when a limit is exceeded, the response explains what happened, which limit applies, when to retry, and why the limit exists
3. **Constructive guidance** -- the refusal includes a useful next step, not just a block

**Read the full specification:** **[spec.md](spec.md)**

## See it in action

These examples use [Siteline](https://siteline.snapsynapse.com/), a Level 4 conformant reference implementation.

**Discover limits before hitting them:**

```bash
curl -s https://siteline.snapsynapse.com/api/limits | jq '{service, limits: .limits.scan}'
```

```json
{
  "service": "Siteline",
  "limits": {
    "scan": {
      "endpoint": "/api/scan",
      "method": "GET",
      "limits": [
        {
          "type": "ip-rate",
          "maxRequests": 10,
          "windowSeconds": 3600,
          "description": "10 scans per IP per hour."
        }
      ]
    }
  }
}
```

**Structured refusal with constructive guidance** (when a limit is exceeded):

```json
{
  "error": "rate_limit_exceeded",
  "detail": "You can run up to 10 scans per hour. Try again in 2400 seconds.",
  "limit": "10 scans per IP per hour",
  "retryAfterSeconds": 2400,
  "why": "Siteline is a free service. Rate limits keep it available for everyone and prevent abuse.",
  "alternativeEndpoint": "/api/result?id=example.com"
}
```

The caller knows the limit, when to retry, *why* the limit exists, and where to get the result without waiting.

**Proactive headers on successful responses:**

```bash
curl -s 'https://siteline.snapsynapse.com/api/result?id=example.com' -D - -o /dev/null 2>&1 | grep ratelimit
```

```
ratelimit: limit=60, remaining=59, reset=60
ratelimit-policy: 60;w=60
```

A caller seeing `remaining=1` self-throttles before the next request. A caller seeing `remaining=59` knows it has budget.

For more examples, see **[docs/curl-examples.md](docs/curl-examples.md)**.

## Conformance levels

Services self-declare a conformance level. The eval suite validates the claim.

| Level | What it requires |
|---|---|
| **N/A: Not Applicable** | No API endpoints, rate limits, or agentic interaction surface. |
| **Level 0: Non-Conformant** | Limits exist but are not described per this specification. |
| **Level 1: Structured Refusal** | All 429 responses include `error`, `detail`, `limit`, `retryAfterSeconds`, and `why`. |
| **Level 2: Discoverable** | Level 1 + a limits discovery endpoint. |
| **Level 3: Constructive** | Level 2 + refusal responses include constructive guidance when applicable. |
| **Level 4: Proactive** | Level 3 + successful responses include proactive limit headers. |

## Evaluate conformance

Check any public URL:

```bash
node evals/check.js https://your-service.com
node evals/check.js https://your-service.com --json
```

Run the unit test suite (104 tests, no dependencies):

```bash
npm test
```

## Adopt the spec

**Level 1** -- Add five fields to your 429 responses: `error`, `detail`, `limit`, `retryAfterSeconds`, and `why`. The `why` field must explain the purpose of the limit, not restate the error.

**Level 2** -- Add a discovery endpoint at `/api/limits` or `/.well-known/limits` that returns all enforced limits as structured JSON. Agents can plan before they hit anything.

**Level 3** -- Add constructive guidance to refusals. When a cached result exists, include `cachedResultUrl`. When a different endpoint can help, include `alternativeEndpoint`. When paid access has higher limits, include `upgradeUrl`.

**Level 4** -- Add `RateLimit` and `RateLimit-Policy` headers to successful responses so callers can self-throttle before hitting limits.

See the **[full specification](spec.md)** for field definitions, response classes, and security considerations.

## Relationship to existing standards

| Standard | What it covers | What Graceful Boundaries adds |
|---|---|---|
| `draft-ietf-httpapi-ratelimit-headers` | Proactive headers on success | Discovery endpoint, structured refusal body, `why` field, constructive guidance |
| RFC 6585 (429 status) | The status code itself | Structured body format with required fields |
| RFC 9457 (Problem Details) | Generic error format | Required fields for rate limits (`limit`, `retryAfterSeconds`, `why`) and guidance categories |
| OpenAPI Rate Limit extensions | Docs-time limit specs | Runtime discovery endpoint, runtime refusal format |

Graceful Boundaries is complementary to these standards, not a replacement.

## Reference implementation

[Siteline](https://siteline.snapsynapse.com/) is a Level 4 conformant implementation with five API endpoints. Verify it:

```bash
node evals/check.js https://siteline.snapsynapse.com
```

## Security

The specification includes a [threat model and security audit](SECURITY-AUDIT.md) covering rate limit calibration attacks, security posture disclosure, validation oracles, and seven other considerations (SC-1 through SC-8), all addressed in the spec.

## License

CC-BY-4.0. Use it, adapt it, build on it. Attribution required.

## Origin

Created by [Snap Synapse](https://snapsynapse.com/) based on patterns developed for [Siteline](https://siteline.snapsynapse.com/), an AI agent readiness scanner. The pattern emerged from building agent-friendly APIs where the quality of the refusal matters as much as the enforcement.
