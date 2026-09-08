# Changelog

All notable changes to the Graceful Boundaries specification.

This project follows [Semantic Versioning](https://semver.org/). The version number reflects the specification, not any implementation.

## Unreleased

## [1.5.5] - 2026-09-07

### Fixed
- ClawHub upload generation now contains exactly `SKILL.md` and the derived `MANIFEST.yaml`. Rebuilds remove stale card and builder files; ClawHub generates `skill-card.md` after publication.
- Corrected the ClawHub consumer manifest to disclose the publisher's already accepted MIT-0 distribution grant, with the canonical CC-BY-4.0 text and MIT code licenses retained as source metadata. The 1.5.4 changelog's statement that MIT-0 was unsupported was incorrect; its published entry is preserved below.
- Normalized npm `repository.url` to `git+https://github.com/snapsynapse/graceful-boundaries.git`.

### Changed
- Updated both repository workflows to immutable release SHAs for checkout 7.0.1, setup-node 7.0.0, and upload-artifact 7.0.1, with Node 24, explicit read-only permissions, bounded jobs, and no persisted checkout credentials or automatic npm cache.
- Documented signed future commits and release tags, and verification of the intentionally moving `v1` Action pointer separately from immutable releases.

### Added
- Specification-first citation metadata and archive-scope guidance.
- A dated trust review, adoption evidence ledger, and comparative caller benchmark design for the next validation phase.

### Notes
- No normative specification or checker behavior changes. Conformance levels, required fields, and response classes are unchanged.

## [1.5.4] - 2026-08-28

### Added
- The checker derives and reports the single smallest change that raises a service's confirmed conformance level. Human output gains a `Next step` block with the target level, an anchored implementation-guide link, an example file, and a pasteable snippet; `--json` gains a `nextStep` object carrying the same content, including a `verifiable` flag that is `false` when the next level requires observing a live refusal.
- `deriveNextStep` is exported from `evals/check.js`.
- `evals/test-next-step.js` — offline tests for next-step derivation.
- Search index policy and contract: `ops/search-indexing.md`, `search-audit.config.json`, and vendored `scripts/check-search.mjs` and `scripts/check-production-search.mjs`. The offline lane runs in CI after `npm test`; the production lane is release-triggered.
- URL-only adopter registration issue template. The checker verifies the available evidence, so registration no longer requires a pull request.
- Reproducible comparative caller benchmark protocol for future retry-reduction and agent-behavior claims.
- Reproducible ClawHub consumer-package builder and tracked audit-skill card. The generated artifact contains only `SKILL.md`, its derived manifest, and the card.
- Concrete before-and-after security examples for SC-2 through SC-6.

### Changed
- Reordered the README around the npx checker and CI path, linked RFC 9457 compatibility at the first specification mention, and added a verified Level 4 output sample.
- Added a literal before-and-after comparison to the RFC 9457 compatibility profile.
- Expanded npm discovery metadata with rate-limit, Problem Details, AI-agent, and retry terms and aligned the package description with the checker-first entry point.
- Moved durable adoption and outreach approval gates from temporary handoffs into `INTENT.md`.
- Recorded the evidence-gated design path for stack-specific checker guidance instead of guessing a service stack from HTTP headers.
- Reconciled completed roadmap items, existing `windowResetAt` support, current test counts, and the Repo Standards v0.4 root-skill layout decision.
- HTML sitemap membership is now reserved for canonical HTML search targets. `sitemap.xml` lists only `https://gracefulboundaries.dev/`. The specification remains published and crawlable at `https://gracefulboundaries.dev/spec.md` but is no longer declared a search index target, because it is served as raw Markdown and cannot carry a canonical link element or JSON-LD. Nothing was removed from the site.
- Aligned the homepage's sitemap `lastmod`, `article:modified_time`, and JSON-LD `dateModified`, which had drifted to three different dates. `lastmodAgreementPaths` now locks the agreement against regression.
- Limits discovery results carry `errors` alongside `warnings`, so a malformed discovery endpoint names the specific fields to fix instead of returning generic advice.
- The 1.5.3 release eval requiring the spec URL in the sitemap is inverted to enforce the new index policy, and now asserts the sitemap lists exactly the canonical HTML search targets.

### Fixed
- Removed the roadmap-only `agentCapable` reservation from the published schema. The schema remains permissive for service-defined extension fields, but no longer presents an unadmitted field as part of the vocabulary.
- Replaced the drift-prone ClawHub install-count badge with a stable audit-skill badge and made repository-root ClawHub packaging fail closed to `SKILL.md` only.
- Removed transient `prepared-not-published` status from generated ClawHub manifests and tied consumer versions and hashes to repository release metadata.
- Corrected the ClawHub skill card from an unsupported MIT-0 claim to the repository's CC-BY-4.0 text and MIT embedded-code license split.

### Notes
- No normative spec changes. Conformance levels, required fields, and response classes are unchanged.

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

## Assistant guide revisions

### [assistant-guide 1.1.1] - 2026-09-08

### Changed
- Updated the contributor guide's reviewed applicability to the exact `graceful-boundaries` 1.5.5 package without changing its GuideCheck 0.3.0 profile or verifier range.
