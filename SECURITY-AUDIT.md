# Security Audit: Graceful Boundaries Specification

## Threat Model

An attacker reads the Graceful Boundaries spec and uses it to exploit services that implement it. The spec is public. Every field definition, every example, and every conformance requirement is available for adversarial analysis.

## Identified Risks

### 1. Rate Limit Calibration Attack

**Risk:** The `/api/limits` endpoint publishes exact limits (e.g., "10 requests per IP per hour"). An attacker calibrates requests to stay at exactly 9/hour, maximizing abuse while never triggering the limit.

**Severity:** Medium. The attacker already discovers limits through trial and error — proactive disclosure just saves them time. The attack is the same either way.

**Mitigation:**
- Services SHOULD use the published limit as a public-facing value and enforce a slightly lower internal limit (e.g., publish 10, enforce at 8). This is consistent with the spec — the discovery endpoint describes the policy, not the exact enforcement threshold.
- Services SHOULD implement behavioral rate limiting (e.g., progressive slowdowns) in addition to hard cutoffs.
- Add to spec: "The discovery endpoint describes the policy. Services MAY enforce stricter internal limits than published."

### 2. Security Posture Disclosure via `why`

**Risk:** The `why` field reveals defensive intent. "This limit prevents the scan engine from being used as a proxy to attack other sites" tells an attacker the service is aware of SSRF and is defending against it — but also reveals that SSRF is a relevant attack vector.

**Severity:** Low-Medium. The defense is already in place. Knowing about it doesn't bypass it. But it gives the attacker a roadmap of what to probe.

**Mitigation:**
- The `why` field SHOULD describe the **category** of defense, not the **mechanism**.
  - Good: "Blocks requests to non-public addresses." (category)
  - Bad: "Validates URLs against RFC 1918 ranges and cloud metadata IPs." (mechanism)
- Add to spec: "The `why` field MUST NOT reveal implementation details of security controls. It SHOULD state the category of protection (e.g., 'prevents abuse') without describing how the protection works (e.g., 'uses a WAF rule on header X')."

### 3. Validation Oracle via Input Class

**Risk:** The Input class (400) includes `field` and `expected` fields that tell the caller exactly what valid input looks like. An attacker can use this to craft inputs that pass validation but cause other problems.

**Severity:** Medium. Example: `"expected": "A public URL on port 80 or 443"` tells an attacker to avoid non-standard ports — but also confirms that port-based filtering is the defense, not URL content inspection.

**Mitigation:**
- The `expected` field SHOULD describe the positive requirement, not the negative filter.
  - Good: "A public URL." (positive)
  - Bad: "Not a private IP, not port 8080, not localhost." (negative — reveals filter rules)
- Add to spec: "The `expected` field SHOULD describe what valid input looks like in positive terms. It MUST NOT enumerate rejected patterns, as this reveals the filter logic."

### 4. Endpoint Enumeration via Discovery

**Risk:** The `/api/limits` endpoint lists every rate-limited endpoint with its path pattern. This is a free sitemap of the API surface for attackers.

**Severity:** Low. API endpoints are typically discoverable through documentation, OpenAPI specs, or crawling. The limits endpoint adds minimal new information. But it concentrates it in one machine-readable location.

**Mitigation:**
- The limits endpoint SHOULD only list publicly documented endpoints. Internal or admin endpoints MUST NOT appear.
- Add to spec: "The discovery endpoint MUST NOT list endpoints that are not intended for public use. Internal, admin, or debug endpoints MUST be excluded."

### 5. Resource Existence Enumeration via 404

**Risk:** A 404 response that distinguishes "never existed" from "expired" reveals whether a resource was ever created. For Siteline, this means an attacker can probe `/api/result?id=competitor.com` to learn whether a competitor has been scanned.

**Severity:** Low for Siteline (scan results are already shareable). Higher for services where resource existence is sensitive (e.g., user profiles, private documents).

**Mitigation:**
- Services with sensitive resources SHOULD return identical 404 responses regardless of whether the resource never existed or expired.
- Add to spec: "When resource existence is sensitive, services SHOULD return identical responses for never-existed and expired resources. The distinction in the Not Found class is OPTIONAL and should only be used when existence is not sensitive."

### 6. Alternative Endpoint as Attack Surface

**Risk:** The `alternativeEndpoint` and `scanUrl` fields in constructive guidance direct callers to other endpoints. A malicious intermediary could modify these fields to redirect callers to attacker-controlled URLs.

**Severity:** Low in HTTPS contexts (response integrity is protected). Higher if responses are cached or proxied without integrity checking.

**Mitigation:**
- Constructive guidance URLs MUST be relative paths or same-origin absolute URLs. Cross-origin URLs MUST NOT be included in `alternativeEndpoint` or `scanUrl`.
- Add to spec: "Constructive guidance URLs (`alternativeEndpoint`, `scanUrl`, `cachedResultUrl`) MUST be relative paths or same-origin absolute URLs. Cross-origin redirects MUST use `humanUrl` or `upgradeUrl` and SHOULD be clearly labeled as external."

### 7. Proactive Headers as Timing Signal

**Risk:** `RateLimit: remaining=1` tells an attacker they have exactly one request left. Combined with `reset=3540`, they know exactly when the window resets. This enables precise timing of burst attacks at window boundaries.

**Severity:** Low. The alternative (no headers) just makes the attacker discover the same information through trial. The practical risk is minimal because the server enforces the limit regardless.

**Mitigation:**
- Services MAY add jitter to the `reset` value (e.g., ±10% randomization) to prevent precise timing.
- Add to spec: "Services MAY add small random jitter to `reset` values in proactive headers to prevent callers from synchronizing with window boundaries."

### 8. Agent Instruction Following via 404 `scanUrl`

**Risk:** An agent encounters a 404 with `scanUrl: "/api/scan?url=https://internal-server.local"`. If the agent follows this instruction, it triggers a scan against an internal resource. This is an indirect SSRF via agent manipulation.

**Severity:** Medium. The SSRF protection in the scan endpoint should block this, but it relies on the scan endpoint's validation being correct.

**Mitigation:**
- The `scanUrl` field SHOULD only contain URLs that the service itself would accept. Since Graceful Boundaries services should already have SSRF protection, the scan endpoint will reject internal URLs.
- Add to spec: "Services that include `scanUrl` in Not Found responses MUST ensure the referenced scan endpoint has adequate input validation. The `scanUrl` field is a convenience, not a trust bypass — the scan endpoint's own security controls still apply."

### 9. Content Cloaking via Agent-Signaling Headers

**Risk:** An origin detects agent intent (via `Accept: text/markdown`, known agent user-agents, or similar signals) and serves altered content designed to mislead, inject prompts, or misrepresent the site's offerings. CDN-level cache partitioning (e.g., Cloudflare's Markdown for Agents) prevents human visitors from seeing the divergent content, making the split undetectable through normal browsing.

This is distinct from user-agent blocking. Blocking is visible — the agent knows it was refused. Cloaking is invisible — the agent believes it received the real page.

**Severity:** Medium-High. A service can be Level 4 conformant (perfect rate limit communication) while serving poisoned content to agents. This undermines the trust that Graceful Boundaries is designed to build.

**Mitigation:**
- Services claiming Level 4 conformance SHOULD NOT serve materially divergent content via agent-signaling headers. Formatting differences (boilerplate removal) are expected; informational differences are not.
- Agents SHOULD compare content across request variants using an asymmetric containment metric: what fraction of the HTML's core text survives into the alternate response. Legitimate CDN conversions produce 60%+ containment. Content cloaking produces sub-60%.
- Add to spec: "SC-9: Content Cloaking via Agent-Signaling Headers" (added in v1.1).

### 10. `statusUrl` Infrastructure Disclosure

**Risk:** Including a status page URL (e.g., `https://status.example.com`) in availability responses reveals infrastructure monitoring tooling.

**Severity:** Very low. Status pages are typically public.

**Mitigation:** None needed. Status pages are designed to be public.

### 11. Action Boundary Over-Disclosure

**Risk:** Action Boundaries and Commercial Boundaries documents may reveal too much about approval thresholds, fraud controls, or automated access policy. Attackers could use this to craft requests that stay just below published boundaries.

**Severity:** Medium. The same boundary often becomes visible through trial and error, but machine-readable disclosure makes calibration faster.

**Mitigation:**
- Published action boundaries SHOULD describe policy categories, not enforcement mechanisms.
- Services MAY apply stricter internal controls than the published boundary.
- Fraud and abuse language SHOULD say what is permitted or disallowed without listing detection rules, model signals, device checks, or bypassable thresholds.

### 12. Agent Intent as Authority

**Risk:** A service treats an agent's stated intent as proof of authority. A malicious or confused agent could claim buyer, organization, or admin authority without an enforceable delegation path.

**Severity:** High for commercial, account, permission, or legal workflows.

**Mitigation:**
- Action Boundary documents MUST NOT be treated as authentication or authorization systems.
- Services SHOULD validate delegated authority independently before executing consequential actions.
- Refusals SHOULD use `authority_insufficient` or `approval_required` when authority is unclear.

### 13. Recourse URL Manipulation

**Risk:** Action Boundary documents include recourse, refund, cancellation, approval, or audit URLs. If these URLs are cross-origin or modified by an intermediary, agents may send users or sensitive transaction context to attacker-controlled destinations.

**Severity:** Medium.

**Mitigation:**
- Machine-actionable Action Boundary URLs SHOULD be relative paths or same-origin absolute URLs.
- Cross-origin URLs SHOULD be limited to human-facing navigation fields and clearly labeled.
- Agents SHOULD treat boundary documents as untrusted input unless fetched directly from the service origin over HTTPS.

### 14. Audit Log Privacy Leakage

**Risk:** Audit metadata can reveal whether a transaction, account, buyer, or support case exists. If audit endpoints are exposed through machine-readable links, attackers may enumerate sensitive commercial activity.

**Severity:** Medium-High depending on the resource.

**Mitigation:**
- Boundary documents SHOULD disclose audit capability, not specific audit records.
- Audit record retrieval MUST require appropriate authorization.
- When resource existence is sensitive, audit and recourse endpoints SHOULD use uniform responses that do not reveal whether a resource exists.

### 15. Declared Boundary vs. Verified Trust

**Risk:** A merchant or service publishes a Commercial Boundaries document and users mistake it for third-party verification, merchant certification, payment safety, or ranking.

**Severity:** Medium.

**Mitigation:**
- The spec SHOULD state that boundary documents are declarations, not endorsements.
- External evaluators MAY verify declarations against observed behavior, but that verification is separate from Graceful Boundaries conformance.
- Implementations SHOULD avoid labels such as "verified", "certified", "recommended", or "trusted" unless a separate verification process exists.

## Summary of Spec Changes Needed

| # | Risk | Spec Addition |
|---|---|---|
| 1 | Rate limit calibration | "Services MAY enforce stricter internal limits than published." |
| 2 | Security posture disclosure | "`why` MUST NOT reveal implementation details. SHOULD state category of protection." |
| 3 | Validation oracle | "`expected` SHOULD describe valid input positively. MUST NOT enumerate rejected patterns." |
| 4 | Endpoint enumeration | "Discovery endpoint MUST NOT list non-public endpoints." |
| 5 | Resource existence | "When existence is sensitive, SHOULD return identical 404s." |
| 6 | Alternative endpoint redirect | "Guidance URLs MUST be relative or same-origin. Cross-origin uses `humanUrl`." |
| 7 | Timing signal | "Services MAY add jitter to `reset` values." |
| 8 | Agent SSRF via scanUrl | "`scanUrl` is convenience, not trust bypass. Scan endpoint's own controls apply." |
| 9 | Content cloaking via agent headers | "Level 4 services SHOULD NOT serve materially divergent content via agent-signaling headers." |
| 11 | Action boundary over-disclosure | "Action boundaries SHOULD describe policy categories, not enforcement mechanisms." |
| 12 | Agent intent as authority | "Action Boundary documents MUST NOT be treated as authentication or authorization systems." |
| 13 | Recourse URL manipulation | "Machine-actionable Action Boundary URLs SHOULD be relative or same-origin." |
| 14 | Audit log privacy leakage | "Boundary documents SHOULD disclose audit capability, not specific audit records." |
| 15 | Declared boundary vs. verified trust | "Boundary documents are declarations, not endorsements or certifications." |
