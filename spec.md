# Graceful Boundaries

**Version:** 0.1.0
**Status:** Draft
**License:** CC-BY-4.0

## Abstract

Graceful Boundaries is a specification for how services communicate their operational limits to humans and autonomous agents. It covers three requirements that existing standards address separately but no specification combines:

1. **Proactive discovery** — limits are machine-readable before they are hit
2. **Structured refusal** — when a limit is exceeded, the response explains what happened, which limit applies, when to retry, and why the limit exists
3. **Constructive guidance** — the refusal includes a useful next step, not just a block

The specification is transport-agnostic but provides concrete conventions for HTTP APIs.

## Motivation

Every unclear response generates follow-up traffic. A vague `429` causes blind retries. A vague `403` causes re-attempts with different credentials. A vague `404` causes the caller to probe neighboring paths. A generic `500` causes the caller to retry indefinitely.

This is wasteful for the service and frustrating for the caller. When autonomous agents are the caller, the waste compounds — agents retry faster, probe more systematically, and lack the human judgment to know when to stop.

Graceful Boundaries exists to **reduce unnecessary traffic** by making every non-success response self-explanatory. The specification has two practical goals:

1. **Eliminate discovery-through-failure.** If a caller can learn the rules before breaking them, they will generate less traffic. A proactive discovery endpoint prevents the first round of 429s entirely.

2. **Expose security intent.** The `why` field is not a courtesy — it is a security signal. When a service says "this limit prevents the scan engine from being used as a proxy to attack other sites," the caller (human or agent) understands the defensive posture and adjusts behavior accordingly. When a service says "rate limit exceeded," the caller learns nothing and retries.

The specification applies not just to rate limits but to every class of HTTP response where the caller needs to decide what to do next.

## Principles

1. **Clarity reduces traffic.** A response that explains the constraint, the reason, and the next step generates zero follow-up requests. A response that says only "no" generates retries, probes, and support tickets.

2. **Limits are not secrets.** A service that enforces limits should publish them before callers hit them. Proactive disclosure prevents the first failure entirely.

3. **The reason is a security signal.** `why` exposes the defensive intent behind a constraint. "This limit prevents abuse of the email system" tells the caller the security model. "Too many requests" tells them nothing. An agent that understands the security model makes better decisions than one that doesn't.

4. **Every non-success response should include a next step.** "Try again in 30 seconds" is a next step. "Use the cached result instead" is a better one. "Here's the endpoint that does what you actually need" is best. "No" with no alternative is the worst — it forces the caller to guess.

5. **Agents and humans need different things from the same response.** Machine-parseable fields (`retryAfterSeconds`, `limit`) serve agents. Human-readable fields (`detail`, `why`) serve people. Both MUST be present. A response that serves only one audience forces the other to parse or guess.

## Specification

### 1. Limits Discovery Endpoint

A conforming service MUST provide a limits discovery endpoint that returns all enforced limits as structured data.

**Convention for HTTP:** `GET /api/limits` or `GET /.well-known/limits`

**Response format:**

```json
{
  "service": "string — service name",
  "description": "string — what the service does",
  "limits": {
    "<endpoint-key>": {
      "endpoint": "string — path pattern",
      "method": "string — HTTP method",
      "limits": [
        {
          "type": "string — limit category (see below)",
          "maxRequests": "number — maximum requests in the window",
          "windowSeconds": "number — window duration in seconds",
          "description": "string — human-readable explanation"
        }
      ],
      "note": "string (optional) — additional context for this endpoint"
    }
  }
}
```

**Limit types:**

| Type | Meaning |
|---|---|
| `ip-rate` | Requests per IP address per time window |
| `key-rate` | Requests per API key per time window |
| `user-rate` | Requests per authenticated user per time window |
| `global-rate` | Requests across all callers per time window |
| `resource-dedup` | One operation per resource per time window (e.g., one scan per domain per day) |
| `cooldown` | Minimum interval between successive requests of a specific type |
| `concurrency` | Maximum simultaneous in-flight requests |

Services MAY define additional types. Unknown types SHOULD be treated as opaque constraints by clients.

The limits endpoint SHOULD be cacheable. A `Cache-Control` header with `s-maxage` of at least 300 seconds is RECOMMENDED.

### 2. Structured Refusal Response

When a limit is exceeded, the response MUST include the following fields:

```json
{
  "error": "string — machine-parseable error category",
  "detail": "string — human-readable explanation including the specific wait time",
  "limit": "string — the limit that was exceeded, in human-readable form",
  "retryAfterSeconds": "number — seconds until the caller can retry",
  "why": "string — one sentence explaining why this limit exists"
}
```

**Requirements:**

- `error` MUST be a stable string suitable for programmatic matching (e.g., `"rate_limit_exceeded"`, `"resource_dedup"`, `"cooldown_active"`).
- `detail` MUST include the specific retry time in human-readable form (e.g., "Try again in 42 seconds").
- `limit` MUST state the limit in concrete terms (e.g., "10 scans per IP per hour").
- `retryAfterSeconds` MUST be a non-negative integer.
- `why` MUST explain the purpose of the limit, not just restate it. "Rate limits keep the service available for everyone" is acceptable. "Rate limit exceeded" is not — that restates the error, not the reason.

**Additional fields** MAY be included for constructive guidance (see section 3).

**Convention for HTTP:** Return status `429 Too Many Requests` with a `Retry-After` header (seconds) and the structured JSON body. The `Content-Type` MUST be `application/json` for API endpoints. HTML endpoints MAY return `text/html` but MUST include the same information in human-readable form.

### 3. Constructive Guidance

A conforming refusal response SHOULD include at least one field that helps the caller take a useful action beyond waiting:

```json
{
  "cached": "boolean (optional) — whether a cached result is available",
  "cachedResultUrl": "string (optional) — URL to retrieve the cached result",
  "alternativeEndpoint": "string (optional) — a different endpoint that may serve the need",
  "upgradeUrl": "string (optional) — where to get higher limits",
  "humanUrl": "string (optional) — a browser-friendly URL for human follow-up"
}
```

**Guidance categories:**

| Category | When to use | Example |
|---|---|---|
| Use cached | A prior result exists for the same resource | `"cachedResultUrl": "/api/result?id=example-com-20260321"` |
| Try alternative | A different endpoint can serve the need with different limits | `"alternativeEndpoint": "/api/result?id=example.com"` |
| Upgrade | Paid or authenticated access has higher limits | `"upgradeUrl": "https://example.com/pricing"` |
| Wait | No alternative exists; retrying after the window is the only option | (No additional fields — `retryAfterSeconds` is sufficient) |
| Human handoff | The situation requires human judgment | `"humanUrl": "https://example.com/contact"` |

A service SHOULD prefer guidance categories in this order: use cached > try alternative > upgrade > wait > human handoff. The first applicable category wins.

### 4. Proactive Limit Headers (RECOMMENDED)

On successful responses, a conforming service SHOULD include headers that communicate the caller's remaining budget. This allows clients to self-throttle before hitting limits.

**Convention for HTTP** (aligned with `draft-ietf-httpapi-ratelimit-headers`):

```
RateLimit: limit=10, remaining=7, reset=2400
RateLimit-Policy: 10;w=3600
```

Services that implement Graceful Boundaries SHOULD also implement the IETF RateLimit headers when they reach RFC status.

### 5. Resource Deduplication Responses

When a request is refused because the resource was already processed within the dedup window (e.g., one scan per domain per day), the service SHOULD return the existing result rather than a bare refusal.

The response SHOULD:
- Return the cached result with a `200` status code
- Include a flag indicating the result is cached (e.g., `"_rescanBlocked": true`)
- Include a human-readable explanation (e.g., "This domain was already scanned today")

This is the strongest form of constructive guidance: the caller gets what they need without waiting.

### 6. Response Classes

Graceful Boundaries applies to all HTTP responses, not just rate limits. Each response class has a base set of fields that make it self-explanatory.

**Core fields for all non-success responses:**

```json
{
  "error": "string — stable, machine-parseable error category",
  "detail": "string — human-readable explanation",
  "why": "string — the reason this response exists (security, policy, or operational)"
}
```

#### Class: Limit (429)

The caller exceeded a rate limit or cooldown.

| Field | Required | Purpose |
|---|---|---|
| `error` | Yes | `"rate_limit_exceeded"`, `"cooldown_active"`, `"resource_dedup"` |
| `detail` | Yes | Include specific wait time in human-readable form |
| `limit` | Yes | The exact limit (e.g., "10 scans per IP per hour") |
| `retryAfterSeconds` | Yes | Machine-parseable retry time |
| `why` | Yes | Security or operational reason for the limit |
| `alternativeEndpoint` | If applicable | A different endpoint that may serve the need |
| `cachedResultUrl` | If applicable | URL to a cached result for the same resource |
| `humanUrl` | Recommended | Browser-friendly fallback URL |

#### Class: Input (400, 405, 422)

The request was malformed, used the wrong method, or failed validation.

| Field | Required | Purpose |
|---|---|---|
| `error` | Yes | `"invalid_input"`, `"method_not_allowed"`, `"validation_failed"` |
| `detail` | Yes | What was wrong and how to fix it |
| `why` | Recommended | Why this validation exists (e.g., SSRF protection) |
| `field` | If applicable | Which input field failed |
| `expected` | If applicable | What valid input looks like |
| `allowedMethods` | For 405 | Which HTTP methods are accepted |

```json
{
  "error": "invalid_input",
  "detail": "This URL points to a private or reserved address and cannot be scanned.",
  "why": "Siteline blocks private IPs, loopback, and cloud metadata endpoints to prevent server-side request forgery.",
  "field": "url",
  "expected": "A public URL with a resolvable hostname on port 80 or 443."
}
```

#### Class: Access (401, 403)

The caller lacks permission or credentials.

| Field | Required | Purpose |
|---|---|---|
| `error` | Yes | `"authentication_required"`, `"forbidden"`, `"blocked"` |
| `detail` | Yes | What credential or permission is needed |
| `why` | Yes | The security policy behind the restriction |
| `authUrl` | If applicable | Where to obtain credentials |
| `upgradeUrl` | If applicable | Where to get higher access |
| `humanUrl` | Recommended | Browser-friendly contact or signup page |

```json
{
  "error": "forbidden",
  "detail": "API key required for batch operations. Free scans are available at the public endpoint.",
  "why": "Batch access requires authentication to prevent abuse and track usage.",
  "authUrl": "https://example.com/api/keys",
  "alternativeEndpoint": "/api/scan"
}
```

#### Class: Not Found (404, 410)

The requested resource doesn't exist or has been removed.

| Field | Required | Purpose |
|---|---|---|
| `error` | Yes | `"not_found"`, `"gone"`, `"result_not_found"` |
| `detail` | Yes | Whether the resource never existed, expired, or moved |
| `why` | Recommended | Why it might be missing (e.g., TTL expiration) |
| `scanAvailable` | If applicable | Whether the caller can create the resource |
| `scanUrl` | If applicable | Endpoint to create/scan the resource |
| `humanUrl` | Recommended | Browser-friendly page to take action |

```json
{
  "error": "result_not_found",
  "detail": "No scan result exists for example.com. This domain has not been scanned yet.",
  "why": "Results are kept for 30 days after scanning. This domain may not have been scanned, or the result may have expired.",
  "scanAvailable": true,
  "scanUrl": "/api/scan?url=https://example.com",
  "humanUrl": "https://siteline.snapsynapse.com/?url=example.com"
}
```

#### Class: Availability (500, 502, 503, 504)

The service is experiencing an error or is temporarily unavailable.

| Field | Required | Purpose |
|---|---|---|
| `error` | Yes | `"internal_error"`, `"service_unavailable"`, `"upstream_error"`, `"timeout"` |
| `detail` | Yes | Whether this is transient and whether retrying is appropriate |
| `why` | Recommended | What subsystem is affected |
| `retryAfterSeconds` | If applicable | When the service expects to recover |
| `statusUrl` | If applicable | Status page or health check endpoint |
| `humanUrl` | Recommended | Where to report the issue or get help |

```json
{
  "error": "service_unavailable",
  "detail": "Result storage is temporarily unavailable. Scans still work but results are not persisted.",
  "why": "The storage backend (Supabase) is unreachable. This is usually transient.",
  "retryAfterSeconds": 60,
  "humanUrl": "https://siteline.snapsynapse.com/"
}
```

#### Class: Success (200, 201, 204)

Successful responses carry proactive information to prevent future errors.

| Header | When | Purpose |
|---|---|---|
| `RateLimit` | Always | Remaining budget: `limit=N, remaining=N, reset=N` |
| `RateLimit-Policy` | Always | Policy description: `N;w=N` |
| `X-Result-Id` | When applicable | Stable ID for the resource, for later retrieval |
| `X-Cache-Status` | When applicable | Whether the response was cached |

The proactive headers are the highest-leverage traffic reduction mechanism. A caller that sees `remaining=1` will self-throttle before the next request. A caller that sees `remaining=9` knows it has budget and won't add artificial delays.

## Conformance Levels

| Level | Requirements |
|---|---|
| **Level 1: Structured Refusal** | All 429 responses include `error`, `detail`, `limit`, `retryAfterSeconds`, and `why`. |
| **Level 2: Discoverable** | Level 1 + a limits discovery endpoint exists and is accurate. |
| **Level 3: Constructive** | Level 2 + refusal responses include at least one constructive guidance field when applicable. |
| **Level 3+: Proactive** | Level 3 + successful responses include proactive limit headers (RateLimit or equivalent). |

A service MAY claim conformance at any level. Services SHOULD target Level 3 for agent-facing APIs.

## Examples

### Limits Discovery

```
GET /api/limits

200 OK
Content-Type: application/json
Cache-Control: s-maxage=3600

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
        },
        {
          "type": "resource-dedup",
          "maxRequests": 1,
          "windowSeconds": 86400,
          "description": "One scan per domain per calendar day."
        }
      ]
    }
  }
}
```

### Structured Refusal (Rate Limit)

```
GET /api/scan?url=example.com

429 Too Many Requests
Retry-After: 2400
Content-Type: application/json

{
  "error": "rate_limit_exceeded",
  "detail": "You can run up to 10 scans per hour. Try again in 2400 seconds.",
  "limit": "10 scans per IP per hour",
  "retryAfterSeconds": 2400,
  "why": "Siteline is a free service. Rate limits keep it available for everyone and prevent abuse."
}
```

### Constructive Refusal (Resource Dedup)

```
GET /api/scan?url=example.com

200 OK
Content-Type: application/json

{
  "grade": "B",
  "score": 82,
  ...full result...,
  "_rescanBlocked": true,
  "_cacheStatus": "KV_HIT"
}
```

The caller gets the result. The `_rescanBlocked` flag tells agents and UIs that this is a cached result, not a fresh scan.

### Constructive Refusal (With Alternative)

```
GET /api/scan?url=example.com

429 Too Many Requests
Retry-After: 42
Content-Type: application/json

{
  "error": "rate_limit_exceeded",
  "detail": "You can run up to 10 scans per hour. Try again in 42 seconds.",
  "limit": "10 scans per IP per hour",
  "retryAfterSeconds": 42,
  "why": "Rate limits keep the service available for everyone.",
  "cachedResultUrl": "/api/result?id=example-com-20260321",
  "alternativeEndpoint": "/api/result?id=example.com"
}
```

## Relationship to Existing Standards

| Standard | What it covers | What Graceful Boundaries adds |
|---|---|---|
| `draft-ietf-httpapi-ratelimit-headers` | Proactive headers on successful responses | Discovery endpoint, structured refusal body, `why` field, constructive guidance |
| RFC 6585 (429 status) | The status code itself | Structured body format with required fields |
| RFC 7807 / RFC 9457 (Problem Details) | Generic error response format | Specific required fields for rate limits (`limit`, `retryAfterSeconds`, `why`) and guidance categories |
| OpenAPI Rate Limit extensions | Documentation of limits in API specs | Runtime discovery endpoint, runtime refusal format |

Graceful Boundaries is complementary to these standards, not a replacement. A conforming service can (and should) also implement IETF RateLimit headers and use RFC 9457 Problem Details as the envelope format.

## Reference Implementation

[Siteline](https://siteline.snapsynapse.com/) is a Level 3+ conformant implementation of Graceful Boundaries. It is an AI agent readiness scanner with five API endpoints, each demonstrating different aspects of the specification.

**Verify conformance:**

```bash
node evals/check.js https://siteline.snapsynapse.com
```

**Discovery endpoint:** [`/api/limits`](https://siteline.snapsynapse.com/api/limits) — returns all rate limits, SSRF protection policy, response headers, and endpoint links.

**Proactive headers on successful responses:**

```
GET /api/scan?url=example.com

200 OK
RateLimit: limit=10, remaining=9, reset=3540
RateLimit-Policy: 10;w=3600
```

**Structured refusal with constructive guidance:**

```
GET /api/scan?url=example.com

429 Too Many Requests
Retry-After: 2400
RateLimit: limit=10, remaining=0, reset=2400
RateLimit-Policy: 10;w=3600

{
  "error": "rate_limit_exceeded",
  "detail": "You can run up to 10 scans per hour. Try again in 2400 seconds.",
  "limit": "10 scans per IP per hour",
  "retryAfterSeconds": 2400,
  "why": "Siteline is a free service. Rate limits keep it available for everyone and prevent abuse.",
  "alternativeEndpoint": "/api/result?id=example.com"
}
```

The `alternativeEndpoint` field directs the caller to the result lookup API, which may already have a cached result for the domain — the strongest form of constructive guidance.

**Resource deduplication (one scan per domain per day):**

```
GET /api/scan?url=example.com

200 OK

{
  "grade": "B",
  "score": 82,
  ...full result...,
  "_rescanBlocked": true,
  "_cacheStatus": "KV_HIT"
}
```

Rather than refusing with a 429, Siteline returns the cached result with a flag. The caller gets what they need without waiting.

**Source code:** The implementation is not open source, but the API is publicly accessible for conformance verification. The Graceful Boundaries eval suite can be run against it at any time.

## FAQ

**Q: Should I use RFC 9457 (Problem Details for HTTP APIs) as the envelope format?**
A: Yes. The Graceful Boundaries fields can be included as extension members in a Problem Details response. The `type`, `title`, `status`, and `detail` fields from RFC 9457 map naturally to `error`, `limit`, the HTTP status code, and `detail` respectively.

**Q: What if my service has no constructive alternative to offer?**
A: That's fine. `retryAfterSeconds` is itself a next step. Level 1 conformance only requires the structured refusal. Constructive guidance is Level 3.

**Q: Should the limits discovery endpoint require authentication?**
A: No. Limits are not secrets (Principle 1). The discovery endpoint SHOULD be publicly accessible so agents can plan before authenticating.

**Q: How does this apply to non-HTTP services?**
A: The principles and field names apply to any request-response protocol. The HTTP conventions (status codes, headers, endpoint paths) are transport-specific implementations of the general pattern.
