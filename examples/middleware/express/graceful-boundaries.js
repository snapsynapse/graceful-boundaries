/**
 * Graceful Boundaries middleware for Express.
 *
 * Drop-in Level 2 conformance (Level 4 with proactiveHeaders: true):
 *   - structured refusals on 429 (error, detail, limit, retryAfterSeconds, why)
 *   - limits discovery endpoint at /api/limits
 *   - optional RateLimit / RateLimit-Policy headers on success
 *
 * No dependencies. In-memory fixed-window counters — suitable for a single
 * process. For multi-instance deployments back the counter with your shared
 * store (Redis, etc.); only `take()` needs to change.
 *
 * Spec: https://gracefulboundaries.dev/spec.md
 * Schemas: https://gracefulboundaries.dev/schema/
 *
 * Usage:
 *   const { gracefulBoundaries } = require("./graceful-boundaries");
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
 *   app.get("/api/limits", gb.limitsEndpoint);
 *   app.get("/api/search", gb.protect("search"), searchHandler);
 */

function gracefulBoundaries(config) {
  const { service, description, conformance, limits, proactiveHeaders = false } = config;
  const windows = new Map(); // key -> { count, resetAt }

  function take(bucketKey, maxRequests, windowSeconds, now) {
    const entry = windows.get(bucketKey);
    if (!entry || now >= entry.resetAt) {
      windows.set(bucketKey, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { allowed: true, remaining: maxRequests - 1, resetSeconds: windowSeconds };
    }
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);
    if (entry.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetSeconds };
    }
    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count, resetSeconds };
  }

  function limitsEndpoint(req, res) {
    const body = { service, description, limits: {} };
    if (conformance) body.conformance = conformance;
    for (const [key, entry] of Object.entries(limits)) {
      body.limits[key] = {
        endpoint: entry.endpoint,
        method: entry.method,
        limits: entry.limits,
      };
      if (entry.note) body.limits[key].note = entry.note;
    }
    res.set("Cache-Control", "public, s-maxage=300");
    res.json(body);
  }

  function protect(limitKey) {
    const entry = limits[limitKey];
    if (!entry) throw new Error(`Unknown limit key: ${limitKey}`);
    const rule = entry.limits[0];

    return (req, res, next) => {
      const bucketKey = `${limitKey}:${req.ip}`;
      const result = take(bucketKey, rule.maxRequests, rule.windowSeconds, Date.now());

      if (proactiveHeaders) {
        res.set("RateLimit", `limit=${rule.maxRequests}, remaining=${result.remaining}, reset=${result.resetSeconds}`);
        res.set("RateLimit-Policy", `${rule.maxRequests};w=${rule.windowSeconds}`);
      }

      if (result.allowed) return next();

      res.set("Retry-After", String(result.resetSeconds));
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
      res.status(429).json(refusal);
    };
  }

  /**
   * Structured non-429 refusal helper. Use for 400/401/403/404/500 bodies:
   *   return refuse(res, 404, {
   *     error: "result_not_found",
   *     detail: "No result exists for that id.",
   *     why: "Results expire 30 days after creation.",
   *   });
   */
  function refuse(res, status, body) {
    if (!body.error || !body.detail || !body.why) {
      throw new Error("Graceful Boundaries refusals require error, detail, and why.");
    }
    return res.status(status).json(body);
  }

  return { limitsEndpoint, protect, refuse };
}

module.exports = { gracefulBoundaries };
