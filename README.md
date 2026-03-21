# Graceful Boundaries

A specification for how services communicate their operational limits to humans and autonomous agents.

Most services enforce rate limits but communicate them poorly. A `429 Too Many Requests` with `Retry-After: 60` tells a retry loop what to do. It doesn't tell an autonomous agent whether to retry, use a cached result, try a different endpoint, or inform the human. It doesn't tell a developer what the limits are before they hit them. It doesn't tell anyone why the limit exists.

Graceful Boundaries addresses three gaps that existing standards cover separately but no specification combines:

1. **Proactive discovery** — limits are machine-readable before they are hit
2. **Structured refusal** — when a limit is exceeded, the response explains what, which limit, when to retry, and why
3. **Constructive guidance** — the refusal includes a useful next step, not just a block

## Read the spec

**[spec.md](spec.md)** — the full specification

## Conformance levels

| Level | What it requires |
|---|---|
| **Level 1: Structured Refusal** | All 429 responses include `error`, `detail`, `limit`, `retryAfterSeconds`, and `why`. |
| **Level 2: Discoverable** | Level 1 + a limits discovery endpoint. |
| **Level 3: Constructive** | Level 2 + refusal responses include constructive guidance when applicable. |
| **Level 3+: Proactive** | Level 3 + successful responses include proactive limit headers. |

## Evaluate conformance

```bash
node evals/check.js https://your-service.com
```

The eval suite tests all three levels against a live service.

## Relationship to existing standards

Graceful Boundaries is complementary to:
- `draft-ietf-httpapi-ratelimit-headers` (proactive headers)
- RFC 6585 (429 status code)
- RFC 9457 (Problem Details for HTTP APIs)

It adds: a discovery endpoint, required refusal fields (`why`, `limit`), constructive guidance categories, and conformance levels.

## License

CC-BY-4.0. Use it, adapt it, build on it. Attribution required.

## Origin

Created by [Snap Synapse](https://snapsynapse.com/) based on patterns developed for [Siteline](https://siteline.snapsynapse.com/), an AI agent readiness scanner. The pattern emerged from building agent-friendly APIs where the quality of the refusal conversation matters as much as the enforcement.
