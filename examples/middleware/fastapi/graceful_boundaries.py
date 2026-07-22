"""Graceful Boundaries middleware for FastAPI / Starlette.

Drop-in Level 2 conformance (Level 4 with proactive_headers=True):
  - structured refusals on 429 (error, detail, limit, retryAfterSeconds, why)
  - limits discovery endpoint at /api/limits
  - optional RateLimit / RateLimit-Policy headers on success

No dependencies beyond FastAPI itself. In-memory fixed-window counters --
suitable for a single process. For multi-instance deployments back
``_take`` with a shared store (Redis, etc.).

Spec: https://gracefulboundaries.dev/spec.md
Schemas: https://gracefulboundaries.dev/schema/

Usage:

    from fastapi import FastAPI, Request
    from graceful_boundaries import GracefulBoundaries

    app = FastAPI()
    gb = GracefulBoundaries(
        service="My API",
        description="What this service does.",
        conformance="level-2",
        limits={
            "search": {
                "endpoint": "/api/search",
                "method": "GET",
                "limits": [{
                    "type": "ip-rate",
                    "maxRequests": 60,
                    "windowSeconds": 3600,
                    "description": "60 searches per IP per hour.",
                }],
                "why": "Rate limits keep this free service available for everyone.",
            },
        },
    )

    @app.get("/api/limits")
    def limits():
        return gb.limits_response()

    @app.get("/api/search")
    def search(request: Request):
        refusal = gb.check("search", request)
        if refusal:
            return refusal
        return {"results": []}
"""

import time

from fastapi.responses import JSONResponse


class GracefulBoundaries:
    def __init__(self, service, description, limits, conformance=None, proactive_headers=False):
        self.service = service
        self.description = description
        self.limits = limits
        self.conformance = conformance
        self.proactive_headers = proactive_headers
        self._windows = {}  # bucket key -> (count, reset_at)

    def _take(self, bucket_key, max_requests, window_seconds):
        now = time.monotonic()
        count, reset_at = self._windows.get(bucket_key, (0, 0.0))
        if now >= reset_at:
            self._windows[bucket_key] = (1, now + window_seconds)
            return True, max_requests - 1, window_seconds
        reset_seconds = max(1, int(reset_at - now))
        if count >= max_requests:
            return False, 0, reset_seconds
        self._windows[bucket_key] = (count + 1, reset_at)
        return True, max_requests - count - 1, reset_seconds

    def limits_response(self):
        body = {"service": self.service, "description": self.description, "limits": {}}
        if self.conformance:
            body["conformance"] = self.conformance
        for key, entry in self.limits.items():
            body["limits"][key] = {
                "endpoint": entry["endpoint"],
                "method": entry["method"],
                "limits": entry["limits"],
            }
            if entry.get("note"):
                body["limits"][key]["note"] = entry["note"]
        return JSONResponse(body, headers={"Cache-Control": "public, s-maxage=300"})

    def check(self, limit_key, request):
        """Returns None when allowed, or a JSONResponse refusal when limited.

        When proactive_headers is on, also stamps RateLimit headers onto
        request.state.gb_headers; merge them into your success response.
        """
        entry = self.limits[limit_key]
        rule = entry["limits"][0]
        client_ip = request.client.host if request.client else "unknown"
        allowed, remaining, reset_seconds = self._take(
            f"{limit_key}:{client_ip}", rule["maxRequests"], rule["windowSeconds"]
        )

        if self.proactive_headers:
            request.state.gb_headers = {
                "RateLimit": f"limit={rule['maxRequests']}, remaining={remaining}, reset={reset_seconds}",
                "RateLimit-Policy": f"{rule['maxRequests']};w={rule['windowSeconds']}",
            }

        if allowed:
            return None

        refusal = {
            "error": "rate_limit_exceeded",
            "detail": f"{rule['description']} Try again in {reset_seconds} seconds.",
            "limit": rule["description"].rstrip("."),
            "retryAfterSeconds": reset_seconds,
            "why": entry.get("why", "Rate limits keep the service available for everyone and prevent abuse."),
        }
        for field in ("alternativeEndpoint", "upgradeUrl", "humanUrl"):
            if entry.get(field):
                refusal[field] = entry[field]
        headers = {"Retry-After": str(reset_seconds)}
        if self.proactive_headers:
            headers.update(request.state.gb_headers)
        return JSONResponse(refusal, status_code=429, headers=headers)

    @staticmethod
    def refuse(status_code, body):
        """Structured non-429 refusal. Requires error, detail, and why."""
        missing = [f for f in ("error", "detail", "why") if not body.get(f)]
        if missing:
            raise ValueError(f"Graceful Boundaries refusals require: {', '.join(missing)}")
        return JSONResponse(body, status_code=status_code)
