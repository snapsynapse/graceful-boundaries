# Changelog

All notable changes to the Graceful Boundaries specification.

This project follows [Semantic Versioning](https://semver.org/). The version number reflects the specification, not any implementation.

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
