# RFC 9457 Compatibility Profile

How to adopt Graceful Boundaries when your API already emits RFC 9457 Problem Details (`application/problem+json`). You keep your content type, your `type`/`title`/`status` members, and your existing error pipeline. Graceful Boundaries fields ride along as Problem Details extension members, which RFC 9457 section 3.2 explicitly permits.

Status: non-normative implementation guidance. The normative requirements live in [spec.md](../spec.md).

## Field mapping

| Graceful Boundaries | RFC 9457 equivalent | Treatment |
|---|---|---|
| `error` | no equivalent (`type` is a URI, not a stable token) | Add as extension member |
| `detail` | `detail` | Already aligned. One field serves both specs |
| `why` | no equivalent | Add as extension member |
| `limit` | no equivalent | Add as extension member (429 only) |
| `retryAfterSeconds` | no equivalent (header `Retry-After` is adjacent) | Add as extension member (429 only) |
| constructive guidance (`cachedResultUrl`, `alternativeEndpoint`, `upgradeUrl`, `humanUrl`) | no equivalent | Add as extension members |
| HTTP status | `status` | Keep as is |

Two notes on the mapping:

- `detail` is the only shared field. RFC 9457 defines it as a human-readable explanation specific to this occurrence, which is exactly what Graceful Boundaries requires. For 429s, include the human-readable wait time in it, per the spec.
- `error` and `type` solve the same problem (stable programmatic matching) differently. Keep both: `type` for RFC 9457 tooling, `error` for Graceful Boundaries agents. They can be derived from each other, e.g. `type: "https://example.com/problems/rate-limit-exceeded"` and `error: "rate_limit_exceeded"`.

## Worked example: 429

Start with an ordinary RFC 9457 response:

```json
{
  "type": "https://example.com/problems/rate-limit-exceeded",
  "title": "Rate limit exceeded",
  "status": 429,
  "detail": "You can run up to 10 scans per hour. Try again in 2400 seconds."
}
```

Keep those members and add the Graceful Boundaries extension members:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/problem+json
Retry-After: 2400
```

```json
{
  "type": "https://example.com/problems/rate-limit-exceeded",
  "title": "Rate limit exceeded",
  "status": 429,
  "detail": "You can run up to 10 scans per hour. Try again in 2400 seconds.",
  "error": "rate_limit_exceeded",
  "limit": "10 scans per IP per hour",
  "retryAfterSeconds": 2400,
  "why": "Rate limits keep this free service available for everyone and prevent abuse.",
  "alternativeEndpoint": "/api/result?id=example.com"
}
```

An RFC 9457 client reads `type`, `title`, `status`, `detail` and ignores the rest. A Graceful Boundaries agent reads `error`, `detail`, `limit`, `retryAfterSeconds`, `why` and ignores the rest. Neither breaks.

## Worked example: 400

```json
{
  "type": "https://example.com/problems/invalid-input",
  "title": "Invalid input",
  "status": 400,
  "detail": "This URL is outside the scanner's accepted public-target policy.",
  "error": "invalid_input",
  "why": "Only public scan targets are accepted to prevent the scanner from being used as a proxy.",
  "field": "url",
  "expected": "A public URL with a resolvable hostname."
}
```

## Content type

Graceful Boundaries requires `application/json` for API error responses. `application/problem+json` is a JSON media type and satisfies the intent; the conformance checker validates the parsed body and does not reject `+json` structured-syntax content types. If your tooling demands plain `application/json`, the body shape above works unchanged under either content type.

## Conformance checklist for RFC 9457 shops

1. Add `error` (snake_case token) and `why` to every problem response. With `detail` already present, that is Level 1 for non-429s.
2. On 429s, also add `limit` and `retryAfterSeconds`. Keep the `Retry-After` header you already send; the body field is what agents parse alongside the rest of the refusal.
3. Add a limits discovery endpoint (`/api/limits` or `/.well-known/limits`) for Level 2. This is new surface, not a Problem Details change. See the [worked examples](../examples/limits/).
4. Add constructive guidance members where applicable for Level 3.
5. Add `RateLimit` / `RateLimit-Policy` headers on success for Level 4.

## Validation

The published [JSON Schemas](https://gracefulboundaries.dev/schema/) set `additionalProperties: true`, so problem-details members (`type`, `title`, `status`, `instance`) pass through validation untouched. Validate your 429 body shapes against `refusal-429.schema.json` and everything else against `refusal.schema.json`; then run the checker for origin-aware SC-6 URL safety and conformance.

```bash
npx graceful-boundaries check https://your-service.example
```
