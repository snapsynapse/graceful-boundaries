# Graceful Boundaries for Cloudflare Workers

Drop-in helper. Level 2 conformance out of the box; Level 4 with `proactiveHeaders: true`.

## Install

Copy [graceful-boundaries.js](graceful-boundaries.js) into your Worker. No dependencies.

## Wire it up

```js
import { gracefulBoundaries } from "./graceful-boundaries.js";

const gb = gracefulBoundaries({
  service: "My API",
  description: "What this service does.",
  conformance: "level-2",
  limits: {
    search: {
      endpoint: "/api/search",
      method: "GET",
      limits: [{
        type: "ip-rate",
        maxRequests: 60,
        windowSeconds: 3600,
        description: "60 searches per IP per hour.",
      }],
      why: "Rate limits keep this free service available for everyone.",
    },
  },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/limits") return gb.limitsResponse();
    if (url.pathname === "/api/search") {
      const refusal = await gb.check("search", request, env.SEARCH_LIMITER);
      if (refusal) return refusal;
      return gb.success(Response.json({ results: [] }), "search");
    }
    return gb.refuse(404, {
      error: "not_found",
      detail: `No route matches ${url.pathname}.`,
      why: "Only documented endpoints are served. See /api/limits.",
    });
  },
};
```

## Counting backends

- **Cloudflare Rate Limiting binding** (recommended): declare in `wrangler.toml` and pass as the third argument to `check()`. Per-colo counting, no extra infrastructure.
```toml
[[unsafe.bindings]]
name = "SEARCH_LIMITER"
type = "ratelimit"
namespace_id = "1001"
simple = { limit = 60, period = 3600 }
```
- **Fallback Map**: used automatically when no binding is passed. Best-effort only — isolates are ephemeral and per-colo. Fine for demos, not for enforcement.
- **Durable Object**: for strict global counting, route `take()` through a DO keyed by caller.

## Verify

```bash
npx graceful-boundaries check https://my-worker.example.workers.dev
```

The spec's Appendix A covers edge runtime considerations (jitter, per-colo counting): https://gracefulboundaries.dev/spec.md
