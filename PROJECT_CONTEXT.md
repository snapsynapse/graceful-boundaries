# Project Context: Graceful Boundaries

Context for content, docs, and blog skills working in this repo. For agent build/test guidance see `CLAUDE.md`.

## What this is

Graceful Boundaries is an **open specification** for how services communicate their operational limits (rate limits, quotas, validation rules, outages) to both humans and autonomous AI agents. The core idea: status codes like `429`/`403`/`500` tell a retry loop what to do but not an agent *whether* to retry, use a cached result, try another endpoint, or stop and inform the human. The spec defines structured, machine-readable responses so callers can act correctly instead of retrying blindly.

It is a spec-and-tooling project, not a library. Deliverables:

- The specification (`spec.md`) with 5 conformance levels (N/A, 1–4).
- A dependency-free conformance checker (`npx graceful-boundaries check <url>`, or `node evals/check.js`).
- Published JSON Schemas, drop-in middleware examples (Express, FastAPI, Cloudflare Workers, Hono), and worked `limits.json` examples.
- A composite GitHub Action for CI conformance gating.
- Two agentic skills: `SKILL.md` (audit/assess conformance) and `SKILL-builder.md` (implement the spec in code).
- A canonical landing page at **gracefulboundaries.dev** (`index.html`, `llms.txt`, `.well-known/`, structured metadata for agent discovery).

## Audience

- **API and service operators** deciding how to communicate limits.
- **Agent builders** whose autonomous callers hit those limits and need to respond correctly.
- **AI agents themselves**, which consume the machine-readable surfaces (spec, schemas, `llms.txt`, `assistant-guide.txt`, discovery endpoints).

Writing addresses a technically sophisticated reader: HTTP semantics, RFCs (6585, 9457, ratelimit-headers draft), and agent retry behavior are assumed knowledge.

## Style and tone

Discernible from README, spec, and docs:

- **Precise and standards-flavored.** Normative language follows RFC 2119 (MUST / SHOULD / MAY). Claims are concrete and testable.
- **Problem-first.** Sections open by naming the failure (blind retries, waste compounding with agents) before the remedy.
- **Show, don't assert.** Heavy use of real `curl` commands and JSON response bodies, verified against the Siteline reference implementation. Prefer worked examples over abstract description.
- **No hype, no emoji.** Plain declarative prose. Complementary-not-replacement framing toward existing standards.
- **Adoption-oriented.** Recurring "adopt in an afternoon", "which level should you target" framing that lowers the barrier to implementing.

## Key URLs

- Canonical site: https://gracefulboundaries.dev/
- Spec: https://gracefulboundaries.dev/ (and `spec.md` in-repo)
- Schemas: https://gracefulboundaries.dev/schema/
- Assistant guide: https://gracefulboundaries.dev/.well-known/assistant-guide.txt
- Repo: https://github.com/snapsynapse/graceful-boundaries
- Reference implementation (Level 4): https://siteline.to/
- Audit skill on ClawHub: https://clawhub.ai/snapsynapse/graceful-boundaries
- Parent org: https://paice.work/ (PAICE.work PBC — public benefit corporation)
- Sibling PAICE projects: GuideCheck (https://guidecheck.org/), Skill Provenance (https://skillprovenance.dev/)

## Current status

- Spec version **1.5.3** (adoption-tooling line; no normative changes since 1.3/1.4). Pending work is recorded under `CHANGELOG.md` `## Unreleased`.
- Actively maintained: clean working tree, tests green in CI on every push/PR.
- License: **CC-BY-4.0** for the spec/content; MIT for the checker code (`LICENSE-SPEC` / `LICENSE`).
- Open questions and deferred ideas are tracked in `INTENT.md` and `docs/roadmap.md`.
