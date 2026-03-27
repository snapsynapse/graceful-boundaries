# Graceful Boundaries — Implementation Feedback from Siteline

**Source:** Full Level 4 conformance implementation across 6 API endpoints (Siteline V2.1, 2026-03-26)
**Context:** Siteline is the reference implementation cited in the spec. This document captures gaps, ambiguities, and suggested improvements discovered while upgrading every non-success response to full spec compliance.

---

## 1. Make `why` a MUST across all response classes

**Current state:** Section 2 (Structured Refusal) requires `why` on 429 responses. Section 6 (Response Classes) lists `why` as "Recommended" for Input (400), Not Found (404), and Availability (500/502/503) classes.

**What happened in practice:** `why` was the single most common missing field — 14 of 18 non-success responses lacked it. Every 429 had `why` because the spec made it required there. Every other error class was missing it because "Recommended" reads as optional. Developers implement MUST and skip SHOULD.

**Recommendation:** Elevate `why` to MUST for all response classes in Section 6. The security-signal argument from the Principles section ("the reason is a security signal") applies equally to 400s, 404s, and 500s. A 400 that says "SSRF protection blocks private addresses" teaches the caller more than "invalid URL."

**Draft language:** "All non-success responses MUST include `error`, `detail`, and `why`. The `why` field explains the defensive, operational, or policy reason behind the response. Omitting `why` degrades the response to the same quality as a bare status code."

---

## 2. Add implementation notes for edge runtimes

**Current state:** The spec's HTTP conventions assume traditional server frameworks (`res.setHeader()`, `res.status().json()`). No mention of edge runtimes.

**What happened in practice:** Siteline's OG image endpoint (`api/og.js`) runs on Vercel's edge runtime, which uses the `Response` constructor with a headers object. The proactive `RateLimit` headers were missing because the edge endpoint was built with a different API surface. The shared `setRateLimitHeaders(res, rateCheck)` utility didn't work — it needed a parallel `ogRateLimitHeaders(rateCheck)` function returning a plain object for the `Response` constructor.

**Recommendation:** Add an "Implementation Notes" subsection to Section 4 (Proactive Limit Headers):

> **Edge and worker runtimes:** Services running on edge runtimes (Vercel Edge Functions, Cloudflare Workers, Deno Deploy) construct responses using `new Response(body, { headers })` rather than `res.setHeader()`. Implementors SHOULD create a shared utility that returns rate limit headers as a plain object, usable in both traditional and edge contexts. The header names and values are identical regardless of the response API.

---

## 3. Guidance for compound and conditional limits

**Current state:** The spec defines limit types (`ip-rate`, `cooldown`, `resource-dedup`, etc.) and shows them as arrays under each endpoint in the discovery response. No guidance on conditional limits.

**What happened in practice:** Siteline's `/api/email-capture` endpoint has two limits: an `ip-rate` (12/hour) and a `cooldown` (1 per 60s) that only applies when `source: "pdf-export"`. The discovery endpoint lists both, but there's no way to express that the cooldown is conditional on a request parameter. An agent reading `/api/limits` sees both limits and might self-throttle to 1/minute for all requests, not just PDF ones.

**Recommendation:** Add an optional `condition` field to limit entries:

```json
{
  "type": "cooldown",
  "maxRequests": 1,
  "windowSeconds": 60,
  "condition": "source=pdf-export",
  "description": "1 report email per IP per 60 seconds (for source: pdf-export)."
}
```

The `condition` field is a human-readable hint (not a query language). Agents that don't understand it fall back to the description. Agents that do can apply the limit selectively.

---

## 4. Add a changelog discovery convention

**Current state:** The spec recommends `/api/limits` or `/.well-known/limits` for limit discovery. No convention for change discovery.

**What happened in practice:** Siteline provides `api/v1/changelog.json` and `feed.json` for version history, but there's no spec-level way for an agent to discover that these exist. An agent that cached the limits response has no signal for when to re-fetch — the `Cache-Control` header provides a staleness window, but not a pointer to what changed.

**Recommendation:** Add an optional `changelog` field to the limits discovery response:

```json
{
  "service": "Siteline",
  "conformance": "level-4",
  "changelog": "https://siteline.snapsynapse.com/api/v1/changelog.json",
  "feed": "https://siteline.snapsynapse.com/feed.json",
  "limits": { ... }
}
```

This parallels the `specUrl` field already in the spec. Agents can poll the changelog or subscribe to the feed to detect limit changes without re-fetching `/api/limits` on every request.

---

## 5. Clarify HTML 429 responses for agent consumers

**Current state:** Section 2 says "HTML endpoints MAY return text/html but MUST include the same information in human-readable form."

**What happened in practice:** Siteline's server-rendered result page (`/results/:id`) returns a styled HTML 429 with auto-refresh. A human sees a friendly "You're moving fast" page. An agent gets HTML instead of JSON and must parse prose to find the retry time. The `Retry-After` header is present (machine-parseable), but the structured body fields (`error`, `limit`, `why`) are embedded in English sentences.

**Recommendation:** Add guidance for HTML 429 responses:

> HTML endpoints that return 429 SHOULD include a `<meta name="retry-after" content="N">` tag (seconds) and a `<link rel="alternate" type="application/json" href="...">` pointing to the JSON equivalent of the same response. This allows agents that follow HTML links to discover the structured refusal without parsing prose.
>
> Alternatively, the `Retry-After` header alone is sufficient for agents that check headers before parsing the body. The requirement is that the information is machine-accessible, not that it is in JSON specifically.

---

## 6. Add `returnsCached` flag for resource-dedup limits

**Current state:** Section 5 (Resource Deduplication Responses) recommends returning the cached result with a 200 rather than a bare 429. The discovery endpoint has no way to signal this behavior.

**What happened in practice:** Siteline returns the earlier scan result with `_rescanBlocked: true` on a 200 when the domain was already scanned that day. This is the "strongest form of constructive guidance" per the spec. But an agent reading `/api/limits` sees `resource-dedup` and expects a 429 — it doesn't know it will get a 200 with data.

**Recommendation:** Add an optional `returnsCached` boolean to `resource-dedup` limit entries:

```json
{
  "type": "resource-dedup",
  "maxRequests": 1,
  "windowSeconds": 86400,
  "returnsCached": true,
  "description": "One scan per domain per calendar day. Repeat requests return the cached result."
}
```

When `returnsCached` is true, agents know they'll receive a valid response (not a refusal) and can skip retry logic entirely. This is a meaningful behavioral difference that the current spec doesn't surface in the discovery endpoint.

---

## Summary

| # | Issue | Severity | Type |
|---|-------|----------|------|
| 1 | `why` should be MUST across all response classes | High | Spec change |
| 2 | Edge runtime implementation notes | Medium | New section |
| 3 | Compound/conditional limits | Medium | New field |
| 4 | Changelog discovery convention | Low | New field |
| 5 | HTML 429 guidance for agents | Medium | Clarification |
| 6 | `returnsCached` flag for resource-dedup | Low | New field |

All recommendations are backward-compatible. Existing Level 4 implementations remain conformant. The changes raise the floor for new implementations and reduce ambiguity for agent consumers.
