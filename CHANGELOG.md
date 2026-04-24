# Changelog

All notable changes to the Graceful Boundaries specification.

This project follows [Semantic Versioning](https://semver.org/). The version number reflects the specification, not any implementation.

## Unreleased

### Changed
- Conformance checker now enforces required refusal field types, snake_case `error` values, integer `retryAfterSeconds`, safe machine-actionable guidance URLs, and the full discovery schema.
- Unit test suite expanded from 131 to 141 tests.

## [1.2.0] - 2026-04-08

### Added
- **Appendix B: Guidance for Autonomous Implementers** in spec.md. Imperative-voice guidance for agents building services (B.1) and consuming them (B.2). Non-normative, same as Appendix A.
- **Builder skill** (`SKILL-builder.md`): fires when agents scaffold APIs or add error handling, injecting Graceful Boundaries patterns into generated code. Distinct from the audit skill which inspects live URLs.
- **CLAUDE.md snippet** on the landing page: copy-pasteable block for project AI context files that tells coding assistants to apply the spec automatically.
- **Landing page** at gracefulboundaries.dev with dark mode, mobile support, and OG/Twitter meta tags.
- **CHANGELOG.md** for version history tracking.
- **Conformance checker now validates Level 4**: probes documented endpoints for proactive `RateLimit` headers.

### Changed
- Checker output refined: "At least Level 2" instead of overstating confirmed level; "trigger a 429" note only appears when relevant.
- Spec explicitly requires `snake_case` for the `error` field.
- All project URLs updated to reference gracefulboundaries.dev.
- README includes clone/cd instructions and shows siteline.to (Level 4) vs google.com (Level 0) as examples.
- Version badge links to CHANGELOG.md.

## [1.1.0] - 2025-05-15

Based on implementation feedback from Siteline's Level 4 conformance work.

### Changed
- **`why` field elevated to MUST** for all non-success response classes (Input, Not Found, Availability), not just rate limits. Previously RECOMMENDED.

### Added
- **HTML 429 machine-accessibility**: `<meta name="retry-after">` and `<link rel="alternate" type="application/json">` guidance for HTML endpoints.
- **`changelog` and `feed` fields** (optional) on the limits discovery response, so agents can detect limit changes.
- **`returnsCached` boolean** (optional) on `resource-dedup` limit entries in the discovery response.
- `checkResponseBody()` validator for all non-success response classes.
- `checkHtmlRefusal()` validator for HTML 429 pages.
- Non-normative Appendix A: edge runtime implementation notes.
- 27 new tests (131 total across 7 files).

## [1.0.0] - 2025-05-01

First stable release.

### Added
- Five conformance levels: N/A, 0, 1 (Structured Refusal), 2 (Discoverable), 3 (Constructive), 4 (Proactive).
- Six response classes: Limit, Input, Access, Not Found, Availability, Success.
- Security considerations SC-1 through SC-9.
- Conformance checker (`evals/check.js`) with 104 unit tests.
- Siteline as Level 4 reference implementation.
- Implementation guide with code samples for each level.
