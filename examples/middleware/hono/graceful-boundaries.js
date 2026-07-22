/**
 * Graceful Boundaries middleware for Hono (Workers, Node, Deno, Bun).
 *
 * Drop-in Level 2 conformance (Level 4 with proactiveHeaders: true):
 *   - structured refusals on 429 (error, detail, limit, retryAfterSeconds, why)
 *   - limits discovery handler for /api/limits
 *   - optional RateLimit / RateLimit-Policy headers on success
 *
 * No dependencies. In-memory fixed-window counters — per-process /
 * per-isolate. Back `take()` with a shared store for multi-instance
 * deployments.
 *
 * Spec: https://gracefulboundaries.dev/spec.md
 * Schemas: https://gracefulboundaries.dev/schema/
 *
 * Usage:
 *   import { Hono } from "hono";
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
 *   const app = new Hono();
 *   app.get("/api/limits", gb.limitsHandler);
 *   app.get("/api/search", gb.protect("search"), (c) => c.json({ results: [] }));
 */

export function gracefulBoundaries(config) {
  const { service, description, conformance, limits, proactiveHeaders = false } = config;
  const windows = new Map(); // key -> { count, resetAt }

  function take(bucketKey, maxRequests, windowSeconds) {
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

  function callerKey(c) {
    return (
      c.req.header("CF-Connecting-IP") ||
      c.req.header("X-Forwarded-For")?.split(",")[0].trim() ||
      "unknown"
    );
  }

  function limitsHandler(c) {
    const body = { service, description, limits: {} };
    if (conformance) body.conformance = conformance;
    for (const [key, entry] of Object.entries(limits)) {
      body.limits[key] = { endpoint: entry.endpoint, method: entry.method, limits: entry.limits };
      if (entry.note) body.limits[key].note = entry.note;
    }
    c.header("Cache-Control", "public, s-maxage=300");
    return c.json(body);
  }

  function protect(limitKey) {
    const entry = limits[limitKey];
    if (!entry) throw new Error(`Unknown limit key: ${limitKey}`);
    const rule = entry.limits[0];

    return async (c, next) => {
      const result = take(`${limitKey}:${callerKey(c)}`, rule.maxRequests, rule.windowSeconds);

      if (proactiveHeaders) {
        c.header("RateLimit", `limit=${rule.maxRequests}, remaining=${result.remaining}, reset=${result.resetSeconds}`);
        c.header("RateLimit-Policy", `${rule.maxRequests};w=${rule.windowSeconds}`);
      }

      if (result.allowed) {
        await next();
        return;
      }

      c.header("Retry-After", String(result.resetSeconds));
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
      return c.json(refusal, 429);
    };
  }

  /** Structured non-429 refusal. Requires error, detail, and why. */
  function refuse(c, status, body) {
    if (!body.error || !body.detail || !body.why) {
      throw new Error("Graceful Boundaries refusals require error, detail, and why.");
    }
    return c.json(body, status);
  }

  return { limitsHandler, protect, refuse };
}
