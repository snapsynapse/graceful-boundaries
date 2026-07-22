/**
 * Graceful Boundaries helper for Cloudflare Workers.
 *
 * Drop-in Level 2 conformance (Level 4 with proactiveHeaders: true):
 *   - structured refusals on 429 (error, detail, limit, retryAfterSeconds, why)
 *   - limits discovery response for /api/limits
 *   - optional RateLimit / RateLimit-Policy headers on success
 *
 * Counting uses Cloudflare's Rate Limiting binding when provided (per-colo),
 * or falls back to an in-isolate Map (best-effort only — isolates are
 * ephemeral). For strict global counting use a Durable Object.
 *
 * Spec: https://gracefulboundaries.dev/spec.md
 * Schemas: https://gracefulboundaries.dev/schema/
 *
 * Usage (module Worker):
 *
 *   import { gracefulBoundaries } from "./graceful-boundaries.js";
 *
 *   const gb = gracefulBoundaries({
 *     service: "My API",
 *     description: "What this service does.",
 *     conformance: "level-2",
 *     limits: {
 *       search: {
 *         endpoint: "/api/search",
 *         method: "GET",
 *         limits: [{
 *           type: "ip-rate",
 *           maxRequests: 60,
 *           windowSeconds: 3600,
 *           description: "60 searches per IP per hour.",
 *         }],
 *         why: "Rate limits keep this free service available for everyone.",
 *       },
 *     },
 *   });
 *
 *   export default {
 *     async fetch(request, env) {
 *       const url = new URL(request.url);
 *       if (url.pathname === "/api/limits") return gb.limitsResponse();
 *       if (url.pathname === "/api/search") {
 *         const refusal = await gb.check("search", request, env.SEARCH_LIMITER);
 *         if (refusal) return refusal;
 *         return gb.success(Response.json({ results: [] }), "search");
 *       }
 *       return gb.refuse(404, {
 *         error: "not_found",
 *         detail: `No route matches ${url.pathname}.`,
 *         why: "Only documented endpoints are served. See /api/limits.",
 *       });
 *     },
 *   };
 */

export function gracefulBoundaries(config) {
  const { service, description, conformance, limits, proactiveHeaders = false } = config;
  const windows = new Map(); // fallback counter: key -> { count, resetAt }

  function fallbackTake(bucketKey, maxRequests, windowSeconds) {
    const now = Date.now();
    const entry = windows.get(bucketKey);
    if (!entry || now >= entry.resetAt) {
      windows.set(bucketKey, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { allowed: true, remaining: maxRequests - 1, resetSeconds: windowSeconds };
    }
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);
    if (entry.count >= maxRequests) return { allowed: false, remaining: 0, resetSeconds };
    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count, resetSeconds };
  }

  function limitsResponse() {
    const body = { service, description, limits: {} };
    if (conformance) body.conformance = conformance;
    for (const [key, entry] of Object.entries(limits)) {
      body.limits[key] = { endpoint: entry.endpoint, method: entry.method, limits: entry.limits };
      if (entry.note) body.limits[key].note = entry.note;
    }
    return Response.json(body, { headers: { "Cache-Control": "public, s-maxage=300" } });
  }

  function rateLimitHeaders(rule, remaining, resetSeconds) {
    return {
      RateLimit: `limit=${rule.maxRequests}, remaining=${remaining}, reset=${resetSeconds}`,
      "RateLimit-Policy": `${rule.maxRequests};w=${rule.windowSeconds}`,
    };
  }

  /**
   * Returns null when allowed, or a 429 Response when limited.
   * Pass a Cloudflare Rate Limiting binding as `limiter` for real counting;
   * otherwise the in-isolate fallback applies.
   */
  async function check(limitKey, request, limiter) {
    const entry = limits[limitKey];
    const rule = entry.limits[0];
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    let result;
    if (limiter) {
      const { success } = await limiter.limit({ key: `${limitKey}:${ip}` });
      // The binding doesn't expose remaining/reset; report conservatively.
      result = { allowed: success, remaining: success ? 1 : 0, resetSeconds: rule.windowSeconds };
    } else {
      result = fallbackTake(`${limitKey}:${ip}`, rule.maxRequests, rule.windowSeconds);
    }

    if (result.allowed) return null;

    const refusal = {
      error: "rate_limit_exceeded",
      detail: `${rule.description} Try again in ${result.resetSeconds} seconds.`,
      limit: rule.description.replace(/\.$/, ""),
      retryAfterSeconds: result.resetSeconds,
      why: entry.why || "Rate limits keep the service available for everyone and prevent abuse.",
    };
    if (entry.alternativeEndpoint) refusal.alternativeEndpoint = entry.alternativeEndpoint;
    if (entry.upgradeUrl) refusal.upgradeUrl = entry.upgradeUrl;
    if (entry.humanUrl) refusal.humanUrl = entry.humanUrl;

    const headers = { "Retry-After": String(result.resetSeconds) };
    if (proactiveHeaders) Object.assign(headers, rateLimitHeaders(rule, 0, result.resetSeconds));
    return Response.json(refusal, { status: 429, headers });
  }

  /** Stamp proactive headers onto a success response (Level 4). */
  function success(response, limitKey, remaining, resetSeconds) {
    if (!proactiveHeaders) return response;
    const rule = limits[limitKey].limits[0];
    const out = new Response(response.body, response);
    const headers = rateLimitHeaders(
      rule,
      remaining ?? rule.maxRequests,
      resetSeconds ?? rule.windowSeconds
    );
    for (const [k, v] of Object.entries(headers)) out.headers.set(k, v);
    return out;
  }

  /** Structured non-429 refusal. Requires error, detail, and why. */
  function refuse(status, body) {
    if (!body.error || !body.detail || !body.why) {
      throw new Error("Graceful Boundaries refusals require error, detail, and why.");
    }
    return Response.json(body, { status });
  }

  return { limitsResponse, check, success, refuse };
}
