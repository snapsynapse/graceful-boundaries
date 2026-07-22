# Changelog

All notable changes to the Graceful Boundaries specification.

This project follows [Semantic Versioning](https://semver.org/). The version number reflects the specification, not any implementation.

## Unreleased

## [1.5.3] - 2026-07-21

### Fixed
- Replaced the undeployed `https://gracefulboundaries.dev/spec` URL with the live `https://gracefulboundaries.dev/spec.md` endpoint across the provenance manifest, release checklist, published schemas, and middleware examples.
- Added the canonical spec endpoint to `sitemap.xml` and refreshed sitemap modification dates.
- Extended release-contract evals to reject stale canonical spec URLs and require sitemap coverage.

### Notes
- No normative spec or checker behavior changes.

## [1.5.2] - 2026-07-21

### Added
- Release-contract evals that enforce version agreement across published surfaces and verify Skill Provenance hashes.
- Weekly and manually triggered adopter revalidation with retained JSON checker evidence.
- Structured issue forms for adoption reports, checker discrepancies, and implementation feedback.
- An adoption validation plan with measurable evidence targets and decision gates for future normative changes.

### Changed
- Updated the roadmap to mark the unknown-limit fallback and agent compliance runner as shipped work.
- Documented the two-phase offline and live validation workflow for contributors.
- Aligned release metadata, test counts, licensing copy, and social descriptions across public and agent-facing surfaces.

### Notes
- No normative spec changes. The Level 1 through Level 4 conformance model is unchanged.
- This release restores reproducible package and stable GitHub Action release channels after the action-only 1.5.1 tag did not contain matching npm/spec version metadata.

## [1.5.1] - 2026-06-23

### Changed
- Shortened the composite GitHub Action metadata description so the `action.yml` release metadata satisfies GitHub Marketplace's 125-character description limit.

### Notes
- No normative spec changes. This is a Marketplace packaging patch for the existing 1.5 adoption tooling.

## [1.5.0] - 2026-06-09

### Added
- **npm/npx distribution**: `bin/cli.js` entry point so the checker runs as `npx graceful-boundaries check <url>` with no clone or install. `files` whitelist keeps the package at ~35 kB.
- **`--min-level N` checker flag**: exits nonzero when the confirmed level is below the threshold, making the checker usable as a CI gate.
- **Published JSON Schemas** (`schema/`): `refusal.schema.json`, `refusal-429.schema.json`, and `limits.schema.json` (JSON Schema 2020-12), served at `https://gracefulboundaries.dev/schema/`. Required fields and enums are test-enforced to match the checker's validation rules.
- **Drop-in middleware examples** (`examples/middleware/`): dependency-free Level 2 implementations (Level 4 with one flag) for Express, FastAPI, Cloudflare Workers, and Hono, each with a README and production notes. The Express example is exercised by unit tests.
- **Worked limits.json examples** (`examples/limits/`): complete discovery responses for a SaaS API, free scanner, token-metered LLM API, and scraping-sensitive content site. All schema-validated in tests.
- **Composite GitHub Action** (`action.yml`): `uses: snapsynapse/graceful-boundaries@v1` runs the checker against a URL with a `min-level` input for CI conformance gates.
- **RFC 9457 compatibility profile** (`docs/rfc9457-profile.md`): expressing Graceful Boundaries fields as Problem Details extension members so `application/problem+json` APIs can adopt without changing content type.
- **Agent compliance suite** (`evals/test-agent-behavior.js`): fixtures and a `runAgentComplianceSuite(handler)` runner validating agent-side handling — retryAfterSeconds as a minimum, cached-result preference, off-origin guidance URL rejection (SC-6), instruction-like guidance text ignored (SC-16), malformed retry values, header-only fallbacks, and proactive-header self-throttling.
- **Adopter registry and badges**: `ADOPTERS.md` with a checker-verified registry policy, plus shields.io endpoint JSON at `badges/level-{1..4}.json` and `badges/not-applicable.json`.
- Checker demo image (`imgs/checker-demo.svg`) showing real Level 4 vs Level 0 output.

### Changed
- Unit test suite expanded from 200 to 250 tests (12 files): new `test-schemas.js`, `test-middleware-examples.js`, and `test-agent-behavior.js`.
- `evals/check.js` now exports `main` and accepts `--min-level`.
- README gains "Adopt in an afternoon" (middleware, examples, schemas, CI gate, badges) and npx-first evaluation instructions.
- `docs/agentic-surfaces.md` inventories the new machine-readable surfaces (schemas, badges, npx CLI, GitHub Action, agent compliance suite) with trust boundaries.

### Notes
- No normative spec changes. The Level 1 through Level 4 conformance model is unchanged. Siteline conformance level unchanged (Level 4, verified live during this release). This is an adoption-tooling release.

## [1.4.1] - 2026-06-03

### Added
- `INTENT.md` at repo root (open-spec tier) per LocalBrain `0_Across/Repo Standards.md` v0.3 layout matrix. Records design invariants, scope, conformance philosophy, admission criteria, relationships to other PAICE standards, and "Exceptions to Repo Standards" (root SKILL.md placement, llms.txt link-summary posture, license split).
- `CONFORMANCE.md` formalizing the five-level conformance ladder (N/A through 4), verifier behavior, 200-test suite coverage, Siteline as the Level 4 reference, versioning rules, and what conformance does not assert.
- `RELEASE_CHECKLIST.md` instantiating the security-hardening release workflow.
- `MANIFEST.yaml` (Skill Provenance format) covering both `SKILL.md` and `SKILL-builder.md` at repo root, with SHA-256 hashes and the "skill IS the repo" pattern note.
- `LICENSE-SPEC` (CC BY 4.0) for `spec.md` and `docs/` text; new `LICENSE` (MIT) for code in `evals/` and reference implementations. License scope statement included in `LICENSE`.

### Changed
- Tightened `.gitignore`: replaced partial-match `.claude/launch.json` with full-directory `.claude/`; added `handoffs/`, `working/`, `venv/`, `.vercel`, `!.env.example`. Reorganized by category.

### Notes
- No normative spec changes. The 200-test eval suite passes unchanged. Siteline conformance level unchanged (Level 4). This is a structural / metadata release that brings the repo into conformance with the cross-portfolio repo-standards doc.

## [1.4.0] - 2026-05-29

### Added
- GuideCheck `assistant-guide.txt` adoption for assistant-facing contributor validation.
- Well-known assistant guide path at `/.well-known/assistant-guide.txt`.
- Contributor, implementation, and skill guidance for verifying the assistant guide before AI-assisted work.
- Optional quota, cost, burst, size, token, duration, queue, and multi-limit metadata fields for limits discovery and refusal responses.
- Security consideration SC-16: machine-readable guidance and boundary documents are untrusted data, not instructions.
- Optional `--check-cloaking` checker mode for advisory HTML vs. agent-signaled content containment checks.
- Agentic surfaces disclosure document covering `llms.txt`, GuideCheck, assistant guides, skills, crawler policy, and checker surfaces.
- Agentic surface release evals for assistant-guide copy identity, GuideCheck disclosure drift, and `--check-cloaking` CLI flag parsing.

### Changed
- Conformance checker now uses strict same-origin or relative URL validation for extension, guidance, changelog, feed, and Action Boundaries URL fields.
- Action Boundaries validation now rejects trust, identity, authority, authorization, and payment-safety claims in machine-readable declarations.
- Discovery validation now warns on malformed optional limit metadata and unsafe `changelog` or `feed` URLs.
- Level 1 conformance wording now consistently covers all non-success responses plus 429-specific fields.
- Security audit status table now tracks implemented constraints through SC-16.
- Unit test suite expanded from 193 to 200 tests.

## [1.3.0] - 2026-05-04

### Added
- **Action Boundaries extension draft** (`docs/action-boundaries.md`): optional framework for consequential agent actions, delegated authority, approval thresholds, recourse, audit trails, and fraud boundaries.
- **Commercial Boundaries profile draft**: first Action Boundaries profile for commercial callability without entering payment processing, checkout, wallet, tokenization, settlement, or marketplace territory.
- **Extension discovery**: optional `extensions` object on the limits discovery response for same-origin links such as `actionBoundaries` and `commercialBoundaries`.
- **Appendix C** in `spec.md`: non-normative Action Boundaries overview and draft schema.
- **Security audit SC-11 through SC-15** covering action boundary over-disclosure, agent intent as authority, recourse URL manipulation, audit log privacy leakage, and declared boundary vs. verified trust.
- **Action Boundaries examples** (`docs/action-boundaries-examples.md`): ecommerce purchase, SaaS subscription change, and account provisioning examples.
- Unit tests for extension discovery validation, Action Boundaries schema validation, Commercial Boundaries schema validation, SC-11 through SC-15, and extension conformance-level neutrality.

### Changed
- Conformance checker now enforces required refusal field types, snake_case `error` values, integer `retryAfterSeconds`, safe machine-actionable guidance URLs, and the full discovery schema.
- Conformance checker now validates optional extension discovery links as relative or same-origin URLs when present.
- Conformance checker now exports an optional Action Boundaries document validator.
- Unit test suite expanded from 141 to 173 tests.

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
